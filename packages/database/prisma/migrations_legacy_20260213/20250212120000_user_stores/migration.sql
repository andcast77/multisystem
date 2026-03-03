-- CreateTable
CREATE TABLE "user_stores" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_stores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_stores_userId_storeId_key" ON "user_stores"("userId", "storeId");

-- AddForeignKey
ALTER TABLE "user_stores" ADD CONSTRAINT "user_stores_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_stores" ADD CONSTRAINT "user_stores_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: assign all company stores to existing USER members (backward compatibility)
INSERT INTO "user_stores" ("id", "userId", "storeId", "createdAt")
SELECT gen_random_uuid(), cm."userId", s.id, NOW()
FROM company_members cm
JOIN stores s ON s."companyId" = cm."companyId" AND s.active = true
WHERE cm."membershipRole" = 'USER'
  AND NOT EXISTS (
    SELECT 1 FROM user_stores us WHERE us."userId" = cm."userId" AND us."storeId" = s.id
  );
