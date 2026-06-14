import Link from "next/link";
import { prisma } from "@/lib/prisma";

type StudentsPageProps = {
  searchParams?: Promise<{
    q?: string | string[];
    created?: string | string[];
    updated?: string | string[];
  }>;
};

export const dynamic = "force-dynamic";

function normalizeQuery(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function matchesTextField(fieldValue: string | null | undefined, query: string) {
  const normalizedField = normalizeText(fieldValue ?? "");

  if (!normalizedField || !query) {
    return false;
  }

  const words = normalizedField.split(/\s+/).filter(Boolean);

  // Para termos curtos, evita falso positivo por trecho interno (ex: ana em eliana).
  if (query.length <= 3) {
    return words.some((word) => word.startsWith(query));
  }

  return normalizedField.includes(query) || words.some((word) => word.startsWith(query));
}

export default async function StudentsPage({ searchParams }: StudentsPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const search = normalizeQuery(resolvedSearchParams?.q).trim();
  const created = normalizeQuery(resolvedSearchParams?.created);
  const updated = normalizeQuery(resolvedSearchParams?.updated);
  const normalizedSearch = normalizeText(search);
  const digitsSearch = onlyDigits(search);

  const studentsFromDb = await prisma.student.findMany({
    orderBy: {
      fullName: "asc",
    },
    select: {
      id: true,
      fullName: true,
      motherName: true,
      motherPhone: true,
      fatherName: true,
      fatherPhone: true,
      cpf: true,
      category: true,
      studentPhone: true,
      createdAt: true,
    },
  });

  const students = normalizedSearch
    ? studentsFromDb.filter((student) => {
        const byName = matchesTextField(student.fullName, normalizedSearch);
        const byMotherName = matchesTextField(student.motherName, normalizedSearch);
        const byFatherName = matchesTextField(student.fatherName, normalizedSearch);

        const byResponsibleName = byMotherName || byFatherName;

        const phoneDigits = onlyDigits(student.studentPhone ?? "");
        const motherPhoneDigits = onlyDigits(student.motherPhone ?? "");
        const fatherPhoneDigits = onlyDigits(student.fatherPhone ?? "");
        const cpfDigits = onlyDigits(student.cpf ?? "");
        const byPhone =
          !!digitsSearch &&
          (phoneDigits.includes(digitsSearch) ||
            motherPhoneDigits.includes(digitsSearch) ||
            fatherPhoneDigits.includes(digitsSearch));
        const byCpf = !!digitsSearch && cpfDigits.includes(digitsSearch);

        return byName || byResponsibleName || byPhone || byCpf;
      })
    : studentsFromDb;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-2xl border border-emerald-400/30 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 p-5 shadow-[0_0_30px_rgba(16,185,129,0.18)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-emerald-300">R Sports</p>
              <h1 className="mt-2 text-3xl font-bold">Lista de Alunos</h1>
              <p className="mt-1 text-sm text-slate-300">Busca rápida por nome para operação diária da escolinha.</p>
            </div>
            <nav className="flex items-center gap-2 text-sm font-medium">
              <Link
                href="/"
                className="rounded-xl border border-slate-600 px-4 py-2 text-slate-200 transition hover:border-emerald-400/50 hover:text-emerald-200"
              >
                Dashboard
              </Link>
              <Link
                href="/alunos"
                className="rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-2 text-emerald-200"
              >
                Alunos
              </Link>
              <Link
                href="/pagamentos"
                className="rounded-xl border border-slate-600 px-4 py-2 text-slate-200 transition hover:border-emerald-400/50 hover:text-emerald-200"
              >
                Pagamentos
              </Link>
              <Link
                href="/despesas"
                className="rounded-xl border border-slate-600 px-4 py-2 text-slate-200 transition hover:border-emerald-400/50 hover:text-emerald-200"
              >
                Despesas
              </Link>
            </nav>
          </div>
        </header>

        <section className="rounded-2xl border border-slate-700 bg-slate-900/90 p-5">
          <div className="space-y-3">
            {created === "1" ? (
              <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
                Aluno cadastrado com sucesso.
              </p>
            ) : null}

            {updated === "1" ? (
              <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
                Aluno atualizado com sucesso.
              </p>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <form className="flex w-full flex-col gap-3 sm:flex-row lg:max-w-3xl" method="get">
                <input
                  type="text"
                  name="q"
                  defaultValue={search}
                  placeholder="Buscar por nome, telefone ou CPF"
                  className="h-11 w-full rounded-xl border border-slate-600 bg-slate-950 px-4 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    className="h-11 rounded-xl bg-emerald-500 px-6 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
                  >
                    Buscar
                  </button>
                  {search ? (
                    <Link
                      href="/alunos"
                      className="inline-flex h-11 items-center rounded-xl border border-slate-600 px-4 text-sm text-slate-200 transition hover:border-emerald-400/50 hover:text-emerald-200"
                    >
                      Limpar
                    </Link>
                  ) : null}
                </div>
              </form>

              <Link
                href="/alunos/novo"
                className="inline-flex h-11 items-center rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
              >
                Novo aluno
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-700 bg-slate-900/90 p-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">Alunos encontrados</h2>
            <p className="text-sm text-slate-400">Total: {students.length}</p>
          </div>

          {students.length === 0 ? (
            <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
              Nenhum aluno encontrado para a busca informada.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="text-slate-400">
                  <tr>
                    <th className="pb-3">Nome</th>
                    <th className="pb-3">Responsáveis</th>
                    <th className="pb-3">Categoria</th>
                    <th className="pb-3">Telefone</th>
                    <th className="pb-3">Cadastro</th>
                    <th className="pb-3">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id} className="border-t border-slate-800">
                      <td className="py-3 font-medium text-slate-100">{student.fullName}</td>
                      <td className="py-3 text-slate-300">
                        {[student.motherName, student.fatherName].filter(Boolean).join(" / ") || "-"}
                      </td>
                      <td className="py-3 text-slate-300">{student.category ?? "-"}</td>
                      <td className="py-3 text-slate-300">{student.studentPhone ?? "-"}</td>
                      <td className="py-3 text-slate-300">
                        {new Intl.DateTimeFormat("pt-BR").format(student.createdAt)}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/alunos/${student.id}`}
                            className="inline-flex h-8 items-center rounded-lg border border-emerald-500/40 px-3 text-xs font-semibold text-emerald-200 transition hover:border-emerald-400 hover:text-emerald-100"
                          >
                            Ver ficha
                          </Link>
                          <Link
                            href={`/alunos/${student.id}/editar`}
                            className="inline-flex h-8 items-center rounded-lg border border-slate-600 px-3 text-xs font-semibold text-slate-200 transition hover:border-emerald-400/50 hover:text-emerald-200"
                          >
                            Editar
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
