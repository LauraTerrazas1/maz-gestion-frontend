"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    CheckCircle2,
    CircleAlert,
    Download,
    FileText,
    Loader2,
    Save,
    ShoppingCart,
} from "lucide-react";

import MainLayout from "@/components/layout/MainLayout";
import Toast from "@/components/ui/Toast";
import { apiFetch } from "@/lib/api";

type ToastState = {
    tipo: "success" | "error" | "info";
    mensaje: string;
};

type Proveedor = {
    id: string;
    razon_social: string;
    documento: string;
    direccion?: string | null;
    contacto_nombre?: string | null;
    contacto_correo?: string | null;
};

type Evento = {
    id: string;
    nombre: string;
    cliente?: string | null;
    fecha_inicio?: string | null;
    fecha_fin?: string | null;
    ubicacion?: string | null;
};

type OrdenCompra = {
    id: string;
    numero_oc: string;
    subtotal: number;
    igv: number;
    total: number;
    moneda: string;
    estado: string;
    proveedores: Proveedor;
    eventos: Evento;
};

type Factura = {
    id: string;
    orden_compra_id: string;
    serie: string;
    numero: string;
    fecha_emision: string;
    subtotal: number;
    igv: number;
    total: number;
    moneda: string;
    estado: string;
    estado_conformidad: string;

    archivo_pdf_url?: string | null;
    archivo_pdf_nombre?: string | null;
    archivo_xml_url?: string | null;
    archivo_xml_nombre?: string | null;
    archivo_pdf_url_firmada?: string | null;
    archivo_xml_url_firmada?: string | null;

    tiene_detraccion?: boolean | null;
    estado_detraccion?: string | null;
    porcentaje_detraccion?: number | null;
    monto_detraccion?: number | null;

    ordenes_compra: OrdenCompra;
};

