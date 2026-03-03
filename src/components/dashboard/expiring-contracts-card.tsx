"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, User } from "lucide-react";

interface ExpiringContract {
  id: string;
  tenantName?: string;
  propertyTitle?: string;
  endDate: string;
  daysUntilExpiry: number;
}

interface ExpiringContractsCardProps {
  contracts?: ExpiringContract[];
}

export function ExpiringContractsCard({ contracts = [] }: ExpiringContractsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Contratos Expirando</CardTitle>
        <Button variant="outline" size="sm" onClick={() => window.location.href = "/contratos"}>
          Ver todos
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {contracts.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <p className="text-sm">Nenhum contrato próximo do vencimento</p>
            </div>
          ) : (
            contracts.map((contract) => (
              <div key={contract.id} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="text-xs bg-amber-100 text-amber-700">
                    {(contract.tenantName || "?").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{contract.tenantName || "Inquilino"}</p>
                  <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {contract.propertyTitle || "Imóvel"}
                  </p>
                </div>
                <Badge variant={contract.daysUntilExpiry <= 15 ? "destructive" : "secondary"} className="text-xs">
                  <Calendar className="h-3 w-3 mr-1" />
                  {contract.daysUntilExpiry}d
                </Badge>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
