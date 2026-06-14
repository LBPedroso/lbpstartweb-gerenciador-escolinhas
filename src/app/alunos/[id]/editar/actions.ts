"use server";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

const ERROR_MESSAGES = {
  REQUIRED_FIELDS: "Preencha nome, data de nascimento e categoria.",
  RESPONSIBLE_REQUIRED: "Informe ao menos um responsavel com telefone.",
  INVALID_BIRTH_DATE: "Data de nascimento invalida.",
  INVALID_AGE: "Idade fora da faixa permitida para escolinha (4 a 18 anos).",
  STUDENT_NOT_FOUND: "Aluno nao encontrado para edicao.",
  DUPLICATE_NAME_BIRTH: "Ja existe outro aluno cadastrado com esse nome e data de nascimento.",
  INVALID_CPF: "CPF invalido.",
  DUPLICATE_CPF: "Ja existe outro aluno cadastrado com esse CPF.",
} as const;

const DRAFT_FIELDS = [
  "fullName",
  "birthDate",
  "cpf",
  "studentPhone",
  "address",
  "motherName",
  "motherPhone",
  "fatherName",
  "fatherPhone",
  "category",
  "primaryPosition",
  "photoUrl",
] as const;

const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_PHOTO_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getOptional(formData: FormData, key: string) {
  const value = getString(formData, key);
  return value || null;
}

function onlyDigits(value: string | null) {
  return value ? value.replace(/\D/g, "") : null;
}

function normalizeName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function isValidCpf(value: string) {
  if (!/^\d{11}$/.test(value)) {
    return false;
  }

  if (/^(\d)\1{10}$/.test(value)) {
    return false;
  }

  const digits = value.split("").map(Number);

  const calcCheckDigit = (length: number) => {
    const sum = digits
      .slice(0, length)
      .reduce((acc, digit, index) => acc + digit * (length + 1 - index), 0);
    const remainder = (sum * 10) % 11;

    return remainder === 10 ? 0 : remainder;
  };

  return calcCheckDigit(9) === digits[9] && calcCheckDigit(10) === digits[10];
}

function parseDate(value: string) {
  if (!value) {
    return null;
  }

  const parsed = new Date(`${value}T00:00:00`);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getAgeInYears(birthDate: Date) {
  const now = new Date();
  let age = now.getFullYear() - birthDate.getFullYear();
  const monthDiff = now.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
    age -= 1;
  }

  return age;
}

function redirectWithError(id: string, message: string): never {
  redirect(`/alunos/${id}/editar?error=${encodeURIComponent(message)}`);
}

function extractDraft(formData: FormData) {
  const draft: Record<string, string> = {};

  for (const field of DRAFT_FIELDS) {
    draft[field] = getString(formData, field);
  }

  return draft;
}

function redirectWithErrorAndDraft(id: string, message: string, formData: FormData): never {
  const draft = extractDraft(formData);
  const draftEncoded = encodeURIComponent(JSON.stringify(draft));
  redirect(`/alunos/${id}/editar?error=${encodeURIComponent(message)}&draft=${draftEncoded}`);
}

async function saveStudentPhotoUpload(formData: FormData) {
  const file = formData.get("photoFile");

  if (!(file instanceof File) || file.size === 0) {
    return { photoUrl: null as string | null, error: null as string | null };
  }

  if (!ALLOWED_PHOTO_MIME_TYPES.has(file.type)) {
    return {
      photoUrl: null,
      error: "Formato de foto invalido. Use JPG, PNG, WEBP ou GIF.",
    };
  }

  if (file.size > MAX_PHOTO_SIZE_BYTES) {
    return {
      photoUrl: null,
      error: "A foto deve ter no maximo 5MB.",
    };
  }

  const extFromName = path.extname(file.name).toLowerCase();
  const ext = extFromName || ".jpg";
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "students");
  const destination = path.join(uploadDir, fileName);

  await mkdir(uploadDir, { recursive: true });
  const bytes = await file.arrayBuffer();
  await writeFile(destination, Buffer.from(bytes));

  return { photoUrl: `/uploads/students/${fileName}`, error: null as string | null };
}

