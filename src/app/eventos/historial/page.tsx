"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import MainLayout from "@/components/layout/MainLayout";
import { apiFetch } from "@/lib/api";

type Evento = {
  id: string;
  nombre: string;
  cliente: string;
  fecha_inicio: string;
  fecha_fin: string;
  ubicacion: string | null;
  presupuesto_aprobado: number;
  estado: string;
};

function filtrarEventosFinalizados(data: unknown) {
  return Array.isArray(data)
    ? data.filter((evento: Evento) => evento.estado === "finalizado")
    : [];
}

export default function HistorialEventosPage() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function cargarHistorial() {
      try {
        setCargando(true);
        setError("");

        try {
          const data = await apiFetch("/eventos/historial");
          setEventos(filtrarEventosFinalizados(data));
        } catch {
          const data = await apiFetch("/eventos/");
          setEventos(filtrarEventosFinalizados(data));
        }
      } catch (error) {
        console.error("Error cargando historial de eventos:", error);
        setError("No se pudo cargar el historial de eventos.");
      } finally {
        setCargando(false);
      }
    }

    cargarHistorial();
  }, []);

  function formatearMonto(monto: number) {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
    }).format(Number(monto || 0));
  }

  function formatearEstado(estado: string) {
    if (estado === "planificacion") return "En planificacion";
    if (estado === "en_curso") return "En curso";
    if (estado === "finalizado") return "Finalizado";
    return estado?.replaceAll("_", " ");
  }

  return (
    <MainLayout>
      <main className="min-h-screen bg-[#F6F8FB] p-8">
        <Link href="/eventos" className="text-sm font-medium text-[#2F73D9]">
          &larr; Volver a eventos
        </Link>

        <div className="mt-6 flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-[#102033]">
            Historial de eventos
          </h1>
          <p className="text-slate-500">
            Eventos finalizados de MAZ Producciones
          </p>
        </div>

        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-[#102033]">
              Eventos finalizados
            </h2>
          </div>

          {cargando ? (
            <p className="p-6 text-sm text-slate-500">Cargando eventos...</p>
          ) : error ? (
            <p className="p-6 text-sm text-red-600">{error}</p>
          ) : eventos.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">
              No hay eventos finalizados para mostrar.
            </p>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-6 py-3 text-left font-semibold">
                        Nombre del evento
                      </th>
                      <th className="px-6 py-3 text-left font-semibold">
                        Cliente
                      </th>
                      <th className="px-6 py-3 text-left font-semibold">
                        Fecha inicio
                      </th>
                      <th className="px-6 py-3 text-left font-semibold">
                        Fecha fin
                      </th>
                      <th className="px-6 py-3 text-left font-semibold">
                        Ubicación
                      </th>
                      <th className="px-6 py-3 text-right font-semibold">
                        Presupuesto aprobado
                      </th>
                      <th className="px-6 py-3 text-left font-semibold">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-right font-semibold">
                        Acción
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {eventos.map((evento) => (
                      <tr key={evento.id} className="border-t border-slate-100">
                        <td className="px-6 py-4 font-semibold text-[#102033]">
                          {evento.nombre}
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {evento.cliente || "No registrado"}
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {evento.fecha_inicio}
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {evento.fecha_fin}
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {evento.ubicacion || "Sin ubicación registrada"}
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-[#102033]">
                          {formatearMonto(evento.presupuesto_aprobado)}
                        </td>
                        <td className="px-6 py-4">
                          <span className="rounded-full bg-[#92C83E]/20 px-3 py-1 text-xs font-medium text-[#5D8F12]">
                            {formatearEstado(evento.estado)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/eventos/${evento.id}`}
                            className="font-semibold text-[#2F73D9] hover:text-[#245DB3]"
                          >
                            Ver detalle
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-1 gap-4 p-4 md:hidden">
                {eventos.map((evento) => (
                  <article
                    key={evento.id}
                    className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-bold text-[#102033]">
                          {evento.nombre}
                        </h2>
                        <p className="mt-1 text-sm text-slate-600">
                          Cliente: <b>{evento.cliente || "No registrado"}</b>
                        </p>
                      </div>

                      <span className="rounded-full bg-[#92C83E]/20 px-3 py-1 text-xs font-medium text-[#5D8F12]">
                        {formatearEstado(evento.estado)}
                      </span>
                    </div>

                    <div className="mt-4 space-y-2 text-sm text-slate-600">
                      <p>
                        <b>Fecha inicio:</b> {evento.fecha_inicio}
                      </p>
                      <p>
                        <b>Fecha fin:</b> {evento.fecha_fin}
                      </p>
                      <p>
                        <b>Ubicación:</b>{" "}
                        {evento.ubicacion || "Sin ubicación registrada"}
                      </p>
                      <p>
                        <b>Presupuesto aprobado:</b>{" "}
                        {formatearMonto(evento.presupuesto_aprobado)}
                      </p>
                    </div>

                    <Link
                      href={`/eventos/${evento.id}`}
                      className="mt-5 block w-full rounded-lg border border-slate-300 py-2 text-center font-semibold text-[#102033] hover:bg-slate-50"
                    >
                      Ver detalle
                    </Link>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
      </main>
    </MainLayout>
  );
}
