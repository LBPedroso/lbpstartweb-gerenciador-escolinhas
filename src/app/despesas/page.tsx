import Link from "next/link";
import { ExpenseCategory, ExpenseStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { deleteExpenseAction } from "./actions";

export const dynamic = "force-dynamic";

type DespesasPageProps = {
  searchParams?: Promise<{
    mes?: string | string[];
    ano?: string | string[];
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

function categoryLabel(cat: ExpenseCategory) {
  switch (cat) {
    case ExpenseCategory.ALUGUEL:
      return "Aluguel";
    case ExpenseCategory.PROFESSORES:
      return "Professores";
    case ExpenseCategory.MATERIAL:
      return "Material";
    case ExpenseCategory.OUTROS:
      return "Outros";
  }
}

function paymentMethodLabel(method: string | null | undefined) {
  switch (method) {
    case "DINHEIRO":
      return "Dinheiro";
    case "DEBITO":
      return "Débito";
    case "CREDITO":
      return "Crédito";
    case "PIX":
      return "PIX";
    case "BOLETO":
      return "Boleto";
    case "OUTRO":
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

export default async function DespesasPage({ searchParams }: DespesasPageProps) {
  const resolved = searchParams ? await searchParams : undefined;
  const now = new Date();

  const selectedMonth = parseInt(normalizeQuery(resolved?.mes) || String(now.getMonth() + 1), 10);
  const selectedYear = parseInt(normalizeQuery(resolved?.ano) || String(now.getFullYear()), 10);

  const safeMonth =
    Number.isInteger(selectedMonth) && selectedMonth >= 1 && selectedMonth <= 12
      ? selectedMonth
      : now.getMonth() + 1;
  const safeYear =
    Number.isInteger(selectedYear) && selectedYear >= 2020 && selectedYear <= 2100
      ? selectedYear
      : now.getFullYear();

  const monthStart = new Date(safeYear, safeMonth - 1, 1);
  const monthEnd = new Date(safeYear, safeMonth, 1);

  const despesas = await prisma.expense.findMany({
    where: { dueDate: { gte: monthStart, lt: monthEnd } },
    orderBy: { dueDate: "asc" },
  });

  const totalGeral = despesas.reduce((acc, d) => acc + Number(d.amount), 0);
  const totalPago = despesas
    .filter((d) => d.status === ExpenseStatus.PAGO)
    .reduce((acc, d) => acc + Number(d.amount), 0);
  const totalPendente = despesas
    .filter((d) => d.status === ExpenseStatus.PENDENTE)
    .reduce((acc, d) => acc + Number(d.amount), 0);

  const years: number[] = [];
  for (let y = now.getFullYear() - 1; y <= now.getFullYear() + 1; y++) {
    years.push(y);
  }

  const monthLabel = MONTHS.find((m) => m.value === safeMonth)?.label ?? "";

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
        <header className="rounded-2xl border border-emerald-400/30 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 p-5 shadow-[0_0_30px_rgba(16,185,129,0.18)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-emerald-300">R Sports</p>
              <h1 className="mt-2 text-3xl font-bold">Despesas</h1>
              <p className="mt-1 text-sm text-slate-300">
                Controle de gastos — {monthLabel} de {safeYear}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
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
                href="/pagamentos"
                className="rounded-xl border border-slate-600 px-4 py-2 text-slate-200 transition hover:border-emerald-400/50 hover:text-emerald-200"
              >
                Pagamentos
              </Link>
              <Link
                href="/despesas/nova"
                className="rounded-xl bg-emerald-500 px-4 py-2 text-slate-950 transition hover:bg-emerald-400"
              >
                + Nova despesa
              </Link>
            </div>
          </div>
        </header>

        {/* KPIs */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <article className="rounded-2xl border border-slate-700 bg-slate-900/90 p-4 text-center">
            <p className="text-xs uppercase tracking-widest text-slate-400">Total do mês</p>
            <p className="mt-2 text-2xl font-bold text-slate-100">{toCurrency(totalGeral)}</p>
          </article>
          <article className="rounded-2xl border border-emerald-500/30 bg-slate-900/90 p-4 text-center">
            <p className="text-xs uppercase tracking-widest text-emerald-400">Pago</p>
            <p className="mt-2 text-2xl font-bold text-emerald-300">{toCurrency(totalPago)}</p>
          </article>
          <article className="rounded-2xl border border-amber-500/30 bg-slate-900/90 p-4 text-center">
            <p className="text-xs uppercase tracking-widest text-amber-400">Pendente</p>
            <p className="mt-2 text-2xl font-bold text-amber-300">{toCurrency(totalPendente)}</p>
          </article>
        </section>

        {/* Filtro */}
        <section className="rounded-2xl border border-slate-700 bg-slate-900/90 p-4">
          <form method="GET" className="flex flex-wrap items-end gap-3">
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
            Despesas — {monthLabel} / {safeYear}
          </h2>

          {despesas.length === 0 ? (
            <div className="mt-4 space-y-2">
              <p className="rounded-xl border border-slate-600/30 bg-slate-800/50 p-4 text-sm text-slate-300">
                Nenhuma despesa registrada para este mês.{" "}
                <Link href="/despesas/nova" className="text-emerald-400 underline hover:text-emerald-300">
                  Cadastrar despesa
                </Link>
              </p>
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="text-slate-400">
                  <tr>
                    <th className="pb-3">Descrição</th>
                    <th className="pb-3">Categoria</th>
                    <th className="pb-3">Vencimento</th>
                    <th className="pb-3">Valor</th>
                    <th className="pb-3">Forma</th>
                    <th className="pb-3">Parcelas</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Data pag.</th>
                    <th className="pb-3">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {despesas.map((despesa) => (
                    <tr key={despesa.id} className="border-t border-slate-800">
                      <td className="py-3 font-medium text-slate-100">
                        {despesa.description}
                        {despesa.recurring ? (
                          <span className="ml-2 rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-400">
                            Recorrente
                          </span>
                        ) : null}
                      </td>
                      <td className="py-3 text-slate-300">{categoryLabel(despesa.category)}</td>
                      <td className="py-3 text-slate-300">{toDate(despesa.dueDate)}</td>
                      <td className="py-3 text-slate-200">{toCurrency(Number(despesa.amount))}</td>
                      <td className="py-3 text-slate-300">{paymentMethodLabel(despesa.expensePaymentMethod)}</td>
                      <td className="py-3 text-slate-300">
                        {despesa.installments
                          ? `${despesa.installmentNumber ?? "?"}/${despesa.installments}x`
                          : "à vista"}
                      </td>
                      <td className="py-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            despesa.status === ExpenseStatus.PAGO
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "bg-amber-500/20 text-amber-300"
                          }`}
                        >
                          {despesa.status}
                        </span>
                      </td>
                      <td className="py-3 text-slate-300">{toDate(despesa.paymentDate)}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/despesas/${despesa.id}/editar`}
                            className="rounded-lg border border-slate-600 px-3 py-1 text-xs font-medium text-slate-300 transition hover:border-emerald-400/50 hover:text-emerald-300"
                          >
                            Editar
                          </Link>
                          <form action={deleteExpenseAction}>
                            <input type="hidden" name="expenseId" value={despesa.id} />
                            <input type="hidden" name="mes" value={safeMonth} />
                            <input type="hidden" name="ano" value={safeYear} />
                            <button
                              type="submit"
                              className="rounded-lg border border-rose-500/40 px-3 py-1 text-xs font-medium text-rose-400 transition hover:border-rose-400 hover:text-rose-300"
                            >
                              Excluir
                            </button>
                          </form>
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
