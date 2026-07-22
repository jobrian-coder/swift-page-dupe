import { Link } from "@tanstack/react-router";

export function Logo({ size = 32 }: { size?: number }) {
  return (
    <Link to="/" className="flex items-center gap-2 group">
      <div
        style={{ width: size, height: size }}
        className="rounded-xl flex items-center justify-center relative shadow-md"
      >
        <div
          className="absolute inset-0 rounded-xl"
          style={{ background: "var(--brand)" }}
        />
        <svg
          viewBox="0 0 24 24"
          fill="white"
          className="relative z-10"
          style={{ width: size * 0.55, height: size * 0.55 }}
        >
          <path d="M12 2l2.9 6.6 7.1.7-5.4 4.8 1.6 7-6.2-3.7L5.8 21l1.6-7L2 9.3l7.1-.7L12 2z" />
        </svg>
        <div
          className="absolute -bottom-1 -right-1 z-20 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow"
          style={{
            width: size * 0.5,
            height: size * 0.5,
            background: "var(--brand-accent)",
          }}
        >
          $
        </div>
      </div>
      <span className="text-xl font-bold tracking-tight">
        <span style={{ color: "var(--foreground)" }}>Review</span>
        <span style={{ color: "var(--brand-accent)" }}>Sasa</span>
      </span>

    </Link>
  );
}
