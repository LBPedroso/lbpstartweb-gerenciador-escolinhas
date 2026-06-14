import Link from "next/link";
import { notFound } from "next/navigation";
import { PaymentMethod, PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { cancelPaymentAction, registerMonthlyPaymentAction } from "./actions";

type StudentProfilePageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    payment?: string | string[];
    message?: string | string[];
  }>;
};

function normalizeQuery(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

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

function studentInitials(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "RS";
  }

  const first = parts[0]?.[0] ?? "R";
  const second = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "S" : parts[0]?.[1] ?? "S";

  return `${first}${second}`.toUpperCase();
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
] as const;

export default async function StudentProfilePage({ params, searchParams }: StudentProfilePageProps) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const paymentFeedback = normalizeQuery(resolvedSearchParams?.payment);
  const paymentMessage = normalizeQuery(resolvedSearchParams?.message);

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

  const yearOptions: number[] = [];
  for (let year = currentYear - 1; year <= currentYear + 2; year += 1) {
    yearOptions.push(year);
  }

  const age = calculateAge(student.birthDate);
  const studentPhotoUrl = student.photoUrl?.trim();

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-2xl border border-emerald-400/30 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 p-5 shadow-[0_0_30px_rgba(16,185,129,0.18)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-emerald-300">R Sports</p>
              <h1 className="mt-2 text-3xl font-bold">Ficha do Aluno</h1>
              <p className="mt-1 text-sm text-slate-300">Visão completa do cadastro e financeiro do aluno.</p>
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
            <div className="mb-4 flex items-center gap-4">
              {studentPhotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={studentPhotoUrl}
                  alt={`Foto de ${student.fullName}`}
                  className="h-20 w-20 rounded-2xl border border-slate-600 object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-slate-600 bg-slate-950 text-lg font-bold text-emerald-300">
                  {studentInitials(student.fullName)}
                </div>
              )}
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Foto / Avatar</p>
                <p className="text-sm text-slate-300">{studentPhotoUrl ? "Foto cadastrada" : "Sem foto cadastrada"}</p>
              </div>
            </div>
            <h2 className="text-xl font-semibold">{student.fullName}</h2>
            <p className="mt-1 text-sm text-slate-300">
              {age !== null ? `${age} anos` : "Idade não informada"}
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
                <span className="text-slate-400">Posição:</span> {student.primaryPosition ?? "-"}
              </p>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-700 bg-slate-900/90 p-5 lg:col-span-1">
            <h3 className="text-lg font-semibold">Responsáveis</h3>
            <div className="mt-4 space-y-4 text-sm text-slate-300">
              <div>
                <p className="text-slate-400">Mãe</p>
                <p className="font-medium text-slate-100">{student.motherName ?? "-"}</p>
                <p>{student.motherPhone ?? "-"}</p>
              </div>
              <div>
                <p className="text-slate-400">Pai</p>
                <p className="font-medium text-slate-100">{student.fatherName ?? "-"}</p>
                <p>{student.fatherPhone ?? "-"}</p>
              </div>
              <div>
                <p className="text-slate-400">Endereço</p>
                <p>{student.address ?? "-"}</p>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-700 bg-slate-900/90 p-5 lg:col-span-1">
            <h3 className="text-lg font-semibold">Resumo financeiro</h3>
            <div className="mt-4 space-y-3 text-sm">
              <p className="text-slate-300">
                <span className="text-slate-400">Status do mês:</span>{" "}
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
                <span className="text-slate-400">Forma de pagamento:</span> {paymentMethodLabel(currentPayment?.paymentMethod)}
              </p>
              <p className="text-slate-300">
                <span className="text-slate-400">Próximo vencimento:</span> {toDate(nextDueDate)}
              </p>

              <form action={registerMonthlyPaymentAction} className="mt-4 space-y-3 rounded-xl border border-slate-700 bg-slate-950/50 p-3">
                <input type="hidden" name="studentId" value={student.id} />
                <p className="text-xs text-slate-400">Registrar pagamento de {referenceLabel(currentMonth, currentYear)}</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="block space-y-1">
                    <span className="text-xs text-slate-400">Competência - Mês</span>
                    <select
                      name="referenceMonth"
                      defaultValue={currentMonth}
                      className="h-10 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
                    >
                      {MONTHS.map((month) => (
                        <option key={month.value} value={month.value}>
                          {month.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block space-y-1">
                    <span className="text-xs text-slate-400">Competência - Ano</span>
                    <select
                      name="referenceYear"
                      defaultValue={currentYear}
                      className="h-10 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
                    >
                      {yearOptions.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="block space-y-1">
                  <span className="text-xs text-slate-400">Valor pago</span>
                  <input
                    name="amount"
                    type="text"
                    defaultValue={monthlyAmount.toFixed(2).replace(".", ",")}
                    className="h-10 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs text-slate-400">Forma de pagamento</span>
                  <select
                    name="paymentMethod"
                    defaultValue={currentPayment?.paymentMethod ?? PaymentMethod.PIX}
                    className="h-10 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
                  >
                    <option value={PaymentMethod.DINHEIRO}>Dinheiro</option>
                    <option value={PaymentMethod.CARTAO}>Cartão</option>
                    <option value={PaymentMethod.PIX}>PIX</option>
                    <option value={PaymentMethod.TRANSFERENCIA}>Transferência</option>
                    <option value={PaymentMethod.BANCO}>Banco</option>
                    <option value={PaymentMethod.OUTRO}>Outro</option>
                  </select>
                </label>
                <label className="block space-y-1">
                  <span className="text-xs text-slate-400">Observacao (opcional)</span>
                  <input
                    name="note"
                    type="text"
                    placeholder="Ex: pago via PIX"
                    className="h-10 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
                  />
                </label>
                <button
                  type="submit"
                  className="h-10 w-full rounded-lg bg-emerald-500 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
                >
                  Registrar pagamento
                </button>
              </form>
            </div>
          </article>
        </section>

        {paymentFeedback === "success" ? (
          <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
            Pagamento registrado com sucesso para este mês.
          </p>
        ) : null}

        {paymentFeedback === "cancelled" ? (
          <p className="rounded-xl border border-slate-500/30 bg-slate-500/10 p-4 text-sm text-slate-200">
            Pagamento cancelado e removido do histórico.
          </p>
        ) : null}

        {paymentFeedback === "error" ? (
          <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
            {paymentMessage || "Não foi possível registrar o pagamento."}
          </p>
        ) : null}

        <section className="rounded-2xl border border-slate-700 bg-slate-900/90 p-5">
          <h3 className="text-lg font-semibold">Histórico de pagamentos (últimos 6)</h3>

          {student.payments.length === 0 ? (
            <p className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
              Nenhum pagamento registrado para este aluno.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="text-slate-400">
                  <tr>
                    <th className="pb-3">Referência</th>
                    <th className="pb-3">Valor</th>
                    <th className="pb-3">Forma</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Data do pagamento</th>
                    <th className="pb-3">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {student.payments.map((payment) => (
                    <tr key={payment.id} className="border-t border-slate-800">
                      <td className="py-3 text-slate-200">{referenceLabel(payment.referenceMonth, payment.referenceYear)}</td>
                      <td className="py-3 text-slate-200">{toCurrency(Number(payment.amount))}</td>
                      <td className="py-3 text-slate-300">{paymentMethodLabel(payment.paymentMethod)}</td>
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
                      <td className="py-3">
                        <form action={cancelPaymentAction}>
                          <input type="hidden" name="paymentId" value={payment.id} />
                          <input type="hidden" name="studentId" value={student.id} />
                          <button
                            type="submit"
                            className="rounded-lg border border-rose-500/40 px-3 py-1 text-xs font-medium text-rose-400 transition hover:border-rose-400 hover:text-rose-300"
                          >
                            Cancelar
                          </button>
                        </form>
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
