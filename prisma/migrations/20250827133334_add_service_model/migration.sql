-- CreateTable
CREATE TABLE "service" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "pricePerRequest" DECIMAL(65,30) NOT NULL DEFAULT 0.25,
    "category" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "apiEndpoint" TEXT,
    "authMethod" TEXT NOT NULL DEFAULT 'api-key',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "service" ADD CONSTRAINT "service_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
