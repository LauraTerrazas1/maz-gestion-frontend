"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import MainLayout from "@/components/layout/MainLayout";
import Toast from "@/components/ui/Toast";
import type { ToastTipo } from "@/components/ui/Toast";
import { apiFetch } from "@/lib/api";

type Alerta = {
  id: string;
  evento_id: string | null;
  pago_id: string | null;
  programacion_pago_id: string | null;
  personal_grupo_id?: string | null;
  tipo_alerta: string;
  origen: string | null;
  titulo: string;
  descripcion: string | null;
  fecha_alerta: string;
  estado: string;

  proveedor_nombre?: string | null;
  servicio?: string | null;
  grupo_nombre?: string | null;
  cargo?: string | null;
  cantidad_personas?: number | null;
  monto?: number | null;
  evento_nombre?: string | null;
  responsable?: string | null;
  concepto?: string | null;
};

export default function AlertasPage() {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [filtro, setFiltro] = useState("todas");
  const [alertaSeleccionada, setAlertaSeleccionada] = useState<Alerta | null>(null);
  const [toast, setToast] = useState<{ tipo: ToastTipo; mensaje: string } | null>(null);

  async function cargarAlertas() {
    try {
      const data = await apiFetch("/alertas/");
      setAlertas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando alertas:", error);
      setAlertas([]);
    }
  }

  useEffect(() => {
    void Promise.resolve().then(cargarAlertas);
  }, []);

  async function resolverAlerta(id: string) {
    if (id.startsWith("calc-")) {
      setToast({
        tipo: "info",
        mensaje: "Esta alerta se resuelve subiendo el comprobante del pago.",
      });
      return;
    }

    try {
      await apiFetch(`/alertas/${id}/resolver`, {
        method: "PUT",
      });

      setAlertaSeleccionada(null);
      cargarAlertas();
    } catch (error) {
      console.error("Error resolviendo alerta:", error);
      setToast({ tipo: "error", mensaje: "No se pudo resolver la alerta." });
    }
  }

  function formatearTipo(tipo: string) {
    if (tipo === "pago_proximo") return "Pago próximo";
    if (tipo === "pago_vencido") return "Pago vencido";
    if (tipo === "comprobante_pendiente") return "Comprobante pendiente";
    if (tipo === "personal_eventual_pendiente") return "Personal eventual pendiente";
    if (tipo === "resumen_semanal") return "Resumen semanal";
    if (tipo === "pago_hoy") return "Pago de hoy";
    return tipo;
  }

  function tipoClass(tipo: string) {
    if (tipo === "pago_vencido") return "bg-red-50 text-red-700 border-red-200";
    if (tipo === "comprobante_pendiente") return "bg-sky-50 text-sky-700 border-sky-200";
    if (tipo === "personal_eventual_pendiente") return "bg-purple-50 text-purple-700 border-purple-200";
    if (tipo === "pago_hoy") { return "border-purple-200 bg-purple-50 text-purple-700"; }
    return "bg-amber-50 text-amber-700 border-amber-200";
  }

  function formatearEstadoAlerta(alerta: Alerta) {
    if (alerta.estado === "resuelta") return "Resuelta";

    if (alerta.tipo_alerta === "comprobante_pendiente") {
      return "Sin comprobante";
    }

    if (alerta.tipo_alerta === "pago_vencido") {
      return "Vencido";
    }

    if (alerta.tipo_alerta === "pago_proximo") {
      return "Programado";
    }

    return alerta.estado?.replaceAll("_", " ");
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

  function esPersonalEventual(alerta: Alerta) {
    return (
      alerta.origen === "personal_eventual" ||
      alerta.tipo_alerta === "personal_eventual_pendiente" ||
      !!alerta.personal_grupo_id
    );
  }

  function obtenerDestinatario(alerta: Alerta) {
    return alerta.responsable || alerta.proveedor_nombre || alerta.grupo_nombre || alerta.cargo || "No registrado";
  }

  function origenBadgeClass(alerta: Alerta) {
    if (esPersonalEventual(alerta)) {
      return "border-purple-200 bg-purple-50 text-purple-700";
    }

    return "border-blue-200 bg-blue-50 text-blue-700";
  }
  function obtenerMonto(alerta: Alerta) {
    if (alerta.monto !== null && alerta.monto !== undefined) {
      return alerta.monto;
    }

    const match = alerta.descripcion?.match(/S\/\s?(\d+(\.\d+)?)/);
    return match ? Number(match[1]) : null;
  }

  const alertasFiltradas = alertas
    .filter((alerta) => {
      if (filtro === "todas") return true;

      if (filtro === "personal_eventual") {
        return alerta.origen === "personal_eventual";
      }

      return alerta.tipo_alerta === filtro;
    })
    .sort(
      (a, b) =>
        new Date(b.fecha_alerta).getTime() -
        new Date(a.fecha_alerta).getTime()
    );

  const pagosProximos = alertas.filter((a) => a.tipo_alerta === "pago_proximo").length;
  const pagosVencidos = alertas.filter((a) => a.tipo_alerta === "pago_vencido").length;
  const comprobantesPendientes = alertas.filter(
    (a) => a.tipo_alerta === "comprobante_pendiente"
  ).length;
  const personalPendiente = alertas.filter(
    (a) => a.origen === "personal_eventual"
  ).length;

  return (
    <MainLayout>
      <main className="min-h-screen bg-[#F6F8FB] p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#102033]">
              Centro de alertas
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Notificaciones automáticas sobre pagos y documentación pendiente.
            </p>
          </div>

          <Link
            href="/alertas/historial"
            className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-[#102033] shadow-sm hover:bg-slate-50"
          >
            Historial
          </Link>
        </div>

        <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <ResumenCard titulo="Pagos vencidos" valor={pagosVencidos} />
          <ResumenCard titulo="Próximos pagos" valor={pagosProximos} />
          <ResumenCard titulo="Comprobantes pendientes" valor={comprobantesPendientes} />
          <ResumenCard titulo="Personal eventual pendiente" valor={personalPendiente} />
        </section>

        <section className="mt-6 flex flex-wrap gap-3">
          <FiltroButton label="Todas" activo={filtro === "todas"} onClick={() => setFiltro("todas")} />
          <FiltroButton label="Pagos próximos" activo={filtro === "pago_proximo"} onClick={() => setFiltro("pago_proximo")} />
          <FiltroButton label="Pagos vencidos" activo={filtro === "pago_vencido"} onClick={() => setFiltro("pago_vencido")} />
          <FiltroButton label="Comprobantes" activo={filtro === "comprobante_pendiente"} onClick={() => setFiltro("comprobante_pendiente")} />
          <FiltroButton label="Personal eventual" activo={filtro === "personal_eventual"} onClick={() => setFiltro("personal_eventual")} />
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {alertasFiltradas.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">
              No hay alertas pendientes.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="min-w-[160px] px-6 py-3 text-left">Tipo</th>
                    <th className="px-6 py-3 text-left">Origen</th>
                    <th className="px-6 py-3 text-left">Descripción</th>
                    <th className="px-6 py-3 text-left">Fecha</th>
                    <th className="px-6 py-3 text-left">Estado</th>
                    <th className="px-6 py-3 text-right">Acción</th>
                  </tr>
                </thead>

                <tbody>
                  {alertasFiltradas.map((alerta) => (
                    <tr key={alerta.id} className="border-t border-slate-100">
                      <td className="px-6 py-4">
                        <span
                          className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium ${tipoClass(
                            alerta.tipo_alerta
                          )}`}
                        >
                          {formatearTipo(alerta.tipo_alerta)}
                        </span>
                      </td>

                      <td className="w-[210px] px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${esPersonalEventual(alerta)
                              ? "bg-purple-100 text-purple-700"
                              : "bg-blue-100 text-blue-700"
                              }`}
                          >
                            {esPersonalEventual(alerta) ? "PE" : "P"}
                          </div>

                          <div className="min-w-0 max-w-[150px]">
                            <div
                              className={`mb-1 inline-flex max-w-full rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${esPersonalEventual(alerta)
                                ? "bg-purple-50 text-purple-700 ring-1 ring-purple-200"
                                : "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
                                }`}
                            >
                              {esPersonalEventual(alerta) ? "Personal" : "Proveedor"}
                            </div>

                            <p className="truncate text-sm font-semibold text-[#102033]">
                              {obtenerDestinatario(alerta)}
                            </p>

                            <p className="truncate text-xs text-slate-500">
                              {alerta.concepto || alerta.servicio || "Sin detalle"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 max-w-[420px]">
                        <p className="font-semibold text-[#102033]">
                          {alerta.concepto || alerta.servicio || "Pago programado"}
                        </p>

                        <p className="text-sm font-semibold text-slate-700">
                          Monto: S/ {obtenerMonto(alerta)?.toFixed(2) || "--"}
                        </p>

                        <p className="mt-1 text-xs font-medium text-slate-600">
                          Evento: {alerta.evento_nombre || "Sin evento"}
                        </p>
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {alerta.fecha_alerta}
                      </td>

                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${estadoBadgeClass(alerta.estado)}`}>
                          {formatearEstadoAlerta(alerta)}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-col items-end gap-1.5">
                          <button
                            onClick={() => setAlertaSeleccionada(alerta)}
                            className="text-sm font-semibold text-[#2F73D9] hover:text-[#245DB3]"
                          >
                            Ver detalle
                          </button>

                          {alerta.id.startsWith("calc-") ? (
                            <Link
                              href={`/pagos`}
                              className="text-xs font-semibold text-slate-500 hover:text-[#2F73D9]"
                            >
                              Subir comprobante
                            </Link>
                          ) : (
                            <button
                              onClick={() => resolverAlerta(alerta.id)}
                              className="text-xs font-semibold text-[#7CB518] hover:text-[#5f8f12]"
                            >
                              Resolver
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {alertaSeleccionada && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-lg">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-[#102033]">
                    {formatearTipo(alertaSeleccionada.tipo_alerta)}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Detalle de la alerta pendiente.
                  </p>
                </div>

                <button
                  onClick={() => setAlertaSeleccionada(null)}
                  className="rounded-full border border-slate-300 px-3 py-1 text-sm"
                >
                  ×
                </button>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                <DetalleItem label="Título" value={alertaSeleccionada.titulo} />
                <DetalleItem
                  label="Responsable"
                  value={obtenerDestinatario(alertaSeleccionada)}
                />
                <DetalleItem
                  label="Evento"
                  value={alertaSeleccionada.evento_nombre || "Sin evento"}
                />
                <DetalleItem
                  label="Concepto"
                  value={alertaSeleccionada.concepto || alertaSeleccionada.servicio || alertaSeleccionada.evento_nombre || "Sin concepto"}
                />
                <DetalleItem label="Fecha" value={alertaSeleccionada.fecha_alerta} />
                <DetalleItem label="Estado" value={alertaSeleccionada.estado} />
              </div>

              <div className="mt-5">
                <DetalleItem
                  label="Descripción"
                  value={alertaSeleccionada.descripcion || "Sin descripción"}
                />
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setAlertaSeleccionada(null)}
                  className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700"
                >
                  Cerrar
                </button>

                {alertaSeleccionada.id.startsWith("calc-") ? (
                  <Link
                    href="/pagos"
                    className="rounded-lg bg-[#2F73D9] px-5 py-2.5 text-sm font-semibold text-white"
                  >
                    Subir comprobante
                  </Link>
                ) : (
                  <button
                    onClick={() => resolverAlerta(alertaSeleccionada.id)}
                    className="rounded-lg bg-[#2F73D9] px-5 py-2.5 text-sm font-semibold text-white"
                  >
                    Resolver alerta
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {toast && (
          <Toast
            tipo={toast.tipo}
            mensaje={toast.mensaje}
            onClose={() => setToast(null)}
          />
        )}
      </main>
    </MainLayout>
  );
}

function ResumenCard({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase text-slate-500">{titulo}</p>
      <p className="mt-3 text-2xl font-bold text-[#102033]">{valor}</p>
    </div>
  );
}

function FiltroButton({
  label,
  activo,
  onClick,
}: {
  label: string;
  activo: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-4 py-2 text-sm font-semibold shadow-sm ${activo
        ? "bg-[#2F73D9] text-white"
        : "border border-slate-300 bg-white text-[#102033]"
        }`}
    >
      {label}
    </button>
  );
}

function DetalleItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#102033]">{value}</p>
    </div>
  );
}
