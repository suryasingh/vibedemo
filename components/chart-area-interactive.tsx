"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

export const description = "An interactive area chart"

const chartData = [
  { date: "2024-04-01", income: 325.50, expenses: 89.45 },
  { date: "2024-04-02", income: 189.25, expenses: 67.32 },
  { date: "2024-04-03", income: 267.80, expenses: 145.68 },
  { date: "2024-04-04", income: 442.75, expenses: 178.97 },
  { date: "2024-04-05", income: 531.20, expenses: 234.25 },
  { date: "2024-04-06", income: 398.90, expenses: 156.18 },
  { date: "2024-04-07", income: 256.35, expenses: 98.62 },
  { date: "2024-04-08", income: 587.60, expenses: 289.54 },
  { date: "2024-04-09", income: 167.25, expenses: 78.26 },
  { date: "2024-04-10", income: 298.75, expenses: 134.79 },
  { date: "2024-04-11", income: 512.30, expenses: 198.64 },
  { date: "2024-04-12", income: 375.85, expenses: 145.10 },
  { date: "2024-04-13", income: 456.40, expenses: 189.42 },
  { date: "2024-04-14", income: 234.20, expenses: 98.53 },
  { date: "2024-04-15", income: 198.75, expenses: 76.39 },
  { date: "2024-04-16", income: 267.50, expenses: 134.67 },
  { date: "2024-04-17", income: 545.25, expenses: 234.78 },
  { date: "2024-04-18", income: 478.90, expenses: 189.51 },
  { date: "2024-04-19", income: 289.60, expenses: 123.75 },
  { date: "2024-04-20", income: 176.25, expenses: 87.30 },
  { date: "2024-04-21", payments: 145.80, requests: 58 },
  { date: "2024-04-22", payments: 203.45, requests: 81 },
  { date: "2024-04-23", payments: 167.90, requests: 67 },
  { date: "2024-04-24", payments: 398.50, requests: 159 },
  { date: "2024-04-25", payments: 234.75, requests: 93 },
  { date: "2024-04-26", payments: 89.25, requests: 35 },
  { date: "2024-04-27", payments: 445.80, requests: 178 },
  { date: "2024-04-28", payments: 156.20, requests: 62 },
  { date: "2024-04-29", payments: 289.65, requests: 115 },
  { date: "2024-04-30", payments: 467.25, requests: 186 },
  { date: "2024-05-01", payments: 198.50, requests: 79 },
  { date: "2024-05-02", payments: 334.75, requests: 133 },
  { date: "2024-05-03", payments: 223.40, requests: 89 },
  { date: "2024-05-04", payments: 456.25, requests: 182 },
  { date: "2024-05-05", payments: 512.80, requests: 205 },
  { date: "2024-05-06", payments: 534.50, requests: 213 },
  { date: "2024-05-07", payments: 367.25, requests: 146 },
  { date: "2024-05-08", payments: 178.90, requests: 71 },
  { date: "2024-05-09", payments: 203.75, requests: 81 },
  { date: "2024-05-10", payments: 356.25, requests: 142 },
  { date: "2024-05-11", payments: 298.50, requests: 119 },
  { date: "2024-05-12", payments: 234.80, requests: 93 },
  { date: "2024-05-13", payments: 167.25, requests: 66 },
  { date: "2024-05-14", payments: 523.50, requests: 209 },
  { date: "2024-05-15", payments: 445.75, requests: 178 },
  { date: "2024-05-16", payments: 398.20, requests: 159 },
  { date: "2024-05-17", payments: 534.25, requests: 213 },
  { date: "2024-05-18", payments: 367.50, requests: 147 },
  { date: "2024-05-19", payments: 198.75, requests: 79 },
  { date: "2024-05-20", payments: 223.50, requests: 89 },
  { date: "2024-05-21", payments: 134.75, requests: 53 },
  { date: "2024-05-22", payments: 98.25, requests: 39 },
  { date: "2024-05-23", payments: 298.50, requests: 119 },
  { date: "2024-05-24", payments: 267.80, requests: 107 },
  { date: "2024-05-25", payments: 245.25, requests: 98 },
  { date: "2024-05-26", payments: 189.50, requests: 75 },
  { date: "2024-05-27", payments: 489.75, requests: 195 },
  { date: "2024-05-28", payments: 203.25, requests: 81 },
  { date: "2024-05-29", payments: 89.50, requests: 35 },
  { date: "2024-05-30", payments: 334.25, requests: 133 },
  { date: "2024-05-31", payments: 223.75, requests: 89 },
  { date: "2024-06-01", payments: 198.25, requests: 79 },
  { date: "2024-06-02", payments: 467.50, requests: 187 },
  { date: "2024-06-03", payments: 156.75, requests: 62 },
  { date: "2024-06-04", payments: 445.25, requests: 178 },
  { date: "2024-06-05", payments: 134.50, requests: 53 },
  { date: "2024-06-06", payments: 298.25, requests: 119 },
  { date: "2024-06-07", payments: 378.75, requests: 151 },
  { date: "2024-06-08", payments: 398.50, requests: 159 },
  { date: "2024-06-09", payments: 512.25, requests: 204 },
  { date: "2024-06-10", payments: 189.75, requests: 75 },
  { date: "2024-06-11", payments: 145.50, requests: 58 },
  { date: "2024-06-12", payments: 534.25, requests: 213 },
  { date: "2024-06-13", payments: 123.75, requests: 49 },
  { date: "2024-06-14", payments: 456.50, requests: 182 },
  { date: "2024-06-15", payments: 367.25, requests: 146 },
  { date: "2024-06-16", payments: 389.75, requests: 155 },
  { date: "2024-06-17", payments: 556.25, requests: 222 },
  { date: "2024-06-18", payments: 167.50, requests: 67 },
  { date: "2024-06-19", payments: 334.75, requests: 133 },
  { date: "2024-06-20", payments: 467.25, requests: 186 },
  { date: "2024-06-21", payments: 203.50, requests: 81 },
  { date: "2024-06-22", payments: 298.75, requests: 119 },
  { date: "2024-06-23", payments: 545.25, requests: 218 },
  { date: "2024-06-24", payments: 178.50, requests: 71 },
  { date: "2024-06-25", payments: 189.75, requests: 75 },
  { date: "2024-06-26", payments: 445.50, requests: 178 },
  { date: "2024-06-27", payments: 512.75, requests: 205 },
  { date: "2024-06-28", payments: 198.25, requests: 79 },
  { date: "2024-06-29", payments: 156.50, requests: 62 },
  { date: "2024-06-30", payments: 467.75, requests: 187 },
]

