"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  FolderOpen, Search, Upload, Download, FileText, File, MoreHorizontal, Eye,
  Trash2, Grid, List, Folder, X, Loader2, Users, Building2, UserCircle,
  FileSignature, ChevronDown, ChevronRight, Plus, Filter,
  Image as ImageIcon, FileSpreadsheet, FileBadge, Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { documentsApi, propertiesApi, ownersApi, tenantsApi } from "@/lib/api-client";
import { useApiList } from "@/hooks/use-api";
import { RequireAuth } from "@/contexts/auth-context";

// ─── Tipos ─────────────────────────────────────────────────────────
type DocumentType = "contract" | "id_document" | "proof_income" | "proof_address" | "photo" | "receipt" | "report" | "insurance" | "other";
type EntityCategory = "all" | "tenant" | "owner" | "property" | "contract" | "general";

const documentTypeLabels: Record<DocumentType, string> = {
  contract: "Contrato",
  id_document: "Documento de Identidade",
  proof_income: "Comprovante de Renda",
  proof_address: "Comprovante de Endereço",
  photo: "Foto",
  receipt: "Recibo / Comprovante",
  report: "Laudo / Vistoria",
  insurance: "Seguro",
  other: "Outros",
};

const documentTypeColors: Record<DocumentType, string> = {
  contract: "bg-primary/10 text-primary",
  id_document: "bg-blue-500/10 text-blue-500",
  proof_income: "bg-green-500/10 text-green-500",
  proof_address: "bg-amber-500/10 text-amber-500",
  photo: "bg-purple-500/10 text-purple-500",
  receipt: "bg-teal-500/10 text-teal-500",
  report: "bg-orange-500/10 text-orange-500",
  insurance: "bg-indigo-500/10 text-indigo-500",
  other: "bg-gray-500/10 text-gray-500",
};

const categoryLabels: Record<EntityCategory, string> = {
  all: "Todos",
  tenant: "Inquilinos",
  owner: "Proprietários",
  property: "Imóveis",
  contract: "Contratos",
  general: "Geral",
};

const categoryIcons: Record<EntityCategory, typeof Users> = {
  all: Folder,
  tenant: Users,
  owner: UserCircle,
  property: Building2,
  contract: FileSignature,
  general: FolderOpen,
};

