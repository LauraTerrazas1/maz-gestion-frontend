"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const logoUrl =
  "https://yoqporwshbseefndrtuu.supabase.co/storage/v1/object/public/logo/Logo%20MAZ.jpeg";

const navItems = [
  {
    href: "/eventos",
    label: "Eventos",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
        <path
          d="M7 3v3M17 3v3M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.8"
        />
      </svg>
    ),
  },
  {
    href: "/proveedores",
    label: "Proveedores",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
        <path
          d="M8 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM3 21v-2a5 5 0 0 1 5-5h1a5 5 0 0 1 5 5v2M17 10h4M19 8v4M16 21h4a1 1 0 0 0 1-1v-5h-5v6Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      </svg>
    ),
  },
  {
    href: "/personal-eventual",
    label: "Personal Eventual",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
        <path
          d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM3 21v-2a6 6 0 0 1 6-6h1a6 6 0 0 1 6 6v2M17 8h4M19 6v4M17 14h4M19 14v6"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      </svg>
    ),
  },
  {
    href: "/pagos",
    label: "Pagos",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
        <path
          d="M4 7h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7Zm0 0V6a2 2 0 0 1 2-2h12M16 14h3"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      </svg>
    ),
  },
  {
    href: "/alertas",
    label: "Alertas",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
        <path
          d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      </svg>
    ),
  },
];

type Props = {
  isCollapsed: boolean;
  setIsCollapsed: (v: boolean) => void;
  alertCount: number;
};

export default function Sidebar({ isCollapsed, setIsCollapsed, alertCount }: Props) {
  const pathname = usePathname();

  useEffect(() => {
    const handler = (e: any) => {
      if (e?.detail?.collapsed !== undefined) setIsCollapsed(!!e.detail.collapsed);
    };
    window.addEventListener("maz:sidebar:toggle", handler as EventListener);

    return () => window.removeEventListener("maz:sidebar:toggle", handler as EventListener);
  }, []);

  // expose setter via dataset event (MainLayout calls setCollapsed directly)
  function toggleLocal() {
    const next = !isCollapsed;
    setIsCollapsed(next);
    window.dispatchEvent(new CustomEvent("maz:sidebar:toggled", { detail: { collapsed: next } }));
  }

  return (
    <aside
      className={`fixed left-4 top-6 z-40 h-[calc(100vh-48px)] ${isCollapsed ? "w-24" : "w-72"
        } rounded-r-[2rem] bg-[#071527] text-white shadow-2xl p-5 transition-all duration-300`}
    >
      <div className="flex h-full flex-col justify-between">
        <div>
          <div className="mb-6 flex items-start justify-between gap-3">
            <div className="rounded-2xl bg-white p-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-md bg-[#EAF7E1] p-1.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logoUrl} alt="Logo MAZ" className="h-full w-full rounded-sm object-contain" />
                </div>
                {!isCollapsed && (
                  <div className="min-w-0 flex-1">
                    <h1 className="truncate text-base font-bold leading-tight text-[#102033]">MAZ Producciones</h1>
                    <p className="mt-1 truncate text-xs font-medium text-slate-500">Sistema de Gestión Operativa</p>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={toggleLocal}
              title={isCollapsed ? "Expandir" : "Colapsar"}
              className="ml-2 rounded-lg bg-white/5 p-2 text-slate-200 hover:bg-white/10"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4">
                <path
                  d={isCollapsed ? "M9 6l6 6-6 6" : "M15 6l-6 6 6 6"}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => {
              const activo = pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={isCollapsed ? item.label : undefined}
                  className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${activo
                    ? "bg-gradient-to-r from-[#1f7a2e]/80 to-[#163b24]/80 border border-[#9DFF3A]/40 shadow-[0_8px_30px_rgba(45,200,80,0.12)] text-white"
                    : "text-white/90 hover:bg-[#153a26]/30"
                    } ${isCollapsed ? "justify-center px-2" : "justify-start"}`}
                >
                  <span className={`flex-none ${activo ? "text-[#9DFF3A]" : "text-[#9DFF3A]"}`}>
                    {item.icon}
                  </span>
                  {!isCollapsed && <span className="flex-1">{item.label}</span>}
                  {item.href === "/alertas" && alertCount > 0 && (
                    <span
                      className={`ml-2 inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold ${isCollapsed ? "absolute translate-x-6" : ""} bg-green-600 text-white`}
                    >
                      {alertCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-6">
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem("maz_auth");
              window.location.href = "/login";
            }}
            className="flex w-full items-center gap-3 rounded-lg bg-white/5 px-3 py-2 text-left hover:bg-white/10"
          >
            <span className="text-slate-300">⎋</span>
            {!isCollapsed && (
              <div className="flex-1">
                <div className="text-sm font-semibold">Administrador</div>
                <div className="text-xs text-slate-300">Cerrar sesión</div>
              </div>
            )}

            {!isCollapsed && (
              <span className="text-slate-300">
                →
              </span>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
