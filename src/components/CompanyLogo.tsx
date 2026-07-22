import { useState } from "react";
import { companyLogoUrl } from "@/lib/companyDomains";

interface Props {
  name: string;
  emoji?: string;
  color?: string;
  size?: number;
  className?: string;
}

export function CompanyLogo({ name, emoji, color = "#0f766e", size = 48, className = "" }: Props) {
  const primary = companyLogoUrl(name);
  // Fallback chain: clearbit -> google favicon (needs domain) -> initial
  const domain = primary ? primary.replace("https://logo.clearbit.com/", "") : null;
  const fallback = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128` : null;

  const [src, setSrc] = useState<string | null>(primary);
  const [stage, setStage] = useState<0 | 1 | 2>(0);

  const handleError = () => {
    if (stage === 0 && fallback) {
      setSrc(fallback);
      setStage(1);
    } else {
      setSrc(null);
      setStage(2);
    }
  };

  const initial = (name.trim()[0] || "?").toUpperCase();

  return (
    <div
      className={`rounded-xl overflow-hidden flex items-center justify-center shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        background: src ? color + "18" : color,
        color: "#fff",
      }}
    >
      {src ? (
        <img
          src={src}
          alt={`${name} logo`}
          className="w-full h-full object-contain p-1"
          onError={handleError}
          loading="lazy"
        />
      ) : emoji ? (
        <span className="text-xl">{emoji}</span>
      ) : (
        <span className="font-bold text-lg">{initial}</span>
      )}
    </div>
  );
}
