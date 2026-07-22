import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export function AppHeader() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("username, balance")
        .single();
      return data;
    },
  });

  const links = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/companies", label: "Companies" },
    { to: "/reviews", label: "My Reviews" },
    { to: "/wallet", label: "Wallet" },
  ];

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  return (
    <header className="border-b" style={{ background: "var(--card-warm)" }}>
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Logo />
          <nav className="hidden md:flex items-center gap-1 text-sm">
            {links.map((l) => {
              const active = pathname.startsWith(l.to);
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className="px-3 py-1.5 rounded-full font-medium transition-colors"
                  style={{
                    background: active ? "var(--brand)" : "transparent",
                    color: active ? "var(--brand-foreground)" : "var(--foreground)",
                  }}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div
            className="hidden sm:flex flex-col items-end px-3 py-1 rounded-lg border"
            style={{ borderColor: "var(--brand)" }}
          >
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Balance
            </span>
            <span className="font-bold" style={{ color: "#16a34a" }}>
              ${Number(profile?.balance ?? 0).toFixed(2)}
            </span>
          </div>
          <span className="hidden sm:inline font-medium">{profile?.username}</span>
          <button
            onClick={signOut}
            className="font-semibold transition-colors hover:opacity-80"
            style={{ color: "#16a34a" }}
          >
            Log out
          </button>

        </div>
      </div>
      <div className="md:hidden border-t px-4 py-2 flex gap-1 overflow-x-auto text-sm">
        {links.map((l) => {
          const active = pathname.startsWith(l.to);
          return (
            <Link
              key={l.to}
              to={l.to}
              className="px-3 py-1.5 rounded-full font-medium whitespace-nowrap"
              style={{
                background: active ? "var(--brand)" : "transparent",
                color: active ? "var(--brand-foreground)" : "var(--foreground)",
              }}
            >
              {l.label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}

export function AppFooter() {
  return (
    <footer
      className="mt-12 py-6 text-center text-xs text-muted-foreground border-t"
      style={{ background: "var(--card-warm)" }}
    >
      RatePay · Activate reviews · Minimum withdrawal $20
    </footer>
  );
}
