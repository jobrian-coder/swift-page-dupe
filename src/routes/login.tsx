import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AuthShell, Field, PrimaryButton } from "@/components/AuthShell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — ReviewSasa" },
      { name: "description", content: "Sign in to ReviewSasa and get paid for company reviews." },
      { property: "og:title", content: "Sign in — ReviewSasa" },
      { property: "og:description", content: "Sign in to ReviewSasa and get paid for company reviews." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    let email = identifier;
    if (!identifier.includes("@")) {
      // look up email by username
      const { data } = await supabase
        .from("profiles")
        .select("email")
        .eq("username", identifier)
        .maybeSingle();
      if (!data?.email) {
        setLoading(false);
        return setError("Account not found.");
      }
      email = data.email;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return setError(error.message);
    navigate({ to: "/dashboard" });
  };

  return (
    <AuthShell title="Sign in" subtitle="Get paid instantly for every company review">
      <form onSubmit={submit}>
        <Field label="Username or email" placeholder="Enter your username" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
        <Field label="Password" type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p className="text-sm text-destructive mb-3">{error}</p>}
        <PrimaryButton disabled={loading}>{loading ? "Signing in..." : "Sign in"}</PrimaryButton>
      </form>
      <p className="text-center text-sm text-muted-foreground mt-4">
        Don't have an account?{" "}
        <Link to="/register" className="font-semibold" style={{ color: "var(--brand)" }}>
          Create one
        </Link>
      </p>
    </AuthShell>
  );
}
