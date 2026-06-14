-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "referenceMonth" INTEGER NOT NULL,
    "referenceYear" INTEGER NOT NULL,
    "amount" DECIMAL NOT NULL,
    "paymentMethod" TEXT NOT NULL DEFAULT 'PIX',
    "paymentDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Payment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Payment" ("amount", "createdAt", "id", "note", "paymentDate", "referenceMonth", "referenceYear", "status", "studentId", "updatedAt") SELECT "amount", "createdAt", "id", "note", "paymentDate", "referenceMonth", "referenceYear", "status", "studentId", "updatedAt" FROM "Payment";
DROP TABLE "Payment";
ALTER TABLE "new_Payment" RENAME TO "Payment";
CREATE INDEX "Payment_referenceYear_referenceMonth_idx" ON "Payment"("referenceYear", "referenceMonth");
CREATE INDEX "Payment_status_idx" ON "Payment"("status");
CREATE UNIQUE INDEX "Payment_studentId_referenceMonth_referenceYear_key" ON "Payment"("studentId", "referenceMonth", "referenceYear");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
