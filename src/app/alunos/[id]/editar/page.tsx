import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateStudentAction } from "./actions";

type EditStudentPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    error?: string | string[];
    draft?: string | string[];
  }>;
};

function normalizeParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function parseDraft(value: string) {
  if (!value) {
    return {} as Record<string, string>;
  }

  try {
    const parsed = JSON.parse(value);
    return typeof parsed === "object" && parsed !== null ? (parsed as Record<string, string>) : {};
  } catch {
    return {} as Record<string, string>;
  }
}

function draftValue(draft: Record<string, string>, key: string, fallback: string) {
  return draft[key] ?? fallback;
}

function toInputDate(value: Date | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const adjusted = new Date(date.getTime() - offset * 60 * 1000);

  return adjusted.toISOString().slice(0, 10);
}

export default async function EditStudentPage({ params, searchParams }: EditStudentPageProps) {
  const { id } = await params;
  const resolvedSearch = searchParams ? await searchParams : undefined;
  const errorMessage = normalizeParam(resolvedSearch?.error);
  const draft = parseDraft(normalizeParam(resolvedSearch?.draft));

  const student = await prisma.student.findUnique({
    where: { id },
  });

  if (!student) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="rounded-2xl border border-emerald-400/30 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 p-5 shadow-[0_0_30px_rgba(16,185,129,0.18)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-emerald-300">R Sports</p>
              <h1 className="mt-2 text-3xl font-bold">Editar Aluno</h1>
              <p className="mt-1 text-sm text-slate-300">Corrija dados sem precisar excluir e cadastrar novamente.</p>
            </div>
            <Link
              href="/alunos"
              className="rounded-xl border border-slate-600 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-emerald-400/50 hover:text-emerald-200"
            >
              Voltar para lista
            </Link>
          </div>
        </header>

        {errorMessage ? (
          <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
            {errorMessage}
          </p>
        ) : null}

        <section className="rounded-2xl border border-slate-700 bg-slate-900/90 p-5">
          <p className="mb-4 text-sm text-slate-300">
            Campos obrigatórios: nome, data de nascimento, categoria e ao menos um responsável com telefone.
          </p>

          <form action={updateStudentAction} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <input type="hidden" name="id" value={student.id} />

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm text-slate-300">Nome completo *</span>
              <input
                name="fullName"
                type="text"
                required
                defaultValue={draftValue(draft, "fullName", student.fullName)}
                className="h-11 w-full rounded-xl border border-slate-600 bg-slate-950 px-4 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm text-slate-300">Data de nascimento *</span>
              <input
                name="birthDate"
                type="date"
                required
                defaultValue={draftValue(draft, "birthDate", toInputDate(student.birthDate))}
                className="h-11 w-full rounded-xl border border-slate-600 bg-slate-950 px-4 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm text-slate-300">CPF</span>
              <input
                name="cpf"
                type="text"
                defaultValue={draftValue(draft, "cpf", student.cpf ?? "")}
                className="h-11 w-full rounded-xl border border-slate-600 bg-slate-950 px-4 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm text-slate-300">Telefone do aluno</span>
              <input
                name="studentPhone"
                type="text"
                defaultValue={draftValue(draft, "studentPhone", student.studentPhone ?? "")}
                className="h-11 w-full rounded-xl border border-slate-600 bg-slate-950 px-4 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm text-slate-300">Categoria *</span>
              <input
                name="category"
                type="text"
                required
                defaultValue={draftValue(draft, "category", student.category ?? "")}
                className="h-11 w-full rounded-xl border border-slate-600 bg-slate-950 px-4 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm text-slate-300">Nome da mãe</span>
              <input
                name="motherName"
                type="text"
                defaultValue={draftValue(draft, "motherName", student.motherName ?? "")}
                className="h-11 w-full rounded-xl border border-slate-600 bg-slate-950 px-4 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm text-slate-300">Telefone da mãe</span>
              <input
                name="motherPhone"
                type="text"
                defaultValue={draftValue(draft, "motherPhone", student.motherPhone ?? "")}
                className="h-11 w-full rounded-xl border border-slate-600 bg-slate-950 px-4 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm text-slate-300">Nome do pai</span>
              <input
                name="fatherName"
                type="text"
                defaultValue={draftValue(draft, "fatherName", student.fatherName ?? "")}
                className="h-11 w-full rounded-xl border border-slate-600 bg-slate-950 px-4 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm text-slate-300">Telefone do pai</span>
              <input
                name="fatherPhone"
                type="text"
                defaultValue={draftValue(draft, "fatherPhone", student.fatherPhone ?? "")}
                className="h-11 w-full rounded-xl border border-slate-600 bg-slate-950 px-4 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm text-slate-300">Endereço</span>
              <input
                name="address"
                type="text"
                defaultValue={draftValue(draft, "address", student.address ?? "")}
                className="h-11 w-full rounded-xl border border-slate-600 bg-slate-950 px-4 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm text-slate-300">Posição primária</span>
              <input
                name="primaryPosition"
                type="text"
                defaultValue={draftValue(draft, "primaryPosition", student.primaryPosition ?? "")}
                className="h-11 w-full rounded-xl border border-slate-600 bg-slate-950 px-4 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm text-slate-300">URL da foto do aluno</span>
              <input
                name="photoUrl"
                type="text"
                defaultValue={draftValue(draft, "photoUrl", student.photoUrl ?? "")}
                placeholder="Cole aqui um link da imagem ou caminho local"
                className="h-11 w-full rounded-xl border border-slate-600 bg-slate-950 px-4 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
              />
              <p className="text-xs text-slate-400">Opcional. Se deixar vazio, a ficha mostra um avatar com as iniciais.</p>
            </label>

            <div className="md:col-span-2 flex flex-wrap items-center gap-3 pt-2">
              <button
                type="submit"
                className="h-11 rounded-xl bg-emerald-500 px-6 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
              >
                Salvar alterações
              </button>
              <Link
                href="/alunos"
                className="inline-flex h-11 items-center rounded-xl border border-slate-600 px-4 text-sm text-slate-200 transition hover:border-emerald-400/50 hover:text-emerald-200"
              >
                Cancelar
              </Link>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
