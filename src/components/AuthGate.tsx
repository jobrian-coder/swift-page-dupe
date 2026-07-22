import { useEffect } from "react";
import { useNavigate, Outlet } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { AppHeader, AppFooter } from "@/components/AppHeader";

export function AuthGate({ children }: { children?: React.ReactNode }) {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/login" });
  }, [loading, session, navigate]);

  if (loading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        {children ?? <Outlet />}
      </main>
      <AppFooter />
    </div>
  );
}
