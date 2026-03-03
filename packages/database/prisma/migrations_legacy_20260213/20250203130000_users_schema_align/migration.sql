-- Align users table with Prisma schema (firstName, lastName, phone, isActive, 2FA)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "firstName" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lastName" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "twoFactorSecret" TEXT;

UPDATE "users" SET "firstName" = COALESCE("name", ''), "lastName" = '' WHERE "firstName" IS NULL;
ALTER TABLE "users" ALTER COLUMN "firstName" SET NOT NULL;
ALTER TABLE "users" ALTER COLUMN "lastName" SET DEFAULT '';
ALTER TABLE "users" ALTER COLUMN "lastName" SET NOT NULL;

ALTER TABLE "users" RENAME COLUMN "active" TO "isActive";

ALTER TABLE "users" DROP COLUMN IF EXISTS "name";
