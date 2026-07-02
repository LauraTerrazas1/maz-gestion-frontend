"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const logoUrl =
  "https://yoqporwshbseefndrtuu.supabase.co/storage/v1/object/public/logo/Logo%20MAZ.jpeg";

export default function LoginPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [error, setError] = useState("");

  function login(e: React.FormEvent) {
    e.preventDefault();

    if (usuario === "admin" && password === "Maz2026*") {
      localStorage.setItem("maz_auth", "true");
      router.push("/eventos");
      return;
    }

    setError("Usuario o contraseña incorrectos.");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0b3d24] via-[#0d2b3f] to-[#071527] p-6">
      <form
        onSubmit={login}
        className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl sm:p-10"
      >
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EAF7E1] p-2.5 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoUrl} alt="Logo MAZ" className="h-full w-full rounded-lg object-contain" />
          </div>

          <p className="mt-4 text-sm font-bold text-[#102033]">MAZ Producciones</p>
          <p className="text-xs font-medium text-slate-500">Sistema de Gestión Operativa</p>
        </div>

        <div className="mt-7 h-1 w-14 rounded-full bg-gradient-to-r from-[#1f7a2e] to-[#2f73d9] mx-auto" />

        <div className="mt-7 text-center">
          <h1 className="text-2xl font-bold text-[#102033]">Iniciar sesión</h1>
          <p className="mt-2 text-sm text-slate-500">
            Ingresa con tu usuario administrador para continuar.
          </p>
        </div>

        <div className="mt-7 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#102033]">
              Usuario
            </label>
            <input
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              placeholder="Ingresa tu usuario"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm shadow-sm outline-none transition-colors focus:border-[#2F73D9] focus:ring-2 focus:ring-[#2F73D9]/20"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#102033]">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={mostrarPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa tu contraseña"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-11 text-sm shadow-sm outline-none transition-colors focus:border-[#2F73D9] focus:ring-2 focus:ring-[#2F73D9]/20"
              />

              <button
                type="button"
                onClick={() => setMostrarPassword((v) => !v)}
                aria-label={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {mostrarPassword ? (
                  <svg viewBox="0 0 24 24" className="h-5 w-5">
                    <path
                      d="M3 3l18 18M10.6 10.6a2.4 2.4 0 0 0 3.4 3.4M9.4 5.5A10.7 10.7 0 0 1 12 5c5 0 9 4 10.5 7-.6 1.2-1.5 2.5-2.6 3.6M6.6 6.6C4.5 8 3 10 1.5 12c1.5 3 5.5 7 10.5 7 1.4 0 2.7-.3 3.9-.8"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-5 w-5">
                    <path
                      d="M1.5 12c1.5-3 5.5-7 10.5-7s9 4 10.5 7c-1.5 3-5.5 7-10.5 7s-9-4-10.5-7Z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full rounded-xl bg-[#2F73D9] px-5 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#245DB3]"
          >
            Iniciar sesión
          </button>
        </div>

        <p className="mt-7 text-center text-xs font-medium text-slate-400">
          Acceso restringido al personal autorizado de MAZ Producciones.
        </p>
      </form>
    </main>
  );
}