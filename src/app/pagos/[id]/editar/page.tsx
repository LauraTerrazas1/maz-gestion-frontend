"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft,
    CalendarDays,
    Save,
    WalletCards,
} from "lucide-react";

import MainLayout from "@/components/layout/MainLayout";
import Toast from "@/components/ui/Toast";
import type { ToastTipo } from "@/components/ui/Toast";
import { apiFetch } from "@/lib/api";

type Pago = {
    id: string;
    monto: number | string;
    metodo_pago: string | null;
    fecha_real_pago: string | null;
    fecha_programada: string | null;
    numero_operacion: string | null;
    observaciones: string | null;
    estado: string | null;
    tipo_destino?: string | null;

    eventos?: {
        id: string;
        nombre: string | null;
        cliente: string | null;
    } | null;

    proveedores?: {
        id: string;
        razon_social: string | null;
        documento: string | null;
    } | null;

    facturas?: {
        id: string;
        serie: string | null;
        numero: string | null;
    } | null;

    programaciones_pago?: {
        id: string;
        fecha_programada: string | null;
        tipo_destino: string | null;
        monto: number | string | null;
        estado: string | null;
    } | null;
};

function moneda(valor: number | string) {
    return Number(valor || 0).toLocaleString("es-PE", {
        style: "currency",
        currency: "PEN",
    });
}

