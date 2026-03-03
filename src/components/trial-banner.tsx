"use client";

import { useAuth } from "@/contexts/auth-context";
import { AlertTriangle, Clock, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function TrialBanner() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  if (!user || dismissed) return null;

  const trialDaysLeft = (user as any).trialDaysLeft as number | null;
  const trialExpired = (user as any).trialExpired as boolean;

  // Plano sem trial ou trial com mais de 5 dias: não mostra
  if (trialDaysLeft === null || (!trialExpired && trialDaysLeft > 5)) return null;

  if (trialExpired) {
    return (
      <div className="bg-red-600 text-white px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">
            Seu período de teste expirou. Assine um plano para continuar usando o sistema.
          </p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          className="shrink-0"
          onClick={() => (window.location.href = "/configuracoes?tab=plano")}
        >
          <Crown className="h-4 w-4 mr-1" />
          Ver Planos
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-amber-500 text-black px-4 py-2.5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Clock className="h-5 w-5 shrink-0" />
        <p className="text-sm font-medium">
          Seu período de teste expira em{" "}
          <strong>
            {trialDaysLeft} {trialDaysLeft === 1 ? "dia" : "dias"}
          </strong>
          . Assine um plano para não perder acesso.
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button
          size="sm"
          variant="outline"
          className="bg-white/20 border-black/30 text-black hover:bg-white/40"
          onClick={() => setDismissed(true)}
        >
          Depois
        </Button>
        <Button
          size="sm"
          className="bg-black text-white hover:bg-black/80"
          onClick={() => (window.location.href = "/configuracoes?tab=plano")}
        >
          <Crown className="h-4 w-4 mr-1" />
          Assinar
        </Button>
      </div>
    </div>
  );
}
