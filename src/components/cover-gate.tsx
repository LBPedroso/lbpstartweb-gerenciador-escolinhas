"use client";

import { useState } from "react";
import { BrandLogo } from "@/components/brand-logo";

type CoverGateProps = {
  children: React.ReactNode;
};

const COVER_KEY = "r-sports-cover-dismissed";

export function CoverGate({ children }: CoverGateProps) {
  const [visible, setVisible] = useState(() => {
    if (typeof window === "undefined") {
      return true;
    }

    const forceCover = new URLSearchParams(window.location.search).get("capa") === "1";
    if (forceCover) {
      return true;
    }

    try {
      return window.localStorage.getItem(COVER_KEY) !== "1";
    } catch {
      return true;
    }
  });

  function enterSystem() {
    setVisible(false);

    let cleanUrl = "/";

    if (typeof window !== "undefined") {
      const currentUrl = new URL(window.location.href);
      if (currentUrl.searchParams.has("capa")) {
        currentUrl.searchParams.delete("capa");
      }
      cleanUrl = `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}` || "/";
    }

    try {
      window.localStorage.setItem(COVER_KEY, "1");
    } catch {
      // Ignore localStorage errors.
    }

    if (typeof window !== "undefined") {
      window.location.assign(cleanUrl);
    }
  }

  return (
    <>
      {children}

      {visible ? (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950 text-slate-100">
          <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-orange-500/25 blur-3xl" />
          <div className="absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-emerald-500/20 blur-3xl" />

          <div className="relative mx-auto flex min-h-screen max-w-6xl items-center px-6 py-10">
            <div className="grid w-full items-center gap-10 lg:grid-cols-[320px_1fr]">
              <div className="flex justify-center lg:justify-start">
                <BrandLogo className="h-64 w-64" />
              </div>

              <div className="space-y-6">
                <p className="text-sm uppercase tracking-[0.4em] text-orange-300">R Sports</p>
                <h1 className="max-w-2xl text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
                  Gestão da Escolinha em ritmo de jogo
                </h1>
                <p className="max-w-2xl text-base text-slate-300 sm:text-lg">
                  Controle alunos, mensalidades e despesas em uma única visão. Uma entrada elegante para impressionar pais,
                  parceiros e novos prospects.
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={enterSystem}
                    className="h-11 rounded-xl bg-orange-500 px-6 text-sm font-semibold text-slate-950 transition hover:bg-orange-400"
                  >
                    Entrar no sistema
                  </button>
                  <button
                    type="button"
                    onClick={enterSystem}
                    className="h-11 rounded-xl border border-slate-600 px-6 text-sm font-semibold text-slate-200 transition hover:border-orange-300 hover:text-orange-200"
                  >
                    Pular capa
                  </button>
                </div>

                <p className="text-xs text-slate-400">
                  Dica: salve a logo da escolinha em public/brand/logo-rsports.png para usar a arte oficial na capa.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
