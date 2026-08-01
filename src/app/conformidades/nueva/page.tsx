"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import { apiFetch } from "@/lib/api";
import Toast from "@/components/ui/Toast";
import {
    ArrowLeft,
    CheckCircle2,
    Search,
    FileText,
    ShoppingCart,
    CircleCheck,
    CircleAlert,
    Download,
} from "lucide-react";
type FacturaDisponible = {
    id: string;
    serie: string;
    numero: string;
    fecha_emision: string;
    subtotal: number;
    igv: number;
    total: number;
    moneda: string;
    estado: string;
    estado_conformidad?: string;

    archivo_pdf_url?: string | null;
    archivo_pdf_nombre?: string | null;
    archivo_xml_url?: string | null;
    archivo_xml_nombre?: string | null;

    tiene_detraccion?: boolean;
    estado_detraccion?: string | null;
    porcentaje_detraccion?: number | null;
    monto_detraccion?: number | null;

    archivo_pdf_url_firmada?: string | null;
    archivo_xml_url_firmada?: string | null;

    ordenes_compra: {
        id: string;
        numero_oc: string;
        subtotal: number;
        igv: number;
        total: number;
        moneda: string;
        estado: string;

        proveedores: {
            id?: string;
            razon_social: string;
            documento?: string;
            direccion?: string;
            contacto_nombre?: string;
            contacto_correo?: string;
        };

        eventos: {
            id?: string;
            nombre: string;
            cliente?: string;
            fecha_inicio?: string;
            fecha_fin?: string;
            ubicacion?: string;
        };
    };

    resumen_orden?: {
        monto_oc: number;
        cantidad_facturas_anteriores: number;
        total_facturado_anterior: number;
        saldo_anterior: number;
        factura_actual: number;
        total_facturado_acumulado: number;
        saldo_restante: number;
        porcentaje_facturado: number;
        supera_monto_oc: boolean;
        facturacion_completa: boolean;
    };

    validaciones?: {
        moneda_coincide: boolean;
        monto_dentro_del_saldo: boolean;
        total_acumulado_correcto: boolean;
        tiene_pdf: boolean;
        tiene_xml: boolean;
    };
};

