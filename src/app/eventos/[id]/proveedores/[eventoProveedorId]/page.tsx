"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import MainLayout from "@/components/layout/MainLayout";
import { apiFetch } from "@/lib/api";

type Evento = {
  id: string;
  nombre: string;
  cliente: string | null;
  fecha_inicio: string;
  fecha_fin: string;
  ubicacion: string | null;
};

type EventoProveedor = {
  id: string;
  evento_id: string;
  proveedor_id: string;
  servicio: string | null;
  monto_contratado: number | string | null;
  estado: string | null;
  proveedores?: {
    razon_social?: string | null;
    contacto_nombre?: string | null;
    banco?: string | null;
    tipo_cuenta?: string | null;
    numero_cuenta?: string | null;
    cci?: string | null;
    titular_cuenta?: string | null;
  } | null;
};

type ProgramacionPago = {
  id: string;
  tipo_programacion: string;
  fecha_programada: string;
  monto: number | string;
  porcentaje: number | string | null;
  estado: string;
};

type Pago = {
  id: string;
  evento_id: string;
  evento_proveedor_id?: string;
  tipo_pago: string;
  metodo_pago: string;
  monto: number | string;
  fecha_real_pago: string | null;
  estado: string;
};

function formatearEstado(estado: string) {
  if (estado === "pendiente") return "Pendiente";
  if (estado === "pagado") return "Pagado";
  if (estado === "pagado_sin_comprobante") return "Pagado sin comprobante";
  if (estado === "vencido") return "Vencido";
  if (estado === "planificacion") return "En planificación";
  if (estado === "en_curso") return "En curso";
  if (estado === "finalizado") return "Finalizado";
  return estado.replaceAll("_", " ");
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

function moneda(value: number | string | null | undefined) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(Number(value || 0));
}

