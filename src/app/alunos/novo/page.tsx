import Link from "next/link";
import { createStudentAction } from "./actions";

type NewStudentPageProps = {
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

function draftValue(draft: Record<string, string>, key: string) {
  return draft[key] ?? "";
}

export default async function NewStudentPage({ searchParams }: NewStudentPageProps) {
  const resolved = searchParams ? await searchParams : undefined;
  const errorMessage = normalizeParam(resolved?.error);
  const draft = parseDraft(normalizeParam(resolved?.draft));

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="rounded-2xl border border-emerald-400/30 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 p-5 shadow-[0_0_30px_rgba(16,185,129,0.18)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-emerald-300">R Sports</p>
              <h1 className="mt-2 text-3xl font-bold">Novo Aluno</h1>
              <p className="mt-1 text-sm text-slate-300">Cadastro simples para não travar a operação diária.</p>
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
          <form action={createStudentAction} encType="multipart/form-data" className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm text-slate-300">Nome completo *</span>
              <input
                name="fullName"
                type="text"
                required
                defaultValue={draftValue(draft, "fullName")}
                className="h-11 w-full rounded-xl border border-slate-600 bg-slate-950 px-4 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm text-slate-300">Data de nascimento *</span>
              <input
                name="birthDate"
                type="date"
                required
                defaultValue={draftValue(draft, "birthDate")}
                className="h-11 w-full rounded-xl border border-slate-600 bg-slate-950 px-4 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm text-slate-300">CPF</span>
              <input
                name="cpf"
                type="text"
                placeholder="Somente numeros"
                defaultValue={draftValue(draft, "cpf")}
                className="h-11 w-full rounded-xl border border-slate-600 bg-slate-950 px-4 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm text-slate-300">Telefone do aluno</span>
              <input
                name="studentPhone"
                type="text"
                placeholder="Ex: 11912345678"
                defaultValue={draftValue(draft, "studentPhone")}
                className="h-11 w-full rounded-xl border border-slate-600 bg-slate-950 px-4 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm text-slate-300">Categoria *</span>
              <input
                name="category"
                type="text"
                placeholder="Ex: Sub-13 - Verde"
                required
                defaultValue={draftValue(draft, "category")}
                className="h-11 w-full rounded-xl border border-slate-600 bg-slate-950 px-4 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm text-slate-300">Nome da mãe</span>
              <input
                name="motherName"
                type="text"
                defaultValue={draftValue(draft, "motherName")}
                className="h-11 w-full rounded-xl border border-slate-600 bg-slate-950 px-4 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm text-slate-300">Telefone da mãe</span>
              <input
                name="motherPhone"
                type="text"
                defaultValue={draftValue(draft, "motherPhone")}
                className="h-11 w-full rounded-xl border border-slate-600 bg-slate-950 px-4 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm text-slate-300">Nome do pai</span>
              <input
                name="fatherName"
                type="text"
                defaultValue={draftValue(draft, "fatherName")}
                className="h-11 w-full rounded-xl border border-slate-600 bg-slate-950 px-4 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm text-slate-300">Telefone do pai</span>
              <input
                name="fatherPhone"
                type="text"
                defaultValue={draftValue(draft, "fatherPhone")}
                className="h-11 w-full rounded-xl border border-slate-600 bg-slate-950 px-4 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm text-slate-300">Endereço</span>
              <input
                name="address"
                type="text"
                defaultValue={draftValue(draft, "address")}
                className="h-11 w-full rounded-xl border border-slate-600 bg-slate-950 px-4 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm text-slate-300">Posição primária</span>
              <input
                name="primaryPosition"
                type="text"
                placeholder="Ex: Goleiro"
                defaultValue={draftValue(draft, "primaryPosition")}
                className="h-11 w-full rounded-xl border border-slate-600 bg-slate-950 px-4 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm text-slate-300">Upload da foto (demo local)</span>
              <input
                name="photoFile"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="h-11 w-full rounded-xl border border-slate-600 bg-slate-950 px-3 text-sm text-slate-200 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-500 file:px-3 file:py-1 file:text-sm file:font-semibold file:text-slate-950 hover:file:bg-emerald-400"
              />
              <p className="text-xs text-slate-400">Opcional. Tamanho maximo: 5MB.</p>
            </label>

            <label className="space-y-2">
              <span className="text-sm text-slate-300">URL da foto do aluno</span>
              <input
                name="photoUrl"
                type="text"
                placeholder="Cole aqui um link da imagem ou caminho local"
                defaultValue={draftValue(draft, "photoUrl")}
                className="h-11 w-full rounded-xl border border-slate-600 bg-slate-950 px-4 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
              />
              <p className="text-xs text-slate-400">Opcional. Se deixar vazio, a ficha mostra um avatar com as iniciais.</p>
            </label>

            <div className="md:col-span-2 flex flex-wrap items-center gap-3 pt-2">
              <button
                type="submit"
                className="h-11 rounded-xl bg-emerald-500 px-6 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
              >
                Salvar aluno
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
