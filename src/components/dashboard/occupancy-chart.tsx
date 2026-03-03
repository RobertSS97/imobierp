"use client";

import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";
import { PieChart, Pie, Cell } from "recharts";

const COLORS = {
  light: [
    { name: "Alugados",    color: "#2563eb" },
    { name: "Disponíveis", color: "#16a34a" },
    { name: "Manutenção",  color: "#d97706" },
  ],
  dark: [
    { name: "Alugados",    color: "#60a5fa" },
    { name: "Disponíveis", color: "#4ade80" },
    { name: "Manutenção",  color: "#fbbf24" },
  ],
};

interface OccupancyChartProps {
  data?: { rented?: number; available?: number; maintenance?: number };
  privacyMode?: boolean;
}

export function OccupancyChart({ data, privacyMode = false }: OccupancyChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const palette = isDark ? COLORS.dark : COLORS.light;

  const chartConfig = {
    alugados:    { label: "Alugados",    color: palette[0].color },
    disponiveis: { label: "Disponíveis", color: palette[1].color },
    manutencao:  { label: "Manutenção",  color: palette[2].color },
  } satisfies ChartConfig;

  const occupancyData = [
    { name: "Alugados",    value: data?.rented      ?? 0, color: palette[0].color },
    { name: "Disponíveis", value: data?.available   ?? 0, color: palette[1].color },
    { name: "Manutenção",  value: data?.maintenance ?? 0, color: palette[2].color },
  ];

  const total = occupancyData.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Ocupação dos Imóveis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <ChartContainer config={chartConfig} className="h-48 w-full">
            <PieChart>
              <Pie
                data={occupancyData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
              >
                {occupancyData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={privacyMode ? (isDark ? "#334155" : "#e2e8f0") : entry.color}
                    opacity={privacyMode ? 0.5 : 1}
                  />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
          {privacyMode && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="rounded-full bg-muted/80 px-4 py-1.5 text-xs text-muted-foreground backdrop-blur-sm select-none">
                Valores ocultados
              </span>
            </div>
          )}
        </div>
        <div className="mt-4 space-y-2">
          {occupancyData.map((item) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-muted-foreground">{item.name}</span>
              </div>
              {privacyMode ? (
                <span className="tracking-widest text-muted-foreground select-none text-sm">••••••</span>
              ) : (
                <span className="text-sm font-medium">{item.value}</span>
              )}
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Taxa de Ocupação</span>
            {privacyMode ? (
              <span className="text-lg font-bold tracking-widest text-muted-foreground select-none">••••••</span>
            ) : (
              <span className="text-lg font-bold text-primary">
                {total > 0 ? ((occupancyData[0].value / total) * 100).toFixed(0) : 0}%
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
