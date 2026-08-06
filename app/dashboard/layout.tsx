import Link from "next/link";
import { redirect } from "next/navigation";
import { FileSearch, Receipt, Stethoscope, ClipboardList } from "lucide-react";
import { supabaseServer } from "@/lib/supabase";
import { BuyCredits } from "@/components/buy-credits";

const nav = [
  { href: "/dashboard/housing", label: "Alquiler", icon: FileSearch },
  { href: "/dashboard/receipts", label: "Descuentos", icon: Receipt },
  { href: "/dashboard/health", label: "Salud", icon: Stethoscope },
  { href: "/dashboard/insurance", label: "Seguros", icon: ClipboardList },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("credits, plan")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <Link href="/" className="font-bold text-primary">🇵🇦 Expat Copilot</Link>
          <nav className="flex items-center gap-1">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm hover:bg-muted"
              >
                <n.icon className="h-4 w-4" />
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3 text-sm">
            <span className="rounded-full bg-muted px-3 py-1">
              {profile?.credits ?? 0} créditos
            </span>
            <BuyCredits />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-10">{children}</main>
    </div>
  );
}
