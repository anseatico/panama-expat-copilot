"use client";

import { useState } from "react";
import { AlertOctagon, AlertTriangle, Copy, Check, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LeaseAudit } from "@/lib/ai-engine";
import { cn } from "@/lib/utils";

const riskConfig = {
  LOW: { label: "LOW RISK", cls: "bg-green-100 text-green-700 border-green-300" },
  MEDIUM: { label: "MEDIUM RISK", cls: "bg-amber-100 text-amber-700 border-amber-300" },
  HIGH: { label: "HIGH RISK", cls: "bg-red-100 text-red-700 border-red-300" },
} as const;

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="inline-flex items-center gap-1 rounded-md border bg-background px-2 py-1 text-xs hover:bg-muted"
    >
      {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copiado" : "Copiar texto"}
    </button>
  );
}

export function LeaseReport({ audit }: { audit: LeaseAudit }) {
  const risk = riskConfig[audit.risk_score];

  return (
    <div className="space-y-6">
      {/* 1. Overall Risk Score + summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lease Audit Report</CardTitle>
            <span className={cn("rounded-full border px-4 py-1 text-sm font-bold", risk.cls)}>
              {risk.label}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{audit.summary}</p>
        </CardContent>
      </Card>

      {/* 2. Red Flag Clauses + 4. Counter-offer Amendments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Red Flag Clauses ({audit.red_flags.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {audit.red_flags.map((flag, i) => (
            <div
              key={i}
              className={cn(
                "rounded-md border-l-4 p-4 text-sm",
                flag.severity === "CRITICAL"
                  ? "border-l-red-500 bg-red-50"
                  : "border-l-amber-500 bg-amber-50"
              )}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-semibold">
                  {flag.severity === "CRITICAL" ? (
                    <AlertOctagon className="h-4 w-4 text-red-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                  )}
                  Clause {flag.clause_number}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-bold",
                    flag.severity === "CRITICAL"
                      ? "bg-red-600 text-white"
                      : "bg-amber-500 text-white"
                  )}
                >
                  {flag.severity}
                </span>
              </div>
              <blockquote className="mb-2 border-l-2 border-border pl-2 italic text-muted-foreground">
                “{flag.original_text_es}”
              </blockquote>
              <p className="mb-3">{flag.issue_description_en}</p>
              <div className="rounded-md border border-primary/30 bg-white p-3">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-primary">
                    Counter-offer amendment (español — listo para enviar)
                  </span>
                  <CopyButton text={flag.suggested_amendment_es} />
                </div>
                <p className="whitespace-pre-wrap">{flag.suggested_amendment_es}</p>
              </div>
            </div>
          ))}
          {audit.red_flags.length === 0 && (
            <p className="text-sm text-muted-foreground">No red flag clauses detected.</p>
          )}
        </CardContent>
      </Card>

      {/* 3. Gringo Tax / Price Check */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Price Check (“Gringo Tax”)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="rounded-md bg-muted p-3">
            <div className="text-muted-foreground">Estimated market range</div>
            <div className="font-semibold">{audit.price_analysis.estimated_market_range}</div>
          </div>
          <p>{audit.price_analysis.recommendation}</p>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        ⚠️ AI-generated preliminary guidance — not legal advice. Always validate with a licensed
        Panamanian attorney before signing.
      </p>
    </div>
  );
}
