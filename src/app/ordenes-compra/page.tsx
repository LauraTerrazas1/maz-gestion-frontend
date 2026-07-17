"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import MainLayout from "@/components/layout/MainLayout";
import EstadoOrdenBadge from "@/components/ordenes-compra/EstadoOrdenBadge";
import { apiFetch } from "@/lib/api";

type Evento = {
  id: string;
  nombre: string;
};

type Proveedor = {
  id: string;
  razon_social: string;
};

type OrdenCompra = {
  id: string;
  numero_oc: string;
  fecha_emision: string;
  total: number | string;
  moneda: string;
  estado: string;

  eventos?: {
    nombre?: string | null;
  } | null;

  proveedores?: {
    razon_social?: string | null;
  } | null;

  evento_proveedores?: {
    servicio?: string | null;
  } | null;
};

function formatearMonto(valor: number | string, moneda: string) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: moneda === "USD" ? "USD" : "PEN",
    minimumFractionDigits: 2,
  }).format(Number(valor || 0));
}

function formatearFecha(fecha: string) {
  if (!fecha) return "Sin fecha";

  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${fecha}T00:00:00`));
}

export default function OrdenesCompraPage() {
  const [ordenes, setOrdenes] = useState<OrdenCompra[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);

  const [buscar, setBuscar] = useState("");
  const [eventoFiltro, setEventoFiltro] = useState("");
  const [proveedorFiltro, setProveedorFiltro] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("");

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  async function cargarOrdenes() {
    try {
      setCargando(true);
      setError("");

      const params = new URLSearchParams();

      if (buscar.trim()) {
        params.set("buscar", buscar.trim());
      }

      if (eventoFiltro) {
        params.set("evento_id", eventoFiltro);
      }

      if (proveedorFiltro) {
        params.set("proveedor_id", proveedorFiltro);
      }

      if (estadoFiltro) {
        params.set("estado", estadoFiltro);
      }

      const query = params.toString();
      const ruta = query
        ? `/ordenes-compra/?${query}`
        : "/ordenes-compra/";

      const data = await apiFetch(ruta);
      setOrdenes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando órdenes de compra:", error);
      setError("No se pudieron cargar las órdenes de compra.");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    async function cargarFiltros() {
      try {
        const [eventosData, proveedoresData] = await Promise.all([
          apiFetch("/eventos/"),
          apiFetch("/proveedores/"),
        ]);

        setEventos(Array.isArray(eventosData) ? eventosData : []);
        setProveedores(
          Array.isArray(proveedoresData) ? proveedoresData : []
        );
      } catch (error) {
        console.error("Error cargando filtros de órdenes:", error);
      }
    }

    cargarFiltros();
  }, []);

  useEffect(() => {
    const temporizador = setTimeout(() => {
      cargarOrdenes();
    }, 350);

    return () => clearTimeout(temporizador);
  }, [buscar, eventoFiltro, proveedorFiltro, estadoFiltro]);

  function limpiarFiltros() {
    setBuscar("");
    setEventoFiltro("");
    setProveedorFiltro("");
    setEstadoFiltro("");
  }

  return (
    <MainLayout>
      <main className="min-h-screen bg-[#F6F8FB] p-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#102033]">
              Órdenes de Compra
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Gestiona las órdenes de compra y servicio de todos los eventos.
            </p>
          </div>

          <Link
            href="/ordenes-compra/nueva"
            className="inline-flex items-center justify-center rounded-xl bg-[#2F73D9] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#245DB3]"
          >
            + Nueva orden
          </Link>
        </div>

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="xl:col-span-2">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Buscar
              </label>

              <input
                type="text"
                value={buscar}
                onChange={(event) => setBuscar(event.target.value)}
                placeholder="N.º OC, descripción o participación"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-[#102033] outline-none transition focus:border-[#2F73D9] focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Evento
              </label>

              <select
                value={eventoFiltro}
                onChange={(event) => setEventoFiltro(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#102033] outline-none transition focus:border-[#2F73D9] focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Todos los eventos</option>

                {eventos.map((evento) => (
                  <option key={evento.id} value={evento.id}>
                    {evento.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Proveedor
              </label>

              <select
                value={proveedorFiltro}
                onChange={(event) => setProveedorFiltro(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#102033] outline-none transition focus:border-[#2F73D9] focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Todos los proveedores</option>

                {proveedores.map((proveedor) => (
                  <option key={proveedor.id} value={proveedor.id}>
                    {proveedor.razon_social}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="w-full sm:max-w-xs">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Estado
              </label>

              <select
                value={estadoFiltro}
                onChange={(event) => setEstadoFiltro(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#102033] outline-none transition focus:border-[#2F73D9] focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Todos los estados</option>
                <option value="borrador">Borrador</option>
                <option value="pendiente_aprobacion">
                  Pendiente de aprobación
                </option>
                <option value="pendiente_factura">
                  Pendiente de factura
                </option>
                <option value="factura_recibida">
                  Factura recibida
                </option>
                <option value="en_conformidad">En conformidad</option>
                <option value="aprobada">Aprobada</option>
                <option value="pagos_programados">
                  Pagos programados
                </option>
                <option value="finalizada">Finalizada</option>
                <option value="anulada">Anulada</option>
              </select>
            </div>

            <button
              type="button"
              onClick={limpiarFiltros}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-[#102033]"
            >
              Limpiar filtros
            </button>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <div>
              <h2 className="font-semibold text-[#102033]">
                Listado de órdenes
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                {ordenes.length} orden{ordenes.length === 1 ? "" : "es"} encontrada
                {ordenes.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          {cargando ? (
            <div className="p-10 text-center text-sm text-slate-500">
              Cargando órdenes de compra...
            </div>
          ) : error ? (
            <div className="p-10 text-center">
              <p className="text-sm font-medium text-red-600">{error}</p>

              <button
                type="button"
                onClick={cargarOrdenes}
                className="mt-4 rounded-lg bg-[#2F73D9] px-4 py-2 text-sm font-semibold text-white hover:bg-[#245DB3]"
              >
                Reintentar
              </button>
            </div>
          ) : ordenes.length === 0 ? (
            <div className="p-10 text-center">
              <p className="font-medium text-[#102033]">
                No se encontraron órdenes de compra
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Prueba cambiando los filtros o registra una nueva orden.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-4">N.º OC</th>
                    <th className="px-6 py-4">Evento</th>
                    <th className="px-6 py-4">Proveedor</th>
                    <th className="px-6 py-4">Servicio</th>
                    <th className="px-6 py-4">Fecha</th>
                    <th className="px-6 py-4 text-right">Total</th>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4 text-right">Acción</th>
                  </tr>
                </thead>

                <tbody>
                  {ordenes.map((orden) => (
                    <tr
                      key={orden.id}
                      className="border-t border-slate-100 transition hover:bg-slate-50/70"
                    >
                      <td className="px-6 py-4">
                        <p className="font-bold text-[#102033]">
                          {orden.numero_oc}
                        </p>
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {orden.eventos?.nombre || "Sin evento"}
                      </td>

                      <td className="px-6 py-4">
                        <p className="font-semibold text-[#102033]">
                          {orden.proveedores?.razon_social || "Sin proveedor"}
                        </p>
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {orden.evento_proveedores?.servicio || "Sin servicio"}
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {formatearFecha(orden.fecha_emision)}
                      </td>

                      <td className="px-6 py-4 text-right font-bold text-[#102033]">
                        {formatearMonto(orden.total, orden.moneda)}
                      </td>

                      <td className="px-6 py-4">
                        <EstadoOrdenBadge estado={orden.estado} />
                      </td>

                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/ordenes-compra/${orden.id}`}
                          className="font-semibold text-[#2F73D9] transition hover:text-[#245DB3]"
                        >
                          Ver detalle →
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