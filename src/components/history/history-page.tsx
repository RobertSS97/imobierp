"use client";

import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { History, Search, Download, Building2, Users, FileText, DollarSign, Loader2, Plus, Edit, Trash2, RefreshCw } from "lucide-react";
import { historyApi } from "@/lib/api-client";
import { useApiList } from "@/hooks/use-api";
import { RequireAuth } from "@/contexts/auth-context";

const entityTypeLabels: Record<string, string> = { property: "Imóvel", tenant: "Inquilino", owner: "Proprietário", contract: "Contrato", charge: "Cobrança" };
const entityTypeColors: Record<string, string> = { property: "bg-primary/10 text-primary", tenant: "bg-blue-500/10 text-blue-500", owner: "bg-green-500/10 text-green-500", contract: "bg-purple-500/10 text-purple-500", charge: "bg-amber-500/10 text-amber-500" };
const actionLabels: Record<string, string> = { create: "Criação", update: "Atualização", delete: "Exclusão", status_change: "Mudança de Status" };
const actionIcons: Record<string, React.ElementType> = { create: Plus, update: Edit, delete: Trash2, status_change: RefreshCw };

function formatDateTime(d: string | null | undefined) {
  if (!d) return "-";
  const date = new Date(d);
  return `${date.toLocaleDateString("pt-BR")} ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
}

function getEntityIcon(type: string) {
  switch (type) {
    case "property": return Building2;
    case "tenant": case "owner": return Users;
    case "contract": return FileText;
    case "charge": return DollarSign;
    default: return History;
  }
}

export function HistoryPage() {
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [page, setPage] = useState(1);

  const queryParams: Record<string, string> = { page: String(page), limit: "50" };
  if (search) queryParams.search = search;
  if (entityFilter !== "all") queryParams.entityType = entityFilter;
  if (actionFilter !== "all") queryParams.action = actionFilter;

  const { items: logs, pagination, isLoading } = useApiList<any>(() => historyApi.list(queryParams), [page, search, entityFilter, actionFilter]);

  return (
    <RequireAuth><AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold">Histórico</h1><p className="text-muted-foreground">Acompanhe todas as alterações no sistema</p></div>
          <Button variant="outline"><Download className="h-4 w-4 mr-2" />Exportar Logs</Button>
        </div>

        {/* Filters */}
        <Card><CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar no histórico..." className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} /></div></div>
            <Select value={entityFilter} onValueChange={(v) => { setEntityFilter(v); setPage(1); }}><SelectTrigger className="w-44"><SelectValue placeholder="Tipo de registro" /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="property">Imóveis</SelectItem><SelectItem value="tenant">Inquilinos</SelectItem><SelectItem value="owner">Proprietários</SelectItem><SelectItem value="contract">Contratos</SelectItem><SelectItem value="charge">Cobranças</SelectItem></SelectContent></Select>
            <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(1); }}><SelectTrigger className="w-40"><SelectValue placeholder="Ação" /></SelectTrigger><SelectContent><SelectItem value="all">Todas</SelectItem><SelectItem value="create">Criação</SelectItem><SelectItem value="update">Atualização</SelectItem><SelectItem value="delete">Exclusão</SelectItem><SelectItem value="status_change">Mudança de Status</SelectItem></SelectContent></Select>
          </div>
        </CardContent></Card>

        {/* Timeline */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><History className="h-5 w-5" /> Linha do Tempo</CardTitle></CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              {isLoading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
              : logs.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <div className="flex flex-col items-center gap-2"><History className="h-12 w-12" /><p className="font-medium">Nenhum registro no histórico</p><p className="text-sm">As alterações aparecerão aqui</p></div>
                </div>
              ) : (
                <div className="space-y-1">
                  {logs.map((log: any, index: number) => {
                    const EntityIcon = getEntityIcon(log.entityType);
                    const ActionIcon = actionIcons[log.action] || History;
                    return (
                      <div key={log.id || index} className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex-shrink-0 mt-0.5">
                          <div className={`p-2 rounded-full ${entityTypeColors[log.entityType] || "bg-gray-500/10 text-gray-500"}`}>
                            <EntityIcon className="h-4 w-4" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="secondary" className="text-xs">{entityTypeLabels[log.entityType] || log.entityType}</Badge>
                            <Badge variant="outline" className="text-xs"><ActionIcon className="h-3 w-3 mr-1" />{actionLabels[log.action] || log.action}</Badge>
                          </div>
                          <p className="text-sm mt-1">{log.description || `${actionLabels[log.action] || log.action} de ${entityTypeLabels[log.entityType] || log.entityType}`}</p>
                          {log.entityName && <p className="text-sm text-muted-foreground">{log.entityName}</p>}
                          {log.changes && (
                            <details className="mt-1"><summary className="text-xs text-muted-foreground cursor-pointer">Ver alterações</summary>
                              <pre className="text-xs mt-1 p-2 bg-muted rounded overflow-auto max-h-40">{typeof log.changes === "string" ? log.changes : JSON.stringify(log.changes, null, 2)}</pre>
                            </details>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground flex-shrink-0">{formatDateTime(log.createdAt)}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{pagination.total} registro(s)</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={!pagination.hasPrev} onClick={() => setPage(page - 1)}>Anterior</Button>
              <span className="text-sm">Página {pagination.page} de {pagination.totalPages}</span>
              <Button variant="outline" size="sm" disabled={!pagination.hasNext} onClick={() => setPage(page + 1)}>Próxima</Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout></RequireAuth>
  );
}