function getFileIcon(name: string) {
  const ext = name?.split(".").pop()?.toLowerCase() || "";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return ImageIcon;
  if (["xls", "xlsx", "csv"].includes(ext)) return FileSpreadsheet;
  if (["pdf"].includes(ext)) return FileBadge;
  return FileText;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function formatDate(d: string | null | undefined) {
  return d ? new Date(d).toLocaleDateString("pt-BR") : "-";
}

function formatRelativeDate(d: string | null | undefined) {
  if (!d) return "";
  const now = new Date();
  const date = new Date(d);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Hoje";
  if (diffDays === 1) return "Ontem";
  if (diffDays < 7) return `${diffDays} dias atrás`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} sem. atrás`;
  return formatDate(d);
}

// ─── Componente Principal ──────────────────────────────────────────
export function DocumentsPage() {
  const { toast } = useToast();

  // State
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<any>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadType, setUploadType] = useState<DocumentType>("other");
  const [uploadCategory, setUploadCategory] = useState<EntityCategory>("general");
  const [uploadEntityId, setUploadEntityId] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [activeCategory, setActiveCategory] = useState<EntityCategory>("all");
  const [page, setPage] = useState(1);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // API calls
  const queryParams: Record<string, string> = { page: String(page), limit: "50" };
  if (search) queryParams.search = search;
  if (typeFilter !== "all") queryParams.type = typeFilter;
  if (activeCategory !== "all") queryParams.category = activeCategory;

  const { items: documents, pagination, stats, isLoading, refetch } = useApiList<any>(
    () => documentsApi.list(queryParams),
    [page, search, typeFilter, activeCategory]
  );

  // Fetch entities for linking
  const { items: tenants } = useApiList<any>(() => tenantsApi.list({ limit: "100" }), []);
  const { items: owners } = useApiList<any>(() => ownersApi.list({ limit: "100" }), []);
  const { items: properties } = useApiList<any>(() => propertiesApi.list({ limit: "100" }), []);

  // Entity options based on upload category
  const entityOptions = useMemo(() => {
    switch (uploadCategory) {
      case "tenant": return tenants.map((t: any) => ({ id: t.id, label: t.name }));
      case "owner": return owners.map((o: any) => ({ id: o.id, label: o.name }));
      case "property": return properties.map((p: any) => ({ id: p.id, label: p.title }));
      case "contract": return [];
      default: return [];
    }
  }, [uploadCategory, tenants, owners, properties]);

  // Group documents by entity
  const groupedDocuments = useMemo(() => {
    if (activeCategory === "all") return null;

    const groups: Record<string, { entityName: string; entityId: string; category: string; docs: any[] }> = {};

    for (const doc of documents) {
      const key = doc.linkedEntityId || doc.linkedTo || "sem-vinculo";
      if (!groups[key]) {
        groups[key] = {
          entityName: doc.linkedTo || "Sem vínculo",
          entityId: doc.linkedEntityId || "",
          category: doc.linkedToType || "general",
          docs: [],
        };
      }
      groups[key].docs.push(doc);
    }

    return Object.entries(groups).sort(([, a], [, b]) => a.entityName.localeCompare(b.entityName));
  }, [documents, activeCategory]);

  // Stats
  const totalFiles = stats?.totalFiles ?? documents.length;
  const categoryStats = stats?.byCategory ?? { tenant: 0, owner: 0, property: 0, contract: 0, general: 0 };
  const totalSize = stats?.totalSize ?? 0;

  // Drag & Drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setIsDragActive(true);
    else if (e.type === "dragleave") setIsDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files?.length > 0) {
      setSelectedFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
      setIsUploadDialogOpen(true);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      setSelectedFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
      setIsUploadDialogOpen(true);
    }
  };

  const removeSelectedFile = (index: number) => setSelectedFiles((prev) => prev.filter((_, i) => i !== index));

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    let success = 0;
    for (const file of selectedFiles) {
      try {
        await documentsApi.upload(file, {
          type: uploadType,
          category: uploadCategory === "all" ? "general" : uploadCategory,
          entityId: uploadEntityId || undefined,
          description: uploadDescription || undefined,
        });
        success++;
      } catch {
        /* continue */
      }
    }
    setUploading(false);
    setSelectedFiles([]);
    setUploadType("other");
    setUploadCategory("general");
    setUploadEntityId("");
    setUploadDescription("");
    setIsUploadDialogOpen(false);
    toast({
      title: "Upload concluído",
      description: `${success} de ${selectedFiles.length} arquivo(s) enviado(s) com sucesso.`,
    });
    refetch();
  };

  const handleDeleteDocument = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir "${name}"?`)) return;
    try {
      await documentsApi.delete(id);
      toast({ title: "Documento excluído", description: `"${name}" foi removido.` });
      refetch();
    } catch {
      toast({ title: "Erro ao excluir", description: "Tente novamente.", variant: "destructive" });
    }
  };

  const handlePreview = (doc: any) => {
    setPreviewDoc(doc);
    setIsPreviewOpen(true);
  };

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const expandAll = () => {
    if (groupedDocuments) {
      setExpandedGroups(new Set(groupedDocuments.map(([key]) => key)));
    }
  };

  const collapseAll = () => setExpandedGroups(new Set());

  const openUploadFor = (category: EntityCategory, entityId?: string) => {
    setUploadCategory(category);
    if (entityId) setUploadEntityId(entityId);
    setIsUploadDialogOpen(true);
  };

  // ─── Render document row ─────────────────────────────────────────
  const renderDocRow = (doc: any, showEntity = true) => {
    const FileIcon = getFileIcon(doc.name || doc.fileName || "");
    return (
      <TableRow key={doc.id} className="group">
        <TableCell>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
              <FileIcon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm truncate max-w-[280px]">{doc.name || doc.fileName}</p>
              {doc.description && (
                <p className="text-xs text-muted-foreground truncate max-w-[280px]">{doc.description}</p>
              )}
            </div>
          </div>
        </TableCell>
        <TableCell>
          <Badge variant="secondary" className={cn("text-xs", documentTypeColors[doc.type as DocumentType] || "")}>
            {documentTypeLabels[doc.type as DocumentType] || doc.type}
          </Badge>
        </TableCell>
        <TableCell className="text-muted-foreground text-sm">{formatFileSize(doc.size || 0)}</TableCell>
        {showEntity && (
          <TableCell>
            {doc.linkedTo ? (
              <div className="flex items-center gap-2">
                {doc.linkedToType && (() => {
                  const CatIcon = categoryIcons[doc.linkedToType as EntityCategory] || Folder;
                  return <CatIcon className="h-3.5 w-3.5 text-muted-foreground" />;
                })()}
                <span className="text-sm">{doc.linkedTo}</span>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">—</span>
            )}
          </TableCell>
        )}
        <TableCell>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-sm text-muted-foreground cursor-default">{formatRelativeDate(doc.createdAt)}</span>
              </TooltipTrigger>
              <TooltipContent>{formatDate(doc.createdAt)}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </TableCell>
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {doc.url && (
                <DropdownMenuItem onClick={() => handlePreview(doc)}>
                  <Eye className="h-4 w-4 mr-2" /> Visualizar
                </DropdownMenuItem>
              )}
              {doc.url && (
                <DropdownMenuItem
                  onClick={() => {
                    const a = document.createElement("a");
                    a.href = doc.url;
                    a.download = doc.name || "download";
                    a.click();
                  }}
                >
                  <Download className="h-4 w-4 mr-2" /> Download
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => handleDeleteDocument(doc.id, doc.name || doc.fileName)}
              >
                <Trash2 className="h-4 w-4 mr-2" /> Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    );
  };

  // ─── Render document grid card ────────────────────────────────────
  const renderDocCard = (doc: any) => {
    const FileIcon = getFileIcon(doc.name || doc.fileName || "");
    return (
      <div
        key={doc.id}
        className="border rounded-xl p-4 hover:bg-accent/50 transition-colors cursor-pointer group relative"
        onClick={() => doc.url && handlePreview(doc)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
            <FileIcon className="h-5 w-5 text-muted-foreground" />
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="opacity-0 group-hover:opacity-100 -mt-1 -mr-1"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteDocument(doc.id, doc.name || doc.fileName);
            }}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
        <p className="font-medium text-sm truncate mb-1">{doc.name || doc.fileName}</p>
        <p className="text-xs text-muted-foreground mb-2">{formatFileSize(doc.size || 0)}</p>
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className={cn("text-[10px]", documentTypeColors[doc.type as DocumentType] || "")}>
            {documentTypeLabels[doc.type as DocumentType] || doc.type}
          </Badge>
          <span className="text-[10px] text-muted-foreground">{formatRelativeDate(doc.createdAt)}</span>
        </div>
        {doc.linkedTo && (
          <div className="flex items-center gap-1.5 mt-2 pt-2 border-t">
            {doc.linkedToType && (() => {
              const CatIcon = categoryIcons[doc.linkedToType as EntityCategory] || Folder;
              return <CatIcon className="h-3 w-3 text-muted-foreground" />;
            })()}
            <span className="text-[11px] text-muted-foreground truncate">{doc.linkedTo}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <RequireAuth>
      <AppLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Documentos</h1>
              <p className="text-muted-foreground">
                Gerencie documentos organizados por inquilinos, proprietários e imóveis
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => { setUploadCategory(activeCategory === "all" ? "general" : activeCategory); setIsUploadDialogOpen(true); }}>
                <Upload className="h-4 w-4 mr-2" />
                Novo Upload
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
            />
          </div>

          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-5">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveCategory("all")}>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total</p>
                    <p className="text-2xl font-bold mt-1">{totalFiles}</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                    <File className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveCategory("tenant")}>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Inquilinos</p>
                    <p className="text-2xl font-bold mt-1">{categoryStats.tenant ?? 0}</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                    <Users className="h-5 w-5 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveCategory("owner")}>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Proprietários</p>
                    <p className="text-2xl font-bold mt-1">{categoryStats.owner ?? 0}</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10">
                    <UserCircle className="h-5 w-5 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveCategory("property")}>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Imóveis</p>
                    <p className="text-2xl font-bold mt-1">{categoryStats.property ?? 0}</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
                    <Building2 className="h-5 w-5 text-amber-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Armazenamento</p>
                    <p className="text-2xl font-bold mt-1">{formatFileSize(totalSize)}</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10">
                    <Folder className="h-5 w-5 text-purple-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Category Tabs + Filters */}
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex flex-col gap-4">
                {/* Category tabs */}
                <Tabs value={activeCategory} onValueChange={(v) => { setActiveCategory(v as EntityCategory); setPage(1); setExpandedGroups(new Set()); }}>
                  <TabsList className="w-full justify-start h-auto flex-wrap gap-1 bg-transparent p-0">
                    {(Object.keys(categoryLabels) as EntityCategory[]).map((cat) => {
                      const CatIcon = categoryIcons[cat];
                      return (
                        <TabsTrigger
                          key={cat}
                          value={cat}
                          className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-4 py-1.5 text-sm"
                        >
                          <CatIcon className="h-3.5 w-3.5 mr-1.5" />
                          {categoryLabels[cat]}
                          {cat !== "all" && (categoryStats[cat] ?? 0) > 0 && (
                            <span className="ml-1.5 text-[10px] opacity-75">({categoryStats[cat]})</span>
                          )}
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>
                </Tabs>

                {/* Search & filters */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por nome, tipo ou entidade..."
                        className="pl-9"
                        value={search}
                        onChange={(e) => {
                          setSearch(e.target.value);
                          setPage(1);
                        }}
                      />
                    </div>
                  </div>
                  <Select
                    value={typeFilter}
                    onValueChange={(v) => {
                      setTypeFilter(v);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="w-52">
                      <Filter className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                      <SelectValue placeholder="Tipo de documento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      {Object.entries(documentTypeLabels).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-1 border rounded-lg p-1">
                    <Button variant={viewMode === "list" ? "secondary" : "ghost"} size="sm" onClick={() => setViewMode("list")}>
                      <List className="h-4 w-4" />
                    </Button>
                    <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="sm" onClick={() => setViewMode("grid")}>
                      <Grid className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Drop Zone */}
          <div
            className={cn(
              "border-2 border-dashed rounded-xl p-8 text-center transition-all",
              isDragActive
                ? "border-primary bg-primary/5 scale-[1.01]"
                : "border-muted-foreground/20 hover:border-muted-foreground/40"
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload
              className={cn(
                "h-10 w-10 mx-auto mb-3 transition-colors",
                isDragActive ? "text-primary" : "text-muted-foreground/50"
              )}
            />
            <p className="text-sm font-medium mb-1">
              {isDragActive ? "Solte os arquivos aqui" : "Arraste arquivos para fazer upload"}
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              PDF, JPG, PNG, DOC, DOCX, XLS, XLSX — máx. 10MB por arquivo
            </p>
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Selecionar Arquivos
            </Button>
          </div>

          {/* Documents Content */}
          {isLoading ? (
            <Card>
              <CardContent className="flex justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ) : documents.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-16">
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                    <FolderOpen className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-lg">Nenhum documento encontrado</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {search || typeFilter !== "all"
                        ? "Tente ajustar os filtros de busca."
                        : `Comece enviando documentos${activeCategory !== "all" ? ` de ${categoryLabels[activeCategory].toLowerCase()}` : ""}.`}
                    </p>
                  </div>
                  <Button className="mt-2" onClick={() => openUploadFor(activeCategory === "all" ? "general" : activeCategory)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Fazer Upload
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : activeCategory !== "all" && groupedDocuments ? (
            /* ─── Grouped View ────────────────────────────────── */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {groupedDocuments.length} grupo(s) • {documents.length} documento(s)
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={expandAll}>Expandir todos</Button>
                  <Button variant="ghost" size="sm" onClick={collapseAll}>Recolher todos</Button>
                </div>
              </div>

              {groupedDocuments.map(([key, group]) => {
                const isExpanded = expandedGroups.has(key);
                const CatIcon = categoryIcons[group.category as EntityCategory] || Folder;

                return (
                  <Card key={key}>
                    <Collapsible open={isExpanded} onOpenChange={() => toggleGroup(key)}>
                      <CollapsibleTrigger asChild>
                        <div className="flex items-center justify-between px-5 py-3 cursor-pointer hover:bg-accent/50 transition-colors rounded-t-xl">
                          <div className="flex items-center gap-3">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                              <CatIcon className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{group.entityName}</p>
                              <p className="text-xs text-muted-foreground">
                                {group.docs.length} documento(s) •{" "}
                                {formatFileSize(group.docs.reduce((sum: number, d: any) => sum + (d.size || 0), 0))}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                openUploadFor(activeCategory, group.entityId);
                              }}
                            >
                              <Plus className="h-3.5 w-3.5 mr-1" />
                              Adicionar
                            </Button>
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="border-t">
                          {viewMode === "list" ? (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Nome</TableHead>
                                  <TableHead>Tipo</TableHead>
                                  <TableHead>Tamanho</TableHead>
                                  <TableHead>Data</TableHead>
                                  <TableHead className="w-10"></TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>{group.docs.map((doc: any) => renderDocRow(doc, false))}</TableBody>
                            </Table>
                          ) : (
                            <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                              {group.docs.map((doc: any) => renderDocCard(doc))}
                            </div>
                          )}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                );
              })}
            </div>
          ) : (
            /* ─── Flat View (All) ─────────────────────────────── */
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FolderOpen className="h-5 w-5" /> Todos os Documentos
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs">{documents.length} arquivo(s)</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {viewMode === "list" ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Tamanho</TableHead>
                        <TableHead>Vinculado a</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>{documents.map((doc: any) => renderDocRow(doc, true))}</TableBody>
                  </Table>
                ) : (
                  <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {documents.map((doc: any) => renderDocCard(doc))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{pagination.total} documento(s)</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={!pagination.hasPrev} onClick={() => setPage(page - 1)}>
                  Anterior
                </Button>
                <span className="text-sm">
                  Página {pagination.page} de {pagination.totalPages}
                </span>
                <Button variant="outline" size="sm" disabled={!pagination.hasNext} onClick={() => setPage(page + 1)}>
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* ─── Upload Dialog ──────────────────────────────────────── */}
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogContent className="max-w-[95vw] w-fit min-w-[min(36rem,95vw)]">
            <DialogHeader>
              <DialogTitle>Upload de Documentos</DialogTitle>
              <DialogDescription>Selecione a categoria e vincule o documento à entidade correspondente.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {/* Category + Entity row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Categoria
                  </Label>
                  <Select
                    value={uploadCategory === "all" ? "general" : uploadCategory}
                    onValueChange={(v) => {
                      setUploadCategory(v as EntityCategory);
                      setUploadEntityId("");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tenant">
                        <div className="flex items-center gap-2">
                          <Users className="h-3.5 w-3.5" /> Inquilino
                        </div>
                      </SelectItem>
                      <SelectItem value="owner">
                        <div className="flex items-center gap-2">
                          <UserCircle className="h-3.5 w-3.5" /> Proprietário
                        </div>
                      </SelectItem>
                      <SelectItem value="property">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5" /> Imóvel
                        </div>
                      </SelectItem>
                      <SelectItem value="contract">
                        <div className="flex items-center gap-2">
                          <FileSignature className="h-3.5 w-3.5" /> Contrato
                        </div>
                      </SelectItem>
                      <SelectItem value="general">
                        <div className="flex items-center gap-2">
                          <FolderOpen className="h-3.5 w-3.5" /> Geral
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Entity selector */}
                {uploadCategory !== "general" && uploadCategory !== "contract" && uploadCategory !== "all" && (
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Vincular a
                    </Label>
                    <Select value={uploadEntityId} onValueChange={setUploadEntityId}>
                      <SelectTrigger>
                        <SelectValue placeholder={`Selecione ${uploadCategory === "tenant" ? "o inquilino" : uploadCategory === "owner" ? "o proprietário" : "o imóvel"}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {entityOptions.map((opt: { id: string; label: string }) => (
                          <SelectItem key={opt.id} value={opt.id}>
                            {opt.label}
                          </SelectItem>
                        ))}
                        {entityOptions.length === 0 && (
                          <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                            Nenhum registro encontrado
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Document type */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Tipo de Documento
                </Label>
                <Select value={uploadType} onValueChange={(v) => setUploadType(v as DocumentType)}>
                  <SelectTrigger>
                    <Tag className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(documentTypeLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        <div className="flex items-center gap-2">
                          <div className={cn("h-2 w-2 rounded-full", documentTypeColors[k as DocumentType]?.split(" ")[0] || "bg-gray-500/30")} />
                          {v}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Descrição <span className="opacity-50">(opcional)</span>
                </Label>
                <Input
                  placeholder="Ex: Contrato de locação assinado em 2026..."
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                />
              </div>

              {/* Files */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Arquivos ({selectedFiles.length})
                  </Label>
                  <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => fileInputRef.current?.click()}>
                    <Plus className="h-3 w-3 mr-1" /> Adicionar mais
                  </Button>
                </div>
                {selectedFiles.length > 0 ? (
                  <ScrollArea className="h-40 border rounded-lg">
                    <div className="p-2 space-y-1.5">
                      {selectedFiles.map((file, index) => {
                        const FIcon = getFileIcon(file.name);
                        return (
                          <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <FIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate max-w-[240px]">{file.name}</p>
                                <p className="text-[11px] text-muted-foreground">{formatFileSize(file.size)}</p>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0" onClick={() => removeSelectedFile(index)}>
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                ) : (
                  <div
                    className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground/50" />
                    <p className="text-xs text-muted-foreground">Clique para selecionar arquivos</p>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedFiles([]);
                  setUploadDescription("");
                  setIsUploadDialogOpen(false);
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleUpload} disabled={selectedFiles.length === 0 || uploading}>
                {uploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Upload className="h-4 w-4 mr-2" />
                Enviar {selectedFiles.length} arquivo(s)
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ─── Preview Dialog ─────────────────────────────────────── */}
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                {previewDoc?.name || "Documento"}
              </DialogTitle>
              <DialogDescription>
                {previewDoc?.type && documentTypeLabels[previewDoc.type as DocumentType]}{" "}
                {previewDoc?.linkedTo && `• Vinculado a ${previewDoc.linkedTo}`}
              </DialogDescription>
            </DialogHeader>
            <div className="min-h-[300px] flex items-center justify-center border rounded-lg bg-muted/30">
              {previewDoc?.url ? (
                previewDoc.name?.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewDoc.url} alt={previewDoc.name} className="max-h-[500px] object-contain" />
                ) : previewDoc.name?.match(/\.pdf$/i) ? (
                  <iframe src={previewDoc.url} className="w-full h-[500px] rounded-lg" title={previewDoc.name} />
                ) : (
                  <div className="text-center text-muted-foreground p-8">
                    <FileText className="h-12 w-12 mx-auto mb-3" />
                    <p className="font-medium">Pré-visualização não disponível</p>
                    <p className="text-sm mt-1">Faça o download para ver este arquivo.</p>
                    <Button className="mt-4" variant="outline" onClick={() => { const a = document.createElement("a"); a.href = previewDoc.url; a.download = previewDoc.name; a.click(); }}>
                      <Download className="h-4 w-4 mr-2" /> Download
                    </Button>
                  </div>
                )
              ) : (
                <div className="text-center text-muted-foreground p-8">
                  <FileText className="h-12 w-12 mx-auto mb-3" />
                  <p className="font-medium">Arquivo sem URL</p>
                  <p className="text-sm mt-1">Este documento ainda não possui um arquivo vinculado.</p>
                </div>
              )}
            </div>
            {previewDoc && (
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Tipo</p>
                  <Badge variant="secondary" className={cn(documentTypeColors[previewDoc.type as DocumentType] || "")}>
                    {documentTypeLabels[previewDoc.type as DocumentType] || previewDoc.type}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Tamanho</p>
                  <p className="font-medium">{formatFileSize(previewDoc.size || 0)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Enviado em</p>
                  <p className="font-medium">{formatDate(previewDoc.createdAt)}</p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </AppLayout>
    </RequireAuth>
  );
}
