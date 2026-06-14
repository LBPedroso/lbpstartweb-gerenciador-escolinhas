import { PaymentStatus, ExpenseStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

function toCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default async function Home() {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const sevenDaysAhead = new Date(todayStart);
  sevenDaysAhead.setDate(sevenDaysAhead.getDate() + 7);
  const monthStart = new Date(currentYear, now.getMonth(), 1);
  const monthEnd = new Date(currentYear, now.getMonth() + 1, 1);

  const [
    totalStudents,
    paidCurrentMonth,
    overdueStudents,
    currentMonthExpenses,
    pending7Days,
    recentPayments,
    upcomingExpenses,
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
  ]);

  const paidAmount = Number(paidCurrentMonth._sum.amount ?? 0);
  const expenseAmount = Number(currentMonthExpenses._sum.amount ?? 0);
  const pendingAmount = Number(pending7Days._sum.amount ?? 0);
  const netAmount = paidAmount - expenseAmount;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-2xl border border-emerald-400/30 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 p-5 shadow-[0_0_30px_rgba(16,185,129,0.18)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-emerald-300">R Sports</p>
              <h1 className="mt-2 text-3xl font-bold">Dashboard Gerencial</h1>
              <p className="mt-1 text-sm text-slate-300">Visao consolidada de alunos, receitas e despesas.</p>
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
            </nav>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <article className="rounded-2xl border border-slate-700 bg-slate-900/90 p-5">
            <p className="text-sm text-slate-400">Total de alunos</p>
            <p className="mt-2 text-4xl font-semibold text-emerald-300">{totalStudents}</p>
          </article>
          <article className="rounded-2xl border border-slate-700 bg-slate-900/90 p-5">
            <p className="text-sm text-slate-400">Mensalidades recebidas (mes atual)</p>
            <p className="mt-2 text-4xl font-semibold text-emerald-300">{toCurrency(paidAmount)}</p>
          </article>
          <article className="rounded-2xl border border-slate-700 bg-slate-900/90 p-5">
            <p className="text-sm text-slate-400">Alunos inadimplentes</p>
            <p className="mt-2 text-4xl font-semibold text-amber-300">{overdueStudents}</p>
          </article>
          <article className="rounded-2xl border border-slate-700 bg-slate-900/90 p-5">
            <p className="text-sm text-slate-400">Despesas (mes atual)</p>
            <p className="mt-2 text-4xl font-semibold text-rose-300">{toCurrency(expenseAmount)}</p>
          </article>
          <article className="rounded-2xl border border-slate-700 bg-slate-900/90 p-5">
            <p className="text-sm text-slate-400">Pendencias (7 dias)</p>
            <p className="mt-2 text-4xl font-semibold text-amber-300">{toCurrency(pendingAmount)}</p>
          </article>
          <article className="rounded-2xl border border-slate-700 bg-slate-900/90 p-5">
            <p className="text-sm text-slate-400">Saldo liquido do mes</p>
            <p className={`mt-2 text-4xl font-semibold ${netAmount >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
              {toCurrency(netAmount)}
            </p>
          </article>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <article className="rounded-2xl border border-slate-700 bg-slate-900/90 p-5">
            <h2 className="text-lg font-semibold">Ultimos pagamentos registrados</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="text-slate-400">
                  <tr>
                    <th className="pb-3">Aluno</th>
                    <th className="pb-3">Data</th>
                    <th className="pb-3">Valor</th>
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
            <h2 className="text-lg font-semibold">Proximas contas a pagar</h2>
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
