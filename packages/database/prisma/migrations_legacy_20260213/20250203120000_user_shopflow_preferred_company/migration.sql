-- Empresa preferida/por defecto en Shopflow por usuario
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "shopflowPreferredCompanyId" TEXT;

ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_shopflowPreferredCompanyId_fkey";
ALTER TABLE "users" ADD CONSTRAINT "users_shopflowPreferredCompanyId_fkey" FOREIGN KEY ("shopflowPreferredCompanyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
