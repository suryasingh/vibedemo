"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { IconCircleCheckFilled, IconLoader, IconClock } from "@tabler/icons-react"

interface Transaction {
  id: number
  header: string
  type: string
  status: string
  target: string
  limit: string
  reviewer: string
}

interface TransactionsTableProps {
  data: Transaction[]
}

function getStatusIcon(status: string) {
  switch (status.toLowerCase()) {
    case "completed":
    case "done":
      return <IconCircleCheckFilled className="w-4 h-4 text-green-500" />
    case "in process":
    case "pending":
      return <IconClock className="w-4 h-4 text-yellow-500" />
    default:
      return <IconLoader className="w-4 h-4 text-blue-500" />
  }
}

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status.toLowerCase()) {
    case "completed":
    case "done":
      return "default"
    case "in process":
      return "secondary"
    case "pending":
      return "outline"
    default:
      return "outline"
  }
}

function getTransactionTypeVariant(type: string): "default" | "secondary" | "destructive" | "outline" {
  if (type.includes("Service Provided")) {
    return "default"
  } else if (type.includes("Service Request")) {
    return "secondary"
  }
  return "outline"
}

export function TransactionsTable({ data }: TransactionsTableProps) {
  return (
    <div className="px-4 lg:px-6">
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            Your agent service transactions and payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service/Agent</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Requests</TableHead>
                <TableHead>Client/Provider</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-medium">
                    {transaction.header}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getTransactionTypeVariant(transaction.type)}>
                      {transaction.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(transaction.status)}
                      <Badge variant={getStatusVariant(transaction.status)}>
                        {transaction.status}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {transaction.target}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {transaction.limit}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {transaction.reviewer}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
