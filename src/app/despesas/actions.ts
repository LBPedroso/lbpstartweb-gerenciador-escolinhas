"use server";

import { ExpenseCategory, ExpenseStatus, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

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

  if (errors.length > 0) {
    const draft = encodeURIComponent(JSON.stringify({ description, categoryRaw, amountRaw, dueDateRaw, statusRaw, paymentDateRaw, recurring, note }));
    redirect(`/despesas/nova?error=${encodeURIComponent(errors[0])}&draft=${draft}`);
  }

  await prisma.expense.create({
    data: {
      description,
      category: category!,
      amount: new Prisma.Decimal(amount!),
      dueDate: dueDate!,
      status,
      paymentDate: paymentDate ?? null,
      recurring,
      note: note || null,
    },
  });

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

  if (errors.length > 0) {
    const draft = encodeURIComponent(JSON.stringify({ description, categoryRaw, amountRaw, dueDateRaw, statusRaw, paymentDateRaw, recurring, note }));
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
