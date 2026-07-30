-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "branch" TEXT NOT NULL DEFAULT 'main',
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT '📦',
    "color" TEXT NOT NULL DEFAULT '#94a3b8',

    CONSTRAINT "Category_pkey" PRIMARY KEY ("branch","id")
);

-- CreateTable
CREATE TABLE "Item" (
    "id" TEXT NOT NULL,
    "branch" TEXT NOT NULL DEFAULT 'main',
    "name" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 0,
    "minQty" INTEGER NOT NULL DEFAULT 0,
    "location" TEXT NOT NULL DEFAULT '',
    "serial" TEXT NOT NULL DEFAULT '',
    "dateAdded" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "assignedTo" TEXT,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("branch","id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "branch" TEXT NOT NULL DEFAULT 'main',
    "name" TEXT NOT NULL,
    "area" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("branch","id")
);

-- CreateTable
CREATE TABLE "Loan" (
    "id" TEXT NOT NULL,
    "branch" TEXT NOT NULL DEFAULT 'main',
    "itemId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "dateOut" TEXT NOT NULL,
    "dateDue" TEXT,
    "dateReturned" TEXT,
    "notes" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "Loan_pkey" PRIMARY KEY ("branch","id")
);

-- CreateTable
CREATE TABLE "Movement" (
    "id" TEXT NOT NULL,
    "branch" TEXT NOT NULL DEFAULT 'main',
    "itemId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "Movement_pkey" PRIMARY KEY ("branch","id")
);

-- CreateTable
CREATE TABLE "Computer" (
    "id" TEXT NOT NULL,
    "branch" TEXT NOT NULL DEFAULT 'main',
    "idNum" TEXT NOT NULL DEFAULT '',
    "tipo" TEXT NOT NULL DEFAULT 'Laptop',
    "marca" TEXT NOT NULL DEFAULT '',
    "modelo" TEXT NOT NULL DEFAULT '',
    "serie" TEXT NOT NULL,
    "hostname" TEXT NOT NULL DEFAULT '',
    "ram" TEXT NOT NULL DEFAULT '',
    "rom" TEXT NOT NULL DEFAULT '',
    "so" TEXT NOT NULL DEFAULT '',
    "asignado" TEXT NOT NULL DEFAULT '',
    "puesto" TEXT NOT NULL DEFAULT '',
    "departamento" TEXT NOT NULL DEFAULT '',
    "ubicacion" TEXT NOT NULL DEFAULT '',
    "fechaCompra" TEXT NOT NULL DEFAULT '',
    "garantia" TEXT NOT NULL DEFAULT '',
    "factura" TEXT NOT NULL DEFAULT '',
    "monitor" TEXT NOT NULL DEFAULT '',
    "serieMonitor" TEXT NOT NULL DEFAULT '',
    "garantiaMonitor" TEXT NOT NULL DEFAULT '',
    "estado" TEXT NOT NULL DEFAULT 'ACTIVO',
    "verificado" TEXT NOT NULL DEFAULT '',
    "comentarios" TEXT NOT NULL DEFAULT '',
    "assignmentHistory" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "Computer_pkey" PRIMARY KEY ("branch","id")
);

-- CreateTable
CREATE TABLE "Recurso" (
    "id" TEXT NOT NULL,
    "branch" TEXT NOT NULL DEFAULT 'main',
    "type" TEXT NOT NULL,
    "data" JSONB NOT NULL,

    CONSTRAINT "Recurso_pkey" PRIMARY KEY ("branch","type","id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "Category_branch_idx" ON "Category"("branch");

-- CreateIndex
CREATE INDEX "Item_branch_idx" ON "Item"("branch");

-- CreateIndex
CREATE INDEX "Item_branch_categoryId_idx" ON "Item"("branch", "categoryId");

-- CreateIndex
CREATE INDEX "Employee_branch_idx" ON "Employee"("branch");

-- CreateIndex
CREATE INDEX "Loan_branch_idx" ON "Loan"("branch");

-- CreateIndex
CREATE INDEX "Movement_branch_idx" ON "Movement"("branch");

-- CreateIndex
CREATE INDEX "Computer_branch_idx" ON "Computer"("branch");

-- CreateIndex
CREATE INDEX "Computer_branch_estado_idx" ON "Computer"("branch", "estado");

-- CreateIndex
CREATE INDEX "Recurso_branch_type_idx" ON "Recurso"("branch", "type");

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_branch_categoryId_fkey" FOREIGN KEY ("branch", "categoryId") REFERENCES "Category"("branch", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_branch_itemId_fkey" FOREIGN KEY ("branch", "itemId") REFERENCES "Item"("branch", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_branch_employeeId_fkey" FOREIGN KEY ("branch", "employeeId") REFERENCES "Employee"("branch", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movement" ADD CONSTRAINT "Movement_branch_itemId_fkey" FOREIGN KEY ("branch", "itemId") REFERENCES "Item"("branch", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

