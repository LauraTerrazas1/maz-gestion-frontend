"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import MainLayout from "@/components/layout/MainLayout";
import { apiFetch } from "@/lib/api";

type Factura = {
    id: string;
    orden_compra_id: string;
    tipo_comprobante: string | null;
    serie: string | null;
    numero: string | null;
    fecha_emision: string | null;
    fecha_recepcion: string | null;
    subtotal: number | string | null;
    igv: number | string | null;
    total: number | string | null;
    moneda: string | null;
    estado: string | null;
    estado_conformidad: string | null;
    estado_detraccion: string | null;
    monto_detraccion: number | string | null;
    archivo_pdf_url: string | null;
    archivo_xml_url: string | null;
    monto_oc: number | string | null;
    diferencia_oc: number | string | null;
    monto_coincide: boolean | null;
    tipo_factura: string | null;
};

function formatearMonto(
    valor: number | string | null | undefined,
    moneda?: string | null
) {
    return new Intl.NumberFormat("es-PE", {
        style: "currency",
        currency: moneda === "USD" ? "USD" : "PEN",
        minimumFractionDigits: 2,
    }).format(Number(valor || 0));
}

function formatearFecha(fecha: string | null | undefined) {
    if (!fecha) return "Sin fecha";

    return new Intl.DateTimeFormat("es-PE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "UTC",
    }).format(new Date(`${fecha}T00:00:00`));
}

function textoConformidad(estado: string | null) {
    const opciones: Record<string, string> = {
        pendiente: "Pendiente",
        aprobada: "Aprobada",
        observada: "Observada",
        rechazada: "Rechazada",
    };

    return opciones[estado || ""] || "Pendiente";
}

function claseConformidad(estado: string | null) {
    if (estado === "aprobada") {
        return "border-emerald-200 bg-emerald-50 text-emerald-700";
    }

    if (estado === "observada") {
        return "border-amber-200 bg-amber-50 text-amber-700";
    }

    if (estado === "rechazada") {
        return "border-red-200 bg-red-50 text-red-700";
    }

    return "border-slate-200 bg-slate-50 text-slate-600";
}

function textoDetraccion(estado: string | null) {
    const opciones: Record<string, string> = {
        no_detectada: "No detectada",
        detectada: "Detectada",
        requiere_revision: "Requiere revisión",
    };

    return opciones[estado || ""] || "Pendiente";
}

