-- CreateTable
CREATE TABLE "wallet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "agentName" TEXT NOT NULL,
    "agentType" TEXT NOT NULL DEFAULT 'AI_AGENT',
    "cardNumber" TEXT NOT NULL,
    "cardHolderName" TEXT NOT NULL,
    "expiryDate" TEXT NOT NULL,
    "balance" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction" (
    "id" TEXT NOT NULL,
    "fromWalletId" TEXT NOT NULL,
    "toWalletId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "transactionType" TEXT NOT NULL DEFAULT 'TRANSFER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "wallet_cardNumber_key" ON "wallet"("cardNumber");

-- AddForeignKey
ALTER TABLE "wallet" ADD CONSTRAINT "wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_fromWalletId_fkey" FOREIGN KEY ("fromWalletId") REFERENCES "wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_toWalletId_fkey" FOREIGN KEY ("toWalletId") REFERENCES "wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
