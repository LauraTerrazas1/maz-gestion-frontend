"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import MainLayout from "@/components/layout/MainLayout";
import Toast from "@/components/ui/Toast";
import type { ToastTipo } from "@/components/ui/Toast";
import { apiFetch } from "@/lib/api";

type ProveedorAsociado = {
    id: string;
    servicio: string | null;
    monto_contratado: number | string | null;
    proveedores?: {
        razon_social: string | null;
    };
};

const selectClassName =
    "w-full cursor-pointer rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-[#2F73D9] focus:ring-2 focus:ring-[#2F73D9]/20";

export default function NuevaProgramacionEventoPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();

    const [proveedores, setProveedores] = useState<ProveedorAsociado[]>([]);
    const [guardando, setGuardando] = useState(false);
    const [toast, setToast] = useState<{ tipo: ToastTipo; mensaje: string } | null>(null);

    const [form, setForm] = useState({
        evento_proveedor_id: "",
        tipo_programacion: "",
        monto: "",
        fecha_programada: "",
        observaciones: "",
    });

    useEffect(() => {
        void Promise.resolve().then(async () => {
            try {
                const data = await apiFetch(`/eventos/${params.id}/proveedores`);
                setProveedores(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Error cargando proveedores asociados:", error);
                setProveedores([]);
            }
        });
    }, [params.id]);

    const proveedorSeleccionado = proveedores.find(
        (item) => item.id === form.evento_proveedor_id
    );

    const montoContratado = Number(proveedorSeleccionado?.monto_contratado || 0);

    const porcentajeCalculado =
        montoContratado > 0
            ? Math.round((Number(form.monto || 0) / montoContratado) * 100)
            : 0;

    function handleChange(
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) {
        setForm((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    }

    function limpiarOpcional(value: string) {
        return value.trim() === "" ? null : value.trim();
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setGuardando(true);

        try {
            await apiFetch("/programaciones-pago/", {
                method: "POST",
                body: JSON.stringify({
                    evento_id: params.id,
                    evento_proveedor_id: form.evento_proveedor_id,
                    origen: "proveedor",
                    tipo_programacion: form.tipo_programacion,
                    monto: Number(form.monto || 0),
                    porcentaje: porcentajeCalculado,
                    fecha_programada: form.fecha_programada,
                    estado: "pendiente",
                    observaciones: limpiarOpcional(form.observaciones),
                }),
            });

            router.push(`/eventos/${params.id}`);
        } catch (error) {
            console.error("Error al crear programación:", error);
            setToast({ tipo: "error", mensaje: "No se pudo crear la programación de pago." });
        } finally {
            setGuardando(false);
        }
    }

    return (
        <MainLayout>
            <main className="min-h-screen bg-[#F6F8FB] p-8">
                <Link href={`/eventos/${params.id}`} className="text-sm font-medium text-[#2F73D9]">
                    ← Volver al evento
                </Link>

                <div className="mt-6">
                    <h1 className="text-3xl font-bold text-[#102033]">
                        Nueva programación de pago
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Registra un adelanto, pago parcial o saldo final para un proveedor del evento.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-[#102033]">
                            Datos de la programación
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            El porcentaje se calcula automáticamente según el monto contratado del proveedor.
                        </p>

                        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-[#102033]">
                                    Proveedor asociado
                                </label>
                                <select
                                    name="evento_proveedor_id"
                                    value={form.evento_proveedor_id}
                                    onChange={handleChange}
                                    required
                                    className={selectClassName}
                                >
                                    <option value="">Seleccionar proveedor</option>
                                    {proveedores.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.proveedores?.razon_social || "Proveedor sin nombre"} -{" "}
                                            {item.servicio || "Sin servicio"} - S/{" "}
                                            {Number(item.monto_contratado || 0).toLocaleString("es-PE")}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-[#102033]">
                                    Monto contratado
                                </label>
                                <input
                                    value={`S/ ${montoContratado.toLocaleString("es-PE", {
                                        minimumFractionDigits: 2,
                                    })}`}
                                    readOnly
                                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm shadow-sm"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-[#102033]">
                                    Tipo de programación
                                </label>
                                <select
                                    name="tipo_programacion"
                                    value={form.tipo_programacion}
                                    onChange={handleChange}
                                    required
                                    className={selectClassName}
                                >
                                    <option value="">Seleccionar tipo</option>
                                    <option value="adelanto">Adelanto</option>
                                    <option value="segundo_pago">Segundo pago</option>
                                    <option value="tercer_pago">Tercer pago</option>
                                    <option value="cuarto_pago">Cuarto pago</option>
                                    <option value="saldo_final">Saldo final</option>
                                    <option value="otro">Otro</option>
                                </select>
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-[#102033]">
                                    Fecha programada
                                </label>
                                <input
                                    type="date"
                                    name="fecha_programada"
                                    value={form.fecha_programada}
                                    onChange={handleChange}
                                    required
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-[#2F73D9]"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-[#102033]">
                                    Monto programado (S/)
                                </label>
                                <input
                                    type="number"
                                    name="monto"
                                    value={form.monto}
                                    onChange={handleChange}
                                    min="0"
                                    step="0.01"
                                    placeholder="0.00"
                                    required
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-[#2F73D9]"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-[#102033]">
                                    Porcentaje
                                </label>
                                <input
                                    value={`${porcentajeCalculado}%`}
                                    readOnly
                                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm shadow-sm"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <p className="mb-4 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
                                    La programación se registrará como pendiente hasta que se registre el pago.
                                </p>
                                <label className="mb-1 block text-sm font-medium text-[#102033]">
                                    Observaciones
                                </label>
                                <textarea
                                    name="observaciones"
                                    value={form.observaciones}
                                    onChange={handleChange}
                                    rows={4}
                                    placeholder="Ej. 40% al firmar la orden, saldo contra entrega..."
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-[#2F73D9]"
                                />
                            </div>
                        </div>
                    </section>

                    <div className="flex justify-end gap-3 pb-8">
                        <Link
                            href={`/eventos/${params.id}`}
                            className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                        >
                            Cancelar
                        </Link>

                        <button
                            type="submit"
                            disabled={guardando}
                            className="rounded-lg bg-[#2F73D9] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#245DB3] disabled:opacity-60"
                        >
                            {guardando ? "Guardando..." : "Guardar programación"}
                        </button>
                    </div>
                </form>

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