export default function DetalleProveedorEventoPage() {
  const params = useParams<{ id: string; eventoProveedorId: string }>();

  const [evento, setEvento] = useState<Evento | null>(null);
  const [proveedor, setProveedor] = useState<EventoProveedor | null>(null);
  const [programaciones, setProgramaciones] = useState<ProgramacionPago[]>([]);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function cargarDatos() {
      if (!params.id || !params.eventoProveedorId) {
        setError("ID de evento o proveedor no especificado.");
        setCargando(false);
        return;
      }

      try {
        const [eventoData, proveedoresData, programacionesData, pagosData] = await Promise.all([
          apiFetch(`/eventos/${params.id}`),
          apiFetch(`/eventos/${params.id}/proveedores`),
          apiFetch(`/programaciones-pago/evento-proveedor/${params.eventoProveedorId}`),
          apiFetch("/pagos/"),
        ]);

        setEvento(eventoData);

        const proveedorEncontrado = Array.isArray(proveedoresData)
          ? proveedoresData.find((item: EventoProveedor) => item.id === params.eventoProveedorId)
          : null;
        setProveedor(proveedorEncontrado || null);

        setProgramaciones(Array.isArray(programacionesData) ? programacionesData : []);

        const pagosFiltrados = Array.isArray(pagosData)
          ? pagosData.filter(
              (pago: Pago) => pago.evento_proveedor_id === params.eventoProveedorId
            )
          : [];
        setPagos(pagosFiltrados);
      } catch (fetchError) {
        console.error("Error cargando datos de proveedor del evento:", fetchError);
        setError("No se pudo cargar la información del proveedor. Intenta nuevamente.");
      } finally {
        setCargando(false);
      }
    }

    void cargarDatos();
  }, [params.id, params.eventoProveedorId]);

  if (cargando) {
    return (
      <MainLayout>
        <main className="min-h-screen bg-[#F6F8FB] p-8">Cargando proveedor...</main>
      </MainLayout>
    );
  }

  if (error || !evento || !proveedor) {
    return (
      <MainLayout>
        <main className="min-h-screen bg-[#F6F8FB] p-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-lg font-semibold text-[#102033]">No se encontró el proveedor asociado.</p>
            <p className="mt-2 text-sm text-slate-500">{error || "Revisa el enlace e inténtalo de nuevo."}</p>
            <div className="mt-6">
              <Link
                href={`/eventos/${params.id}`}
                className="inline-flex rounded-lg bg-[#2F73D9] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#245DB3]"
              >
                Volver al evento
              </Link>
            </div>
          </div>
        </main>
      </MainLayout>
    );
  }

  const montoContratado = Number(proveedor.monto_contratado || 0);
  const totalPagado = pagos.reduce((acc, pago) => {
    if (pago.estado !== "pagado" && pago.estado !== "pagado_sin_comprobante") {
      return acc;
    }
    return acc + Number(pago.monto || 0);
  }, 0);
  const saldoPendiente = montoContratado - totalPagado;
  const programacionesCount = programaciones.length;
  const pagosCount = pagos.length;
  const porcentajeProgramado = montoContratado > 0
    ? Math.round(
        (programaciones.reduce((acc, item) => acc + Number(item.monto || 0), 0) / montoContratado) * 100
      )
    : 0;

  return (
    <MainLayout>
      <main className="min-h-screen bg-[#F6F8FB] p-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href={`/eventos/${params.id}`} className="text-sm font-medium text-[#2F73D9]">
              &larr; Volver al evento
            </Link>
            <h1 className="mt-4 text-3xl font-bold text-[#102033]">Detalle del proveedor</h1>
            <p className="mt-2 text-sm text-slate-500">
              Información operacional y financiera para el proveedor asociado al evento.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {saldoPendiente > 0 ? (
              <>
                <Link
                  href={`/eventos/${params.id}/programaciones/nuevo?eventoProveedorId=${params.eventoProveedorId}`}
                  className="inline-flex items-center justify-center rounded-lg bg-[#2F73D9] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#245DB3]"
                >
                  + Nueva programación
                </Link>
                <Link
                  href={`/pagos/nuevo?eventoId=${params.id}&eventoProveedorId=${params.eventoProveedorId}`}
                  className="inline-flex items-center justify-center rounded-lg border border-[#2F73D9] bg-white px-4 py-2 text-sm font-semibold text-[#2F73D9] shadow-sm hover:bg-[#F6F8FB]"
                >
                  Registrar pago
                </Link>
              </>
            ) : (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                Servicio completamente pagado
              </div>
            )}
            <Link
              href={`/eventos/${params.id}`}
              className="inline-flex items-center justify-center rounded-lg border border-[#2F73D9] bg-white px-4 py-2 text-sm font-semibold text-[#2F73D9] shadow-sm hover:bg-[#F6F8FB]"
            >
              Ver evento
            </Link>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-[#F6F8FB] px-6 py-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#2F73D9]">
                Resumen del proveedor
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[#102033]">Operación y pagos</h2>
            </div>

            <div className="grid gap-4 p-6 sm:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#2F73D9]">Proveedor</p>
                <p className="mt-3 text-lg font-semibold text-[#102033]">
                  {proveedor.proveedores?.razon_social || "Sin nombre registrado"}
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  {proveedor.proveedores?.contacto_nombre ? `Contacto: ${proveedor.proveedores.contacto_nombre}` : "Contacto no registrado"}
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#2F73D9]">Servicio</p>
                <p className="mt-3 text-lg font-semibold text-[#102033]">
                  {proveedor.servicio || "Servicio no registrado"}
                </p>
                <span className={`mt-4 inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${estadoBadgeClass(proveedor.estado || "pendiente")}`}>
                  {formatearEstado(proveedor.estado || "pendiente")}
                </span>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#2F73D9]">Monto contratado</p>
                <p className="mt-3 text-2xl font-semibold text-[#102033]">{moneda(proveedor.monto_contratado)}</p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#2F73D9]">Saldo pendiente</p>
                <p className="mt-3 text-2xl font-semibold text-[#102033]">{moneda(saldoPendiente)}</p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:col-span-2">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#2F73D9]">Programaciones</p>
                    <p className="mt-3 text-lg font-semibold text-[#102033]">{programacionesCount}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Avance programado</p>
                    <p className="mt-3 text-lg font-semibold text-[#102033]">{porcentajeProgramado}%</p>
                  </div>
                </div>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-[#2F73D9]" style={{ width: `${Math.min(Math.max(porcentajeProgramado, 0), 100)}%` }} />
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:col-span-2">
                <div className="grid grid-cols-2 gap-4 text-sm text-slate-500 sm:grid-cols-4">
                  <div>
                    <p className="font-semibold text-[#102033]">Programaciones</p>
                    <p className="mt-1">{programacionesCount}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-[#102033]">Pagos</p>
                    <p className="mt-1">{pagosCount}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-[#102033]">Pagado</p>
                    <p className="mt-1">{moneda(totalPagado)}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-[#102033]">Saldo</p>
                    <p className="mt-1">{moneda(saldoPendiente)}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#2F73D9]">Evento</p>
            <h2 className="mt-2 text-xl font-semibold text-[#102033]">{evento.nombre}</h2>
            <p className="mt-2 text-sm text-slate-600">Cliente: {evento.cliente || "Sin cliente registrado"}</p>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <p>📅 {evento.fecha_inicio} - {evento.fecha_fin}</p>
              <p>📍 {evento.ubicacion || "Sin ubicación"}</p>
            </div>
          </section>
        </div>

        <section className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-[#F6F8FB] px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#2F73D9]">Programaciones</p>
            <h2 className="mt-2 text-2xl font-semibold text-[#102033]">Cronograma de pagos</h2>
          </div>

          {programacionesCount === 0 ? (
            <div className="p-6 text-slate-500">No hay programaciones registradas para este proveedor.</div>
          ) : (
            <div className="overflow-x-auto p-6">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 text-left">Tipo</th>
                    <th className="px-4 py-3 text-right">Monto</th>
                    <th className="px-4 py-3 text-left">Fecha</th>
                    <th className="px-4 py-3 text-left">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {programaciones.map((item) => (
                    <tr key={item.id} className="border-t border-slate-200 transition duration-200 hover:bg-slate-50">
                      <td className="px-4 py-4 font-semibold text-[#102033]">{item.tipo_programacion}</td>
                      <td className="px-4 py-4 text-right font-semibold">{moneda(item.monto)}</td>
                      <td className="px-4 py-4 text-slate-600">{item.fecha_programada}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${estadoBadgeClass(item.estado)}`}>
                          {formatearEstado(item.estado)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-[#F6F8FB] px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#2F73D9]">Pagos</p>
            <h2 className="mt-2 text-2xl font-semibold text-[#102033]">Movimientos asociados</h2>
          </div>

          {pagosCount === 0 ? (
            <div className="p-6 text-slate-500">No se han registrado pagos para este proveedor.</div>
          ) : (
            <div className="overflow-x-auto p-6">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 text-left">Tipo de pago</th>
                    <th className="px-4 py-3 text-left">Método</th>
                    <th className="px-4 py-3 text-right">Monto</th>
                    <th className="px-4 py-3 text-left">Fecha</th>
                    <th className="px-4 py-3 text-left">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {pagos.map((pago) => (
                    <tr key={pago.id} className="border-t border-slate-200 transition duration-200 hover:bg-slate-50">
                      <td className="px-4 py-4 font-semibold text-[#102033]">{pago.tipo_pago}</td>
                      <td className="px-4 py-4 text-slate-600">{pago.metodo_pago}</td>
                      <td className="px-4 py-4 text-right font-semibold">{moneda(pago.monto)}</td>
                      <td className="px-4 py-4">{pago.fecha_real_pago || "Sin registrar"}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${estadoBadgeClass(pago.estado)}`}>
                          {formatearEstado(pago.estado)}
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
