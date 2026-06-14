import Link from "next/link";
import { PaymentMethod, PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PagamentosPageProps = {
  searchParams?: Promise<{
    mes?: string | string[];
    ano?: string | string[];
    status?: string | string[];
  }>;
};

function toCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function toDate(value: Date | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR").format(value);
}

function paymentMethodLabel(method: PaymentMethod | null | undefined) {
  switch (method) {
    case PaymentMethod.DINHEIRO:
      return "Dinheiro";
    case PaymentMethod.CARTAO:
      return "Cartão";
    case PaymentMethod.PIX:
      return "PIX";
    case PaymentMethod.TRANSFERENCIA:
      return "Transferência";
    case PaymentMethod.BANCO:
      return "Banco";
    case PaymentMethod.OUTRO:
      return "Outro";
    default:
      return "-";
  }
}

function normalizeQuery(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

const MONTHS = [
  { value: 1, label: "Janeiro" },
  { value: 2, label: "Fevereiro" },
  { value: 3, label: "Março" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Maio" },
  { value: 6, label: "Junho" },
  { value: 7, label: "Julho" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Setembro" },
  { value: 10, label: "Outubro" },
  { value: 11, label: "Novembro" },
  { value: 12, label: "Dezembro" },
];

export default async function PagamentosPage({ searchParams }: PagamentosPageProps) {
  const resolved = searchParams ? await searchParams : undefined;
  const now = new Date();

  const selectedMonth = parseInt(normalizeQuery(resolved?.mes) || String(now.getMonth() + 1), 10);
  const selectedYear = parseInt(normalizeQuery(resolved?.ano) || String(now.getFullYear()), 10);

  const safeMonth = Number.isInteger(selectedMonth) && selectedMonth >= 1 && selectedMonth <= 12
    ? selectedMonth
    : now.getMonth() + 1;
  const safeYear = Number.isInteger(selectedYear) && selectedYear >= 2020 && selectedYear <= 2100
    ? selectedYear
    : now.getFullYear();

  const selectedStatusRaw = normalizeQuery(resolved?.status).toLowerCase();
  const safeStatus: "todos" | "pago" | "pendente" =
    selectedStatusRaw === "pago" || selectedStatusRaw === "pendente"
      ? selectedStatusRaw
      : "todos";

  const students = await prisma.student.findMany({
    orderBy: { fullName: "asc" },
    select: {
      id: true,
      fullName: true,
      category: true,
      payments: {
        where: {
          referenceMonth: safeMonth,
          referenceYear: safeYear,
        },
        take: 1,
      },
    },
  });

  const totalAlunos = students.length;
  const pagos = students.filter((s) => s.payments[0]?.status === PaymentStatus.PAGO);
  const pendentes = students.filter((s) => !s.payments[0] || s.payments[0].status !== PaymentStatus.PAGO);
  const totalRecebido = pagos.reduce((acc, s) => acc + Number(s.payments[0]?.amount ?? 0), 0);

  const filteredStudents =
    safeStatus === "pago" ? pagos : safeStatus === "pendente" ? pendentes : students;

  const years: number[] = [];
  for (let y = now.getFullYear() - 1; y <= now.getFullYear() + 1; y++) {
    years.push(y);
  }

  const monthLabel = MONTHS.find((m) => m.value === safeMonth)?.label ?? "";

  function paymentsFilterHref(status: "todos" | "pago" | "pendente") {
    return `/pagamentos?mes=${safeMonth}&ano=${safeYear}&status=${status}`;
  }

  const statusLabel =
    safeStatus === "pago" ? "Somente pagos" : safeStatus === "pendente" ? "Somente pendentes" : "Todos";

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
        <header className="rounded-2xl border border-emerald-400/30 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 p-5 shadow-[0_0_30px_rgba(16,185,129,0.18)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-emerald-300">R Sports</p>
              <h1 className="mt-2 text-3xl font-bold">Pagamentos</h1>
              <p className="mt-1 text-sm text-slate-300">
                Status de mensalidades por mês — {monthLabel} de {safeYear}
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium">
              <Link
                href="/"
                className="rounded-xl border border-slate-600 px-4 py-2 text-slate-200 transition hover:border-emerald-400/50 hover:text-emerald-200"
              >
                Dashboard
              </Link>
              <Link
                href="/alunos"
                className="rounded-xl border border-slate-600 px-4 py-2 text-slate-200 transition hover:border-emerald-400/50 hover:text-emerald-200"
              >
                Alunos
              </Link>
              <Link
                href="/despesas"
                className="rounded-xl border border-slate-600 px-4 py-2 text-slate-200 transition hover:border-emerald-400/50 hover:text-emerald-200"
              >
                Despesas
              </Link>
            </div>
          </div>
        </header>

        {/* KPIs */}
        <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Link
            href={paymentsFilterHref("todos")}
            className={`rounded-2xl border p-4 text-center transition ${
              safeStatus === "todos"
                ? "border-emerald-400/40 bg-emerald-500/10"
                : "border-slate-700 bg-slate-900/90 hover:border-slate-500"
            }`}
          >
            <p className="text-xs uppercase tracking-widest text-slate-400">Total alunos</p>
            <p className="mt-2 text-3xl font-bold text-slate-100">{totalAlunos}</p>
          </Link>
          <Link
            href={paymentsFilterHref("pago")}
            className={`rounded-2xl border p-4 text-center transition ${
              safeStatus === "pago"
                ? "border-emerald-400/40 bg-emerald-500/10"
                : "border-emerald-500/30 bg-slate-900/90 hover:border-emerald-400/50"
            }`}
          >
            <p className="text-xs uppercase tracking-widest text-emerald-400">Pagos</p>
            <p className="mt-2 text-3xl font-bold text-emerald-300">{pagos.length}</p>
          </Link>
          <Link
            href={paymentsFilterHref("pendente")}
            className={`rounded-2xl border p-4 text-center transition ${
              safeStatus === "pendente"
                ? "border-emerald-400/40 bg-emerald-500/10"
                : "border-amber-500/30 bg-slate-900/90 hover:border-amber-400/50"
            }`}
          >
            <p className="text-xs uppercase tracking-widest text-amber-400">Pendentes</p>
            <p className="mt-2 text-3xl font-bold text-amber-300">{pendentes.length}</p>
          </Link>
          <article className="rounded-2xl border border-slate-700 bg-slate-900/90 p-4 text-center">
            <p className="text-xs uppercase tracking-widest text-slate-400">Recebido</p>
            <p className="mt-2 text-2xl font-bold text-slate-100">{toCurrency(totalRecebido)}</p>
          </article>
        </section>

        {/* Filtro */}
        <section className="rounded-2xl border border-slate-700 bg-slate-900/90 p-4">
          <form method="GET" className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="status" value={safeStatus} />
            <label className="space-y-1">
              <span className="text-xs text-slate-400">Mês</span>
              <select
                name="mes"
                defaultValue={safeMonth}
                className="h-10 rounded-lg border border-slate-600 bg-slate-950 px-3 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
              >
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs text-slate-400">Ano</span>
              <select
                name="ano"
                defaultValue={safeYear}
                className="h-10 rounded-lg border border-slate-600 bg-slate-950 px-3 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className="h-10 rounded-lg bg-emerald-500 px-5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
            >
              Filtrar
            </button>
          </form>
        </section>

        {/* Tabela */}
        <section className="rounded-2xl border border-slate-700 bg-slate-900/90 p-5">
          <h2 className="text-lg font-semibold">
            Mensalidades — {monthLabel} / {safeYear}
          </h2>
          <p className="mt-2 text-sm text-slate-400">Filtro atual: {statusLabel}</p>

          {totalAlunos === 0 ? (
            <p className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
              Nenhum aluno cadastrado.{" "}
              <Link href="/alunos/novo" className="underline hover:text-amber-100">
                Cadastrar aluno
              </Link>
            </p>
          ) : filteredStudents.length === 0 ? (
            <p className="mt-4 rounded-xl border border-slate-600/30 bg-slate-800/50 p-4 text-sm text-slate-300">
              Não há registros para o filtro selecionado.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="text-slate-400">
                  <tr>
                    <th className="pb-3">Aluno</th>
                    <th className="pb-3">Categoria</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Valor</th>
                    <th className="pb-3">Forma</th>
                    <th className="pb-3">Data pag.</th>
                    <th className="pb-3">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => {
                    const payment = student.payments[0] ?? null;
                    const isPago = payment?.status === PaymentStatus.PAGO;

                    return (
                      <tr key={student.id} className="border-t border-slate-800">
                        <td className="py-3 font-medium text-slate-100">{student.fullName}</td>
                        <td className="py-3 text-slate-300">{student.category ?? "-"}</td>
                        <td className="py-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              isPago
                                ? "bg-emerald-500/20 text-emerald-300"
                                : "bg-amber-500/20 text-amber-300"
                            }`}
                          >
                            {isPago ? "PAGO" : "PENDENTE"}
                          </span>
                        </td>
                        <td className="py-3 text-slate-200">
                          {payment ? toCurrency(Number(payment.amount)) : "-"}
                        </td>
                        <td className="py-3 text-slate-300">
                          {paymentMethodLabel(payment?.paymentMethod)}
                        </td>
                        <td className="py-3 text-slate-300">
                          {toDate(payment?.paymentDate)}
                        </td>
                        <td className="py-3">
                          <Link
                            href={`/alunos/${student.id}`}
                            className="rounded-lg border border-emerald-500/40 px-3 py-1 text-xs font-medium text-emerald-400 transition hover:border-emerald-400 hover:text-emerald-300"
                          >
                            Ver ficha
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
