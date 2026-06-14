import { Prisma, PrismaClient, ExpenseCategory, ExpenseStatus, PaymentStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.payment.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.student.deleteMany();

  await prisma.adminUser.upsert({
    where: { email: "admin@rsports.local" },
    update: { name: "Admin R Sports" },
    create: {
      name: "Admin R Sports",
      email: "admin@rsports.local",
      passwordHash: null,
    },
  });

  const gabriel = await prisma.student.create({
    data: {
      fullName: "Gabriel Silva Martins",
      birthDate: new Date("2014-05-15"),
      cpf: "49223656378",
      studentPhone: "11912345678",
      address: "Rua Turiassu, 123 - Perdizes",
      motherName: "Carla Silva",
      motherPhone: "11987654321",
      fatherName: "Marcos Martins",
      fatherPhone: "11977775555",
      category: "Sub-13 - Verde",
      primaryPosition: "Goleiro - Azul",
      photoUrl: "/students/gabriel.jpg",
    },
  });

  const lucas = await prisma.student.create({
    data: {
      fullName: "Lucas Souza",
      birthDate: new Date("2013-09-02"),
      cpf: "50112478091",
      studentPhone: "11922223333",
      address: "Rua das Palmeiras, 55 - Pompeia",
      motherName: "Eliana Souza",
      motherPhone: "11990001111",
      fatherName: "Paulo Souza",
      fatherPhone: "11998887777",
      category: "Sub-13 - Verde",
      primaryPosition: "Fixo - Azul",
      photoUrl: "/students/lucas.jpg",
    },
  });

  const ana = await prisma.student.create({
    data: {
      fullName: "Ana Costa",
      birthDate: new Date("2015-01-20"),
      cpf: "34511988002",
      studentPhone: "11933334444",
      address: "Av. Sumaré, 450 - Perdizes",
      motherName: "Juliana Costa",
      motherPhone: "11995556666",
      fatherName: "Rafael Costa",
      fatherPhone: "11994443322",
      category: "Sub-11 - Amarelo",
      primaryPosition: "Ala - Verde",
      photoUrl: "/students/ana.jpg",
    },
  });

  const currentDate = new Date();
  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();

  await prisma.payment.createMany({
    data: [
      {
        studentId: gabriel.id,
        referenceMonth: month,
        referenceYear: year,
        amount: new Prisma.Decimal(150),
        paymentDate: new Date(),
        status: PaymentStatus.PAGO,
        note: "Mensalidade paga via PIX",
      },
      {
        studentId: lucas.id,
        referenceMonth: month,
        referenceYear: year,
        amount: new Prisma.Decimal(150),
        paymentDate: new Date(),
        status: PaymentStatus.PAGO,
      },
      {
        studentId: ana.id,
        referenceMonth: month,
        referenceYear: year,
        amount: new Prisma.Decimal(150),
        paymentDate: null,
        status: PaymentStatus.PENDENTE,
      },
    ],
  });

  await prisma.expense.createMany({
    data: [
      {
        description: "Aluguel da quadra",
        category: ExpenseCategory.ALUGUEL,
        amount: new Prisma.Decimal(6000),
        dueDate: new Date(year, currentDate.getMonth(), 5),
        paymentDate: null,
        status: ExpenseStatus.PENDENTE,
        recurring: true,
      },
      {
        description: "Salarios dos professores",
        category: ExpenseCategory.PROFESSORES,
        amount: new Prisma.Decimal(4500),
        dueDate: new Date(year, currentDate.getMonth(), 10),
        paymentDate: null,
        status: ExpenseStatus.PENDENTE,
        recurring: true,
      },
      {
        description: "Material esportivo",
        category: ExpenseCategory.MATERIAL,
        amount: new Prisma.Decimal(1800),
        dueDate: new Date(year, currentDate.getMonth(), 15),
        paymentDate: new Date(),
        status: ExpenseStatus.PAGO,
        recurring: false,
      },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
