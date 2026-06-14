import Link from "next/link";
import { notFound } from "next/navigation";
import { PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type StudentProfilePageProps = {
  params: Promise<{
    id: string;
  }>;
};

function toCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function toDate(value: Date | null | undefined) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR").format(value);
}

function calculateAge(birthDate: Date | null) {
  if (!birthDate) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }

  return age;
}

function referenceLabel(month: number, year: number) {
  return new Intl.DateTimeFormat("pt-BR", {
    month: "short",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}

export default async function StudentProfilePage({ params }: StudentProfilePageProps) {
  const { id } = await params;

  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      payments: {
        orderBy: [{ referenceYear: "desc" }, { referenceMonth: "desc" }],
        take: 6,
      },
    },
  });

  if (!student) {
    notFound();
  }

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const currentPayment = student.payments.find(
    (payment) => payment.referenceMonth === currentMonth && payment.referenceYear === currentYear,
  );

  const latestPayment = student.payments[0];
  const monthlyAmount = Number(currentPayment?.amount ?? latestPayment?.amount ?? 150);
  const statusCurrentMonth = currentPayment?.status ?? PaymentStatus.PENDENTE;

  const nextDueDate =
    statusCurrentMonth === PaymentStatus.PAGO
      ? new Date(currentYear, now.getMonth() + 1, 10)
      : new Date(currentYear, now.getMonth(), 10);

  const age = calculateAge(student.birthDate);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-2xl border border-emerald-400/30 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 p-5 shadow-[0_0_30px_rgba(16,185,129,0.18)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-emerald-300">R Sports</p>
              <h1 className="mt-2 text-3xl font-bold">Ficha do Aluno</h1>
              <p className="mt-1 text-sm text-slate-300">Visao completa do cadastro e financeiro do aluno.</p>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium">
              <Link
                href="/alunos"
                className="rounded-xl border border-slate-600 px-4 py-2 text-slate-200 transition hover:border-emerald-400/50 hover:text-emerald-200"
              >
                Voltar para alunos
              </Link>
              <Link
                href={`/alunos/${student.id}/editar`}
                className="rounded-xl bg-emerald-500 px-4 py-2 text-slate-950 transition hover:bg-emerald-400"
              >
                Editar dados
              </Link>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <article className="rounded-2xl border border-slate-700 bg-slate-900/90 p-5 lg:col-span-1">
            <h2 className="text-xl font-semibold">{student.fullName}</h2>
            <p className="mt-1 text-sm text-slate-300">
              {age !== null ? `${age} anos` : "Idade nao informada"}
            </p>
            <div className="mt-4 space-y-2 text-sm text-slate-300">
              <p>
                <span className="text-slate-400">Nascimento:</span> {toDate(student.birthDate)}
              </p>
              <p>
                <span className="text-slate-400">CPF:</span> {student.cpf ?? "-"}
              </p>
              <p>
                <span className="text-slate-400">Telefone:</span> {student.studentPhone ?? "-"}
              </p>
              <p>
                <span className="text-slate-400">Categoria:</span> {student.category ?? "-"}
              </p>
              <p>
                <span className="text-slate-400">Posicao:</span> {student.primaryPosition ?? "-"}
              </p>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-700 bg-slate-900/90 p-5 lg:col-span-1">
            <h3 className="text-lg font-semibold">Responsaveis</h3>
            <div className="mt-4 space-y-4 text-sm text-slate-300">
              <div>
                <p className="text-slate-400">Mae</p>
                <p className="font-medium text-slate-100">{student.motherName ?? "-"}</p>
                <p>{student.motherPhone ?? "-"}</p>
              </div>
              <div>
                <p className="text-slate-400">Pai</p>
                <p className="font-medium text-slate-100">{student.fatherName ?? "-"}</p>
                <p>{student.fatherPhone ?? "-"}</p>
              </div>
              <div>
                <p className="text-slate-400">Endereco</p>
                <p>{student.address ?? "-"}</p>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-700 bg-slate-900/90 p-5 lg:col-span-1">
            <h3 className="text-lg font-semibold">Resumo financeiro</h3>
            <div className="mt-4 space-y-3 text-sm">
              <p className="text-slate-300">
                <span className="text-slate-400">Status do mes:</span>{" "}
                <span
                  className={`rounded-full px-2 py-1 text-xs font-semibold ${
                    statusCurrentMonth === PaymentStatus.PAGO
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-amber-500/20 text-amber-300"
                  }`}
                >
                  {statusCurrentMonth}
                </span>
              </p>
              <p className="text-slate-300">
                <span className="text-slate-400">Mensalidade:</span> {toCurrency(monthlyAmount)}
              </p>
              <p className="text-slate-300">
                <span className="text-slate-400">Data do pagamento:</span> {toDate(currentPayment?.paymentDate)}
              </p>
              <p className="text-slate-300">
                <span className="text-slate-400">Proximo vencimento:</span> {toDate(nextDueDate)}
              </p>
            </div>
          </article>
        </section>

        <section className="rounded-2xl border border-slate-700 bg-slate-900/90 p-5">
          <h3 className="text-lg font-semibold">Historico de pagamentos (ultimos 6)</h3>

          {student.payments.length === 0 ? (
            <p className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
              Nenhum pagamento registrado para este aluno.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="text-slate-400">
                  <tr>
                    <th className="pb-3">Referencia</th>
                    <th className="pb-3">Valor</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Data do pagamento</th>
                  </tr>
                </thead>
                <tbody>
                  {student.payments.map((payment) => (
                    <tr key={payment.id} className="border-t border-slate-800">
                      <td className="py-3 text-slate-200">{referenceLabel(payment.referenceMonth, payment.referenceYear)}</td>
                      <td className="py-3 text-slate-200">{toCurrency(Number(payment.amount))}</td>
                      <td className="py-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            payment.status === PaymentStatus.PAGO
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "bg-amber-500/20 text-amber-300"
                          }`}
                        >
                          {payment.status}
                        </span>
                      </td>
                      <td className="py-3 text-slate-300">{toDate(payment.paymentDate)}</td>
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