export default function FacturasPage() {
    const [facturas, setFacturas] = useState<Factura[]>([]);
    const [facturasPendientes, setFacturasPendientes] = useState(0);

    const [buscar, setBuscar] = useState("");
    const [estadoFiltro, setEstadoFiltro] = useState("");
    const [documentoFiltro, setDocumentoFiltro] = useState("");

    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");

    async function cargarFacturas() {
        try {
            setCargando(true);
            setError("");

            const [data, pendientesData] = await Promise.all([
                apiFetch("/facturas/"),
                apiFetch("/ordenes-compra/disponibles-facturacion"),
            ]);

            setFacturas(Array.isArray(data) ? data : []);

            setFacturasPendientes(
                Array.isArray(pendientesData) ? pendientesData.length : 0
            );

            setFacturas(
                Array.isArray(data)
                    ? data
                    : Array.isArray(data?.facturas)
                        ? data.facturas
                        : []
            );
        } catch (error) {
            console.error("Error cargando facturas:", error);
            setError("No se pudieron cargar las facturas.");
        } finally {
            setCargando(false);
        }
    }

    useEffect(() => {
        cargarFacturas();
    }, []);

    const facturasFiltradas = useMemo(() => {
        const texto = buscar.trim().toLowerCase();

        return facturas.filter((factura) => {
            const comprobante = `${factura.serie || ""}-${factura.numero || ""
                }`.toLowerCase();

            const coincideBusqueda =
                !texto ||
                comprobante.includes(texto) ||
                factura.tipo_comprobante?.toLowerCase().includes(texto) ||
                factura.estado_conformidad?.toLowerCase().includes(texto) ||
                factura.estado_detraccion?.toLowerCase().includes(texto);

            const coincideEstado =
                !estadoFiltro ||
                factura.estado_conformidad === estadoFiltro;

            const coincideDocumento =
                !documentoFiltro ||
                (documentoFiltro === "pdf" &&
                    Boolean(factura.archivo_pdf_url)) ||
                (documentoFiltro === "xml" &&
                    Boolean(factura.archivo_xml_url)) ||
                (documentoFiltro === "ambos" &&
                    Boolean(factura.archivo_pdf_url) &&
                    Boolean(factura.archivo_xml_url)) ||
                (documentoFiltro === "incompletos" &&
                    (!factura.archivo_pdf_url ||
                        !factura.archivo_xml_url));

            return (
                coincideBusqueda &&
                coincideEstado &&
                coincideDocumento
            );
        });
    }, [
        facturas,
        buscar,
        estadoFiltro,
        documentoFiltro,
    ]);

    function limpiarFiltros() {
        setBuscar("");
        setEstadoFiltro("");
        setDocumentoFiltro("");
    }

    return (
        <MainLayout>
            <main className="min-h-screen bg-[#F6F8FB] p-8">
                <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-[#102033]">
                            Facturas
                        </h1>

                        <p className="mt-1 text-sm text-slate-500">
                            Gestiona los comprobantes asociados a las órdenes de
                            compra.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href="/facturas/nueva"
                            className="inline-flex items-center justify-center rounded-xl bg-[#2F73D9] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#245DB3]"
                        >
                            + Nueva factura
                        </Link>
                        <button
                            type="button"
                            onClick={cargarFacturas}
                            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-[#102033]"
                        >
                            Actualizar
                        </button>
                    </div>
                </div>
                <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                    <p className="text-sm font-medium text-amber-700">
                        Facturas pendientes de subir
                    </p>

                    <p className="mt-2 text-3xl font-bold text-amber-700">
                        {facturasPendientes}
                    </p>

                    <p className="mt-1 text-xs text-amber-700/70">
                        Órdenes de compra con facturación pendiente
                    </p>
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
                                onChange={(event) =>
                                    setBuscar(event.target.value)
                                }
                                placeholder="Serie, número o estado"
                                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-[#102033] outline-none transition focus:border-[#2F73D9] focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Conformidad
                            </label>

                            <select
                                value={estadoFiltro}
                                onChange={(event) =>
                                    setEstadoFiltro(event.target.value)
                                }
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#102033] outline-none transition focus:border-[#2F73D9] focus:ring-2 focus:ring-blue-100"
                            >
                                <option value="">Todos los estados</option>
                                <option value="pendiente">
                                    Pendiente
                                </option>
                                <option value="aprobada">
                                    Aprobada
                                </option>
                                <option value="observada">
                                    Observada
                                </option>
                                <option value="rechazada">
                                    Rechazada
                                </option>
                            </select>
                        </div>

                        <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Documentos
                            </label>

                            <select
                                value={documentoFiltro}
                                onChange={(event) =>
                                    setDocumentoFiltro(event.target.value)
                                }
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#102033] outline-none transition focus:border-[#2F73D9] focus:ring-2 focus:ring-blue-100"
                            >
                                <option value="">Todos</option>
                                <option value="pdf">Con PDF</option>
                                <option value="xml">Con XML</option>
                                <option value="ambos">PDF y XML</option>
                                <option value="incompletos">
                                    Documentos incompletos
                                </option>
                            </select>
                        </div>
                    </div>

                    <div className="mt-4 flex justify-end">
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
                                Listado de facturas
                            </h2>

                            <p className="mt-1 text-xs text-slate-500">
                                {facturasFiltradas.length} factura
                                {facturasFiltradas.length === 1 ? "" : "s"} encontrada
                                {facturasFiltradas.length === 1 ? "" : "s"}
                            </p>
                        </div>
                    </div>

                    {cargando ? (
                        <div className="p-10 text-center text-sm text-slate-500">
                            Cargando facturas...
                        </div>
                    ) : error ? (
                        <div className="p-10 text-center">
                            <p className="text-sm font-medium text-red-600">
                                {error}
                            </p>

                            <button
                                type="button"
                                onClick={cargarFacturas}
                                className="mt-4 rounded-lg bg-[#2F73D9] px-4 py-2 text-sm font-semibold text-white hover:bg-[#245DB3]"
                            >
                                Reintentar
                            </button>
                        </div>
                    ) : facturasFiltradas.length === 0 ? (
                        <div className="p-10 text-center">
                            <p className="font-medium text-[#102033]">
                                No se encontraron facturas
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                                Prueba cambiando los filtros o registra una factura
                                desde una orden de compra.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1050px] text-left text-sm">
                                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                    <tr>
                                        <th className="px-6 py-4">
                                            Comprobante
                                        </th>

                                        <th className="px-6 py-4">
                                            Fecha
                                        </th>

                                        <th className="px-6 py-4">
                                            Documentos
                                        </th>

                                        <th className="px-6 py-4">
                                            Conformidad
                                        </th>

                                        <th className="px-6 py-4">
                                            Detracción
                                        </th>

                                        <th className="px-6 py-4">
                                            Pago proveedor
                                        </th>

                                        <th className="px-6 py-4 text-right">
                                            Total
                                        </th>

                                        <th className="px-6 py-4 text-right">
                                            Acción
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {facturasFiltradas.map((factura) => {
                                        const comprobante =
                                            factura.serie && factura.numero
                                                ? `${factura.serie}-${factura.numero}`
                                                : "Pendiente de lectura";
                                        const total = Number(factura.total || 0);

                                        const detraccion = Number(
                                            factura.monto_detraccion || 0
                                        );

                                        const pagoProveedor =
                                            total - detraccion;
                                        return (
                                            <tr
                                                key={factura.id}
                                                className="border-t border-slate-100 transition hover:bg-slate-50/70"
                                            >
                                                <td className="px-6 py-4">
                                                    <p className="font-bold text-[#102033]">
                                                        {comprobante}
                                                    </p>

                                                    <p className="mt-1 text-xs text-slate-500">
                                                        {factura.tipo_comprobante ||
                                                            "Factura"}
                                                    </p>
                                                </td>

                                                <td className="px-6 py-4 text-slate-600">
                                                    {formatearFecha(
                                                        factura.fecha_emision
                                                    )}
                                                </td>

                                                <td className="px-6 py-4">
                                                    <div className="flex gap-2">
                                                        <span
                                                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${factura.archivo_pdf_url
                                                                ? "bg-red-50 text-red-600"
                                                                : "bg-slate-100 text-slate-400"
                                                                }`}
                                                        >
                                                            PDF
                                                        </span>

                                                        <span
                                                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${factura.archivo_xml_url
                                                                ? "bg-blue-50 text-blue-600"
                                                                : "bg-slate-100 text-slate-400"
                                                                }`}
                                                        >
                                                            XML
                                                        </span>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${claseConformidad(
                                                            factura.estado_conformidad
                                                        )}`}
                                                    >
                                                        {textoConformidad(
                                                            factura.estado_conformidad
                                                        )}
                                                    </span>
                                                </td>

                                                <td className="px-6 py-4 text-slate-600">
                                                    {textoDetraccion(
                                                        factura.estado_detraccion
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="font-semibold text-[#102033]">
                                                        {formatearMonto(
                                                            pagoProveedor,
                                                            factura.moneda
                                                        )}
                                                    </p>

                                                    {detraccion > 0 ? (
                                                        <p className="mt-1 text-xs text-slate-500">
                                                            Detracción:{" "}
                                                            {formatearMonto(
                                                                detraccion,
                                                                factura.moneda
                                                            )}
                                                        </p>
                                                    ) : (
                                                        <p className="mt-1 text-xs text-slate-500">
                                                            Sin detracción
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right font-bold text-[#102033]">
                                                    {formatearMonto(
                                                        factura.total,
                                                        factura.moneda
                                                    )}
                                                </td>

                                                <td className="px-6 py-4 text-right">
                                                    <Link
                                                        href={`/facturas/${factura.id}`}
                                                        className="font-semibold text-[#2F73D9] transition hover:text-[#245DB3]"
                                                    >
                                                        Ver detalle →
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </main>
        </MainLayout>
    );
}