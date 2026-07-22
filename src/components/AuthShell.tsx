export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{
        background:
          "radial-gradient(ellipse at top right, oklch(0.95 0.04 45), var(--background) 60%)",
      }}
    >
      <div
        className="w-full max-w-md rounded-3xl shadow-xl p-8"
        style={{ background: "var(--card)" }}
      >
        <div className="flex flex-col items-center text-center gap-2 mb-6">
          <div className="relative">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ background: "var(--brand)" }}
            >
              <svg viewBox="0 0 24 24" fill="white" className="w-9 h-9">
                <path d="M12 2l2.9 6.6 7.1.7-5.4 4.8 1.6 7-6.2-3.7L5.8 21l1.6-7L2 9.3l7.1-.7L12 2z" />
              </svg>
            </div>
            <div
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow"
              style={{ background: "var(--brand-accent)" }}
            >
              $
            </div>
          </div>
          <h1 className="text-3xl font-bold mt-2">
            <span>Review</span>
            <span style={{ color: "var(--brand-accent)" }}>Sasa</span>
          </h1>
          <p className="text-muted-foreground text-sm">{subtitle}</p>
        </div>
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        {children}
      </div>
    </div>
  );
}

export function Field({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block mb-4">
      <span className="text-sm font-semibold block mb-1.5">{label}</span>
      <input
        {...props}
        className="w-full h-11 px-3.5 rounded-lg border bg-transparent text-sm focus:outline-none focus:ring-2 transition"
        style={{
          borderColor: "var(--border)",
          // @ts-ignore
          "--tw-ring-color": "var(--brand)",
        }}
      />
    </label>
  );
}

export function PrimaryButton(
  props: React.ButtonHTMLAttributes<HTMLButtonElement>,
) {
  return (
    <button
      {...props}
      className={
        "w-full h-11 rounded-full font-semibold text-sm shadow-md transition disabled:opacity-60 " +
        (props.className ?? "")
      }
      style={{
        background: "var(--brand)",
        color: "var(--brand-foreground)",
        ...(props.style ?? {}),
      }}
    />
  );
}
