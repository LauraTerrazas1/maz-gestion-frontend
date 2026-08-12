"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import { apiFetch } from "@/lib/api";
import {
    AlertTriangle,
    ArrowLeft,
    Building2,
    CheckCircle2,
    FileText,
    Landmark,
    RefreshCw,
    Upload,
    WalletCards,
    XCircle,
} from "lucide-react";

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

    archivo_pdf_url: string | null;
    archivo_pdf_nombre: string | null;
    archivo_xml_url: string | null;
    archivo_xml_nombre: string | null;
    archivo_pdf_url_firmada?: string | null;
    archivo_xml_url_firmada?: string | null;

    monto_oc: number | string | null;
    diferencia_oc: number | string | null;
    monto_coincide: boolean | null;

    tiene_detraccion: boolean | null;
    codigo_detraccion: string | null;
    descripcion_detraccion: string | null;
    porcentaje_detraccion: number | string | null;
    monto_detraccion: number | string | null;
    cuenta_detracciones: string | null;
    estado_detraccion: string | null;
    cuenta_detraccion_detectada?: string | null;

    estado: string | null;
    estado_conformidad: string | null;
    observacion_conformidad: string | null;
    observaciones: string | null;
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
    if (!fecha) return "Sin registrar";

    return new Intl.DateTimeFormat("es-PE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "UTC",
    }).format(new Date(`${fecha}T00:00:00`));
}

function textoEstadoDetraccion(estado: string | null) {
    const estados: Record<string, string> = {
        no_detectada: "No detectada",
        detectada: "Detectada",
        requiere_revision: "Requiere revisión",
    };

    return estados[estado || ""] || "Pendiente";
}

