"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Eye, Send } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChargeItem {
  id: string;
  tenantName?: string;
  propertyTitle?: string;
  amount: number;
  dueDate: string;
  status: string;
}

interface RecentChargesTableProps {
  type: "pending" | "overdue";
  charges?: ChargeItem[];
  privacyMode?: boolean;
}

const MASK = "••••••";

export function RecentChargesTable({ type, charges = [], privacyMode = false }: RecentChargesTableProps) {
  const isOverdue = type === "overdue";

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("pt-BR");

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">
          {isOverdue ? "Cobranças Vencidas" : "Cobranças Pendentes"}
        </CardTitle>
        <Button variant="outline" size="sm" onClick={() => window.location.href = "/cobrancas"}>
          Ver todas
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Inquilino</TableHead>
              <TableHead>Imóvel</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {charges.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                  Nenhuma cobrança {isOverdue ? "vencida" : "pendente"}
                </TableCell>
              </TableRow>
            ) : (
              charges.map((charge) => (
                <TableRow key={charge.id}>
                  <TableCell className="font-medium">{charge.tenantName || "-"}</TableCell>
                  <TableCell className="text-muted-foreground">{charge.propertyTitle || "-"}</TableCell>
                  <TableCell className="text-right font-medium">
                    {privacyMode ? <span className="tracking-widest text-muted-foreground select-none">{MASK}</span> : formatCurrency(charge.amount)}
                  </TableCell>
                  <TableCell>{formatDate(charge.dueDate)}</TableCell>
                  <TableCell>
                    <Badge variant={isOverdue ? "destructive" : "default"}>
                      {isOverdue ? "Vencida" : "Pendente"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => window.location.href = `/cobrancas`}>
                          <Eye className="mr-2 h-4 w-4" /> Ver detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Send className="mr-2 h-4 w-4" /> Enviar WhatsApp
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
