"use server";

import { ExpenseCategory, ExpenseStatus, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

type ExpensePaymentMethodValue =
  | "DINHEIRO"
  | "DEBITO"
  | "CREDITO"
  | "PIX"
  | "BOLETO"
  | "OUTRO";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function parseAmount(value: string) {
  if (!value) return null;
  const normalized = value.replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

function parseCategory(value: string): ExpenseCategory | null {
  const allowed = new Set<ExpenseCategory>([
    ExpenseCategory.ALUGUEL,
    ExpenseCategory.PROFESSORES,
    ExpenseCategory.MATERIAL,
    ExpenseCategory.OUTROS,
  ]);
  return allowed.has(value as ExpenseCategory) ? (value as ExpenseCategory) : null;
}

function parseDate(value: string): Date | null {
  if (!value) return null;
  const d = new Date(value + "T12:00:00");
  return isNaN(d.getTime()) ? null : d;
}

function parseExpensePaymentMethod(value: string): ExpensePaymentMethodValue | null {
  const allowed = new Set<ExpensePaymentMethodValue>([
    "DINHEIRO",
    "DEBITO",
    "CREDITO",
    "PIX",
    "BOLETO",
    "OUTRO",
  ]);
  return allowed.has(value as ExpensePaymentMethodValue)
    ? (value as ExpensePaymentMethodValue)
    : null;
}

function parsePositiveInt(value: string): number | null {
  const n = parseInt(value, 10);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function addMonths(baseDate: Date, monthsToAdd: number) {
  const date = new Date(baseDate);
  date.setMonth(date.getMonth() + monthsToAdd);
  return date;
}

function splitInstallmentsAmount(totalAmount: number, totalInstallments: number) {
  const cents = Math.round(totalAmount * 100);
  const baseCents = Math.floor(cents / totalInstallments);
  const remainder = cents % totalInstallments;

  return Array.from({ length: totalInstallments }, (_, index) => {
    const installmentCents = baseCents + (index < remainder ? 1 : 0);
    return installmentCents / 100;
  });
}

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/despesas");
}

export async function createExpenseAction(formData: FormData) {
  const description = getString(formData, "description");
  const categoryRaw = getString(formData, "category");
  const amountRaw = getString(formData, "amount");
  const dueDateRaw = getString(formData, "dueDate");
  const statusRaw = getString(formData, "status");
  const paymentDateRaw = getString(formData, "paymentDate");
  const paymentMethodRaw = getString(formData, "expensePaymentMethod");
  const installmentsRaw = getString(formData, "installments");
  const installmentNumberRaw = getString(formData, "installmentNumber");
  const recurring = getString(formData, "recurring") === "on";
  const note = getString(formData, "note");

  const errors: string[] = [];

  if (!description) errors.push("Descrição é obrigatória.");

  const category = parseCategory(categoryRaw);
  if (!category) errors.push("Selecione uma categoria válida.");

  const amount = parseAmount(amountRaw);
  if (!amount) errors.push("Informe um valor válido.");

  const dueDate = parseDate(dueDateRaw);
  if (!dueDate) errors.push("Informe uma data de vencimento válida.");

  const status =
    statusRaw === ExpenseStatus.PAGO ? ExpenseStatus.PAGO : ExpenseStatus.PENDENTE;

  const paymentDate = status === ExpenseStatus.PAGO ? parseDate(paymentDateRaw) : null;
  const expensePaymentMethod = parseExpensePaymentMethod(paymentMethodRaw);
  const installments = parsePositiveInt(installmentsRaw);
  const installmentNumber = parsePositiveInt(installmentNumberRaw);

  if (installmentNumber && !installments) {
    errors.push("Para informar número da parcela, preencha também o total de parcelas.");
  }

  if (installments && installmentNumber && installmentNumber > installments) {
    errors.push("Número da parcela não pode ser maior que o total de parcelas.");
  }

  if (errors.length > 0) {
    const draft = encodeURIComponent(JSON.stringify({ description, categoryRaw, amountRaw, dueDateRaw, statusRaw, paymentDateRaw, paymentMethodRaw, installmentsRaw, installmentNumberRaw, recurring, note }));
    redirect(`/despesas/nova?error=${encodeURIComponent(errors[0])}&draft=${draft}`);
  }

  if (installments && installments > 1) {
    const installmentAmounts = splitInstallmentsAmount(amount!, installments);

    await prisma.$transaction(
      installmentAmounts.map((installmentAmount, index) =>
        prisma.expense.create({
          data: {
            description,
            category: category!,
            amount: new Prisma.Decimal(installmentAmount),
            dueDate: addMonths(dueDate!, index),
            status: status === ExpenseStatus.PAGO && index === 0 ? ExpenseStatus.PAGO : ExpenseStatus.PENDENTE,
            paymentDate: status === ExpenseStatus.PAGO && index === 0 ? paymentDate ?? new Date() : null,
            expensePaymentMethod: expensePaymentMethod ?? null,
            installments,
            installmentNumber: index + 1,
            recurring,
            note: note || null,
          },
        }),
      ),
    );
  } else {
    await prisma.expense.create({
      data: {
        description,
        category: category!,
        amount: new Prisma.Decimal(amount!),
        dueDate: dueDate!,
        status,
        paymentDate: paymentDate ?? null,
        expensePaymentMethod: expensePaymentMethod ?? null,
        installments: installments ?? null,
        installmentNumber: installmentNumber ?? null,
        recurring,
        note: note || null,
      },
    });
  }

  revalidateAll();

  const mes = dueDate!.getMonth() + 1;
  const ano = dueDate!.getFullYear();
  redirect(`/despesas?mes=${mes}&ano=${ano}`);
}

export async function updateExpenseAction(formData: FormData) {
  const expenseId = getString(formData, "expenseId");
  const description = getString(formData, "description");
  const categoryRaw = getString(formData, "category");
  const amountRaw = getString(formData, "amount");
  const dueDateRaw = getString(formData, "dueDate");
  const statusRaw = getString(formData, "status");
  const paymentDateRaw = getString(formData, "paymentDate");
  const paymentMethodRaw = getString(formData, "expensePaymentMethod");
  const installmentsRaw = getString(formData, "installments");
  const installmentNumberRaw = getString(formData, "installmentNumber");
  const recurring = getString(formData, "recurring") === "on";
  const note = getString(formData, "note");

  if (!expenseId) redirect("/despesas");

  const errors: string[] = [];

  if (!description) errors.push("Descrição é obrigatória.");

  const category = parseCategory(categoryRaw);
  if (!category) errors.push("Selecione uma categoria válida.");

  const amount = parseAmount(amountRaw);
  if (!amount) errors.push("Informe um valor válido.");

  const dueDate = parseDate(dueDateRaw);
  if (!dueDate) errors.push("Informe uma data de vencimento válida.");

  const status =
    statusRaw === ExpenseStatus.PAGO ? ExpenseStatus.PAGO : ExpenseStatus.PENDENTE;

  const paymentDate = status === ExpenseStatus.PAGO ? parseDate(paymentDateRaw) : null;
  const expensePaymentMethod = parseExpensePaymentMethod(paymentMethodRaw);
  const installments = parsePositiveInt(installmentsRaw);
  const installmentNumber = parsePositiveInt(installmentNumberRaw);

  if (installments && installmentNumber && installmentNumber > installments) {
    errors.push("Número da parcela não pode ser maior que o total de parcelas.");
  }

  if (errors.length > 0) {
    const draft = encodeURIComponent(JSON.stringify({ description, categoryRaw, amountRaw, dueDateRaw, statusRaw, paymentDateRaw, paymentMethodRaw, installmentsRaw, installmentNumberRaw, recurring, note }));
    redirect(`/despesas/${expenseId}/editar?error=${encodeURIComponent(errors[0])}&draft=${draft}`);
  }

  await prisma.expense.update({
    where: { id: expenseId },
    data: {
      description,
      category: category!,
      amount: new Prisma.Decimal(amount!),
      dueDate: dueDate!,
      status,
      paymentDate: paymentDate ?? null,
      expensePaymentMethod: expensePaymentMethod ?? null,
      installments: installments ?? null,
      installmentNumber: installmentNumber ?? null,
      recurring,
      note: note || null,
    },
  });

  revalidateAll();

  const mes = dueDate!.getMonth() + 1;
  const ano = dueDate!.getFullYear();
  redirect(`/despesas?mes=${mes}&ano=${ano}`);
}

export async function deleteExpenseAction(formData: FormData) {
  const expenseId = getString(formData, "expenseId");
  const mes = getString(formData, "mes");
  const ano = getString(formData, "ano");

  if (!expenseId) redirect("/despesas");

  await prisma.expense.delete({ where: { id: expenseId } });

  revalidateAll();
  redirect(`/despesas?mes=${mes}&ano=${ano}`);
}
