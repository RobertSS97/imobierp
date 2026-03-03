"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Building2,
  Users,
  FileText,
  DollarSign,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Activity {
  id: string;
  type?: string;
  entityType?: string;
  action?: string;
  description: string;
  timestamp?: Date | string;
  createdAt?: string;
}

const getActivityIcon = (type?: string) => {
  switch (type) {
    case "property":
      return Building2;
    case "tenant":
      return Users;
    case "contract":
      return FileText;
    case "charge":
      return DollarSign;
    case "owner":
      return Users;
    default:
      return FileText;
  }
};

const getActionIcon = (action?: string) => {
  switch (action) {
    case "create":
      return Plus;
    case "update":
      return Edit;
    case "delete":
      return Trash2;
    case "status_change":
      return CheckCircle2;
    default:
      return Edit;
  }
};

const getActionColor = (action?: string) => {
  switch (action) {
    case "create":
      return "text-green-500 bg-green-500/10";
    case "update":
      return "text-blue-500 bg-blue-500/10";
    case "delete":
      return "text-red-500 bg-red-500/10";
    case "status_change":
      return "text-amber-500 bg-amber-500/10";
    default:
      return "text-gray-500 bg-gray-500/10";
  }
};

interface RecentActivityProps {
  activities?: Activity[];
}

export function RecentActivity({ activities = [] }: RecentActivityProps) {
  const formatTimeAgo = (date: Date | string | undefined | null) => {
    if (!date) return "";
    const now = new Date();
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "";
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes} min atrás`;
    if (hours < 24) return `${hours}h atrás`;
    return `${days}d atrás`;
  };

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle className="text-base">Atividade Recente</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64">
          {activities.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <p className="text-sm">Nenhuma atividade recente</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((activity) => {
                const Icon = getActivityIcon(activity.type ?? activity.entityType);
                const ActionIcon = getActionIcon(activity.action);
                const actionColor = getActionColor(activity.action);

                return (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className={cn("rounded-full p-1.5", actionColor)}>
                      <ActionIcon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{activity.description}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatTimeAgo((activity as any).timestamp ?? (activity as any).createdAt)}
                      </p>
                    </div>
                    <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
