-- CreateTable: companies (required by company_members_and_modules migration)
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_name_key" ON "companies"("name");

-- AddForeignKey: self-reference for parent company
ALTER TABLE "companies" ADD CONSTRAINT "companies_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