const chartConfig = {
  cashflow: {
    label: "Cash Flow",
  },
  income: {
    label: "Income ($)",
    color: "var(--primary)",
  },
  expenses: {
    label: "Expenses ($)",
    color: "var(--primary)",
  },
} satisfies ChartConfig

export function ChartAreaInteractive() {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("90d")

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  const filteredData = chartData.filter((item) => {
    const date = new Date(item.date)
    const referenceDate = new Date("2024-06-30")
    let daysToSubtract = 90
    if (timeRange === "30d") {
      daysToSubtract = 30
    } else if (timeRange === "7d") {
      daysToSubtract = 7
    }
    const startDate = new Date(referenceDate)
    startDate.setDate(startDate.getDate() - daysToSubtract)
    return date >= startDate
  })

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Cash Flow Analysis</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Income vs expenses across all agent wallets
          </span>
          <span className="@[540px]/card:hidden">Income vs expenses</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">Last 3 months</ToggleGroupItem>
            <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
            <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Last 3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillDesktop" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-income)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-income)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillMobile" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-expenses)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-expenses)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <ChartTooltip
              cursor={false}
              defaultIndex={isMobile ? -1 : 10}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="expenses"
              type="natural"
              fill="url(#fillMobile)"
              stroke="var(--color-expenses)"
              stackId="a"
            />
            <Area
              dataKey="income"
              type="natural"
              fill="url(#fillDesktop)"
              stroke="var(--color-income)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
