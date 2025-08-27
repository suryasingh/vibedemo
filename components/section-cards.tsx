import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

interface SectionCardsProps {
  transactions: Transaction[];
  wallets: Wallet[];
}

export function SectionCards({ transactions, wallets }: SectionCardsProps) {
  // Get current month transactions
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const currentMonthTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.createdAt);
    return transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear;
  });

  // Get wallet IDs belonging to the user
  const userWalletIds = new Set(wallets.map(w => w.id));

  // Calculate income (payments received TO user's wallets)
  const income = transactions
    .filter(t => userWalletIds.has(t.toWalletId) && t.status === "COMPLETED")
    .reduce((sum, t) => sum + t.amount, 0);

  // Calculate expenses (payments sent FROM user's wallets)  
  const expenses = transactions
    .filter(t => userWalletIds.has(t.fromWalletId) && t.status === "COMPLETED")
    .reduce((sum, t) => sum + t.amount, 0);

  // Calculate net profit
  const netProfit = income - expenses;

  // Calculate this month's stats
  const monthlyIncome = currentMonthTransactions
    .filter(t => userWalletIds.has(t.toWalletId) && t.status === "COMPLETED")
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyExpenses = currentMonthTransactions
    .filter(t => userWalletIds.has(t.fromWalletId) && t.status === "COMPLETED")
    .reduce((sum, t) => sum + t.amount, 0);

  // Count transactions
  const incomeTransactionCount = transactions.filter(t => userWalletIds.has(t.toWalletId) && t.status === "COMPLETED").length;
  const expenseTransactionCount = transactions.filter(t => userWalletIds.has(t.fromWalletId) && t.status === "COMPLETED").length;

  // Calculate total wallet balance
  const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);
  const activeWallets = wallets.filter(w => w.isActive).length;

  // Growth calculations (simplified - would need historical data for real percentages)
  const incomeGrowth = monthlyIncome > 0 ? "+new" : "0%";
  const expenseGrowth = monthlyExpenses > 0 ? "+new" : "0%";
  const profitGrowth = netProfit > 0 ? "+profitable" : "break-even";

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-bl *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card ">
        <CardHeader>
          <CardDescription>Total Income</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {income.toFixed(CURRENCY.DECIMALS)} {CURRENCY.TICKER}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {income > 0 ? <IconTrendingUp /> : <IconTrendingDown />}
              {incomeGrowth}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Earned from services provided <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            {incomeTransactionCount} payments received
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Expenses</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {expenses.toFixed(CURRENCY.DECIMALS)} {CURRENCY.TICKER}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {expenses > 0 ? <IconTrendingDown /> : <IconTrendingUp />}
              {expenseGrowth}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Spent on agent services <IconTrendingDown className="size-4" />
          </div>
          <div className="text-muted-foreground">
            {expenseTransactionCount} service requests made
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Net Profit</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {netProfit >= 0 ? '+' : ''}{netProfit.toFixed(CURRENCY.DECIMALS)} {CURRENCY.TICKER}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {netProfit >= 0 ? <IconTrendingUp /> : <IconTrendingDown />}
              {profitGrowth}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {netProfit >= 0 ? 'Positive cash flow' : 'Negative cash flow'} {netProfit >= 0 ? <IconTrendingUp className="size-4" /> : <IconTrendingDown className="size-4" />}
          </div>
          <div className="text-muted-foreground">Income minus expenses</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Balance</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {totalBalance.toFixed(CURRENCY.DECIMALS)} {CURRENCY.TICKER}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              {wallets.length} wallets
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {activeWallets} active wallets <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">Combined balance across all agents</div>
        </CardFooter>
      </Card>
    </div>
  );
}