export async function updateStudentAction(formData: FormData) {
  const id = getString(formData, "id");

  if (!id) {
    redirect("/alunos");
  }

  const fullName = getString(formData, "fullName");
  const birthDateRaw = getString(formData, "birthDate");
  const category = getString(formData, "category");
  const cpf = onlyDigits(getOptional(formData, "cpf"));

  const motherName = getOptional(formData, "motherName");
  const motherPhone = onlyDigits(getOptional(formData, "motherPhone"));
  const fatherName = getOptional(formData, "fatherName");
  const fatherPhone = onlyDigits(getOptional(formData, "fatherPhone"));

  if (!fullName || !birthDateRaw || !category) {
    redirectWithErrorAndDraft(id, ERROR_MESSAGES.REQUIRED_FIELDS, formData);
  }

  const parsedBirthDate = parseDate(birthDateRaw);

  if (!parsedBirthDate) {
    redirectWithErrorAndDraft(id, ERROR_MESSAGES.INVALID_BIRTH_DATE, formData);
  }

  const birthDate = parsedBirthDate;

  const age = getAgeInYears(birthDate);

  if (age < 4 || age > 18) {
    redirectWithErrorAndDraft(id, ERROR_MESSAGES.INVALID_AGE, formData);
  }

  const hasResponsibleName = !!motherName || !!fatherName;
  const hasResponsiblePhone = !!motherPhone || !!fatherPhone;

  if (!hasResponsibleName || !hasResponsiblePhone) {
    redirectWithErrorAndDraft(id, ERROR_MESSAGES.RESPONSIBLE_REQUIRED, formData);
  }

  if (cpf && !isValidCpf(cpf)) {
    redirectWithErrorAndDraft(id, ERROR_MESSAGES.INVALID_CPF, formData);
  }

  const existingStudentsSameBirthDate = await prisma.student.findMany({
    where: {
      id: {
        not: id,
      },
      birthDate,
    },
    select: {
      id: true,
      fullName: true,
    },
  });

  const normalizedFullName = normalizeName(fullName);
  const hasDuplicateNameBirth = existingStudentsSameBirthDate.some(
    (student) => normalizeName(student.fullName) === normalizedFullName,
  );

  if (hasDuplicateNameBirth) {
    redirectWithErrorAndDraft(id, ERROR_MESSAGES.DUPLICATE_NAME_BIRTH, formData);
  }

  if (cpf) {
    const existingCpf = await prisma.student.findFirst({
      where: {
        cpf,
        id: {
          not: id,
        },
      },
      select: { id: true },
    });

    if (existingCpf) {
      redirectWithErrorAndDraft(id, ERROR_MESSAGES.DUPLICATE_CPF, formData);
    }
  }

  const photoUploadResult = await saveStudentPhotoUpload(formData);

  if (photoUploadResult.error) {
    redirectWithErrorAndDraft(id, photoUploadResult.error, formData);
  }

  const photoUrlManual = getOptional(formData, "photoUrl");
  const finalPhotoUrl = photoUploadResult.photoUrl ?? photoUrlManual;

  try {
    await prisma.student.update({
      where: { id },
      data: {
        fullName,
        birthDate,
        cpf,
        studentPhone: onlyDigits(getOptional(formData, "studentPhone")),
        address: getOptional(formData, "address"),
        motherName,
        motherPhone,
        fatherName,
        fatherPhone,
        category,
        primaryPosition: getOptional(formData, "primaryPosition"),
        photoUrl: finalPhotoUrl,
      },
    });
  } catch {
    redirectWithError(id, ERROR_MESSAGES.STUDENT_NOT_FOUND);
  }

  revalidatePath("/alunos");
  revalidatePath("/");
  revalidatePath(`/alunos/${id}/editar`);
  redirect("/alunos?updated=1");
}
