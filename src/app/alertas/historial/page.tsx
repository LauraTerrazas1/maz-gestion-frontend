"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import MainLayout from "@/components/layout/MainLayout";
import { apiFetch } from "@/lib/api";

type Alerta = {
  id: string;
  evento_id: string | null;
  pago_id: string | null;
  programacion_pago_id: string | null;
  tipo_alerta: string;
  origen: string | null;
  titulo: string;
  descripcion: string | null;
  fecha_alerta: string;
  estado: string;
};

export default function HistorialAlertasPage() {
  const [alertas, setAlertas] = useState<Alerta[]>([]);

  async function cargarHistorial() {
    try {
      const data = await apiFetch("/alertas/historial");
      setAlertas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando historial de alertas:", error);
      setAlertas([]);
    }
  }

  useEffect(() => {
    void Promise.resolve().then(cargarHistorial);
  }, []);

  function formatearTipo(tipo: string) {
    if (tipo === "pago_proximo") return "Pago próximo";
    if (tipo === "pago_hoy") return "Pago de hoy";
    if (tipo === "pago_vencido") return "Pago vencido";
    if (tipo === "comprobante_pendiente") return "Comprobante pendiente";
    if (tipo === "personal_eventual_pendiente") return "Personal eventual pendiente";
    if (tipo === "resumen_semanal") return "Resumen semanal";
    return tipo;
  }

  function formatearOrigen(origen?: string | null) {
  if (origen === "factura") return "Factura";
  if (origen === "proveedor") return "Proveedor";
  if (origen === "personal_eventual") return "Personal eventual";

  return origen || "No registrado";
}

  function formatearEstado(estado: string) {
    if (estado === "pagado_sin_comprobante") return "Pagado sin comprobante";
    if (estado === "comprobante_pendiente") return "Comprobante pendiente";
    if (estado === "pago_vencido") return "Pago vencido";
    return estado?.replaceAll("_", " ");
  }

  function estadoBadgeClass(estado: string) {
    if (estado === "pagado" || estado === "activo" || estado === "resuelta" || estado === "aprobado") {
      return "border-green-200 bg-green-50 text-green-700";
    }

    if (estado === "pendiente" || estado === "planificacion") {
      return "border-amber-200 bg-amber-50 text-amber-700";
    }

    if (estado === "pagado_sin_comprobante" || estado === "comprobante_pendiente") {
      return "border-sky-200 bg-sky-50 text-sky-700";
    }

    if (estado === "vencido" || estado === "pago_vencido") {
      return "border-red-200 bg-red-50 text-red-700";
    }

    if (estado === "inactivo") {
      return "border-slate-200 bg-slate-100 text-slate-600";
    }

    if (estado === "en_curso") {
      return "border-blue-200 bg-blue-50 text-blue-700";
    }

    if (estado === "finalizado") {
      return "border-slate-300 bg-slate-100 text-slate-700";
    }

    return "border-slate-200 bg-slate-50 text-slate-600";
  }

  return (
    <MainLayout>
      <main className="min-h-screen bg-[#F6F8FB] p-8">
        <Link href="/alertas" className="text-sm font-medium text-[#2F73D9]">
          ← Volver a alertas
        </Link>

        <div className="mt-6">
          <h1 className="text-3xl font-bold text-[#102033]">
            Historial de alertas
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Alertas resueltas y notificadas anteriormente.
          </p>
        </div>

        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {alertas.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">
              No hay alertas resueltas.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-6 py-3 text-left">Tipo</th>
                    <th className="px-6 py-3 text-left">Origen</th>
                    <th className="px-6 py-3 text-left">Descripción</th>
                    <th className="px-6 py-3 text-left">Fecha</th>
                    <th className="px-6 py-3 text-left">Estado</th>
                  </tr>
                </thead>

                <tbody>
                  {alertas.map((alerta) => (
                    <tr key={alerta.id} className="border-t border-slate-100">
                      <td className="px-6 py-4 font-semibold text-[#102033]">
                        {formatearTipo(alerta.tipo_alerta)}
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {formatearOrigen(alerta.origen)}
                      </td>

                      <td className="px-6 py-4">
                        <p className="font-semibold text-[#102033]">
                          {alerta.titulo}
                        </p>
                        <p className="text-slate-500">
                          {alerta.descripcion || "Sin descripción"}
                        </p>
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {alerta.fecha_alerta}
                      </td>

                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${estadoBadgeClass(alerta.estado)}`}>
                          {formatearEstado(alerta.estado)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </MainLayout>
  );
}
