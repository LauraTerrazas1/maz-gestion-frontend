"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MainLayout from "@/components/layout/MainLayout";
import CustomSelect from "@/components/ui/CustomSelect";
import Toast from "@/components/ui/Toast";
import type { ToastTipo } from "@/components/ui/Toast";
import { apiFetch } from "@/lib/api";

type Evento = {
    id: string;
    nombre: string;
    cliente: string;
};

type GrupoForm = {
    evento_id: string;
    cargo: string;
    cantidad_personas: string;
    pago_unitario: string;
    fecha_pago: string;
    metodo_pago: string;
    observaciones: string;
};

const initialForm: GrupoForm = {
    evento_id: "",
    cargo: "",
    cantidad_personas: "",
    pago_unitario: "",
    fecha_pago: "",
    metodo_pago: "transferencia",
    observaciones: "",
};

const METODO_PAGO_OPTIONS = [
    { value: "transferencia", label: "Transferencia bancaria" },
    { value: "yape", label: "Yape" },
    { value: "plin", label: "Plin" },
    { value: "efectivo", label: "Efectivo" },
];

export default function NuevoGrupoPersonalPage() {
    const router = useRouter();

    const [eventos, setEventos] = useState<Evento[]>([]);
    const [form, setForm] = useState<GrupoForm>(initialForm);
    const [guardando, setGuardando] = useState(false);
    const [toast, setToast] = useState<{ tipo: ToastTipo; mensaje: string } | null>(null);

    async function cargarEventos() {
        try {
            const data = await apiFetch("/eventos/");
            setEventos(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error cargando eventos:", error);
            setEventos([]);
        }
    }

    useEffect(() => {
        void Promise.resolve().then(cargarEventos);
    }, []);

    const eventoOptions = eventos.map((evento) => ({
        value: evento.id,
        label: `${evento.nombre} - ${evento.cliente}`,
    }));

    const subtotal = useMemo(() => {
        const cantidad = Number(form.cantidad_personas) || 0;
        const unitario = Number(form.pago_unitario) || 0;
        return cantidad * unitario;
    }, [form.cantidad_personas, form.pago_unitario]);

    function moneda(value: number) {
        return new Intl.NumberFormat("es-PE", {
            style: "currency",
            currency: "PEN",
            minimumFractionDigits: 2,
        }).format(value || 0);
    }

    function handleChange(
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    }

    function limpiarOpcional(value: string) {
        return value.trim() === "" ? null : value.trim();
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!form.evento_id) {
            setToast({ tipo: "error", mensaje: "Selecciona un evento." });
            return;
        }

        if (!form.cargo.trim()) {
            setToast({ tipo: "error", mensaje: "Ingresa el cargo o función." });
            return;
        }

        if (!form.cantidad_personas || Number(form.cantidad_personas) <= 0) {
            setToast({ tipo: "error", mensaje: "Ingresa una cantidad de personas válida." });
            return;
        }

        if (!form.pago_unitario || Number(form.pago_unitario) <= 0) {
            setToast({ tipo: "error", mensaje: "Ingresa un pago unitario válido." });
            return;
        }

        setGuardando(true);

        try {
            await apiFetch("/personal-eventual/grupos", {
                method: "POST",
                body: JSON.stringify({
                    evento_id: form.evento_id,
                    cargo_funcion: form.cargo.trim(),
                    cantidad_personas: Number(form.cantidad_personas),
                    pago_unitario: Number(form.pago_unitario),
                    fecha_pago: limpiarOpcional(form.fecha_pago),
                    metodo_pago: form.metodo_pago,
                    observaciones: limpiarOpcional(form.observaciones),
                }),
            });

            router.push("/personal-eventual");
        } catch (error) {
            console.error("Error registrando grupo:", error);
            setToast({ tipo: "error", mensaje: "No se pudo registrar el grupo." });
        } finally {
            setGuardando(false);
        }
    }

    return (
        <MainLayout>
            <main className="min-h-screen bg-[#F6F8FB] p-8">
                <Link href="/personal-eventual" className="text-sm font-medium text-[#2F73D9]">
                    ← Volver a personal eventual
                </Link>

                <div className="mt-6">
                    <h1 className="text-3xl font-bold text-[#102033]">Registrar grupo</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Registra un nuevo grupo de personal eventual para un evento.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="font-semibold text-[#102033]">1. Datos del grupo</h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Evento y función que desempeñará este grupo de personal.
                        </p>

                        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="md:col-span-2">
                                <label className="mb-1 block text-sm font-medium text-[#102033]">
                                    Evento
                                </label>
                                <CustomSelect
                                    name="evento_id"
                                    value={form.evento_id}
                                    options={eventoOptions}
                                    onChange={(value) => setForm((prev) => ({ ...prev, evento_id: value }))}
                                    placeholder="Selecciona un evento"
                                    required
                                />
                            </div>

                            <Campo
                                label="Cargo / Función"
                                name="cargo"
                                value={form.cargo}
                                onChange={handleChange}
                                placeholder="Ej. Personal de logística"
                                required
                            />
                        </div>
                    </section>

                    <section className="rounded-2xl border border-sky-200 bg-sky-50 p-6 shadow-sm">
                        <h2 className="font-semibold text-[#102033]">2. Cantidad y pago</h2>
                        <p className="mt-1 text-sm text-slate-600">
                            El subtotal se calcula automáticamente según la cantidad de personas y el pago unitario.
                        </p>

                        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                            <Campo
                                label="Cantidad de personas"
                                name="cantidad_personas"
                                type="number"
                                value={form.cantidad_personas}
                                onChange={handleChange}
                                placeholder="0"
                                required
                            />

                            <Campo
                                label="Pago unitario (S/)"
                                name="pago_unitario"
                                type="number"
                                value={form.pago_unitario}
                                onChange={handleChange}
                                placeholder="0.00"
                                required
                            />

                            <div>
                                <label className="mb-1 block text-sm font-medium text-[#102033]">
                                    Subtotal
                                </label>
                                <div className="flex h-[42px] items-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-bold text-[#102033] shadow-sm">
                                    {moneda(subtotal)}
                                </div>
                            </div>

                            <Campo
                                label="Fecha de pago"
                                name="fecha_pago"
                                type="date"
                                value={form.fecha_pago}
                                onChange={handleChange}
                            />

                            <div>
                                <label className="mb-1 block text-sm font-medium text-[#102033]">
                                    Método de pago
                                </label>
                                <CustomSelect
                                    name="metodo_pago"
                                    value={form.metodo_pago}
                                    options={METODO_PAGO_OPTIONS}
                                    onChange={(value) => setForm((prev) => ({ ...prev, metodo_pago: value }))}
                                    placeholder="Selecciona un método"
                                />
                            </div>
                        </div>
                    </section>

                    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="font-semibold text-[#102033]">3. Observaciones</h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Notas adicionales sobre este grupo de personal.
                        </p>

                        <div className="mt-6">
                            <textarea
                                name="observaciones"
                                value={form.observaciones}
                                onChange={handleChange}
                                rows={4}
                                placeholder="Notas internas sobre el grupo..."
                                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm shadow-sm outline-none focus:border-[#2F73D9]"
                            />
                        </div>
                    </section>

                    <div className="flex justify-end gap-3 pb-8">
                        <Link
                            href="/personal-eventual"
                            className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                        >
                            Cancelar
                        </Link>

                        <button
                            type="submit"
                            disabled={guardando}
                            className="rounded-lg bg-[#2F73D9] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#245DB3] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {guardando ? "Guardando..." : "Guardar grupo"}
                        </button>
                    </div>
                </form>

                {toast && (
                    <Toast tipo={toast.tipo} mensaje={toast.mensaje} onClose={() => setToast(null)} />
                )}
            </main>
        </MainLayout>
    );
}

function Campo({
    label,
    name,
    value,
    onChange,
    placeholder,
    type = "text",
    required = false,
}: {
    label: string;
    name: string;
    value: string;
    onChange: (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => void;
    placeholder?: string;
    type?: string;
    required?: boolean;
}) {
    return (
        <div>
            <label className="mb-1 block text-sm font-medium text-[#102033]">
                {label}
            </label>
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                min={type === "number" ? "0" : undefined}
                step={type === "number" ? "0.01" : undefined}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-[#2F73D9]"
            />
        </div>
    );
}