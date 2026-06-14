import { PaymentMethod, PaymentStatus, ExpenseStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

type HomeProps = {
  searchParams?: Promise<{
    mode?: string | string[];
    ano?: string | string[];
    mes?: string | string[];
    inicio?: string | string[];
    fim?: string | string[];
  }>;
};

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
] as const;

function normalizeQuery(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function toInputDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function parseInputDate(value: string) {
  if (!value) {
    return null;
  }

  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function diffDays(start: Date, endExclusive: Date) {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.max(1, Math.round((endExclusive.getTime() - start.getTime()) / msPerDay));
}

function addDays(value: Date, days: number) {
  const next = new Date(value);
  next.setDate(next.getDate() + days);
  return next;
}

function toCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function paymentMethodLabel(method: PaymentMethod) {
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

export default async function Home({ searchParams }: HomeProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const periodModeRaw = normalizeQuery(resolvedSearchParams?.mode);
  const periodMode =
    periodModeRaw === "anual" || periodModeRaw === "personalizado" || periodModeRaw === "mensal"
      ? periodModeRaw
      : "mensal";

  const selectedYear = Number.parseInt(normalizeQuery(resolvedSearchParams?.ano), 10);
  const safeSelectedYear = Number.isInteger(selectedYear) && selectedYear >= 2020 && selectedYear <= 2100
    ? selectedYear
    : currentYear;

  const selectedMonth = Number.parseInt(normalizeQuery(resolvedSearchParams?.mes), 10);
  const safeSelectedMonth = Number.isInteger(selectedMonth) && selectedMonth >= 1 && selectedMonth <= 12
    ? selectedMonth
    : currentMonth;

  const customStartRaw = normalizeQuery(resolvedSearchParams?.inicio);
  const customEndRaw = normalizeQuery(resolvedSearchParams?.fim);

  const fallbackStart = new Date(currentYear, now.getMonth(), 1);
  const fallbackEndExclusive = new Date(currentYear, now.getMonth() + 1, 1);

  let periodStart = fallbackStart;
  let periodEndExclusive = fallbackEndExclusive;
  let periodLabel = "Mês atual";

  if (periodMode === "anual") {
    periodStart = new Date(safeSelectedYear, 0, 1);
    periodEndExclusive = new Date(safeSelectedYear + 1, 0, 1);
    periodLabel = `Ano ${safeSelectedYear}`;
  } else if (periodMode === "personalizado") {
    const customStart = parseInputDate(customStartRaw);
    const customEnd = parseInputDate(customEndRaw);

    if (customStart && customEnd && customStart <= customEnd) {
      periodStart = customStart;
      periodEndExclusive = addDays(customEnd, 1);
      periodLabel = `${new Intl.DateTimeFormat("pt-BR").format(customStart)} a ${new Intl.DateTimeFormat("pt-BR").format(customEnd)}`;
    } else {
      periodLabel = "Período personalizado inválido (usando mês atual)";
    }
  } else {
    periodStart = new Date(safeSelectedYear, safeSelectedMonth - 1, 1);
    periodEndExclusive = new Date(safeSelectedYear, safeSelectedMonth, 1);
    const monthName = MONTHS.find((item) => item.value === safeSelectedMonth)?.label ?? "";
    periodLabel = `${monthName} de ${safeSelectedYear}`;
  }

  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const sevenDaysAhead = new Date(todayStart);
  sevenDaysAhead.setDate(sevenDaysAhead.getDate() + 7);
  const monthStart = new Date(currentYear, now.getMonth(), 1);
  const monthEnd = new Date(currentYear, now.getMonth() + 1, 1);
  const previousPeriodDays = diffDays(periodStart, periodEndExclusive);
  const previousPeriodEndExclusive = new Date(periodStart);
  const previousPeriodStart = addDays(previousPeriodEndExclusive, -previousPeriodDays);

  const [
    totalStudents,
    paidCurrentMonth,
    overdueStudents,
    currentMonthExpenses,
    pending7Days,
    recentPayments,
    upcomingExpenses,
    periodRevenue,
    periodExpenses,
    periodExpensesPaid,
    previousPeriodRevenue,
    previousPeriodExpenses,
  ] = await Promise.all([
    prisma.student.count(),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        referenceMonth: currentMonth,
        referenceYear: currentYear,
        status: PaymentStatus.PAGO,
      },
    }),
    prisma.student.count({
      where: {
        payments: {
          none: {
            referenceMonth: currentMonth,
            referenceYear: currentYear,
            status: PaymentStatus.PAGO,
          },
        },
      },
    }),
    prisma.expense.aggregate({
      _sum: { amount: true },
      where: {
        dueDate: {
          gte: monthStart,
          lt: monthEnd,
        },
      },
    }),
    prisma.expense.aggregate({
      _sum: { amount: true },
      where: {
        status: ExpenseStatus.PENDENTE,
        dueDate: {
          gte: todayStart,
          lte: sevenDaysAhead,
        },
      },
    }),
    prisma.payment.findMany({
      where: { status: PaymentStatus.PAGO },
      include: { student: true },
      orderBy: { paymentDate: "desc" },
      take: 5,
    }),
    prisma.expense.findMany({
      where: { status: ExpenseStatus.PENDENTE },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        status: PaymentStatus.PAGO,
        paymentDate: {
          gte: periodStart,
          lt: periodEndExclusive,
        },
      },
    }),
    prisma.expense.aggregate({
      _sum: { amount: true },
      where: {
        dueDate: {
          gte: periodStart,
          lt: periodEndExclusive,
        },
      },
    }),
    prisma.expense.aggregate({
      _sum: { amount: true },
      where: {
        status: ExpenseStatus.PAGO,
        paymentDate: {
          gte: periodStart,
          lt: periodEndExclusive,
        },
      },
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        status: PaymentStatus.PAGO,
        paymentDate: {
          gte: previousPeriodStart,
          lt: previousPeriodEndExclusive,
        },
      },
    }),
    prisma.expense.aggregate({
      _sum: { amount: true },
      where: {
        dueDate: {
          gte: previousPeriodStart,
          lt: previousPeriodEndExclusive,
        },
      },
    }),
  ]);

  const paidAmount = Number(paidCurrentMonth._sum.amount ?? 0);
  const expenseAmount = Number(currentMonthExpenses._sum.amount ?? 0);
  const pendingAmount = Number(pending7Days._sum.amount ?? 0);
  const netAmount = paidAmount - expenseAmount;
  const periodRevenueAmount = Number(periodRevenue._sum.amount ?? 0);
  const periodExpensesAmount = Number(periodExpenses._sum.amount ?? 0);
  const periodExpensesPaidAmount = Number(periodExpensesPaid._sum.amount ?? 0);
  const periodNetAmount = periodRevenueAmount - periodExpensesAmount;
  const previousNetAmount = Number(previousPeriodRevenue._sum.amount ?? 0) - Number(previousPeriodExpenses._sum.amount ?? 0);
  const netVariation = periodNetAmount - previousNetAmount;

  const monthOptions = MONTHS.map((item) => (
    <option key={item.value} value={item.value}>
      {item.label}
    </option>
  ));

  const years: number[] = [];
  for (let year = currentYear - 4; year <= currentYear + 1; year += 1) {
    years.push(year);
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-2xl border border-emerald-400/30 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 p-5 shadow-[0_0_30px_rgba(16,185,129,0.18)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-emerald-300">R Sports</p>
              <h1 className="mt-2 text-3xl font-bold">Dashboard Gerencial</h1>
              <p className="mt-1 text-sm text-slate-300">Visão consolidada de alunos, receitas e despesas.</p>
            </div>
            <nav className="flex items-center gap-2 text-sm font-medium">
              <Link
                href="/"
                className="rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-2 text-emerald-200"
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
                href="/despesas"
                className="rounded-xl border border-slate-600 px-4 py-2 text-slate-200 transition hover:border-emerald-400/50 hover:text-emerald-200"
              >
                Despesas
              </Link>
            </nav>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <article className="rounded-2xl border border-slate-700 bg-slate-900/90 p-5">
            <p className="text-sm text-slate-400">Total de alunos</p>
            <p className="mt-2 text-4xl font-semibold text-emerald-300">{totalStudents}</p>
          </article>
          <article className="rounded-2xl border border-slate-700 bg-slate-900/90 p-5">
            <p className="text-sm text-slate-400">Mensalidades recebidas (mês atual)</p>
            <p className="mt-2 text-4xl font-semibold text-emerald-300">{toCurrency(paidAmount)}</p>
          </article>
          <article className="rounded-2xl border border-slate-700 bg-slate-900/90 p-5">
            <p className="text-sm text-slate-400">Alunos inadimplentes</p>
            <p className="mt-2 text-4xl font-semibold text-amber-300">{overdueStudents}</p>
          </article>
          <article className="rounded-2xl border border-slate-700 bg-slate-900/90 p-5">
            <p className="text-sm text-slate-400">Despesas (mês atual)</p>
            <p className="mt-2 text-4xl font-semibold text-rose-300">{toCurrency(expenseAmount)}</p>
          </article>
          <article className="rounded-2xl border border-slate-700 bg-slate-900/90 p-5">
            <p className="text-sm text-slate-400">Pendências (7 dias)</p>
            <p className="mt-2 text-4xl font-semibold text-amber-300">{toCurrency(pendingAmount)}</p>
          </article>
          <article className="rounded-2xl border border-slate-700 bg-slate-900/90 p-5">
            <p className="text-sm text-slate-400">Saldo líquido do mês</p>
            <p className={`mt-2 text-4xl font-semibold ${netAmount >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
              {toCurrency(netAmount)}
            </p>
          </article>
        </section>

        <section className="rounded-2xl border border-cyan-400/20 bg-slate-900/90 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Receitas x Despesas por Período</h2>
              <p className="mt-1 text-sm text-slate-300">Análise em visão mensal, anual ou intervalo personalizado.</p>
            </div>
            <p className="rounded-lg border border-slate-700 px-3 py-1 text-sm text-slate-300">{periodLabel}</p>
          </div>

          <form method="GET" className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-5">
            <label className="space-y-1">
              <span className="text-xs text-slate-400">Modo</span>
              <select
                name="mode"
                defaultValue={periodMode}
                className="h-10 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 text-sm outline-none transition focus:border-emerald-400"
              >
                <option value="mensal">Mensal</option>
                <option value="anual">Anual</option>
                <option value="personalizado">Personalizado</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs text-slate-400">Mês (modo mensal)</span>
              <select
                name="mes"
                defaultValue={safeSelectedMonth}
                className="h-10 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 text-sm outline-none transition focus:border-emerald-400"
              >
                {monthOptions}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs text-slate-400">Ano</span>
              <select
                name="ano"
                defaultValue={safeSelectedYear}
                className="h-10 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 text-sm outline-none transition focus:border-emerald-400"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs text-slate-400">Início (personalizado)</span>
              <input
                type="date"
                name="inicio"
                defaultValue={customStartRaw || toInputDate(fallbackStart)}
                className="h-10 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 text-sm outline-none transition focus:border-emerald-400"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs text-slate-400">Fim (personalizado)</span>
              <input
                type="date"
                name="fim"
                defaultValue={customEndRaw || toInputDate(addDays(fallbackEndExclusive, -1))}
                className="h-10 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 text-sm outline-none transition focus:border-emerald-400"
              />
            </label>
            <div className="md:col-span-5">
              <button
                type="submit"
                className="h-10 rounded-lg bg-emerald-500 px-5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
              >
                Aplicar período
              </button>
            </div>
          </form>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
              <p className="text-xs uppercase tracking-widest text-slate-400">Receita no período</p>
              <p className="mt-2 text-2xl font-bold text-emerald-300">{toCurrency(periodRevenueAmount)}</p>
            </article>
            <article className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
              <p className="text-xs uppercase tracking-widest text-slate-400">Despesa prevista</p>
              <p className="mt-2 text-2xl font-bold text-rose-300">{toCurrency(periodExpensesAmount)}</p>
            </article>
            <article className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
              <p className="text-xs uppercase tracking-widest text-slate-400">Despesa paga</p>
              <p className="mt-2 text-2xl font-bold text-amber-300">{toCurrency(periodExpensesPaidAmount)}</p>
            </article>
            <article className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
              <p className="text-xs uppercase tracking-widest text-slate-400">Saldo do período</p>
              <p className={`mt-2 text-2xl font-bold ${periodNetAmount >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                {toCurrency(periodNetAmount)}
              </p>
              <p className={`mt-1 text-xs ${netVariation >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                Variação vs período anterior: {netVariation >= 0 ? "+" : ""}{toCurrency(netVariation)}
              </p>
            </article>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <article className="rounded-2xl border border-slate-700 bg-slate-900/90 p-5">
            <h2 className="text-lg font-semibold">Últimos pagamentos registrados</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="text-slate-400">
                  <tr>
                    <th className="pb-3">Aluno</th>
                    <th className="pb-3">Data</th>
                    <th className="pb-3">Valor</th>
                    <th className="pb-3">Forma</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPayments.map((payment) => (
                    <tr key={payment.id} className="border-t border-slate-800">
                      <td className="py-3">{payment.student.fullName}</td>
                      <td className="py-3">
                        {payment.paymentDate
                          ? new Intl.DateTimeFormat("pt-BR").format(payment.paymentDate)
                          : "-"}
                      </td>
                      <td className="py-3">{toCurrency(Number(payment.amount))}</td>
                      <td className="py-3">{paymentMethodLabel(payment.paymentMethod)}</td>
                      <td className="py-3">
                        <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300">
                          {payment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-700 bg-slate-900/90 p-5">
            <h2 className="text-lg font-semibold">Próximas contas a pagar</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="text-slate-400">
                  <tr>
                    <th className="pb-3">Conta</th>
                    <th className="pb-3">Vencimento</th>
                    <th className="pb-3">Valor</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingExpenses.map((expense) => (
                    <tr key={expense.id} className="border-t border-slate-800">
                      <td className="py-3">{expense.description}</td>
                      <td className="py-3">{new Intl.DateTimeFormat("pt-BR").format(expense.dueDate)}</td>
                      <td className="py-3">{toCurrency(Number(expense.amount))}</td>
                      <td className="py-3">
                        <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-300">
                          {expense.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