export default function NuevaConformidadPage() {

    const [facturas, setFacturas] = useState<FacturaDisponible[]>([]);
    const [cargando, setCargando] = useState(true);

    const [buscar, setBuscar] = useState("");

    const [facturaSeleccionada, setFacturaSeleccionada] =
        useState<FacturaDisponible | null>(null);

    const [revisadoPor, setRevisadoPor] = useState("");

    const router = useRouter();
    const [guardando, setGuardando] = useState(false);

    const [estado, setEstado] = useState<
        "aprobada" | "observada"
    >("aprobada");

    const [toast, setToast] = useState<{
        tipo: "success" | "error";
        mensaje: string;
    } | null>(null);

    const [observaciones, setObservaciones] = useState("");
    const [errorRevisadoPor, setErrorRevisadoPor] = useState("");

    async function cargarFacturas() {
        try {

            setCargando(true);

            const data = await apiFetch(
                "/conformidades/disponibles-conformidad"
            );

            setFacturas(
                Array.isArray(data) ? data : []
            );

        } catch (error) {

            console.error(error);

        } finally {

            setCargando(false);

        }
    }
    async function seleccionarFactura(facturaId: string) {
        try {
            const detalle = await apiFetch(
                `/facturas/${facturaId}`
            );

            setFacturaSeleccionada(detalle);
        } catch (error) {
            console.error(
                "Error cargando detalle de factura:",
                error
            );

            alert(
                "No se pudo cargar el detalle de la factura."
            );
        }
    }

    useEffect(() => {
        cargarFacturas();
    }, []);

    const facturasFiltradas = useMemo(() => {

        return facturas.filter((item) => {

            const numeroFactura =
                `${item.serie}-${item.numero}`;

            return (

                buscar === "" ||

                numeroFactura
                    .toLowerCase()
                    .includes(buscar.toLowerCase()) ||

                item.ordenes_compra.numero_oc
                    .toLowerCase()
                    .includes(buscar.toLowerCase()) ||

                item.ordenes_compra.proveedores.razon_social
                    .toLowerCase()
                    .includes(buscar.toLowerCase()) ||

                item.ordenes_compra.eventos.nombre
                    .toLowerCase()
                    .includes(buscar.toLowerCase())

            );

        });

    }, [buscar, facturas]);

    function formatearMoneda(valor: number) {

        return new Intl.NumberFormat("es-PE", {
            style: "currency",
            currency: "PEN",
        }).format(valor);

    }

    async function guardarConformidad() {
        if (!facturaSeleccionada) {
            alert("Seleccione una factura.");
            return;
        }

        if (!revisadoPor.trim()) {
            setErrorRevisadoPor(
                "Debes ingresar el nombre de la persona que realizó la revisión."
            );
            return;
        }

        setErrorRevisadoPor("");


        if (estado === "observada" && !observaciones.trim()) {
            alert("Ingrese las observaciones de la factura.");
            return;
        }

        try {
            setGuardando(true);

            await apiFetch("/conformidades/", {
                method: "POST",
                body: JSON.stringify({
                    factura_id: facturaSeleccionada.id,
                    estado,
                    revisado_por: revisadoPor.trim(),
                    observaciones: observaciones.trim() || null,
                }),
            });

            setToast({
                tipo: "success",
                mensaje: "Conformidad registrada correctamente.",
            });

            setTimeout(() => {
                router.push("/conformidades");
            }, 1200);

            router.push("/conformidades");
            router.refresh();
        } catch (error) {
            console.error("Error registrando conformidad:", error);

            setToast({
                tipo: "error",
                mensaje: "No se pudo registrar la conformidad.",
            });
        } finally {
            setGuardando(false);
        }
    }

    return (

        <MainLayout>

            <main className="min-h-screen bg-[#F6F8FB] p-8">
                {toast && (
                    <Toast
                        tipo={toast.tipo}
                        mensaje={toast.mensaje}
                        onClose={() => setToast(null)}
                    />
                )}
                {/* Header */}

                <div className="mb-8 flex items-center justify-between">

                    <div>

                        <Link
                            href="/conformidades"
                            className="mb-3 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-[#102033]"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Volver
                        </Link>

                        <h1 className="text-3xl font-bold text-[#102033]">
                            Nueva conformidad
                        </h1>

                        <p className="mt-1 text-sm text-slate-500">
                            Selecciona una factura para registrar su conformidad.
                        </p>

                    </div>

                </div>

                {/* Facturas disponibles */}

                {!facturaSeleccionada && (

                    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

                        <div className="border-b border-slate-200 px-6 py-5">

                            <h2 className="text-lg font-semibold text-[#102033]">
                                Facturas disponibles
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Solo se muestran facturas pendientes de conformidad.
                            </p>

                        </div>

                        <div className="p-6">

                            <div className="relative mb-6">

                                <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />

                                <input
                                    value={buscar}
                                    onChange={(e) =>
                                        setBuscar(e.target.value)
                                    }
                                    placeholder="Buscar factura, proveedor, OC o evento..."
                                    className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm"
                                />

                            </div>

                            {cargando ? (

                                <div className="py-16 text-center text-slate-500">
                                    Cargando facturas...
                                </div>

                            ) : facturasFiltradas.length === 0 ? (

                                <div className="py-16 text-center text-slate-500">
                                    No existen facturas pendientes de conformidad.
                                </div>

                            ) : (

                                <div className="overflow-x-auto">

                                    <table className="w-full min-w-[1100px]">

                                        <thead className="bg-slate-50 text-xs uppercase text-slate-500">

                                            <tr>

                                                <th className="px-6 py-4 text-left">
                                                    Factura
                                                </th>

                                                <th className="px-6 py-4 text-left">
                                                    Orden Compra
                                                </th>

                                                <th className="px-6 py-4 text-left">
                                                    Proveedor
                                                </th>

                                                <th className="px-6 py-4 text-left">
                                                    Evento
                                                </th>

                                                <th className="px-6 py-4 text-left">
                                                    Fecha
                                                </th>

                                                <th className="px-6 py-4 text-right">
                                                    Total
                                                </th>

                                                <th className="px-6 py-4 text-center">
                                                    Acción
                                                </th>

                                            </tr>

                                        </thead>

                                        <tbody>

                                            {facturasFiltradas.map((item) => (

                                                <tr
                                                    key={item.id}
                                                    className="border-t hover:bg-slate-50"
                                                >

                                                    <td className="px-6 py-4 font-medium whitespace-nowrap">
                                                        {item.serie}-{item.numero}
                                                    </td>

                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {item.ordenes_compra.numero_oc}
                                                    </td>

                                                    <td className="px-6 py-4">
                                                        {item.ordenes_compra.proveedores.razon_social}
                                                    </td>

                                                    <td className="px-6 py-4">
                                                        {item.ordenes_compra.eventos.nombre}
                                                    </td>

                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {item.fecha_emision}
                                                    </td>

                                                    <td className="px-6 py-4 text-right font-semibold whitespace-nowrap">
                                                        {formatearMoneda(item.total)}
                                                    </td>

                                                    <td className="px-6 py-4 text-center">

                                                        <button
                                                            onClick={() =>
                                                                seleccionarFactura(item.id)
                                                            }
                                                            className="rounded-xl bg-[#2F73D9] px-4 py-2 text-sm font-semibold text-white hover:bg-[#245DB3]"
                                                        >
                                                            Seleccionar
                                                        </button>

                                                    </td>

                                                </tr>

                                            ))}

                                        </tbody>

                                    </table>

                                </div>

                            )}

                        </div>

                    </section>

                )}

                {/* Formulario */}
                {facturaSeleccionada && (

                    <section className="space-y-6">

                        {/* Comparación OC vs Factura */}

                        <div className="grid gap-6 lg:grid-cols-2">

                            {/* Orden de compra */}

                            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

                                <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-5">

                                    <div className="rounded-xl bg-blue-50 p-2 text-[#2F73D9]">
                                        <ShoppingCart className="h-5 w-5" />
                                    </div>

                                    <div>
                                        <p className="text-xs font-semibold uppercase text-slate-500">
                                            Documento de origen
                                        </p>

                                        <h2 className="text-lg font-semibold text-[#102033]">
                                            Orden de compra
                                        </h2>
                                    </div>

                                </div>

                                <div className="space-y-5 p-6">

                                    <div>
                                        <p className="text-xs font-semibold uppercase text-slate-500">
                                            Número de OC
                                        </p>

                                        <p className="mt-1 font-semibold text-[#102033]">
                                            {facturaSeleccionada.ordenes_compra.numero_oc}
                                        </p>
                                    </div>

                                    <div className="grid gap-5 sm:grid-cols-2">

                                        <div>
                                            <p className="text-xs font-semibold uppercase text-slate-500">
                                                Proveedor
                                            </p>

                                            <p className="mt-1 text-sm text-slate-700">
                                                {facturaSeleccionada.ordenes_compra.proveedores.razon_social}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs font-semibold uppercase text-slate-500">
                                                RUC / Documento
                                            </p>

                                            <p className="mt-1 text-sm text-slate-700">
                                                {facturaSeleccionada.ordenes_compra.proveedores.documento ||
                                                    "No registrado"}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs font-semibold uppercase text-slate-500">
                                                Evento
                                            </p>

                                            <p className="mt-1 text-sm text-slate-700">
                                                {facturaSeleccionada.ordenes_compra.eventos.nombre}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs font-semibold uppercase text-slate-500">
                                                Cliente
                                            </p>

                                            <p className="mt-1 text-sm text-slate-700">
                                                {facturaSeleccionada.ordenes_compra.eventos.cliente ||
                                                    "No registrado"}
                                            </p>
                                        </div>

                                    </div>

                                    <div className="grid grid-cols-3 gap-3 rounded-xl bg-slate-50 p-4">

                                        <div>
                                            <p className="text-xs text-slate-500">
                                                Subtotal
                                            </p>

                                            <p className="mt-1 text-sm font-semibold">
                                                {formatearMoneda(
                                                    facturaSeleccionada.ordenes_compra.subtotal
                                                )}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs text-slate-500">
                                                IGV
                                            </p>

                                            <p className="mt-1 text-sm font-semibold">
                                                {formatearMoneda(
                                                    facturaSeleccionada.ordenes_compra.igv
                                                )}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs text-slate-500">
                                                Total OC
                                            </p>

                                            <p className="mt-1 text-sm font-bold text-[#102033]">
                                                {formatearMoneda(
                                                    facturaSeleccionada.ordenes_compra.total
                                                )}
                                            </p>
                                        </div>

                                    </div>

                                </div>

                            </div>

                            {/* Factura */}

                            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

                                <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-5">

                                    <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600">
                                        <FileText className="h-5 w-5" />
                                    </div>

                                    <div>
                                        <p className="text-xs font-semibold uppercase text-slate-500">
                                            Documento recibido
                                        </p>

                                        <h2 className="text-lg font-semibold text-[#102033]">
                                            Factura
                                        </h2>
                                    </div>

                                </div>

                                <div className="space-y-5 p-6">

                                    <div className="flex items-start justify-between gap-4">

                                        <div>
                                            <p className="text-xs font-semibold uppercase text-slate-500">
                                                Comprobante
                                            </p>

                                            <p className="mt-1 font-semibold text-[#102033]">
                                                {facturaSeleccionada.serie}-
                                                {facturaSeleccionada.numero}
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => setFacturaSeleccionada(null)}
                                            className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                                        >
                                            Cambiar factura
                                        </button>

                                    </div>

                                    <div className="grid gap-5 sm:grid-cols-2">

                                        <div>
                                            <p className="text-xs font-semibold uppercase text-slate-500">
                                                Fecha de emisión
                                            </p>

                                            <p className="mt-1 text-sm text-slate-700">
                                                {facturaSeleccionada.fecha_emision || "No registrada"}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs font-semibold uppercase text-slate-500">
                                                Moneda
                                            </p>

                                            <p className="mt-1 text-sm text-slate-700">
                                                {facturaSeleccionada.moneda}
                                            </p>
                                        </div>

                                    </div>

                                    <div className="grid grid-cols-3 gap-3 rounded-xl bg-slate-50 p-4">

                                        <div>
                                            <p className="text-xs text-slate-500">
                                                Subtotal
                                            </p>

                                            <p className="mt-1 text-sm font-semibold">
                                                {formatearMoneda(facturaSeleccionada.subtotal)}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs text-slate-500">
                                                IGV
                                            </p>

                                            <p className="mt-1 text-sm font-semibold">
                                                {formatearMoneda(facturaSeleccionada.igv)}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs text-slate-500">
                                                Total
                                            </p>

                                            <p className="mt-1 text-sm font-bold text-[#102033]">
                                                {formatearMoneda(facturaSeleccionada.total)}
                                            </p>
                                        </div>

                                    </div>

                                    <div className="flex flex-wrap gap-3">

                                        {facturaSeleccionada.archivo_pdf_url_firmada ? (
                                            <a
                                                href={facturaSeleccionada.archivo_pdf_url_firmada}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                                            >
                                                <Download className="h-4 w-4" />
                                                Ver PDF
                                            </a>
                                        ) : (
                                            <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">
                                                <Download className="h-4 w-4" />
                                                PDF no cargado
                                            </div>
                                        )}

                                        {facturaSeleccionada.archivo_xml_url_firmada ? (
                                            <a
                                                href={facturaSeleccionada.archivo_xml_url_firmada}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                                            >
                                                <Download className="h-4 w-4" />
                                                Ver XML
                                            </a>
                                        ) : (
                                            <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">
                                                <Download className="h-4 w-4" />
                                                XML no cargado
                                            </div>
                                        )}

                                    </div>

                                </div>

                            </div>

                        </div>

                        {/* Validaciones automáticas */}

                        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

                            <div className="border-b border-slate-200 px-6 py-5">

                                <h2 className="text-lg font-semibold text-[#102033]">
                                    Validación automática
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Comparación entre la orden de compra y la factura.
                                </p>

                            </div>

                            <div className="grid gap-4 p-6 md:grid-cols-3">

                                {[
                                    {
                                        nombre: "Moneda coincidente",
                                        correcto:
                                            facturaSeleccionada.validaciones?.moneda_coincide ??
                                            false,
                                    },
                                    {
                                        nombre: "Monto dentro del saldo",
                                        correcto:
                                            facturaSeleccionada.validaciones
                                                ?.monto_dentro_del_saldo ?? false,
                                    },
                                    {
                                        nombre: "Total acumulado válido",
                                        correcto:
                                            facturaSeleccionada.validaciones
                                                ?.total_acumulado_correcto ?? false,
                                    },
                                ].map((validacion) => (

                                    <div
                                        key={validacion.nombre}
                                        className={`flex items-center gap-3 rounded-xl border p-4 ${validacion.correcto
                                            ? "border-emerald-200 bg-emerald-50"
                                            : "border-amber-200 bg-amber-50"
                                            }`}
                                    >

                                        {validacion.correcto ? (
                                            <CircleCheck className="h-5 w-5 text-emerald-600" />
                                        ) : (
                                            <CircleAlert className="h-5 w-5 text-amber-600" />
                                        )}

                                        <div>
                                            <p className="text-sm font-semibold text-slate-700">
                                                {validacion.nombre}
                                            </p>

                                            <p
                                                className={`text-xs ${validacion.correcto
                                                    ? "text-emerald-700"
                                                    : "text-amber-700"
                                                    }`}
                                            >
                                                {validacion.correcto
                                                    ? "Validación correcta"
                                                    : "Requiere revisión"}
                                            </p>
                                        </div>

                                    </div>

                                ))}

                            </div>

                        </div>

                        {/* Resumen financiero */}

                        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

                            <div className="border-b border-slate-200 px-6 py-5">

                                <h2 className="text-lg font-semibold text-[#102033]">
                                    Resumen de facturación
                                </h2>

                            </div>

                            <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-5">

                                <div className="rounded-xl bg-slate-50 p-4">
                                    <p className="text-xs text-slate-500">
                                        Total OC
                                    </p>

                                    <p className="mt-2 font-bold text-[#102033]">
                                        {formatearMoneda(
                                            facturaSeleccionada.resumen_orden?.monto_oc ?? 0
                                        )}
                                    </p>
                                </div>

                                <div className="rounded-xl bg-slate-50 p-4">
                                    <p className="text-xs text-slate-500">
                                        Facturado anteriormente
                                    </p>

                                    <p className="mt-2 font-bold text-[#102033]">
                                        {formatearMoneda(
                                            facturaSeleccionada.resumen_orden
                                                ?.total_facturado_anterior ?? 0
                                        )}
                                    </p>
                                </div>

                                <div className="rounded-xl bg-blue-50 p-4">
                                    <p className="text-xs text-blue-600">
                                        Factura actual
                                    </p>

                                    <p className="mt-2 font-bold text-blue-700">
                                        {formatearMoneda(facturaSeleccionada.total)}
                                    </p>
                                </div>

                                <div className="rounded-xl bg-slate-50 p-4">
                                    <p className="text-xs text-slate-500">
                                        Total facturado
                                    </p>

                                    <p className="mt-2 font-bold text-[#102033]">
                                        {formatearMoneda(
                                            facturaSeleccionada.resumen_orden
                                                ?.total_facturado_acumulado ?? 0
                                        )}
                                    </p>
                                </div>

                                <div
                                    className={`rounded-xl p-4 ${(facturaSeleccionada.resumen_orden?.saldo_restante ?? 0) < 0
                                        ? "bg-red-50"
                                        : "bg-emerald-50"
                                        }`}
                                >
                                    <p
                                        className={`text-xs ${(facturaSeleccionada.resumen_orden?.saldo_restante ?? 0) < 0
                                            ? "text-red-600"
                                            : "text-emerald-600"
                                            }`}
                                    >
                                        Saldo restante
                                    </p>

                                    <p
                                        className={`mt-2 font-bold ${(facturaSeleccionada.resumen_orden?.saldo_restante ?? 0) < 0
                                            ? "text-red-700"
                                            : "text-emerald-700"
                                            }`}
                                    >
                                        {formatearMoneda(
                                            facturaSeleccionada.resumen_orden?.saldo_restante ?? 0
                                        )}
                                    </p>
                                </div>

                            </div>

                        </div>

                        {/* Datos de la conformidad */}

                        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

                            <div className="border-b border-slate-200 px-6 py-5">

                                <h2 className="text-lg font-semibold text-[#102033]">
                                    Datos de la conformidad
                                </h2>

                            </div>

                            <div className="grid gap-6 p-6 md:grid-cols-2">

                                <div>
                                    <label className="mb-2 block text-sm font-medium">
                                        Revisado por *
                                    </label>

                                    <input
                                        value={revisadoPor}
                                        onChange={(e) => {
                                            setRevisadoPor(e.target.value);

                                            if (e.target.value.trim()) {
                                                setErrorRevisadoPor("");
                                            }
                                        }}
                                        className={`w-full rounded-xl border px-4 py-3 outline-none transition ${errorRevisadoPor
                                                ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                                                : "border-slate-200 focus:border-[#2F73D9] focus:ring-2 focus:ring-blue-100"
                                            }`}
                                        placeholder="Nombre del responsable"
                                    />

                                    {errorRevisadoPor && (
                                        <p className="mt-1.5 text-xs font-medium text-red-600">
                                            {errorRevisadoPor}
                                        </p>
                                    )}
                                </div>

                                <div>

                                    <label className="mb-2 block text-sm font-medium">
                                        Estado
                                    </label>

                                    <select
                                        value={estado}
                                        onChange={(e) =>
                                            setEstado(
                                                e.target.value as
                                                | "aprobada"
                                                | "observada"
                                            )
                                        }
                                        className="w-full rounded-xl border border-slate-200 px-4 py-3"
                                    >

                                        <option value="aprobada">
                                            Aprobada
                                        </option>

                                        <option value="observada">
                                            Observada
                                        </option>

                                    </select>

                                </div>

                                <div className="md:col-span-2">

                                    <label className="mb-2 block text-sm font-medium">
                                        Observaciones
                                    </label>

                                    <textarea
                                        rows={5}
                                        value={observaciones}
                                        onChange={(e) =>
                                            setObservaciones(e.target.value)
                                        }
                                        placeholder="Comentarios, observaciones o incidencias..."
                                        className="w-full rounded-xl border border-slate-200 px-4 py-3"
                                    />

                                </div>

                            </div>

                        </div>
                        {/* Acciones */}

                        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

                            <button
                                type="button"
                                onClick={() => {
                                    setFacturaSeleccionada(null);
                                    setRevisadoPor("");
                                    setEstado("aprobada");
                                    setObservaciones("");
                                    setErrorRevisadoPor("");
                                }}
                                disabled={guardando}
                                className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Cancelar
                            </button>

                            <button
                                type="button"
                                onClick={guardarConformidad}
                                disabled={guardando}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2F73D9] px-5 py-3 text-sm font-semibold text-white hover:bg-[#245DB3] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <CheckCircle2 className="h-4 w-4" />

                                {guardando
                                    ? "Guardando..."
                                    : "Guardar conformidad"}
                            </button>

                        </div>

                    </section>

                )}

            </main>

        </MainLayout>

    );
}