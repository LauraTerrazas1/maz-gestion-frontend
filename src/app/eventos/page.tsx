"use client";

import { useEffect, useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { apiFetch } from "@/lib/api";
import Link from "next/link";

type Evento = {
  id: string;
  nombre: string;
  cliente: string;
  fecha_inicio: string;
  fecha_fin: string;
  ubicacion: string | null;
  presupuesto_aprobado: number;
  monto_recibido_cliente: number;
  saldo_pendiente_cliente: number;
  porcentaje_adelanto: number;
  estado: string;
  color_card?: string | null;
};

function getColorCardClass(color?: string | null) {
  if (color === "verde") return "border-t-[#92C83E]";
  if (color === "naranja") return "border-t-orange-500";
  if (color === "morado") return "border-t-purple-500";
  if (color === "rosado") return "border-t-pink-500";
  if (color === "rojo") return "border-t-red-500";
  if (color === "amarillo") return "border-t-yellow-500";
  if (color === "turquesa") return "border-t-cyan-500";
  if (color === "indigo") return "border-t-indigo-500";
  if (color === "gris") return "border-t-slate-400";
  if (color === "negro") return "border-t-[#102033]";
  return "border-t-[#2F73D9]";
}

export default function EventosPage() {
  const [eventos, setEventos] = useState<Evento[]>([]);

  useEffect(() => {
    async function cargarEventos() {
      try {
        const data = await apiFetch("/eventos/");
        const activos = Array.isArray(data)
          ? data.filter(
            (evento: Evento) =>
              evento.estado === "planificacion" ||
              evento.estado === "en_curso" ||
              evento.estado === "pendiente_cierre"
          )
          : [];
        setEventos(activos);
      } catch (error) {
        console.error("Error cargando eventos:", error);
      }
    }

    cargarEventos();
  }, []);

  function formatearMonto(monto: number) {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
      minimumFractionDigits: 2,
    }).format(Number(monto || 0));
  }

  function formatearEstado(estado: string) {
    if (estado === "planificacion") return "En planificación";
    if (estado === "en_curso") return "En curso";
    if (estado === "pendiente_cierre") return "Pendiente de cierre";
    if (estado === "finalizado") return "Finalizado";
    return estado;
  }

  function iniciales(nombre: string) {
    return nombre
      ?.split(" ")
      .slice(0, 2)
      .map((p) => p[0])
      .join("")
      .toUpperCase();
  }

  return (
    <MainLayout>
      <main className="min-h-screen bg-[#F6F8FB] p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#102033]">Eventos</h1>
            <p className="mt-1 text-sm text-slate-500">
              Eventos deportivos y carreras gestionadas por MAZ Producciones.
            </p>
          </div>

          <Link
            href="/eventos/nuevo"
            className="rounded-lg bg-[#2F73D9] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#245DB3]"
          >
            + Nuevo evento
          </Link>
        </div>

        <div className="mb-6 flex gap-3">
          <button className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#102033] shadow-sm">
            Eventos activos
          </button>

          <Link
            href="/eventos/historial"
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-500 shadow-sm hover:text-[#102033]"
          >
            Historial
          </Link>
        </div>

        {eventos.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
            No hay eventos activos registrados.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {eventos.map((evento) => {
              const avance = Number(evento.porcentaje_adelanto || 0);
              const colorTop = getColorCardClass(evento.color_card);

              return (
                <article
                  key={evento.id}
                  className={`rounded-2xl border border-slate-200 border-t-4 ${colorTop} bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md`}
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="flex gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2F73D9] text-sm font-bold text-white">
                        {iniciales(evento.nombre)}
                      </div>

                      <div>
                        <h2 className="line-clamp-1 font-bold text-[#102033]">
                          {evento.nombre}
                        </h2>
                        <p className="text-xs text-slate-500">
                          Cliente:{" "}
                          <span className="font-medium text-slate-700">
                            {evento.cliente}
                          </span>
                        </p>
                      </div>
                    </div>

                    <span className="whitespace-nowrap rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-[#102033]">
                      {formatearEstado(evento.estado)}
                    </span>
                  </div>

                  <div className="mb-4 space-y-2 text-sm text-slate-600">
                    <p>📅 {evento.fecha_inicio} al {evento.fecha_fin}</p>
                    <p>📍 {evento.ubicacion || "Sin ubicación registrada"}</p>
                  </div>

                  <div className="mb-4">
                    <div className="mb-1 flex justify-between text-xs text-slate-500">
                      <span>Avance financiero</span>
                      <span className="font-semibold text-[#102033]">
                        {avance}% ejecutado
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-[#2F73D9]"
                        style={{ width: `${Math.min(avance, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 text-center">
                    <div>
                      <p className="text-[10px] uppercase text-slate-500">
                        Presupuesto
                      </p>
                      <p className="text-xs font-bold text-[#102033]">
                        {formatearMonto(evento.presupuesto_aprobado)}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase text-slate-500">
                        Recibido
                      </p>
                      <p className="text-xs font-bold text-[#92C83E]">
                        {formatearMonto(evento.monto_recibido_cliente)}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase text-slate-500">
                        Pendiente
                      </p>
                      <p className="text-xs font-bold text-[#102033]">
                        {formatearMonto(evento.saldo_pendiente_cliente)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl border border-slate-200 p-3">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="uppercase text-slate-500">
                          Recibido del cliente
                        </p>
                        <p className="font-bold text-[#102033]">
                          {formatearMonto(evento.monto_recibido_cliente)}{" "}
                          <span className="text-slate-500">
                            ({avance}%)
                          </span>
                        </p>
                      </div>

                      <div>
                        <p className="uppercase text-slate-500">
                          Saldo del cliente
                        </p>
                        <p className="font-bold text-[#102033]">
                          {formatearMonto(evento.saldo_pendiente_cliente)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/eventos/${evento.id}`}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-[#102033] shadow-sm hover:bg-slate-50"
                  >
                    Ver detalle <span>→</span>
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </MainLayout>
  );
}