export default function EditarPagoPage() {
    const params = useParams();
    const router = useRouter();

    const pagoId = params.id as string;

    const [pago, setPago] = useState<Pago | null>(null);
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);

    const [metodoPago, setMetodoPago] = useState("");
    const [fechaRealPago, setFechaRealPago] = useState("");
    const [numeroOperacion, setNumeroOperacion] = useState("");
    const [observaciones, setObservaciones] = useState("");

    const [toast, setToast] = useState<{
        tipo: ToastTipo;
        mensaje: string;
    } | null>(null);

    useEffect(() => {
        async function cargarPago() {
            try {
                setCargando(true);

                const data = (await apiFetch(
                    `/pagos/${pagoId}`
                )) as Pago;

                setPago(data);

                setMetodoPago(data.metodo_pago || "");
                setFechaRealPago(
                    data.fecha_real_pago
                        ? String(data.fecha_real_pago).slice(0, 10)
                        : ""
                );
                setNumeroOperacion(data.numero_operacion || "");
                setObservaciones(data.observaciones || "");
            } catch (error) {
                console.error("Error cargando pago:", error);

                setToast({
                    tipo: "error",
                    mensaje: "No se pudo cargar el pago.",
                });
            } finally {
                setCargando(false);
            }
        }

        if (pagoId) {
            void cargarPago();
        }
    }, [pagoId]);

    async function guardarCambios() {
        if (!pago) return;

        if (!metodoPago) {
            setToast({
                tipo: "error",
                mensaje: "Selecciona el método de pago.",
            });
            return;
        }

        if (!fechaRealPago) {
            setToast({
                tipo: "error",
                mensaje: "Ingresa la fecha real del pago.",
            });
            return;
        }

        try {
            setGuardando(true);

            await apiFetch(`/pagos/${pagoId}`, {
                method: "PUT",
                body: JSON.stringify({
                    metodo_pago: metodoPago,
                    fecha_real_pago: fechaRealPago,
                    numero_operacion:
                        numeroOperacion.trim() || null,
                    observaciones:
                        observaciones.trim() || null,
                }),
            });

            setToast({
                tipo: "success",
                mensaje: "Pago actualizado correctamente.",
            });

            setTimeout(() => {
                router.push("/pagos");
            }, 700);
        } catch (error) {
            console.error("Error actualizando pago:", error);

            setToast({
                tipo: "error",
                mensaje:
                    error instanceof Error
                        ? error.message
                        : "No se pudo actualizar el pago.",
            });
        } finally {
            setGuardando(false);
        }
    }

    if (cargando) {
        return (
            <MainLayout>
                <main className="min-h-screen bg-[#F6F8FB] p-8">
                    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
                        Cargando pago...
                    </div>
                </main>
            </MainLayout>
        );
    }

    if (!pago) {
        return (
            <MainLayout>
                <main className="min-h-screen bg-[#F6F8FB] p-8">
                    <div className="rounded-2xl border border-red-200 bg-white p-8">
                        <p className="font-semibold text-red-600">
                            No se pudo cargar el pago.
                        </p>

                        <button
                            type="button"
                            onClick={() => router.push("/pagos")}
                            className="mt-4 text-sm font-semibold text-[#2F73D9]"
                        >
                            ← Volver a pagos
                        </button>
                    </div>
                </main>
            </MainLayout>
        );
    }

    const destino =
        pago.tipo_destino ||
        pago.programaciones_pago?.tipo_destino ||
        "proveedor";

    return (
        <MainLayout>
            <main className="min-h-screen bg-[#F6F8FB] p-8">
                <div className="mx-auto max-w-5xl">
                    {/* Encabezado */}

                    <div className="flex items-start gap-4">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm hover:bg-slate-50"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </button>

                        <div>
                            <h1 className="text-3xl font-bold text-[#102033]">
                                Editar pago
                            </h1>

                            <p className="mt-1 text-sm text-slate-500">
                                Actualiza la información del pago registrado.
                            </p>
                        </div>
                    </div>

                    {/* Resumen */}

                    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between gap-6">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Monto registrado
                                </p>

                                <p className="mt-2 text-3xl font-bold text-[#102033]">
                                    {moneda(pago.monto)}
                                </p>
                            </div>

                            <span
                                className={`rounded-full border px-3 py-1 text-xs font-semibold ${destino === "detraccion"
                                        ? "border-amber-200 bg-amber-50 text-amber-700"
                                        : "border-blue-200 bg-blue-50 text-blue-700"
                                    }`}
                            >
                                {destino === "detraccion"
                                    ? "Detracción"
                                    : "Proveedor"}
                            </span>
                        </div>

                        <div className="mt-6 grid gap-5 border-t border-slate-100 pt-5 sm:grid-cols-2 lg:grid-cols-3">
                            <div>
                                <p className="text-xs text-slate-500">
                                    Proveedor
                                </p>

                                <p className="mt-1 text-sm font-semibold text-[#102033]">
                                    {pago.proveedores?.razon_social ||
                                        "No registrado"}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs text-slate-500">
                                    Evento
                                </p>

                                <p className="mt-1 text-sm font-semibold text-[#102033]">
                                    {pago.eventos?.nombre || "No registrado"}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs text-slate-500">
                                    Factura
                                </p>

                                <p className="mt-1 text-sm font-semibold text-[#102033]">
                                    {pago.facturas
                                        ? `${pago.facturas.serie || ""}-${pago.facturas.numero || ""
                                        }`
                                        : "No registrada"}
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Formulario */}

                    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="border-b border-slate-100 pb-4">
                            <h2 className="font-semibold text-[#102033]">
                                Información del pago
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Modifica únicamente los datos necesarios.
                            </p>
                        </div>

                        <div className="mt-6 grid gap-5 md:grid-cols-2">
                            {/* Método */}

                            <div>
                                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Método de pago *
                                </label>

                                <div className="relative">
                                    <WalletCards className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />

                                    <select
                                        value={metodoPago}
                                        onChange={(e) =>
                                            setMetodoPago(e.target.value)
                                        }
                                        className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-[#2F73D9]"
                                    >
                                        <option value="">
                                            Seleccionar método
                                        </option>

                                        <option value="transferencia">
                                            Transferencia
                                        </option>

                                        <option value="yape">Yape</option>

                                        <option value="plin">Plin</option>

                                        <option value="efectivo">
                                            Efectivo
                                        </option>

                                        <option value="otro">Otro</option>
                                    </select>
                                </div>
                            </div>

                            {/* Fecha */}

                            <div>
                                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Fecha real de pago *
                                </label>

                                <div className="relative">
                                    <CalendarDays className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />

                                    <input
                                        type="date"
                                        value={fechaRealPago}
                                        onChange={(e) =>
                                            setFechaRealPago(e.target.value)
                                        }
                                        className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 text-sm outline-none focus:border-[#2F73D9]"
                                    />
                                </div>
                            </div>

                            {/* Operación */}

                            <div>
                                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Número de operación
                                </label>

                                <input
                                    type="text"
                                    value={numeroOperacion}
                                    onChange={(e) =>
                                        setNumeroOperacion(e.target.value)
                                    }
                                    placeholder="Ej. 001234567"
                                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#2F73D9]"
                                />
                            </div>

                            {/* Monto solo lectura */}

                            <div>
                                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Monto
                                </label>

                                <input
                                    type="text"
                                    value={moneda(pago.monto)}
                                    disabled
                                    className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500"
                                />
                            </div>

                            {/* Observaciones */}

                            <div className="md:col-span-2">
                                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Observaciones
                                </label>

                                <textarea
                                    value={observaciones}
                                    onChange={(e) =>
                                        setObservaciones(e.target.value)
                                    }
                                    rows={4}
                                    placeholder="Observaciones del pago..."
                                    className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#2F73D9]"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Acciones */}

                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            disabled={guardando}
                            className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-[#102033] shadow-sm hover:bg-slate-50 disabled:opacity-50"
                        >
                            Cancelar
                        </button>

                        <button
                            type="button"
                            onClick={guardarCambios}
                            disabled={guardando}
                            className="inline-flex items-center gap-2 rounded-xl bg-[#2F73D9] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#245DB3] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Save className="h-4 w-4" />

                            {guardando
                                ? "Guardando..."
                                : "Guardar cambios"}
                        </button>
                    </div>
                </div>

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