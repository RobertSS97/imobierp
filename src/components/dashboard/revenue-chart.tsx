"use client";

import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Area,
  AreaChart,
} from "recharts";

const defaultData = [
  { month: "Jan", receita: 0, pendente: 0 },
  { month: "Fev", receita: 0, pendente: 0 },
  { month: "Mar", receita: 0, pendente: 0 },
  { month: "Abr", receita: 0, pendente: 0 },
  { month: "Mai", receita: 0, pendente: 0 },
  { month: "Jun", receita: 0, pendente: 0 },
];

const COLORS = {
  light: {
    receita: "#2563eb",
    pendente: "#94a3b8",
    grid: "#e2e8f0",
    tick: "#64748b",
  },
  dark: {
    receita: "#60a5fa",
    pendente: "#f59e0b",
    grid: "#334155",
    tick: "#94a3b8",
  },
};

interface RevenueChartProps {
  data?: Array<{ month: string; receita: number; pendente: number }>;
  privacyMode?: boolean;
}

export function RevenueChart({ data, privacyMode = false }: RevenueChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const c = isDark ? COLORS.dark : COLORS.light;

  const chartConfig = {
    receita: { label: "Receita", color: c.receita },
    pendente: { label: "Pendente", color: c.pendente },
  } satisfies ChartConfig;

  // No modo privado usa dados zerados para ocultar os valores reais
  const rawData = data && data.length > 0 ? data : defaultData;
  const revenueData = privacyMode
    ? rawData.map((d) => ({ ...d, receita: 0, pendente: 0 }))
    : rawData;

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle className="text-base">Receita Mensal</CardTitle>
      </CardHeader>
      <CardContent className="relative">
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <AreaChart data={privacyMode ? rawData : revenueData}>
            <CartesianGrid strokeDasharray="3 3" stroke={c.grid} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tick={{ fill: c.tick, fontSize: 12 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: c.tick, fontSize: 12 }}
              tickFormatter={privacyMode ? () => "••••" : (value) => `R$ ${(value / 1000).toFixed(0)}k`}
            />
            {!privacyMode && <ChartTooltip content={<ChartTooltipContent />} />}
            <Area
              type="monotone"
              dataKey="receita"
              stackId="1"
              stroke={privacyMode ? c.grid : c.receita}
              fill={privacyMode ? c.grid : c.receita}
              fillOpacity={privacyMode ? 0.15 : 0.6}
            />
            <Area
              type="monotone"
              dataKey="pendente"
              stackId="2"
              stroke={privacyMode ? c.grid : c.pendente}
              fill={privacyMode ? c.grid : c.pendente}
              fillOpacity={privacyMode ? 0.1 : 0.4}
            />
          </AreaChart>
        </ChartContainer>
        {privacyMode && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="rounded-full bg-muted/80 px-4 py-1.5 text-xs text-muted-foreground backdrop-blur-sm select-none">
              Valores ocultados
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
