-- AlterTable
ALTER TABLE "Expense" ADD COLUMN "expensePaymentMethod" TEXT;
ALTER TABLE "Expense" ADD COLUMN "installmentNumber" INTEGER;
ALTER TABLE "Expense" ADD COLUMN "installments" INTEGER;
