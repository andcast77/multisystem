-- Add storeId to sales (locale/sucursal where sale was made)
ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "storeId" TEXT;

ALTER TABLE "sales" DROP CONSTRAINT IF EXISTS "sales_storeId_fkey";
ALTER TABLE "sales" ADD CONSTRAINT "sales_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;
