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

type Pago = {
  id: string;
  evento_id: string;
  evento_proveedor_id?: string | null;
  tipo_pago: string;
  metodo_pago: string;
  monto: number | string;
  fecha_real_pago: string | null;
  estado: string;
  proveedores?: {
    razon_social?: string | null;
  } | null;
  evento_proveedores?: {
    servicio?: string | null;
  } | null;
};

function moneda(value: number | string | null | undefined) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatearEstado(estado: string) {
  if (estado === "pendiente") return "Pendiente";
  if (estado === "pagado") return "Pagado";
  if (estado === "pagado_sin_comprobante") return "Pagado sin comprobante";
  if (estado === "vencido") return "Vencido";
  return estado.replaceAll("_", " ");
}

function estadoBadgeClass(estado: string) {
  if (estado === "pagado" || estado === "aprobado") {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (estado === "pendiente") {
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

export default function EventoPagosPage() {
  const params = useParams<{ id: string }>();
  const [evento, setEvento] = useState<Evento | null>(null);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [proveedorFiltro, setProveedorFiltro] = useState("");
  const [metodoFiltro, setMetodoFiltro] = useState("todos");
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
        const [eventoData, pagosData] = await Promise.all([
          apiFetch(`/eventos/${params.id}`),
          apiFetch("/pagos/"),
        ]);

        setEvento(eventoData);

        const listaPagos = Array.isArray(pagosData)
          ? pagosData.filter((pago: Pago) => pago.evento_id === params.id)
          : [];

        setPagos(listaPagos);
      } catch (fetchError) {
        console.error(fetchError);
        setError("No se pudo cargar los pagos del evento.");
      } finally {
        setCargando(false);
      }
    }

    void cargarDatos();
  }, [params.id]);

  const totalPagado = pagos.reduce((acc, pago) => {
    if (pago.estado !== "pagado" && pago.estado !== "pagado_sin_comprobante") {
      return acc;
    }
    return acc + Number(pago.monto || 0);
  }, 0);

  const pagosFiltrados = pagos.filter((pago) => {
    const textoProveedor = (pago.proveedores?.razon_social || "").toLowerCase();
    const coincideProveedor = !proveedorFiltro || textoProveedor.includes(proveedorFiltro.toLowerCase());
    const coincideMetodo = metodoFiltro === "todos" || pago.metodo_pago === metodoFiltro;
    const coincideEstado = estadoFiltro === "todos" || pago.estado === estadoFiltro;
    const coincideFecha = !fechaFiltro || (pago.fecha_real_pago || "") === fechaFiltro;

    return coincideProveedor && coincideMetodo && coincideEstado && coincideFecha;
  });

  return (
    <MainLayout>
      <main className="min-h-screen bg-[#F6F8FB] p-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href={`/eventos/${params.id}`} className="text-sm font-medium text-[#2F73D9]">
              &larr; Volver al evento
            </Link>
            <h1 className="mt-4 text-3xl font-bold text-[#102033]">Pagos del evento</h1>
            <p className="mt-1 text-sm text-slate-500">
              Historial completo de pagos del evento con filtros por proveedor, método, estado y fecha.
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
            Cargando pagos...
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-10 text-center text-red-700 shadow-sm">
            {error}
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-6 py-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#2F73D9]">Evento</p>
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
              <p className="text-xs font-semibold uppercase tracking-wide text-[#2F73D9]">Resumen</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Pagos registrados</p>
                  <p className="mt-2 text-2xl font-semibold text-[#102033]">{pagos.length}</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Total pagado</p>
                  <p className="mt-2 text-2xl font-semibold text-[#102033]">{moneda(totalPagado)}</p>
                </div>
              </div>
            </section>
          </div>
        )}

        <section className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-5">
            <h2 className="text-lg font-semibold text-[#102033]">Registros de pagos</h2>
          </div>

          <div className="grid gap-4 border-b border-slate-100 bg-slate-50 p-6 md:grid-cols-4">
            <input
              value={proveedorFiltro}
              onChange={(e) => setProveedorFiltro(e.target.value)}
              placeholder="Filtrar por proveedor"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-[#2F73D9]"
            />
            <select
              value={metodoFiltro}
              onChange={(e) => setMetodoFiltro(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-[#2F73D9]"
            >
              <option value="todos">Todos los métodos</option>
              <option value="transferencia">Transferencia</option>
              <option value="efectivo">Efectivo</option>
              <option value="yape">Yape</option>
            </select>
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

          {pagosFiltrados.length === 0 ? (
            <div className="p-10 text-center text-slate-500">
              No hay pagos registrados para este evento con los filtros aplicados.
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
                  {pagosFiltrados.map((pago) => (
                    <tr
                      key={pago.id}
                      className="border-t border-slate-200 transition duration-200 hover:bg-slate-50"
                    >
                      <td className="px-4 py-4 font-semibold text-[#102033]">
                        {pago.proveedores?.razon_social || "No registrado"}
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {pago.evento_proveedores?.servicio || "Servicio no registrado"}
                      </td>
                      <td className="px-4 py-4 text-slate-600">{pago.tipo_pago}</td>
                      <td className="px-4 py-4 text-right font-semibold text-[#102033]">
                        {moneda(pago.monto)}
                      </td>
                      <td className="px-4 py-4">
                        {pago.fecha_real_pago || "Sin fecha"}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${estadoBadgeClass(pago.estado)}`}>
                          {formatearEstado(pago.estado)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <Link
                          href={pago.evento_proveedor_id ? `/eventos/${params.id}/proveedores/${pago.evento_proveedor_id}` : `/eventos/${params.id}`}
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
