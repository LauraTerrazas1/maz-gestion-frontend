"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import MainLayout from "@/components/layout/MainLayout";
import CustomSelect from "@/components/ui/CustomSelect";
import Toast from "@/components/ui/Toast";
import type { ToastTipo } from "@/components/ui/Toast";
import { apiFetch } from "@/lib/api";

type GrupoPersonal = {
    id: string;
    evento_id: string;
    cargo_funcion: string;
    cantidad_personas: number;
    pago_unitario: number | string;
    subtotal: number | string;
    fecha_pago: string | null;
    metodo_pago: string | null;
    observaciones: string | null;
    estado: string;
    eventos?: {
        nombre: string | null;
        cliente: string | null;
    };
};

type Evento = {
    id: string;
    nombre: string;
};

const ESTADO_OPTIONS = [
    { value: "todos", label: "Todos los estados" },
    { value: "pendiente", label: "Pendiente" },
    { value: "pagado", label: "Pagado" },
    { value: "vencido", label: "Vencido" },
];

export default function PersonalEventualPage() {
    const [grupos, setGrupos] = useState<GrupoPersonal[]>([]);
    const [eventos, setEventos] = useState<Evento[]>([]);
    const [busqueda, setBusqueda] = useState("");
    const [eventoFiltro, setEventoFiltro] = useState("todos");
    const [estadoFiltro, setEstadoFiltro] = useState("todos");
    const [grupoSeleccionado, setGrupoSeleccionado] = useState<GrupoPersonal | null>(null);
    const [toast, setToast] = useState<{ tipo: ToastTipo; mensaje: string } | null>(null);

    async function cargarGrupos() {
        try {
            const data = await apiFetch("/personal-eventual/grupos");
            setGrupos(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error cargando grupos de personal eventual:", error);
            setGrupos([]);
        }
    }

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
        void Promise.resolve().then(cargarGrupos);
        void Promise.resolve().then(cargarEventos);
    }, []);

    const eventoOptions = [
        { value: "todos", label: "Todos los eventos" },
        ...eventos.map((evento) => ({ value: evento.id, label: evento.nombre })),
    ];

    function moneda(value: number | string | null | undefined) {
        return new Intl.NumberFormat("es-PE", {
            style: "currency",
            currency: "PEN",
            minimumFractionDigits: 2,
        }).format(Number(value || 0));
    }

    function valor(value?: string | null) {
        return value && value.trim() !== "" ? value : "No registrado";
    }

    function formatearEstado(estado: string) {
        if (estado === "pendiente") return "Pendiente";
        if (estado === "pagado") return "Pagado";
        if (estado === "vencido") return "Vencido";
        return estado;
    }

    function formatearMetodo(metodo: string | null) {
        if (metodo === "transferencia") return "Transferencia";
        if (metodo === "yape") return "Yape";
        if (metodo === "plin") return "Plin";
        if (metodo === "efectivo") return "Efectivo";
        return valor(metodo);
    }

    function estadoBadgeClass(estado: string) {
        if (estado === "pagado") {
            return "border-green-200 bg-green-50 text-green-700";
        }

        if (estado === "pendiente") {
            return "border-amber-200 bg-amber-50 text-amber-700";
        }

        if (estado === "vencido") {
            return "border-red-200 bg-red-50 text-red-700";
        }

        return "border-slate-200 bg-slate-50 text-slate-600";
    }

    const gruposFiltrados = grupos.filter((grupo) => {
        const texto = `${grupo.cargo_funcion || ""} ${grupo.eventos?.nombre || ""}`.toLowerCase();

        const coincideBusqueda = texto.includes(busqueda.toLowerCase());
        const coincideEvento =
            eventoFiltro === "todos" || grupo.evento_id === eventoFiltro;
        const coincideEstado =
            estadoFiltro === "todos" || grupo.estado === estadoFiltro;

        return coincideBusqueda && coincideEvento && coincideEstado;
    });

    return (
        <MainLayout>
            <main className="min-h-screen bg-[#F6F8FB] p-8">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-[#102033]">Personal eventual</h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Grupos de personal contratado por evento gestionados por MAZ Producciones.
                        </p>
                    </div>

                    <Link
                        href="/personal-eventual/nuevo"
                        className="rounded-lg bg-[#2F73D9] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#245DB3]"
                    >
                        + Registrar grupo
                    </Link>
                </div>

                <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <input
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            placeholder="Buscar por cargo o evento"
                            className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm shadow-sm outline-none focus:border-[#2F73D9]"
                        />

                        <CustomSelect
                            name="evento_filtro"
                            value={eventoFiltro}
                            options={eventoOptions}
                            onChange={setEventoFiltro}
                            placeholder="Todos los eventos"
                        />

                        <CustomSelect
                            name="estado_filtro"
                            value={estadoFiltro}
                            options={ESTADO_OPTIONS}
                            onChange={setEstadoFiltro}
                            placeholder="Todos los estados"
                        />
                    </div>
                </section>

                <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    {gruposFiltrados.length === 0 ? (
                        <p className="p-6 text-sm text-slate-500">
                            No hay grupos de personal eventual registrados.
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 text-slate-600">
                                    <tr>
                                        <th className="px-6 py-3 text-left">Cargo / Función</th>
                                        <th className="px-6 py-3 text-left">Evento</th>
                                        <th className="px-6 py-3 text-right">Cantidad de personas</th>
                                        <th className="px-6 py-3 text-right">Pago unitario</th>
                                        <th className="px-6 py-3 text-right">Subtotal</th>
                                        <th className="px-6 py-3 text-left">Fecha de pago</th>
                                        <th className="px-6 py-3 text-left">Estado</th>
                                        <th className="min-w-[140px] px-6 py-3 text-right">Acción</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {gruposFiltrados.map((grupo) => (
                                        <tr key={grupo.id} className="border-t border-slate-100">
                                            <td className="px-6 py-4 font-semibold text-[#102033]">
                                                {valor(grupo.cargo_funcion)}
                                            </td>

                                            <td className="px-6 py-4 text-slate-600">
                                                {valor(grupo.eventos?.nombre)}
                                            </td>

                                            <td className="px-6 py-4 text-right text-slate-600">
                                                {grupo.cantidad_personas}
                                            </td>

                                            <td className="px-6 py-4 text-right text-slate-600">
                                                {moneda(grupo.pago_unitario)}
                                            </td>

                                            <td className="px-6 py-4 text-right font-bold text-[#102033]">
                                                {moneda(grupo.subtotal)}
                                            </td>

                                            <td className="px-6 py-4 text-slate-600">
                                                {valor(grupo.fecha_pago)}
                                            </td>

                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex items-center whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold ${estadoBadgeClass(
                                                        grupo.estado
                                                    )}`}
                                                >
                                                    {formatearEstado(grupo.estado)}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => setGrupoSeleccionado(grupo)}
                                                    className="font-semibold text-[#2F73D9] hover:text-[#245DB3]"
                                                >
                                                    Ver detalle
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                {grupoSeleccionado && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                        <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-lg">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h2 className="text-xl font-bold text-[#102033]">
                                        {valor(grupoSeleccionado.cargo_funcion)}
                                    </h2>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Detalle del grupo de personal eventual.
                                    </p>
                                </div>

                                <button
                                    onClick={() => setGrupoSeleccionado(null)}
                                    className="rounded-full border border-slate-300 px-3 py-1 text-sm"
                                >
                                    ×
                                </button>
                            </div>

                            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                                <DetalleItem label="Evento" value={valor(grupoSeleccionado.eventos?.nombre)} />
                                <DetalleItem
                                    label="Cantidad de personas"
                                    value={String(grupoSeleccionado.cantidad_personas)}
                                />
                                <DetalleItem
                                    label="Pago unitario"
                                    value={moneda(grupoSeleccionado.pago_unitario)}
                                />
                                <DetalleItem label="Subtotal" value={moneda(grupoSeleccionado.subtotal)} />
                                <DetalleItem
                                    label="Fecha de pago"
                                    value={valor(grupoSeleccionado.fecha_pago)}
                                />
                                <DetalleItem
                                    label="Método de pago"
                                    value={formatearMetodo(grupoSeleccionado.metodo_pago)}
                                />
                                <DetalleItem label="Estado" value={formatearEstado(grupoSeleccionado.estado)} />
                            </div>

                            <div className="mt-5">
                                <DetalleItem
                                    label="Observaciones"
                                    value={valor(grupoSeleccionado.observaciones)}
                                />
                            </div>

                            <div className="mt-6 flex justify-end">
                                <button
                                    onClick={() => setGrupoSeleccionado(null)}
                                    className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {toast && (
                    <Toast tipo={toast.tipo} mensaje={toast.mensaje} onClose={() => setToast(null)} />
                )}
            </main>
        </MainLayout>
    );
}

function DetalleItem({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
            <p className="mt-1 text-sm font-semibold text-[#102033]">{value}</p>
        </div>
    );
}