"use server";

import { PaymentMethod, PaymentStatus, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function parseAmount(value: string) {
  if (!value) {
    return null;
  }

  const normalized = value.replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

function redirectWithError(studentId: string, message: string): never {
  redirect(`/alunos/${studentId}?payment=error&message=${encodeURIComponent(message)}`);
}

function parsePaymentMethod(value: string): PaymentMethod | null {
  const allowed = new Set<PaymentMethod>([
    PaymentMethod.DINHEIRO,
    PaymentMethod.CARTAO,
    PaymentMethod.PIX,
    PaymentMethod.TRANSFERENCIA,
    PaymentMethod.BANCO,
    PaymentMethod.OUTRO,
  ]);

  return allowed.has(value as PaymentMethod) ? (value as PaymentMethod) : null;
}

export async function registerMonthlyPaymentAction(formData: FormData) {
  const studentId = getString(formData, "studentId");
  const amountRaw = getString(formData, "amount");
  const paymentMethodRaw = getString(formData, "paymentMethod");
  const note = getString(formData, "note");

  if (!studentId) {
    redirect("/alunos");
  }

  const amount = parseAmount(amountRaw);

  if (!amount) {
    redirectWithError(studentId, "Informe um valor valido para registrar o pagamento.");
  }

  const paymentMethod = parsePaymentMethod(paymentMethodRaw);

  if (!paymentMethod) {
    redirectWithError(studentId, "Selecione uma forma de pagamento valida.");
  }

  if (paymentMethod === PaymentMethod.OUTRO && !note) {
    redirectWithError(studentId, "Quando a forma for OUTRO, preencha a observacao.");
  }

  const studentExists = await prisma.student.findUnique({
    where: { id: studentId },
    select: { id: true },
  });

  if (!studentExists) {
    redirect("/alunos");
  }

  const now = new Date();
  const referenceMonth = now.getMonth() + 1;
  const referenceYear = now.getFullYear();

  await prisma.payment.upsert({
    where: {
      studentId_referenceMonth_referenceYear: {
        studentId,
        referenceMonth,
        referenceYear,
      },
    },
    create: {
      studentId,
      referenceMonth,
      referenceYear,
      amount: new Prisma.Decimal(amount),
      paymentMethod,
      paymentDate: now,
      status: PaymentStatus.PAGO,
      note: note || null,
    },
    update: {
      amount: new Prisma.Decimal(amount),
      paymentMethod,
      paymentDate: now,
      status: PaymentStatus.PAGO,
      note: note || null,
    },
  });

  revalidatePath("/");
  revalidatePath("/alunos");
  revalidatePath(`/alunos/${studentId}`);
  redirect(`/alunos/${studentId}?payment=success`);
}

export async function cancelPaymentAction(formData: FormData) {
  const paymentId = getString(formData, "paymentId");
  const studentId = getString(formData, "studentId");

  if (!paymentId || !studentId) {
    redirect("/alunos");
  }

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: { id: true, studentId: true },
  });

  if (!payment || payment.studentId !== studentId) {
    redirect(`/alunos/${studentId}`);
  }

  await prisma.payment.delete({ where: { id: paymentId } });

  revalidatePath("/");
  revalidatePath("/alunos");
  revalidatePath(`/alunos/${studentId}`);
  redirect(`/alunos/${studentId}?payment=cancelled`);
}
