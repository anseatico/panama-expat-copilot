"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function BuyCredits() {
  const [loading, setLoading] = useState(false);

  async function checkout(plan: "onetime" | "monthly") {
    setLoading(true);
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else setLoading(false);
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" variant="outline" disabled={loading} onClick={() => checkout("onetime")}>
        Comprar 1 uso
      </Button>
      <Button size="sm" disabled={loading} onClick={() => checkout("monthly")}>
        Suscribirme
      </Button>
    </div>
  );
}
