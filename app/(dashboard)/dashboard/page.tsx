"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/data-table";
import { SectionCards } from "@/components/section-cards";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { CURRENCY } from "@/lib/constants";

interface Transaction {
  id: string;
  fromWalletId: string;
  toWalletId: string;
  amount: number;
  currency: string;
  status: string;
  type: string;
  memo: string | null;
  createdAt: string;
  fromWallet?: {
    id: string;
    agentName: string;
    ethereumAddress: string;
  };
  toWallet?: {
    id: string;
    agentName: string;
    ethereumAddress: string;
  };
}

interface Wallet {
  id: string;
  agentName: string;
  balance: number;
  currency: string;
  isActive: boolean;
}

export default function Page() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeData = async () => {
      const { data: session } = await authClient.getSession();
      if (!session?.user) {
        router.push("/login");
        return;
      }
      
      // Fetch data after authentication is confirmed
      try {
        await Promise.all([
          fetchTransactions(),
          fetchWallets()
        ]);
      } catch (error) {
        console.error("Error initializing data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    initializeData();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await fetch("/api/transactions");
      if (response.ok) {
        const result = await response.json();
        console.log("Fetched transactions:", result);
        setTransactions(result.data || []);
      } else {
        console.error("Failed to fetch transactions:", response.status, response.statusText);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  const fetchWallets = async () => {
    try {
      const response = await fetch("/api/wallets");
      if (response.ok) {
        const walletsData = await response.json();
        console.log("Fetched wallets:", walletsData);
        setWallets(walletsData);
      } else {
        console.error("Failed to fetch wallets:", response.status, response.statusText);
      }
    } catch (error) {
      console.error("Error fetching wallets:", error);
    }
  };

  // Transform transactions to match DataTable format
  const transformedData = transactions.map((transaction, index) => {
    console.log("Transforming transaction:", transaction);
    return {
      id: index + 1, // Convert to number for DataTable compatibility
      header: transaction.fromWallet?.agentName || "Unknown Agent",
      type: transaction.type === "TRANSFER" ? "Agent Transfer" : transaction.type,
      status: transaction.status === "COMPLETED" ? "Completed" : 
               transaction.status === "PENDING" ? "Pending" : 
               transaction.status === "FAILED" ? "Failed" : transaction.status,
      target: `${Number(transaction.amount).toFixed(CURRENCY.DECIMALS)} ${CURRENCY.TICKER}`,
      limit: transaction.memo || "-",
      reviewer: transaction.toWallet?.agentName || "External",
    };
  });

  console.log("Transformed data:", transformedData);
  console.log("Transactions count:", transactions.length);
  console.log("Wallets count:", wallets.length);

  if (loading) {
    return (
      <>
        <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-bl *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
        <div className="space-y-4 px-4 lg:px-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </>
    );
  }

  return (
    <>
      <SectionCards transactions={transactions} wallets={wallets} />
      <DataTable data={transformedData} />
    </>
  );
}