type ResumenOrden = {
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

type Validaciones = {
    moneda_coincide: boolean;
    monto_dentro_del_saldo: boolean;
    total_acumulado_correcto: boolean;
    tiene_pdf: boolean;
    tiene_xml: boolean;
};

type Conformidad = {
    id: string;
    orden_compra_id: string;
    factura_id: string;
    revisado_por: string;
    fecha_revision: string;
    estado: "aprobada" | "observada";
    observaciones?: string | null;
    fecha_creacion: string;
    fecha_actualizacion: string;

    facturas: Factura;
    resumen_orden: ResumenOrden;
    validaciones: Validaciones;
};

function formatearMoneda(
    monto?: number | null,
    moneda: string = "PEN"
) {
    const valor = Number(monto ?? 0);

    return new Intl.NumberFormat("es-PE", {
        style: "currency",
        currency: moneda || "PEN",
        minimumFractionDigits: 2,
    }).format(valor);
}

function formatearFecha(fecha?: string | null) {
    if (!fecha) return "No registrada";

    return new Intl.DateTimeFormat("es-PE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(new Date(fecha));
}

function formatearFechaHora(fecha?: string | null) {
    if (!fecha) return "No registrada";

    return new Intl.DateTimeFormat("es-PE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(fecha));
}

function textoEstado(estado?: string | null) {
    if (estado === "aprobada") return "Aprobada";
    if (estado === "observada") return "Observada";
    return "No registrado";
}

export default function DetalleConformidadPage() {
    const params = useParams();
    const router = useRouter();

    const conformidadId = params.id as string;

    const [conformidad, setConformidad] =
        useState<Conformidad | null>(null);

    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [modoEdicion, setModoEdicion] = useState(false);

    const [revisadoPor, setRevisadoPor] = useState("");
    const [estado, setEstado] =
        useState<"aprobada" | "observada">("observada");
    const [observaciones, setObservaciones] = useState("");

    const [toast, setToast] = useState<ToastState | null>(null);


    async function cargarConformidad() {
        try {
            setCargando(true);

            const data = await apiFetch(
                `/conformidades/${conformidadId}`
            );

            setConformidad(data);
            setRevisadoPor(data.revisado_por ?? "");
            setEstado(data.estado ?? "observada");
            setObservaciones(data.observaciones ?? "");

            setModoEdicion(data.estado === "observada");
        } catch (error) {
            console.error(
                "Error cargando la conformidad:",
                error
            );

            setToast({
                tipo: "error",
                mensaje:
                    "No se pudo cargar la conformidad.",
            });
        } finally {
            setCargando(false);
        }
    }

    useEffect(() => {
        if (conformidadId) {
            cargarConformidad();
        }
    }, [conformidadId]);

    async function actualizarConformidad() {
        if (!revisadoPor.trim()) {
            setToast({
                tipo: "info",
                mensaje:
                    "Ingresa el nombre de la persona que realizó la revisión.",
            });
            return;
        }

        if (
            estado === "observada" &&
            !observaciones.trim()
        ) {
            setToast({
                tipo: "info",
                mensaje:
                    "Debes registrar una observación.",
            });
            return;
        }

        try {
            setGuardando(true);

            await apiFetch(
                `/conformidades/${conformidadId}`,
                {
                    method: "PUT",
                    body: JSON.stringify({
                        revisado_por: revisadoPor.trim(),
                        estado,
                        observaciones:
                            estado === "observada"
                                ? observaciones.trim()
                                : observaciones.trim() || null,
                    }),
                }
            );

            setToast({
                tipo: "success",
                mensaje:
                    "Conformidad actualizada correctamente.",
            });

            await cargarConformidad();

            if (estado === "aprobada") {
                setModoEdicion(false);
            }
        } catch (error) {
            console.error(
                "Error actualizando la conformidad:",
                error
            );

            setToast({
                tipo: "error",
                mensaje:
                    "No se pudo actualizar la conformidad.",
            });
        } finally {
            setGuardando(false);
        }
    }

    if (cargando) {
        return (
            <MainLayout>
                <main className="min-h-screen bg-[#F6F8FB] p-6 md:p-8">
                    <div className="flex min-h-[420px] items-center justify-center">
                        <div className="flex items-center gap-3 text-sm text-slate-500">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Cargando conformidad...
                        </div>
                    </div>
                </main>
            </MainLayout>
        );
    }

    if (!conformidad) {
        return (
            <MainLayout>
                <main className="min-h-screen bg-[#F6F8FB] p-6 md:p-8">
                    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
                        <CircleAlert className="mx-auto mb-3 h-10 w-10 text-amber-500" />

                        <h1 className="text-lg font-semibold text-[#102033]">
                            Conformidad no encontrada
                        </h1>

                        <p className="mt-2 text-sm text-slate-500">
                            No se pudo encontrar el registro solicitado.
                        </p>

                        <Link
                            href="/conformidades"
                            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#102033] px-4 py-2 text-sm font-medium text-white"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Volver a conformidades
                        </Link>
                    </div>
                </main>
            </MainLayout>
        );
    }

    const factura = conformidad.facturas;
    const ordenCompra = factura.ordenes_compra;
    const proveedor = ordenCompra.proveedores;
    const evento = ordenCompra.eventos;
    const resumen = conformidad.resumen_orden;
    const validaciones = conformidad.validaciones;

    const puedeEditar =
        conformidad.estado === "observada";

    return (
        <MainLayout>
            <main className="min-h-screen bg-[#F6F8FB] p-6 md:p-8">
                {toast && (
                    <Toast
                        tipo={toast.tipo}
                        mensaje={toast.mensaje}
                        onClose={() => setToast(null)}
                    />
                )}

                <div className="mx-auto max-w-7xl">
                    <div className="mb-6">
                        <button
                            type="button"
                            onClick={() =>
                                router.push("/conformidades")
                            }
                            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-[#102033]"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Volver a conformidades
                        </button>

                        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                            <div>
                                <h1 className="text-2xl font-bold text-[#102033]">
                                    Detalle de conformidad
                                </h1>

                                <p className="mt-1 text-sm text-slate-500">
                                    Revisión de la factura, orden de compra y documentos asociados.
                                </p>
                            </div>

                            <div
                                className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${conformidad.estado ===
                                    "aprobada"
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-amber-50 text-amber-700"
                                    }`}
                            >
                                {conformidad.estado ===
                                    "aprobada" ? (
                                    <CheckCircle2 className="h-4 w-4" />
                                ) : (
                                    <CircleAlert className="h-4 w-4" />
                                )}

                                {textoEstado(
                                    conformidad.estado
                                )}
                            </div>
                        </div>
                    </div>

                    <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="grid gap-5 md:grid-cols-3">
                            <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                    Revisado por
                                </p>
                                <p className="mt-1 text-sm font-semibold text-[#102033]">
                                    {conformidad.revisado_por ||
                                        "No registrado"}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                    Fecha de revisión
                                </p>
                                <p className="mt-1 text-sm font-semibold text-[#102033]">
                                    {formatearFechaHora(
                                        conformidad.fecha_revision
                                    )}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                    Última actualización
                                </p>
                                <p className="mt-1 text-sm font-semibold text-[#102033]">
                                    {formatearFechaHora(
                                        conformidad.fecha_actualizacion
                                    )}
                                </p>
                            </div>
                        </div>
                    </section>

                    <div className="grid gap-6 lg:grid-cols-2">
                        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="mb-5 flex items-center gap-3">
                                <div className="rounded-xl bg-blue-50 p-2.5 text-blue-700">
                                    <ShoppingCart className="h-5 w-5" />
                                </div>

                                <div>
                                    <h2 className="font-semibold text-[#102033]">
                                        Orden de compra
                                    </h2>
                                    <p className="text-sm text-slate-500">
                                        Información comercial registrada.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Detalle
                                    label="Número de OC"
                                    value={
                                        ordenCompra.numero_oc
                                    }
                                />

                                <Detalle
                                    label="Proveedor"
                                    value={
                                        proveedor.razon_social
                                    }
                                />

                                <Detalle
                                    label="RUC / Documento"
                                    value={
                                        proveedor.documento
                                    }
                                />

                                <Detalle
                                    label="Evento"
                                    value={evento.nombre}
                                />

                                <Detalle
                                    label="Cliente"
                                    value={
                                        evento.cliente ||
                                        "No registrado"
                                    }
                                />

                                <Detalle
                                    label="Subtotal"
                                    value={formatearMoneda(
                                        ordenCompra.subtotal,
                                        ordenCompra.moneda
                                    )}
                                />

                                <Detalle
                                    label="IGV"
                                    value={formatearMoneda(
                                        ordenCompra.igv,
                                        ordenCompra.moneda
                                    )}
                                />

                                <Detalle
                                    label="Total OC"
                                    value={formatearMoneda(
                                        ordenCompra.total,
                                        ordenCompra.moneda
                                    )}
                                    destacado
                                />
                            </div>
                        </section>

                        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="mb-5 flex items-center gap-3">
                                <div className="rounded-xl bg-violet-50 p-2.5 text-violet-700">
                                    <FileText className="h-5 w-5" />
                                </div>

                                <div>
                                    <h2 className="font-semibold text-[#102033]">
                                        Factura
                                    </h2>
                                    <p className="text-sm text-slate-500">
                                        Comprobante asociado a la conformidad.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Detalle
                                    label="Comprobante"
                                    value={`${factura.serie}-${factura.numero}`}
                                />

                                <Detalle
                                    label="Fecha de emisión"
                                    value={formatearFecha(
                                        factura.fecha_emision
                                    )}
                                />

                                <Detalle
                                    label="Moneda"
                                    value={
                                        factura.moneda === "PEN"
                                            ? "Soles"
                                            : factura.moneda
                                    }
                                />

                                <Detalle
                                    label="Subtotal"
                                    value={formatearMoneda(
                                        factura.subtotal,
                                        factura.moneda
                                    )}
                                />

                                <Detalle
                                    label="IGV"
                                    value={formatearMoneda(
                                        factura.igv,
                                        factura.moneda
                                    )}
                                />

                                <Detalle
                                    label="Total factura"
                                    value={formatearMoneda(
                                        factura.total,
                                        factura.moneda
                                    )}
                                    destacado
                                />

                                {factura.estado_detraccion ===
                                    "detectada" && (
                                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                                            <p className="text-sm font-semibold text-amber-800">
                                                Detracción detectada
                                            </p>

                                            <p className="mt-1 text-sm text-amber-700">
                                                {factura.porcentaje_detraccion ??
                                                    0}
                                                % —{" "}
                                                {formatearMoneda(
                                                    factura.monto_detraccion,
                                                    factura.moneda
                                                )}
                                            </p>
                                        </div>
                                    )}
                            </div>

                            <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                {factura.archivo_pdf_url_firmada ? (
                                    <a
                                        href={factura.archivo_pdf_url_firmada}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-[#102033] transition hover:bg-slate-50"
                                    >
                                        <Download className="h-4 w-4" />
                                        Ver PDF
                                    </a>
                                ) : (
                                    <div className="flex items-center justify-center rounded-lg border border-dashed border-slate-200 px-4 py-2.5 text-sm text-slate-400">
                                        PDF no disponible
                                    </div>
                                )}

                                {factura.archivo_xml_url_firmada ? (
                                    <a
                                        href={factura.archivo_xml_url_firmada}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-[#102033] transition hover:bg-slate-50"
                                    >
                                        <Download className="h-4 w-4" />
                                        Ver XML
                                    </a>
                                ) : (
                                    <div className="flex items-center justify-center rounded-lg border border-dashed border-slate-200 px-4 py-2.5 text-sm text-slate-400">
                                        XML no disponible
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    <div className="mt-6 grid gap-6 lg:grid-cols-2">
                        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <h2 className="font-semibold text-[#102033]">
                                Validaciones automáticas
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Comparación de la factura con la orden de compra.
                            </p>

                            <div className="mt-5 space-y-3">
                                <Validacion
                                    correcta={
                                        validaciones.moneda_coincide
                                    }
                                    texto="La moneda coincide con la orden de compra"
                                />

                                <Validacion
                                    correcta={
                                        validaciones.monto_dentro_del_saldo
                                    }
                                    texto="El monto de la factura está dentro del saldo disponible"
                                />

                                <Validacion
                                    correcta={
                                        validaciones.total_acumulado_correcto
                                    }
                                    texto="El total facturado no supera el monto de la OC"
                                />

                                <Validacion
                                    correcta={
                                        validaciones.tiene_pdf
                                    }
                                    texto="La factura cuenta con archivo PDF"
                                />

                                <Validacion
                                    correcta={
                                        validaciones.tiene_xml
                                    }
                                    texto="La factura cuenta con archivo XML"
                                />
                            </div>
                        </section>

                        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <h2 className="font-semibold text-[#102033]">
                                Resumen de facturación
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Estado acumulado de la orden de compra.
                            </p>

                            <div className="mt-5 space-y-4">
                                <Detalle
                                    label="Monto total de la OC"
                                    value={formatearMoneda(
                                        resumen.monto_oc,
                                        factura.moneda
                                    )}
                                />

                                <Detalle
                                    label="Facturado anteriormente"
                                    value={formatearMoneda(
                                        resumen.total_facturado_anterior,
                                        factura.moneda
                                    )}
                                />

                                <Detalle
                                    label="Factura actual"
                                    value={formatearMoneda(
                                        resumen.factura_actual,
                                        factura.moneda
                                    )}
                                />

                                <Detalle
                                    label="Total facturado"
                                    value={formatearMoneda(
                                        resumen.total_facturado_acumulado,
                                        factura.moneda
                                    )}
                                />

                                <Detalle
                                    label="Saldo restante"
                                    value={formatearMoneda(
                                        resumen.saldo_restante,
                                        factura.moneda
                                    )}
                                    destacado
                                />

                                <div className="pt-2">
                                    <div className="mb-2 flex items-center justify-between text-sm">
                                        <span className="text-slate-500">
                                            Avance de facturación
                                        </span>

                                        <span className="font-semibold text-[#102033]">
                                            {
                                                resumen.porcentaje_facturado
                                            }
                                            %
                                        </span>
                                    </div>

                                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                        <div
                                            className="h-full rounded-full bg-[#102033]"
                                            style={{
                                                width: `${Math.min(
                                                    resumen.porcentaje_facturado,
                                                    100
                                                )}%`,
                                            }}
                                        />
                                    </div>
                                </div>

                                {resumen.facturacion_completa && (
                                    <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

                                        <div>
                                            <p className="text-sm font-semibold text-emerald-800">
                                                OC completamente facturada
                                            </p>

                                            <p className="mt-1 text-sm text-emerald-700">
                                                El total acumulado coincide con el monto de la orden de compra.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                            <div>
                                <h2 className="font-semibold text-[#102033]">
                                    Resultado de la conformidad
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    {puedeEditar
                                        ? "Puedes actualizar la conformidad porque se encuentra observada."
                                        : "La conformidad aprobada se muestra en modo de solo lectura."}
                                </p>
                            </div>

                            {puedeEditar && !modoEdicion && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        setModoEdicion(true)
                                    }
                                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-[#102033] hover:bg-slate-50"
                                >
                                    Editar conformidad
                                </button>
                            )}
                        </div>

                        {modoEdicion && puedeEditar ? (
                            <div className="space-y-5">
                                <div className="grid gap-5 md:grid-cols-2">
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-[#102033]">
                                            Revisado por
                                        </label>

                                        <input
                                            type="text"
                                            value={revisadoPor}
                                            onChange={(event) =>
                                                setRevisadoPor(
                                                    event.target.value
                                                )
                                            }
                                            placeholder="Nombre de la persona responsable"
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-[#102033] focus:ring-2 focus:ring-slate-100"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-[#102033]">
                                            Estado
                                        </label>

                                        <select
                                            value={estado}
                                            onChange={(event) =>
                                                setEstado(
                                                    event.target
                                                        .value as
                                                    | "aprobada"
                                                    | "observada"
                                                )
                                            }
                                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#102033] focus:ring-2 focus:ring-slate-100"
                                        >
                                            <option value="observada">
                                                Observada
                                            </option>

                                            <option value="aprobada">
                                                Aprobada
                                            </option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-[#102033]">
                                        Observaciones
                                    </label>

                                    <textarea
                                        value={observaciones}
                                        onChange={(event) =>
                                            setObservaciones(
                                                event.target.value
                                            )
                                        }
                                        rows={4}
                                        placeholder="Describe las observaciones encontradas..."
                                        className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-[#102033] focus:ring-2 focus:ring-slate-100"
                                    />
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        type="button"
                                        onClick={
                                            actualizarConformidad
                                        }
                                        disabled={guardando}
                                        className="inline-flex items-center gap-2 rounded-lg bg-[#102033] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1B3048] disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {guardando ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Save className="h-4 w-4" />
                                        )}

                                        {guardando
                                            ? "Actualizando..."
                                            : "Actualizar conformidad"}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="grid gap-5 md:grid-cols-2">
                                <Detalle
                                    label="Estado"
                                    value={textoEstado(
                                        conformidad.estado
                                    )}
                                />

                                <Detalle
                                    label="Revisado por"
                                    value={
                                        conformidad.revisado_por ||
                                        "No registrado"
                                    }
                                />

                                <div className="md:col-span-2">
                                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                        Observaciones
                                    </p>

                                    <div className="mt-2 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                                        {conformidad.observaciones ||
                                            "Sin observaciones registradas."}
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </MainLayout>
    );
}

function Detalle({
    label,
    value,
    destacado = false,
}: {
    label: string;
    value: string;
    destacado?: boolean;
}) {
    return (
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
            <span className="text-sm text-slate-500">
                {label}
            </span>

            <span
                className={`text-right text-sm ${destacado
                    ? "font-bold text-[#102033]"
                    : "font-medium text-slate-700"
                    }`}
            >
                {value}
            </span>
        </div>
    );
}

function Validacion({
    correcta,
    texto,
}: {
    correcta: boolean;
    texto: string;
}) {
    return (
        <div
            className={`flex items-start gap-3 rounded-xl border p-3.5 ${correcta
                ? "border-emerald-200 bg-emerald-50"
                : "border-amber-200 bg-amber-50"
                }`}
        >
            {correcta ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            ) : (
                <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            )}

            <p
                className={`text-sm font-medium ${correcta
                    ? "text-emerald-800"
                    : "text-amber-800"
                    }`}
            >
                {texto}
            </p>
        </div>
    );
}