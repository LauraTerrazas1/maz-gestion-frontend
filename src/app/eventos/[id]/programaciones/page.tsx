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

type ProgramacionPago = {
  id: string;
  evento_proveedor_id?: string | null;
  tipo_programacion: string;
  fecha_programada: string;
  monto: number | string;
  porcentaje: number | string | null;
  estado: string;
  evento_proveedores?: {
    servicio?: string | null;
    proveedores?: {
      razon_social?: string | null;
    } | null;
  } | null;
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
  if (estado === "pagado" || estado === "aprobado") {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (estado === "pendiente" || estado === "planificacion") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (estado === "pagado_sin_comprobante") {
    return "border-sky-200 bg-sky-50 text-sky-700";
  }

  if (estado === "vencido") {
    return "border-red-200 bg-red-50 text-red-700";
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

export default function EventoProgramacionesPage() {
  const params = useParams<{ id: string }>();
  const [evento, setEvento] = useState<Evento | null>(null);
  const [programaciones, setProgramaciones] = useState<ProgramacionPago[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [proveedorFiltro, setProveedorFiltro] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("todos");
  const [fechaFiltro, setFechaFiltro] = useState("");

  useEffect(() => {
    async function cargarDatos() {
      if (!params.id) {
        setError("ID de evento no especificado.");
        setCargando(false);
        return;
      }

      try {
        const [eventoData, programacionesData] = await Promise.all([
          apiFetch(`/eventos/${params.id}`),
          apiFetch(`/programaciones-pago/evento/${params.id}`),
        ]);

        setEvento(eventoData);
        setProgramaciones(Array.isArray(programacionesData) ? programacionesData : []);
      } catch (fetchError) {
        console.error(fetchError);
        setError("No se pudo cargar las programaciones del evento.");
      } finally {
        setCargando(false);
      }
    }

    void cargarDatos();
  }, [params.id]);

  const programacionesFiltradas = programaciones.filter((item) => {
    const textoProveedor = (item.evento_proveedores?.proveedores?.razon_social || "").toLowerCase();
    const coincideProveedor = !proveedorFiltro || textoProveedor.includes(proveedorFiltro.toLowerCase());
    const coincideEstado = estadoFiltro === "todos" || item.estado === estadoFiltro;
    const coincideFecha = !fechaFiltro || item.fecha_programada === fechaFiltro;

    return coincideProveedor && coincideEstado && coincideFecha;
  });

  return (
    <MainLayout>
      <main className="min-h-screen bg-[#F6F8FB] p-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href={`/eventos/${params.id}`} className="text-sm font-medium text-[#2F73D9]">
              &larr; Volver al evento
            </Link>
            <h1 className="mt-4 text-3xl font-bold text-[#102033]">Programaciones del evento</h1>
            <p className="mt-1 text-sm text-slate-500">
              Listado general de las programaciones del evento con filtros por proveedor, estado y fecha.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/eventos/${params.id}`}
              className="inline-flex items-center justify-center rounded-lg bg-[#2F73D9] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#245DB3]"
            >
              Volver al evento
            </Link>
          </div>
        </div>

        {cargando ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
            Cargando programaciones...
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-10 text-center text-red-700 shadow-sm">
            {error}
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-6 py-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#2F73D9]">
                  Evento
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[#102033]">
                  {evento?.nombre || "Evento no encontrado"}
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  {evento?.cliente || "Cliente no registrado"}
                </p>
              </div>

              <div className="p-6 space-y-3 text-sm text-slate-600">
                <p>📅 {evento?.fecha_inicio} - {evento?.fecha_fin}</p>
                <p>📍 {evento?.ubicacion || "Sin ubicación"}</p>
              </div>
            </section>

            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#2F73D9]">
                Resumen
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Programaciones</p>
                  <p className="mt-2 text-2xl font-semibold text-[#102033]">{programaciones.length}</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Última programada</p>
                  <p className="mt-2 text-lg font-semibold text-[#102033]">
                    {programaciones.length > 0
                      ? programaciones[programaciones.length - 1].fecha_programada
                      : "N/A"}
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}

        <section className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-5">
            <h2 className="text-lg font-semibold text-[#102033]">Todas las programaciones</h2>
          </div>

          <div className="grid gap-4 border-b border-slate-100 bg-slate-50 p-6 md:grid-cols-3">
            <input
              value={proveedorFiltro}
              onChange={(e) => setProveedorFiltro(e.target.value)}
              placeholder="Filtrar por proveedor"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-[#2F73D9]"
            />
            <select
              value={estadoFiltro}
              onChange={(e) => setEstadoFiltro(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-[#2F73D9]"
            >
              <option value="todos">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="pagado">Pagado</option>
              <option value="pagado_sin_comprobante">Pagado sin comprobante</option>
              <option value="vencido">Vencido</option>
            </select>
            <input
              type="date"
              value={fechaFiltro}
              onChange={(e) => setFechaFiltro(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-[#2F73D9]"
            />
          </div>

          {programacionesFiltradas.length === 0 ? (
            <div className="p-10 text-center text-slate-500">
              No hay programaciones registradas para este evento con los filtros aplicados.
            </div>
          ) : (
            <div className="overflow-x-auto p-6">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 text-left">Proveedor</th>
                    <th className="px-4 py-3 text-left">Servicio</th>
                    <th className="px-4 py-3 text-left">Tipo</th>
                    <th className="px-4 py-3 text-right">Monto</th>
                    <th className="px-4 py-3 text-left">Fecha</th>
                    <th className="px-4 py-3 text-left">Estado</th>
                    <th className="px-4 py-3 text-left">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {programacionesFiltradas.map((item) => (
                    <tr
                      key={item.id}
                      className="border-t border-slate-200 transition duration-200 hover:bg-slate-50"
                    >
                      <td className="px-4 py-4 font-semibold text-[#102033]">
                        {item.evento_proveedores?.proveedores?.razon_social || "Proveedor no registrado"}
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {item.evento_proveedores?.servicio || "Servicio no registrado"}
                      </td>
                      <td className="px-4 py-4 text-slate-600">{item.tipo_programacion}</td>
                      <td className="px-4 py-4 text-right font-semibold text-[#102033]">
                        {moneda(item.monto)}
                      </td>
                      <td className="px-4 py-4">{item.fecha_programada}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${estadoBadgeClass(item.estado)}`}>
                          {formatearEstado(item.estado)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <Link
                          href={item.evento_proveedor_id ? `/eventos/${params.id}/proveedores/${item.evento_proveedor_id}` : `/eventos/${params.id}`}
                          className="font-semibold text-[#2F73D9] hover:text-[#245DB3]"
                        >
                          Ver proveedor asociado
                        </Link>
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
