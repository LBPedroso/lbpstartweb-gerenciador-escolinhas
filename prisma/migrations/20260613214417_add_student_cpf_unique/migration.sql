/*
  Warnings:

  - A unique constraint covering the columns `[cpf]` on the table `Student` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Student_cpf_key" ON "Student"("cpf");
