"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import { apiFetch } from "@/lib/api";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

type Evento = {
    id: string;
    nombre: string;
};

type Proveedor = {
    id: string;
    razon_social: string;
};

type OrdenDisponible = {
    id: string;
    evento_id: string;
    proveedor_id: string;

    numero_oc: string;
    evento: string;
    proveedor: string;

    moneda: string;

    total_oc: number;
    total_facturado: number;
    saldo_pendiente: number;
};

export default function NuevaFacturaPage() {
    const router = useRouter();

    const [ordenes, setOrdenes] = useState<OrdenDisponible[]>([]);
    const [eventos, setEventos] = useState<Evento[]>([]);
    const [proveedores, setProveedores] = useState<Proveedor[]>([]);

    const [buscar, setBuscar] = useState("");
    const [eventoFiltro, setEventoFiltro] = useState("");
    const [proveedorFiltro, setProveedorFiltro] = useState("");

    const [ordenSeleccionada, setOrdenSeleccionada] =
        useState<OrdenDisponible | null>(null);

    const [tipoComprobante, setTipoComprobante] =
        useState("factura");

    const [fechaRecepcion, setFechaRecepcion] =
        useState(new Date().toISOString().split("T")[0]);

    const [observaciones, setObservaciones] =
        useState("");

    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);

    const [archivoPdf, setArchivoPdf] = useState<File | null>(null);
    const [archivoXml, setArchivoXml] = useState<File | null>(null);
    const [facturaCreadaId, setFacturaCreadaId] =
        useState<string | null>(null);

    const [mostrarRevision, setMostrarRevision] =
        useState(false);

    const [datosFactura, setDatosFactura] = useState({
        serie: "",
        numero: "",
        fecha_emision: "",
        subtotal: "",
        igv: "",
        total: "",
        moneda: "PEN",

        tiene_detraccion: false,
        codigo_detraccion: "",
        porcentaje_detraccion: "",
        monto_detraccion: "",
        cuenta_detraccion_detectada: "",
    });
    const [subiendoArchivos, setSubiendoArchivos] = useState(false);

    const [error, setError] = useState("");

    async function cargarOrdenes() {
        try {
            setCargando(true);

            const data = await apiFetch(
                "/ordenes-compra/disponibles-facturacion"
            );

            setOrdenes(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
            setError(
                "No se pudieron cargar las órdenes disponibles."
            );
        } finally {
            setCargando(false);
        }
    }

    async function cargarFiltros() {
        try {
            const [eventosData, proveedoresData] =
                await Promise.all([
                    apiFetch("/eventos/"),
                    apiFetch("/proveedores/"),
                ]);

            setEventos(Array.isArray(eventosData) ? eventosData : []);

            setProveedores(
                Array.isArray(proveedoresData)
                    ? proveedoresData
                    : []
            );
        } catch (error) {
            console.error(error);
        }
    }

    useEffect(() => {
        cargarOrdenes();
        cargarFiltros();
    }, []);

    const ordenesFiltradas = useMemo(() => {
        return ordenes.filter((orden) => {
            const coincideBuscar =
                buscar === "" ||
                orden.numero_oc
                    .toLowerCase()
                    .includes(buscar.toLowerCase());

            const coincideEvento =
                !eventoFiltro ||
                orden.evento_id === eventoFiltro;

            const coincideProveedor =
                !proveedorFiltro ||
                orden.proveedor_id === proveedorFiltro;

            return (
                coincideBuscar &&
                coincideEvento &&
                coincideProveedor
            );
        });
    }, [
        ordenes,
        buscar,
        eventoFiltro,
        proveedorFiltro,
    ]);

    function limpiarFiltros() {
        setBuscar("");
        setEventoFiltro("");
        setProveedorFiltro("");
    }

    function formatearMonto(
        monto: number,
        moneda: string
    ) {
        return new Intl.NumberFormat("es-PE", {
            style: "currency",
            currency: moneda === "USD" ? "USD" : "PEN",
        }).format(monto);
    }

    async function crearFactura() {
        if (!ordenSeleccionada) return;

        if (!archivoPdf && !archivoXml) {
            alert(
                "Debes seleccionar al menos un archivo PDF o XML."
            );
            return;
        }

        try {
            setGuardando(true);
            setSubiendoArchivos(false);
            setError("");

            // 1. Crear registro inicial
            const factura = await apiFetch("/facturas/", {
                method: "POST",
                body: JSON.stringify({
                    orden_compra_id:
                        ordenSeleccionada.id,

                    tipo_comprobante:
                        tipoComprobante,

                    fecha_recepcion:
                        fechaRecepcion,

                    observaciones:
                        observaciones.trim() || null,
                }),
            });

            if (!factura?.id) {
                throw new Error(
                    "No se recibió el ID de la factura."
                );
            }

            setFacturaCreadaId(factura.id);
            setSubiendoArchivos(true);

            // 2. Subir PDF
            if (archivoPdf) {
                const formDataPdf =
                    new FormData();

                formDataPdf.append(
                    "archivo_pdf",
                    archivoPdf
                );

                await apiFetch(
                    `/facturas/${factura.id}/archivo-pdf`,
                    {
                        method: "POST",
                        body: formDataPdf,
                    }
                );
            }

            // 3. Subir XML
            if (archivoXml) {
                const formDataXml =
                    new FormData();

                formDataXml.append(
                    "archivo_xml",
                    archivoXml
                );

                await apiFetch(
                    `/facturas/${factura.id}/archivo-xml`,
                    {
                        method: "POST",
                        body: formDataXml,
                    }
                );
            }

            // 4. Volver a consultar la factura
            // ya con todos los datos detectados
            const facturaActualizada =
                await apiFetch(
                    `/facturas/${factura.id}`
                );

            // 5. Cargar datos detectados al formulario editable
            setDatosFactura({
                serie:
                    facturaActualizada?.serie ?? "",

                numero:
                    facturaActualizada?.numero ?? "",

                fecha_emision:
                    facturaActualizada?.fecha_emision ?? "",

                subtotal:
                    facturaActualizada?.subtotal != null
                        ? String(
                            facturaActualizada.subtotal
                        )
                        : "",

                igv:
                    facturaActualizada?.igv != null
                        ? String(
                            facturaActualizada.igv
                        )
                        : "",

                total:
                    facturaActualizada?.total != null
                        ? String(
                            facturaActualizada.total
                        )
                        : "",

                moneda:
                    facturaActualizada?.moneda ||
                    ordenSeleccionada.moneda ||
                    "PEN",

                tiene_detraccion:
                    Boolean(
                        facturaActualizada?.tiene_detraccion
                    ) ||
                    facturaActualizada?.estado_detraccion ===
                    "detectada",

                codigo_detraccion:
                    facturaActualizada?.codigo_detraccion ??
                    "",

                porcentaje_detraccion:
                    facturaActualizada?.porcentaje_detraccion !=
                        null
                        ? String(
                            facturaActualizada
                                .porcentaje_detraccion
                        )
                        : "",

                monto_detraccion:
                    facturaActualizada?.monto_detraccion !=
                        null
                        ? String(
                            facturaActualizada
                                .monto_detraccion
                        )
                        : "",

                cuenta_detraccion_detectada:
                    facturaActualizada
                        ?.cuenta_detraccion_detectada ??
                    "",
            });

            // YA NO mandamos al detalle todavía
            setMostrarRevision(true);

        } catch (error) {
            console.error(error);

            alert(
                error instanceof Error
                    ? error.message
                    : "No se pudo crear la factura."
            );
        } finally {
            setGuardando(false);
            setSubiendoArchivos(false);
        }
    }
    async function guardarRevisionFactura() {
        if (!facturaCreadaId) {
            return;
        }

        if (
            !datosFactura.serie.trim() ||
            !datosFactura.numero.trim() ||
            !datosFactura.fecha_emision ||
            !datosFactura.total
        ) {
            alert(
                "Completa como mínimo serie, número, fecha de emisión y total."
            );
            return;
        }

        const total = Number(
            datosFactura.total
        );

        const subtotal = Number(
            datosFactura.subtotal || 0
        );

        const igv = Number(
            datosFactura.igv || 0
        );

        if (
            Number.isNaN(total) ||
            total <= 0
        ) {
            alert(
                "Ingresa un total válido."
            );
            return;
        }

        try {
            setGuardando(true);

            await apiFetch(
                `/facturas/${facturaCreadaId}`,
                {
                    method: "PUT",

                    body: JSON.stringify({
                        serie:
                            datosFactura.serie.trim(),

                        numero:
                            datosFactura.numero.trim(),

                        fecha_emision:
                            datosFactura.fecha_emision,

                        fecha_recepcion:
                            fechaRecepcion,

                        subtotal,
                        igv,
                        total,

                        moneda:
                            datosFactura.moneda,

                        observaciones:
                            observaciones.trim() ||
                            null,

                        tiene_detraccion:
                            datosFactura.tiene_detraccion,

                        estado_detraccion:
                            datosFactura.tiene_detraccion
                                ? "detectada"
                                : "no_aplica",

                        codigo_detraccion:
                            datosFactura.tiene_detraccion
                                ? datosFactura
                                    .codigo_detraccion
                                    .trim() || null
                                : null,

                        porcentaje_detraccion:
                            datosFactura.tiene_detraccion &&
                                datosFactura
                                    .porcentaje_detraccion
                                ? Number(
                                    datosFactura
                                        .porcentaje_detraccion
                                )
                                : 0,

                        monto_detraccion:
                            datosFactura.tiene_detraccion &&
                                datosFactura
                                    .monto_detraccion
                                ? Number(
                                    datosFactura
                                        .monto_detraccion
                                )
                                : 0,

                        cuenta_detraccion_detectada:
                            datosFactura.tiene_detraccion
                                ? datosFactura
                                    .cuenta_detraccion_detectada
                                    .trim() || null
                                : null,
                    }),
                }
            );

            router.push(
                `/facturas/${facturaCreadaId}`
            );

        } catch (error) {
            console.error(
                "Error guardando revisión:",
                error
            );

            alert(
                error instanceof Error
                    ? error.message
                    : "No se pudo guardar la revisión."
            );
        } finally {
            setGuardando(false);
        }
    }
    function verArchivo(archivo: File | null) {
        if (!archivo) return;

        const url = URL.createObjectURL(archivo);
        window.open(url, "_blank", "noopener,noreferrer");

        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 60000);
    }


    return (
        <MainLayout>
            <main className="min-h-screen bg-[#F6F8FB] p-8">
                <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="mb-3 text-sm font-semibold text-slate-500 hover:text-[#2F73D9]"
                        >
                            ← Volver a facturas
                        </button>

                        <h1 className="text-3xl font-bold text-[#102033]">
                            Nueva Factura
                        </h1>

                        <p className="mt-1 text-sm text-slate-500">
                            Selecciona una orden de compra pendiente de facturación.
                        </p>
                    </div>
                </div>

                <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

                        <div className="xl:col-span-2">
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Buscar
                            </label>

                            <input
                                value={buscar}
                                onChange={(e) => setBuscar(e.target.value)}
                                placeholder="Número de OC"
                                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Evento
                            </label>

                            <select
                                value={eventoFiltro}
                                onChange={(e) => setEventoFiltro(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                            >
                                <option value="">Todos</option>

                                {eventos.map((evento) => (
                                    <option
                                        key={evento.id}
                                        value={evento.id}
                                    >
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
                                onChange={(e) =>
                                    setProveedorFiltro(e.target.value)
                                }
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                            >
                                <option value="">Todos</option>

                                {proveedores.map((proveedor) => (
                                    <option
                                        key={proveedor.id}
                                        value={proveedor.id}
                                    >
                                        {proveedor.razon_social}
                                    </option>
                                ))}
                            </select>
                        </div>

                    </div>

                    <div className="mt-4">
                        <button
                            onClick={limpiarFiltros}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold"
                        >
                            Limpiar filtros
                        </button>
                    </div>

                </section>

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                    <div className="border-b border-slate-200 px-6 py-4">

                        <h2 className="font-semibold text-[#102033]">
                            Órdenes disponibles
                        </h2>

                        <p className="mt-1 text-xs text-slate-500">
                            {ordenesFiltradas.length} órdenes disponibles
                        </p>

                    </div>

                    {cargando ? (

                        <div className="p-10 text-center">
                            Cargando...
                        </div>

                    ) : ordenesFiltradas.length === 0 ? (

                        <div className="py-16 text-center">

                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
                                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                            </div>

                            <h3 className="mt-5 text-lg font-semibold text-[#102033]">
                                Todas las órdenes ya fueron facturadas
                            </h3>

                            <p className="mt-2 text-sm text-slate-500">
                                No existen órdenes de compra con saldo pendiente por facturar.
                            </p>

                            <Link
                                href="/facturas"
                                className="mt-6 inline-flex rounded-xl bg-[#2F73D9] px-5 py-3 text-sm font-semibold text-white hover:bg-[#245DB3]"
                            >
                                Ver facturas
                            </Link>

                        </div>

                    ) : (

                        <div className="overflow-x-auto">

                            <table className="w-full min-w-[1000px]">

                                <thead className="bg-slate-50 text-xs uppercase text-slate-500">

                                    <tr>
                                        <th className="px-6 py-4 text-left">
                                            OC
                                        </th>

                                        <th className="px-6 py-4 text-left">
                                            Evento
                                        </th>

                                        <th className="px-6 py-4 text-left">
                                            Proveedor
                                        </th>

                                        <th className="px-6 py-4 text-right">
                                            Saldo pendiente
                                        </th>

                                        <th className="px-6 py-4 text-right">
                                            Acción
                                        </th>

                                    </tr>

                                </thead>

                                <tbody>

                                    {ordenesFiltradas.map((orden) => (

                                        <tr
                                            key={orden.id}
                                            className="border-t hover:bg-slate-50"
                                        >

                                            <td className="px-6 py-4 font-semibold">
                                                {orden.numero_oc}
                                            </td>

                                            <td className="px-6 py-4">
                                                {orden.evento}
                                            </td>

                                            <td className="px-6 py-4">
                                                {orden.proveedor}
                                            </td>

                                            <td className="px-6 py-4 text-right font-bold">
                                                {formatearMonto(
                                                    orden.saldo_pendiente,
                                                    orden.moneda
                                                )}
                                            </td>

                                            <td className="px-6 py-4 text-right">

                                                <button
                                                    onClick={() =>
                                                        setOrdenSeleccionada(orden)
                                                    }
                                                    className="rounded-lg bg-[#2F73D9] px-4 py-2 text-white hover:bg-[#245DB3]"
                                                >
                                                    Seleccionar
                                                </button>

                                            </td>

                                        </tr>

                                    ))}

                                </tbody>

                            </table>

                        </div>

                    )
                    }

                </section>
                {ordenSeleccionada && (
                    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-6 border-b border-slate-200 pb-4">
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2F73D9]">
                                Factura
                            </p>

                            <h2 className="mt-2 text-xl font-bold text-[#102033]">
                                Crear factura
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                La factura quedará vinculada a la orden seleccionada.
                            </p>
                        </div>

                        <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-5">
                            <h3 className="text-sm font-bold text-[#102033]">
                                Orden seleccionada
                            </h3>

                            <div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-4">

                                <div>
                                    <p className="text-xs uppercase text-slate-500">
                                        N° OC
                                    </p>

                                    <p className="mt-1 font-semibold">
                                        {ordenSeleccionada.numero_oc}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs uppercase text-slate-500">
                                        Evento
                                    </p>

                                    <p className="mt-1 font-semibold">
                                        {ordenSeleccionada.evento}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs uppercase text-slate-500">
                                        Proveedor
                                    </p>

                                    <p className="mt-1 font-semibold">
                                        {ordenSeleccionada.proveedor}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs uppercase text-slate-500">
                                        Saldo pendiente
                                    </p>

                                    <p className="mt-1 font-bold text-[#2F73D9]">
                                        {formatearMonto(
                                            ordenSeleccionada.saldo_pendiente,
                                            ordenSeleccionada.moneda
                                        )}
                                    </p>
                                </div>

                            </div>
                        </div>

                        <div className="grid gap-5 md:grid-cols-2">

                            <div>
                                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Tipo de comprobante
                                </label>

                                <select
                                    value={tipoComprobante}
                                    onChange={(e) =>
                                        setTipoComprobante(e.target.value)
                                    }
                                    className="w-full rounded-xl border border-slate-200 px-4 py-3"
                                >
                                    <option value="factura">Factura</option>
                                    <option value="boleta">Boleta</option>
                                    <option value="recibo">Recibo</option>
                                </select>
                            </div>

                            <div>
                                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Fecha de recepción
                                </label>

                                <input
                                    type="date"
                                    value={fechaRecepcion}
                                    onChange={(e) =>
                                        setFechaRecepcion(e.target.value)
                                    }
                                    className="w-full rounded-xl border border-slate-200 px-4 py-3"
                                />
                            </div>
                            <div className="mt-6">
                                <div className="mb-4">
                                    <h3 className="text-base font-bold text-[#102033]">
                                        Documentos de la factura
                                    </h3>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Adjunta el PDF, el XML o ambos, según los documentos recibidos
                                        del proveedor.
                                    </p>
                                </div>

                                <div className="grid gap-5 md:grid-cols-2">
                                    {/* PDF */}
                                    <label
                                        className={`
                group cursor-pointer rounded-2xl border-2 border-dashed p-5
                transition
                ${archivoPdf
                                                ? "border-green-300 bg-green-50"
                                                : "border-slate-300 bg-slate-50 hover:border-[#2F73D9] hover:bg-blue-50"
                                            }
            `}
                                    >
                                        <input
                                            type="file"
                                            accept=".pdf,application/pdf"
                                            className="hidden"
                                            onChange={(e) =>
                                                setArchivoPdf(e.target.files?.[0] || null)
                                            }
                                        />

                                        <div className="flex items-start gap-4">
                                            <div
                                                className={`
                        flex h-11 w-11 shrink-0 items-center justify-center
                        rounded-xl text-sm font-bold
                        ${archivoPdf
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-red-100 text-red-600"
                                                    }
                    `}
                                            >
                                                PDF
                                            </div>

                                            <div className="min-w-0">
                                                <p className="font-semibold text-[#102033]">
                                                    Factura en PDF
                                                </p>

                                                {archivoPdf ? (
                                                    <>
                                                        <div className="flex items-start gap-2">
                                                            <div className="min-w-0 flex-1">
                                                                <p className="mt-1 truncate text-sm font-medium text-green-700">
                                                                    {archivoPdf.name}
                                                                </p>

                                                                <p className="mt-1 text-xs text-slate-500">
                                                                    {archivoPdf.size < 1024 * 1024
                                                                        ? `${(archivoPdf.size / 1024).toFixed(2)} KB`
                                                                        : `${(
                                                                            archivoPdf.size /
                                                                            1024 /
                                                                            1024
                                                                        ).toFixed(2)} MB`}
                                                                </p>
                                                            </div>

                                                            <button
                                                                type="button"
                                                                title="Quitar archivo PDF"
                                                                onClick={(event) => {
                                                                    event.preventDefault();
                                                                    event.stopPropagation();
                                                                    setArchivoPdf(null);
                                                                }}
                                                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm transition hover:bg-red-50 hover:text-red-600"
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <p className="mt-1 text-sm text-slate-500">
                                                        Haz clic para seleccionar el PDF.
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </label>

                                    {/* XML */}
                                    <label
                                        className={`
                group cursor-pointer rounded-2xl border-2 border-dashed p-5
                transition
                ${archivoXml
                                                ? "border-green-300 bg-green-50"
                                                : "border-slate-300 bg-slate-50 hover:border-[#2F73D9] hover:bg-blue-50"
                                            }
            `}
                                    >
                                        <input
                                            type="file"
                                            accept=".xml,text/xml,application/xml"
                                            className="hidden"
                                            onChange={(e) =>
                                                setArchivoXml(e.target.files?.[0] || null)
                                            }
                                        />

                                        <div className="flex items-start gap-4">
                                            <div
                                                className={`
                        flex h-11 w-11 shrink-0 items-center justify-center
                        rounded-xl text-sm font-bold
                        ${archivoXml
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-blue-100 text-blue-700"
                                                    }
                    `}
                                            >
                                                XML
                                            </div>

                                            <div className="min-w-0">
                                                <p className="font-semibold text-[#102033]">
                                                    Comprobante XML
                                                </p>

                                                {archivoXml ? (
                                                    <>
                                                        <div className="flex items-start gap-2">
                                                            <div className="min-w-0 flex-1">
                                                                <p className="mt-1 truncate text-sm font-medium text-green-700">
                                                                    {archivoXml.name}
                                                                </p>

                                                                <p className="mt-1 text-xs text-slate-500">
                                                                    {archivoXml.size < 1024 * 1024
                                                                        ? `${(archivoXml.size / 1024).toFixed(2)} KB`
                                                                        : `${(
                                                                            archivoXml.size /
                                                                            1024 /
                                                                            1024
                                                                        ).toFixed(2)} MB`}
                                                                </p>
                                                            </div>

                                                            <button
                                                                type="button"
                                                                title="Quitar archivo XML"
                                                                onClick={(event) => {
                                                                    event.preventDefault();
                                                                    event.stopPropagation();
                                                                    setArchivoXml(null);
                                                                }}
                                                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm transition hover:bg-red-50 hover:text-red-600"
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <p className="mt-1 text-sm text-slate-500">
                                                        Haz clic para seleccionar el XML UBL 2.1.
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </label>
                                </div>
                            </div>

                        </div>

                        <div className="mt-5">
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Observaciones
                            </label>

                            <textarea
                                rows={4}
                                value={observaciones}
                                onChange={(e) =>
                                    setObservaciones(e.target.value)
                                }
                                placeholder="Observaciones de la factura..."
                                className="w-full rounded-xl border border-slate-200 px-4 py-3"
                            />
                        </div>

                        <div className="mt-8 flex justify-end gap-3">

                            <button
                                type="button"
                                onClick={() =>
                                    setOrdenSeleccionada(null)
                                }
                                className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-[#102033]"
                            >
                                Cancelar
                            </button>

                            {!mostrarRevision && (
                                <button
                                    type="button"
                                    disabled={
                                        guardando ||
                                        (!archivoPdf && !archivoXml)
                                    }
                                    onClick={crearFactura}
                                    className="
                                        rounded-xl bg-[#2F73D9] px-6 py-3
                                        text-sm font-semibold text-white
                                        transition hover:bg-[#245DB3]
                                        disabled:cursor-not-allowed
                                        disabled:opacity-50
                                    "
                                >
                                    {guardando
                                        ? subiendoArchivos
                                            ? "Analizando documento..."
                                            : "Creando factura..."
                                        : "Analizar factura"}
                                </button>
                            )}
                            {!mostrarRevision && !archivoPdf && !archivoXml && (
                                <p className="mt-2 text-right text-xs text-slate-500">
                                    Adjunta al menos el PDF o el XML de la factura.
                                </p>
                            )}

                        </div>
                        {mostrarRevision && (
                            <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-6">
                                <div className="mb-6">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">
                                        Revisión manual
                                    </p>

                                    <h3 className="mt-2 text-xl font-bold text-[#102033]">
                                        Datos detectados de la factura
                                    </h3>

                                    <p className="mt-1 text-sm text-slate-600">
                                        Revisa los datos extraídos del documento. Si algún campo no fue detectado o es incorrecto, puedes completarlo manualmente antes de continuar.
                                    </p>
                                    <div className="mt-4 flex flex-wrap items-center gap-2">
                                        <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Documentos:
                                        </span>

                                        {archivoPdf && (
                                            <button
                                                type="button"
                                                onClick={() => verArchivo(archivoPdf)}
                                                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-[#2F73D9] transition hover:bg-slate-50"
                                            >
                                                Ver PDF
                                            </button>
                                        )}

                                        {archivoXml && (
                                            <button
                                                type="button"
                                                onClick={() => verArchivo(archivoXml)}
                                                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-[#2F73D9] transition hover:bg-slate-50"
                                            >
                                                Ver XML
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="grid gap-4 md:grid-cols-4">
                                    <div>
                                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Serie *
                                        </label>

                                        <input
                                            value={datosFactura.serie}
                                            onChange={(e) =>
                                                setDatosFactura((prev) => ({
                                                    ...prev,
                                                    serie: e.target.value,
                                                }))
                                            }
                                            placeholder="Ej. F001"
                                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Número *
                                        </label>

                                        <input
                                            value={datosFactura.numero}
                                            onChange={(e) =>
                                                setDatosFactura((prev) => ({
                                                    ...prev,
                                                    numero: e.target.value,
                                                }))
                                            }
                                            placeholder="Ej. 00000125"
                                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Fecha de emisión *
                                        </label>

                                        <input
                                            type="date"
                                            value={datosFactura.fecha_emision}
                                            onChange={(e) =>
                                                setDatosFactura((prev) => ({
                                                    ...prev,
                                                    fecha_emision: e.target.value,
                                                }))
                                            }
                                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Moneda
                                        </label>

                                        <select
                                            value={datosFactura.moneda}
                                            onChange={(e) =>
                                                setDatosFactura((prev) => ({
                                                    ...prev,
                                                    moneda: e.target.value,
                                                }))
                                            }
                                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                        >
                                            <option value="PEN">Soles (PEN)</option>
                                            <option value="USD">Dólares (USD)</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Subtotal
                                        </label>

                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={datosFactura.subtotal}
                                            onChange={(e) =>
                                                setDatosFactura((prev) => ({
                                                    ...prev,
                                                    subtotal: e.target.value,
                                                }))
                                            }
                                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            IGV
                                        </label>

                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={datosFactura.igv}
                                            onChange={(e) =>
                                                setDatosFactura((prev) => ({
                                                    ...prev,
                                                    igv: e.target.value,
                                                }))
                                            }
                                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Total *
                                        </label>

                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={datosFactura.total}
                                            onChange={(e) =>
                                                setDatosFactura((prev) => ({
                                                    ...prev,
                                                    total: e.target.value,
                                                }))
                                            }
                                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold"
                                        />
                                    </div>
                                </div>

                                <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
                                    <label className="flex cursor-pointer items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={datosFactura.tiene_detraccion}
                                            onChange={(e) =>
                                                setDatosFactura((prev) => ({
                                                    ...prev,
                                                    tiene_detraccion: e.target.checked,
                                                }))
                                            }
                                            className="h-4 w-4"
                                        />

                                        <div>
                                            <p className="font-semibold text-[#102033]">
                                                La factura tiene detracción
                                            </p>

                                            <p className="text-xs text-slate-500">
                                                Activa esta opción si corresponde aplicar detracción.
                                            </p>
                                        </div>
                                    </label>

                                    {datosFactura.tiene_detraccion && (
                                        <div className="mt-4 grid gap-4 md:grid-cols-4">
                                            <div>
                                                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                    Código de detracción
                                                </label>

                                                <input
                                                    value={datosFactura.codigo_detraccion}
                                                    onChange={(e) =>
                                                        setDatosFactura((prev) => ({
                                                            ...prev,
                                                            codigo_detraccion: e.target.value,
                                                        }))
                                                    }
                                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                                />
                                            </div>

                                            <div>
                                                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                    Porcentaje de detracción
                                                </label>

                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={datosFactura.porcentaje_detraccion}
                                                    onChange={(e) =>
                                                        setDatosFactura((prev) => ({
                                                            ...prev,
                                                            porcentaje_detraccion: e.target.value,
                                                        }))
                                                    }
                                                    placeholder="Ej. 12"
                                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                                />
                                            </div>

                                            <div>
                                                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                    Monto de detracción
                                                </label>

                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={datosFactura.monto_detraccion}
                                                    onChange={(e) =>
                                                        setDatosFactura((prev) => ({
                                                            ...prev,
                                                            monto_detraccion: e.target.value,
                                                        }))
                                                    }
                                                    placeholder="Ej. 1000"
                                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                                />
                                            </div>

                                            <div>
                                                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                    Cuenta Banco de la Nación
                                                </label>

                                                <input
                                                    value={datosFactura.cuenta_detraccion_detectada}
                                                    onChange={(e) =>
                                                        setDatosFactura((prev) => ({
                                                            ...prev,
                                                            cuenta_detraccion_detectada: e.target.value,
                                                        }))
                                                    }
                                                    placeholder="Ej. 123456789"
                                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-6 flex justify-end">
                                    <button
                                        type="button"
                                        onClick={guardarRevisionFactura}
                                        disabled={guardando}
                                        className="rounded-lg bg-[#2F73D9] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#245DB3] disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {guardando
                                            ? "Guardando..."
                                            : "Guardar y continuar"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </section>
                )}
            </main>
        </MainLayout>
    );
}