"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowUpDown, TrendingUp, TrendingDown, Activity } from "lucide-react";
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

export default function TransactionsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    fetchTransactions();
  }, []);

  const checkAuth = async () => {
    const { data: session } = await authClient.getSession();
    if (!session?.user) {
      router.push("/login");
      return;
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await fetch("/api/transactions");
      if (response.ok) {
        const result = await response.json();
        setTransactions(result.data || []);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate transaction statistics
  const stats = {
    total: transactions.length,
    completed: transactions.filter(t => t.status === "COMPLETED").length,
    pending: transactions.filter(t => t.status === "PENDING").length,
    failed: transactions.filter(t => t.status === "FAILED").length,
    totalVolume: transactions
      .filter(t => t.status === "COMPLETED")
      .reduce((sum, t) => sum + t.amount, 0),
  };

  // Transform transactions to match DataTable format
  const transformedData = transactions.map((transaction, index) => ({
    id: index + 1, // Convert to number for DataTable compatibility
    header: transaction.fromWallet?.agentName || "Unknown Agent",
    type: transaction.type === "TRANSFER" ? "Agent Transfer" : transaction.type,
    status: transaction.status === "COMPLETED" ? "Completed" : 
             transaction.status === "PENDING" ? "Pending" : 
             transaction.status === "FAILED" ? "Failed" : transaction.status,
    target: `${transaction.amount.toFixed(CURRENCY.DECIMALS)} ${CURRENCY.TICKER}`,
    limit: transaction.memo || "-",
    reviewer: transaction.toWallet?.agentName || "External",
  }));

  if (loading) {
    return (
      <div className="px-4 lg:px-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ArrowUpDown className="w-7 h-7" />
          Transactions
        </h1>
        <p className="text-muted-foreground">
          View and manage all your agent-to-agent transactions
        </p>
      </div>

      {/* Transaction Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}% success rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Activity className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVolume.toFixed(CURRENCY.DECIMALS)} {CURRENCY.TICKER}</div>
            <p className="text-xs text-muted-foreground">Completed transactions</p>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Transaction Table */}
      {transformedData.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ArrowUpDown className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Transactions Yet</h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              Start sending tokens between your agent wallets to see transaction history here
            </p>
          </CardContent>
        </Card>
      ) : (
        <DataTable data={transformedData} />
      )}
    </div>
  );
}
