import Link from "next/link";
import { notFound } from "next/navigation";
import { ExpenseCategory, ExpensePaymentMethod, ExpenseStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { updateExpenseAction } from "../../actions";

export const dynamic = "force-dynamic";

type EditarDespesaPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{
    error?: string | string[];
    draft?: string | string[];
  }>;
};

function normalizeQuery(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function toInputDate(value: Date | null | undefined) {
  if (!value) return "";
  return value.toISOString().split("T")[0];
}

type DraftData = {
  description?: string;
  categoryRaw?: string;
  amountRaw?: string;
  dueDateRaw?: string;
  statusRaw?: string;
  paymentDateRaw?: string;
  paymentMethodRaw?: string;
  installmentsRaw?: string;
  installmentNumberRaw?: string;
  recurring?: boolean;
  note?: string;
};

export default async function EditarDespesaPage({ params, searchParams }: EditarDespesaPageProps) {
  const { id } = await params;
  const resolved = searchParams ? await searchParams : undefined;
  const errorMsg = normalizeQuery(resolved?.error);
  const draftRaw = normalizeQuery(resolved?.draft);

  let draft: DraftData | null = null;
  if (draftRaw) {
    try {
      draft = JSON.parse(decodeURIComponent(draftRaw)) as DraftData;
    } catch {
      draft = null;
    }
  }

  const despesa = await prisma.expense.findUnique({ where: { id } });
  if (!despesa) notFound();

  const d = draft;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-2xl space-y-6">

        <header className="rounded-2xl border border-emerald-400/30 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 p-5 shadow-[0_0_30px_rgba(16,185,129,0.18)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-emerald-300">R Sports</p>
              <h1 className="mt-2 text-3xl font-bold">Editar Despesa</h1>
              <p className="mt-1 text-sm text-slate-300 truncate max-w-xs">{despesa.description}</p>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium">
              <Link
                href="/despesas"
                className="rounded-xl border border-slate-600 px-4 py-2 text-slate-200 transition hover:border-emerald-400/50 hover:text-emerald-200"
              >
                Voltar
              </Link>
            </div>
          </div>
        </header>

        {errorMsg ? (
          <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
            {errorMsg}
          </p>
        ) : null}

        <form action={updateExpenseAction} className="space-y-4 rounded-2xl border border-slate-700 bg-slate-900/90 p-6">
          <input type="hidden" name="expenseId" value={despesa.id} />

          <label className="block space-y-1">
            <span className="text-sm text-slate-300">Descrição <span className="text-rose-400">*</span></span>
            <input
              name="description"
              type="text"
              required
              defaultValue={d?.description ?? despesa.description}
              className="h-10 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
            />
          </label>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block space-y-1">
              <span className="text-sm text-slate-300">Categoria <span className="text-rose-400">*</span></span>
              <select
                name="category"
                required
                defaultValue={d?.categoryRaw ?? despesa.category}
                className="h-10 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
              >
                <option value={ExpenseCategory.ALUGUEL}>Aluguel</option>
                <option value={ExpenseCategory.PROFESSORES}>Professores</option>
                <option value={ExpenseCategory.MATERIAL}>Material</option>
                <option value={ExpenseCategory.OUTROS}>Outros</option>
              </select>
            </label>

            <label className="block space-y-1">
              <span className="text-sm text-slate-300">Valor (R$) <span className="text-rose-400">*</span></span>
              <input
                name="amount"
                type="text"
                required
                defaultValue={d?.amountRaw ?? Number(despesa.amount).toFixed(2).replace(".", ",")}
                className="h-10 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block space-y-1">
              <span className="text-sm text-slate-300">Vencimento <span className="text-rose-400">*</span></span>
              <input
                name="dueDate"
                type="date"
                required
                defaultValue={d?.dueDateRaw ?? toInputDate(despesa.dueDate)}
                className="h-10 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-sm text-slate-300">Status</span>
              <select
                name="status"
                defaultValue={d?.statusRaw ?? despesa.status}
                className="h-10 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
              >
                <option value={ExpenseStatus.PENDENTE}>Pendente</option>
                <option value={ExpenseStatus.PAGO}>Pago</option>
              </select>
            </label>
          </div>

          <label className="block space-y-1">
            <span className="text-sm text-slate-300">Data do pagamento</span>
            <input
              name="paymentDate"
              type="date"
              defaultValue={d?.paymentDateRaw ?? toInputDate(despesa.paymentDate)}
              className="h-10 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
            />
            <p className="text-xs text-slate-500">Preencha se o status for Pago.</p>
          </label>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <label className="block space-y-1 sm:col-span-1">
              <span className="text-sm text-slate-300">Forma de pagamento</span>
              <select
                name="expensePaymentMethod"
                defaultValue={d?.paymentMethodRaw ?? despesa.expensePaymentMethod ?? ""}
                className="h-10 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
              >
                <option value="">Não informado</option>
                <option value={ExpensePaymentMethod.DINHEIRO}>Dinheiro</option>
                <option value={ExpensePaymentMethod.DEBITO}>Débito</option>
                <option value={ExpensePaymentMethod.CREDITO}>Crédito</option>
                <option value={ExpensePaymentMethod.PIX}>PIX</option>
                <option value={ExpensePaymentMethod.BOLETO}>Boleto</option>
                <option value={ExpensePaymentMethod.OUTRO}>Outro (permuta etc.)</option>
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-sm text-slate-300">Total de parcelas</span>
              <input
                name="installments"
                type="number"
                min="1"
                max="48"
                defaultValue={d?.installmentsRaw ?? despesa.installments ?? ""}
                placeholder="Ex: 3"
                className="h-10 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-sm text-slate-300">Parcela nº</span>
              <input
                name="installmentNumber"
                type="number"
                min="1"
                max="48"
                defaultValue={d?.installmentNumberRaw ?? despesa.installmentNumber ?? ""}
                placeholder="Ex: 1"
                className="h-10 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
              />
            </label>
          </div>
          <p className="text-xs text-slate-500">Deixe parcelas em branco para pagamento à vista.</p>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              name="recurring"
              type="checkbox"
              defaultChecked={d?.recurring ?? despesa.recurring}
              className="h-4 w-4 rounded border-slate-600 accent-emerald-500"
            />
            <span className="text-sm text-slate-300">Despesa recorrente (mensal)</span>
          </label>

          <label className="block space-y-1">
            <span className="text-sm text-slate-300">Observação (opcional)</span>
            <input
              name="note"
              type="text"
              defaultValue={d?.note ?? despesa.note ?? ""}
              className="h-10 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
            />
          </label>

          <button
            type="submit"
            className="h-11 w-full rounded-xl bg-emerald-500 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
          >
            Salvar alterações
          </button>
        </form>
      </div>
    </main>
  );
}
