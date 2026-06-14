"use client";

import { useState } from "react";

type BrandLogoProps = {
  className?: string;
};

export function BrandLogo({ className }: BrandLogoProps) {
  const logoCandidates = ["/uploads/logo-rsports.png", "/brand/logo-rsports.png"];
  const [candidateIndex, setCandidateIndex] = useState(0);

  const currentLogoSrc = logoCandidates[candidateIndex] ?? null;

  if (!currentLogoSrc) {
    return (
      <div className={`relative overflow-hidden rounded-3xl border border-white/35 bg-black/60 ${className ?? "h-44 w-44"}`}>
        <div className="absolute inset-0 bg-gradient-to-r from-black to-orange-500/80" />
        <div className="absolute inset-0 flex items-center justify-center text-5xl font-extrabold tracking-widest text-white">
          RS
        </div>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={currentLogoSrc}
      alt="Logo R Sports"
      className={`rounded-3xl border border-white/35 bg-black/50 object-cover shadow-[0_25px_60px_rgba(249,115,22,0.35)] ${className ?? "h-44 w-44"}`}
      onError={() => setCandidateIndex((previous) => previous + 1)}
    />
  );
}