function claseEstadoConformidad(estado: string | null) {
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

export default function DetalleFacturaPage() {
    const params = useParams();
    const router = useRouter();

    const facturaId = String(params.id || "");

    const [factura, setFactura] = useState<Factura | null>(null);
    const [cargando, setCargando] = useState(true);
    const [subiendoPdf, setSubiendoPdf] = useState(false);
    const [subiendoXml, setSubiendoXml] = useState(false);
    const [error, setError] = useState("");
    const [mensaje, setMensaje] = useState("");

    async function cargarFactura() {
        try {
            setCargando(true);
            setError("");

            const data = await apiFetch(`/facturas/${facturaId}`);

            setFactura(data);
        } catch (error) {
            console.error("Error cargando factura:", error);
            setError("No se pudo cargar la factura.");
        } finally {
            setCargando(false);
        }
    }

    useEffect(() => {
        if (facturaId) {
            cargarFactura();
        }
    }, [facturaId]);

    async function subirArchivo(
        archivo: File,
        tipo: "pdf" | "xml"
    ) {
        try {
            setError("");
            setMensaje("");

            if (tipo === "pdf") {
                setSubiendoPdf(true);
            } else {
                setSubiendoXml(true);
            }

            const formData = new FormData();

            formData.append(
                tipo === "pdf" ? "archivo_pdf" : "archivo_xml",
                archivo
            );

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL ||
                "http://localhost:8000"
                }/facturas/${facturaId}/archivo-${tipo}`,
                {
                    method: "POST",
                    body: formData,
                }
            );

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(
                    data?.detail ||
                    `No se pudo subir el ${tipo.toUpperCase()}`
                );
            }

            setMensaje(
                `${tipo.toUpperCase()} analizado correctamente`
            );

            if (data?.factura) {
                setFactura(data.factura);
            } else {
                await cargarFactura();
            }
        } catch (error) {
            console.error("Error subiendo archivo:", error);

            setError(
                error instanceof Error
                    ? error.message
                    : "No se pudo subir el archivo."
            );
        } finally {
            setSubiendoPdf(false);
            setSubiendoXml(false);
        }
    }

    function seleccionarPdf(
        event: ChangeEvent<HTMLInputElement>
    ) {
        const archivo = event.target.files?.[0];

        if (archivo) {
            subirArchivo(archivo, "pdf");
        }

        event.target.value = "";
    }

    function seleccionarXml(
        event: ChangeEvent<HTMLInputElement>
    ) {
        const archivo = event.target.files?.[0];

        if (archivo) {
            subirArchivo(archivo, "xml");
        }

        event.target.value = "";
    }

    if (cargando) {
        return (
            <MainLayout>
                <main className="min-h-screen bg-[#F6F8FB] p-8">
                    <div className="flex min-h-[65vh] items-center justify-center">
                        <div className="text-center">
                            <RefreshCw className="mx-auto h-8 w-8 animate-spin text-[#2F73D9]" />

                            <p className="mt-3 text-sm text-slate-500">
                                Cargando factura...
                            </p>
                        </div>
                    </div>
                </main>
            </MainLayout>
        );
    }

    if (error && !factura) {
        return (
            <MainLayout>
                <main className="min-h-screen bg-[#F6F8FB] p-8">
                    <div className="flex min-h-[65vh] items-center justify-center">
                        <div className="max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
                            <XCircle className="mx-auto h-10 w-10 text-red-500" />

                            <h2 className="mt-4 text-xl font-bold text-[#102033]">
                                No se pudo cargar la factura
                            </h2>

                            <p className="mt-2 text-sm text-slate-500">
                                {error}
                            </p>

                            <button
                                type="button"
                                onClick={() => router.push("/facturas")}
                                className="mt-5 rounded-xl bg-[#2F73D9] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#245DB3]"
                            >
                                Volver a facturas
                            </button>
                        </div>
                    </div>
                </main>
            </MainLayout>
        );
    }

    if (!factura) return null;

    const comprobante =
        factura.serie && factura.numero
            ? `${factura.serie}-${factura.numero}`
            : "Factura sin numeración";

    const saldoPendiente = Math.abs(
        Number(factura.diferencia_oc || 0)
    );

    const totalFactura = Number(factura.total || 0);

    const montoDetraccion = Number(
        factura.monto_detraccion || 0
    );

    const tieneDetraccion =
        factura.tiene_detraccion === true ||
        factura.estado_detraccion === "detectada" ||
        montoDetraccion > 0;

    const montoProveedor = Math.max(
        totalFactura - montoDetraccion,
        0
    );

    const montoOc = Number(factura.monto_oc || 0);

    const totalFacturadoAcumulado = Math.max(
        montoOc - saldoPendiente,
        0
    );

    const cuentaDetracciones =
        factura.cuenta_detraccion_detectada ||
        "Cuenta no registrada";
    return (
        <MainLayout>
            <main className="min-h-screen bg-[#F6F8FB] p-8">
                <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-3">
                        <button
                            type="button"
                            onClick={() => router.push("/facturas")}
                            className="mt-1 rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-[#102033]"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </button>

                        <div>
                            <h1 className="text-3xl font-bold text-[#102033]">
                                {comprobante}
                            </h1>

                            <p className="mt-1 text-sm text-slate-500">
                                Revisa la información, documentos y conformidad de la
                                factura.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={cargarFactura}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-[#102033]"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Actualizar
                    </button>
                </div>

                {mensaje && (
                    <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-700">
                        <CheckCircle2 className="h-5 w-5" />
                        {mensaje}
                    </div>
                )}

                {error && (
                    <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
                        <XCircle className="h-5 w-5" />
                        {error}
                    </div>
                )}

                <div className="grid gap-6 xl:grid-cols-3">
                    <div className="space-y-6 xl:col-span-2">

                        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="font-semibold text-[#102033]">
                                            Resumen del pago
                                        </h2>

                                        {tieneDetraccion && (
                                            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                                                Con detracción
                                            </span>
                                        )}
                                    </div>

                                    <p className="mt-1 text-xs text-slate-500">
                                        Distribución del importe de esta factura.
                                    </p>
                                </div>

                                <div className="text-left sm:text-right">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                        Total factura
                                    </p>

                                    <p className="mt-1 text-2xl font-bold text-[#102033]">
                                        {formatearMonto(
                                            totalFactura,
                                            factura.moneda
                                        )}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-6 grid gap-4 md:grid-cols-2">
                                <div className="rounded-xl border border-slate-200 p-5">
                                    <div className="flex items-center gap-3">
                                        <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
                                            <WalletCards className="h-5 w-5" />
                                        </div>

                                        <p className="text-sm font-medium text-slate-600">
                                            Pago al proveedor
                                        </p>
                                    </div>

                                    <p className="mt-4 text-3xl font-bold text-[#102033]">
                                        {formatearMonto(
                                            montoProveedor,
                                            factura.moneda
                                        )}
                                    </p>

                                    <p className="mt-2 text-xs text-slate-500">
                                        Monto que recibirá directamente el proveedor.
                                    </p>
                                </div>

                                <div className="rounded-xl border border-slate-200 p-5">
                                    <div className="flex items-center gap-3">
                                        <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
                                            <Landmark className="h-5 w-5" />
                                        </div>

                                        <p className="text-sm font-medium text-slate-600">
                                            Depósito de detracción
                                        </p>
                                    </div>

                                    <p className="mt-4 text-3xl font-bold text-[#102033]">
                                        {formatearMonto(
                                            montoDetraccion,
                                            factura.moneda
                                        )}
                                    </p>

                                    <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm">
                                        <div className="flex items-center justify-between gap-4">
                                            <span className="text-slate-500">
                                                Porcentaje
                                            </span>

                                            <span className="font-semibold text-slate-700">
                                                {Number(
                                                    factura.porcentaje_detraccion || 0
                                                )}
                                                %
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between gap-4">
                                            <span className="text-slate-500">
                                                Código
                                            </span>

                                            <span className="font-semibold text-slate-700">
                                                {factura.codigo_detraccion ||
                                                    "No registrado"}
                                            </span>
                                        </div>

                                        <div className="flex items-start justify-between gap-4">
                                            <span className="text-slate-500">
                                                Cuenta BN
                                            </span>

                                            <span className="text-right font-semibold text-slate-700">
                                                {cuentaDetracciones}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {tieneDetraccion && (
                                <div className="mt-5 flex items-start gap-3 rounded-xl bg-slate-50 px-4 py-3">
                                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />

                                    <p className="text-sm leading-6 text-slate-600">
                                        Pagar{" "}
                                        <strong className="text-[#102033]">
                                            {formatearMonto(
                                                montoProveedor,
                                                factura.moneda
                                            )}
                                        </strong>{" "}
                                        al proveedor y depositar{" "}
                                        <strong className="text-[#102033]">
                                            {formatearMonto(
                                                montoDetraccion,
                                                factura.moneda
                                            )}
                                        </strong>{" "}
                                        en la cuenta de detracciones del Banco de la Nación.
                                    </p>
                                </div>
                            )}
                        </section>

                        {/* RESUMEN DE LA OC */}
                        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="border-b border-slate-100 pb-4">
                                <h2 className="font-semibold text-[#102033]">
                                    Estado de facturación de la OC
                                </h2>

                                <p className="mt-1 text-xs text-slate-500">
                                    Seguimiento del monto facturado frente al total de la
                                    orden de compra.
                                </p>
                            </div>

                            <div className="mt-6 grid gap-4 sm:grid-cols-3">
                                <Resumen
                                    etiqueta="Total de la OC"
                                    valor={formatearMonto(
                                        montoOc,
                                        factura.moneda
                                    )}
                                />

                                <Resumen
                                    etiqueta="Facturado acumulado"
                                    valor={formatearMonto(
                                        totalFacturadoAcumulado,
                                        factura.moneda
                                    )}
                                />

                                <Resumen
                                    etiqueta="Saldo por facturar"
                                    valor={formatearMonto(
                                        saldoPendiente,
                                        factura.moneda
                                    )}
                                />
                            </div>

                            <div
                                className={`mt-5 rounded-xl border px-4 py-3 text-sm font-medium ${factura.monto_coincide
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                    : "border-amber-200 bg-amber-50 text-amber-700"
                                    }`}
                            >
                                {factura.monto_coincide
                                    ? "La orden de compra está completamente facturada."
                                    : `Todavía queda ${formatearMonto(
                                        saldoPendiente,
                                        factura.moneda
                                    )} pendiente por facturar.`}
                            </div>
                        </section>

                        {/* INFORMACIÓN TÉCNICA */}
                        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="flex flex-col gap-5 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <h2 className="font-semibold text-[#102033]">
                                        Información del comprobante
                                    </h2>

                                    <p className="mt-1 text-xs text-slate-500">
                                        Datos extraídos automáticamente del PDF o XML.
                                    </p>
                                </div>

                                <div className="rounded-xl bg-slate-50 px-5 py-3 sm:text-right">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                        Total factura
                                    </p>

                                    <p className="mt-1 text-2xl font-bold text-[#102033]">
                                        {formatearMonto(
                                            factura.total,
                                            factura.moneda
                                        )}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-6 grid gap-x-10 gap-y-6 sm:grid-cols-2">
                                <DatoComprobante
                                    etiqueta="Tipo de comprobante"
                                    valor={factura.tipo_comprobante || "Factura"}
                                />

                                <DatoComprobante
                                    etiqueta="Serie y número"
                                    valor={comprobante}
                                    destacado
                                />

                                <DatoComprobante
                                    etiqueta="Fecha de emisión"
                                    valor={formatearFecha(
                                        factura.fecha_emision
                                    )}
                                />

                                <DatoComprobante
                                    etiqueta="Fecha de recepción"
                                    valor={formatearFecha(
                                        factura.fecha_recepcion
                                    )}
                                />
                            </div>

                            <div className="mt-6 grid gap-4 border-t border-slate-100 pt-6 sm:grid-cols-3">
                                <MontoComprobante
                                    etiqueta="Subtotal"
                                    valor={formatearMonto(
                                        factura.subtotal,
                                        factura.moneda
                                    )}
                                />

                                <MontoComprobante
                                    etiqueta="IGV"
                                    valor={formatearMonto(
                                        factura.igv,
                                        factura.moneda
                                    )}
                                />

                                <MontoComprobante
                                    etiqueta="Total"
                                    valor={formatearMonto(
                                        factura.total,
                                        factura.moneda
                                    )}
                                    destacado
                                />
                            </div>
                        </section>
                    </div>

                    {/* COLUMNA DERECHA */}
                    <aside className="space-y-6">

                        {/* CONFORMIDAD AÚN NO IMPLEMENTADA */}
                        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="border-b border-slate-100 pb-4">
                                <h2 className="font-semibold text-[#102033]">
                                    Conformidad
                                </h2>

                                <p className="mt-1 text-xs text-slate-500">
                                    Próximo paso del flujo.
                                </p>
                            </div>

                            <div className="mt-5">
                                <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                                    Pendiente
                                </span>

                                <p className="mt-3 text-sm leading-6 text-slate-500">
                                    La factura deberá aprobarse antes de programar
                                    sus pagos.
                                </p>
                            </div>

                            <button
                                type="button"
                                disabled
                                className="mt-5 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-400"
                            >
                                Gestionar conformidad
                            </button>
                        </section>

                        {/* DOCUMENTOS SECUNDARIOS */}
                        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="border-b border-slate-100 pb-4">
                                <h2 className="font-semibold text-[#102033]">
                                    Documentos adjuntos
                                </h2>

                                <p className="mt-1 text-xs text-slate-500">
                                    Archivos recibidos del proveedor.
                                </p>
                            </div>

                            <div className="mt-5 space-y-3">
                                <DocumentoAdjunto
                                    tipo="PDF"
                                    nombre={factura.archivo_pdf_nombre}
                                    url={factura.archivo_pdf_url_firmada}
                                />

                                <DocumentoAdjunto
                                    tipo="XML"
                                    nombre={factura.archivo_xml_nombre}
                                    url={factura.archivo_xml_url_firmada}
                                />
                            </div>
                        </section>

                        {factura.observaciones && (
                            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                <div className="border-b border-slate-100 pb-4">
                                    <h2 className="font-semibold text-[#102033]">
                                        Observaciones
                                    </h2>
                                </div>

                                <p className="mt-4 text-sm leading-6 text-slate-600">
                                    {factura.observaciones}
                                </p>
                            </section>
                        )}
                    </aside>
                </div>
            </main>
        </MainLayout>
    );
}

function Dato({
    etiqueta,
    valor,
}: {
    etiqueta: string;
    valor: string;
}) {
    return (
        <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {etiqueta}
            </p>

            <p className="mt-2 font-semibold text-[#102033]">
                {valor}
            </p>
        </div>
    );
}

function Resumen({
    etiqueta,
    valor,
}: {
    etiqueta: string;
    valor: string;
}) {
    return (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {etiqueta}
            </p>

            <p className="mt-2 text-lg font-bold text-[#102033]">
                {valor}
            </p>
        </div>
    );
}

function ResumenPago({
    etiqueta,
    valor,
    descripcion,
    destacado = false,
}: {
    etiqueta: string;
    valor: string;
    descripcion: string;
    destacado?: boolean;
}) {
    return (
        <div
            className={`rounded-xl border p-4 ${destacado
                ? "border-blue-200 bg-blue-50"
                : "border-slate-200 bg-slate-50"
                }`}
        >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {etiqueta}
            </p>

            <p className="mt-2 text-2xl font-bold text-[#102033]">
                {valor}
            </p>

            <p className="mt-2 text-xs leading-5 text-slate-500">
                {descripcion}
            </p>
        </div>
    );
}
function DocumentoAdjunto({
    tipo,
    nombre,
    url,
}: {
    tipo: "PDF" | "XML";
    nombre: string | null;
    url?: string | null;
}) {
    const existe = Boolean(nombre);
    const sePuedeAbrir = Boolean(nombre && url);

    const contenido = (
        <>
            <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${tipo === "PDF"
                    ? "bg-red-100 text-red-600"
                    : "bg-blue-100 text-blue-700"
                    }`}
            >
                {tipo}
            </div>

            <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[#102033]">
                    {tipo === "PDF"
                        ? "Representación PDF"
                        : "Comprobante XML"}
                </p>

                <p
                    className={`mt-1 truncate text-xs ${existe
                        ? "text-slate-500"
                        : "text-amber-600"
                        }`}
                >
                    {nombre || "No recibido"}
                </p>
            </div>

            {sePuedeAbrir ? (
                <span className="shrink-0 text-xs font-semibold text-[#2F73D9]">
                    Ver
                </span>
            ) : (
                existe && (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                )
            )}
        </>
    );

    if (sePuedeAbrir) {
        return (
            <a
                href={url!}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 transition hover:border-[#2F73D9] hover:bg-blue-50/40"
            >
                {contenido}
            </a>
        );
    }

    return (
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-4">
            {contenido}
        </div>
    );
}
function DatoComprobante({
    etiqueta,
    valor,
    destacado = false,
}: {
    etiqueta: string;
    valor: string;
    destacado?: boolean;
}) {
    return (
        <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {etiqueta}
            </p>

            <p
                className={`mt-2 font-semibold ${destacado
                    ? "text-[#2F73D9]"
                    : "text-[#102033]"
                    }`}
            >
                {valor}
            </p>
        </div>
    );
}

function MontoComprobante({
    etiqueta,
    valor,
    destacado = false,
}: {
    etiqueta: string;
    valor: string;
    destacado?: boolean;
}) {
    return (
        <div
            className={`rounded-xl border p-4 ${destacado
                ? "border-slate-300 bg-slate-50"
                : "border-slate-200 bg-white"
                }`}
        >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {etiqueta}
            </p>

            <p
                className={`mt-2 font-bold ${destacado
                    ? "text-xl text-[#102033]"
                    : "text-lg text-slate-700"
                    }`}
            >
                {valor}
            </p>
        </div>
    );
}