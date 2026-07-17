"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import FlowStepper from "@/components/ui/FlowStepper";
import { apiFetch } from "@/lib/api";

type Evento = {
    id: string;
    nombre: string;
    cliente: string | null;
    fecha_inicio: string;
    fecha_fin: string;
    ubicacion: string | null;
    observaciones: string | null;
    presupuesto_aprobado: number;
    tipo_presupuesto: string;
    monto_recibido_cliente: number;
    saldo_pendiente_cliente?: number;
    porcentaje_adelanto?: number;
    estado: string;
    color_card?: string | null;
};

type EventoProveedor = {
    id: string;
    servicio: string;
    estado: string | null;
    monto_contratado: number;
    proveedores?: {
        razon_social?: string | null;
        contacto_nombre?: string | null;
    } | null;
};

type EstadoProgramacionPago =
    | "pendiente"
    | "pagado"
    | "pagado_sin_comprobante";

type ProgramacionPago = {
    id: string;
    tipo_programacion: string;
    fecha_programada: string;
    monto: number;
    porcentaje: number;
    estado: EstadoProgramacionPago;
    evento_proveedores?: {
        servicio?: string | null;
        proveedores?: {
            razon_social?: string | null;
        } | null;
    } | null;
};

type Pago = {
    id: string;
    evento_id: string;

    origen: "proveedor" | "personal_eventual";

    tipo_pago: string;
    metodo_pago: string;

    monto: number | string;

    fecha_real_pago: string | null;
    fecha_programada: string | null;

    estado: string;

    proveedores?: {
        razon_social?: string | null;
    } | null;

    evento_proveedores?: {
        servicio?: string | null;
    } | null;

    personal_eventual_grupos?: {
        cargo_funcion?: string | null;
        cantidad_personas?: number | null;
    } | null;
};

type PersonalEventualGrupo = {
    id: string;
    evento_id: string;
    cargo_funcion?: string | null;
    cantidad_personas?: number | null;
    pago_unitario?: number | string | null;
    monto_total?: number | string | null;
    estado?: string | null;
};

type IconName =
    | "wallet"
    | "arrow-down-circle"
    | "clock"
    | "percent"
    | "users"
    | "dollar-sign"
    | "clipboard-list"
    | "check-circle"
    | "briefcase-business"
    | "alert-triangle";

function formatearEstado(estado: string) {
    if (estado === "planificacion") return "En planificación";
    if (estado === "en_curso") return "En curso";
    if (estado === "pendiente_cierre") return "Pendiente de cierre";
    if (estado === "finalizado") return "Finalizado";
    if (estado === "pagado_sin_comprobante") return "Pagado sin comprobante";
    return estado?.replaceAll("_", " ");
}

function formatearEstadoProgramacion(estado: EstadoProgramacionPago) {
    if (estado === "pagado_sin_comprobante") return "Pagado sin comprobante";
    if (estado === "pagado") return "Pagado";
    if (estado === "pendiente") return "Pendiente";
    return estado;
}

function formatearEstadoPago(estado: string) {
    if (estado === "pagado_sin_comprobante") return "Pagado sin comprobante";
    if (estado === "pagado") return "Pagado";
    if (estado === "pendiente") return "Pendiente";
    if (estado === "vencido") return "Vencido";
    return estado?.replaceAll("_", " ");
}

function estadoBadgeClass(estado: string) {
    if (
        estado === "pagado" ||
        estado === "activo" ||
        estado === "resuelta" ||
        estado === "aprobado"
    ) {
        return "border-green-200 bg-green-50 text-green-700";
    }

    if (estado === "en_curso") {
        return "border-blue-200 bg-blue-50 text-blue-700";
    }

    if (estado === "pendiente_cierre") {
        return "border-orange-200 bg-orange-50 text-orange-700";
    }

    if (estado === "pendiente" || estado === "planificacion") {
        return "border-amber-200 bg-amber-50 text-amber-700";
    }

    if (
        estado === "pagado_sin_comprobante" ||
        estado === "comprobante_pendiente"
    ) {
        return "border-sky-200 bg-sky-50 text-sky-700";
    }

    if (estado === "vencido" || estado === "pago_vencido") {
        return "border-red-200 bg-red-50 text-red-700";
    }

    if (estado === "inactivo") {
        return "border-slate-200 bg-slate-100 text-slate-600";
    }

    return "border-slate-200 bg-slate-50 text-slate-600";
}

function formatearTipoPresupuesto(tipo: string) {
    if (tipo === "incluye_igv") return "Incluye IGV";
    if (tipo === "no_incluye_igv") return "No incluye IGV";
    return tipo?.replaceAll("_", " ");
}

function formatearColorCard(color?: string | null) {
    if (color === "verde") return "Verde";
    if (color === "naranja") return "Naranja";
    if (color === "morado") return "Morado";
    if (color === "rosado") return "Rosado";
    if (color === "rojo") return "Rojo";
    if (color === "amarillo") return "Amarillo";
    if (color === "turquesa") return "Turquesa";
    if (color === "indigo") return "Indigo";
    if (color === "gris") return "Gris";
    if (color === "negro") return "Negro";
    return "Azul";
}

function colorIdentificadorClass(color: string | null | undefined) {
    const value = (color || "").toLowerCase();

    if (value === "rojo") return "bg-red-500";
    if (value === "azul") return "bg-blue-500";
    if (value === "verde") return "bg-green-500";
    if (value === "naranja") return "bg-orange-500";
    if (value === "morado") return "bg-purple-500";
    if (value === "rosado") return "bg-pink-500";
    if (value === "amarillo") return "bg-yellow-400";
    if (value === "celeste") return "bg-sky-400";
    if (value === "gris") return "bg-slate-400";

    return "bg-slate-400";
}

export default function DetalleEventoPage() {
    const params = useParams<{ id: string }>();

    const [evento, setEvento] = useState<Evento | null>(null);
    const [proveedores, setProveedores] = useState<EventoProveedor[]>([]);
    const [programaciones, setProgramaciones] = useState<ProgramacionPago[]>([]);
    const [pagos, setPagos] = useState<Pago[]>([]);
    const [personalEventual, setPersonalEventual] = useState<PersonalEventualGrupo[]>([]);

    async function cargarEvento() {
        const eventoId = params.id;

        const data = await apiFetch(`/eventos/${eventoId}`);
        setEvento(data);

        const proveedoresData = await apiFetch(`/eventos/${eventoId}/proveedores`);
        setProveedores(Array.isArray(proveedoresData) ? proveedoresData : []);

        const programacionesData = await apiFetch(
            `/programaciones-pago/evento/${eventoId}`
        );
        setProgramaciones(Array.isArray(programacionesData) ? programacionesData : []);

        const pagosData = await apiFetch("/pagos/");
        const pagosEvento = Array.isArray(pagosData)
            ? pagosData.filter((pago: Pago) => pago.evento_id === eventoId)
            : [];
        setPagos(pagosEvento);
        const personalData = await apiFetch(`/personal-eventual/grupos/evento/${eventoId}`);
        setPersonalEventual(Array.isArray(personalData) ? personalData : []);
        const personalEvento = Array.isArray(personalData)
            ? personalData.filter(
                (item: PersonalEventualGrupo) => item.evento_id === eventoId
            )
            : [];

        setPersonalEventual(personalEvento);
    }

    async function eliminarProveedorAsociado(relacionId: string) {
        try {
            await apiFetch(`/evento-proveedores/${relacionId}`, {
                method: "DELETE",
            });

            await cargarEvento();
        } catch (error) {
            console.error("Error eliminando proveedor asociado:", error);
            alert("No se pudo eliminar el proveedor asociado.");
        }
    }

    async function eliminarProgramacion(programacionId: string) {
        try {
            await apiFetch(`/programaciones-pago/${programacionId}`, {
                method: "DELETE",
            });

            await cargarEvento();
        } catch (error) {
            console.error("Error eliminando programación:", error);
            alert("No se pudo eliminar la programación.");
        }
    }

    useEffect(() => {
        cargarEvento();
    }, [params.id]);

    if (!evento) {
        return (
            <MainLayout>
                <main className="min-h-screen bg-[#F6F8FB] p-8">Cargando...</main>
            </MainLayout>
        );
    }

    function moneda(value: number | string | null | undefined) {
        return new Intl.NumberFormat("es-PE", {
            style: "currency",
            currency: "PEN",
            minimumFractionDigits: 2,
        }).format(Number(value || 0));
    }

    const totalPersonalEventual = personalEventual.reduce(
        (acc, item) =>
            acc + Number(item.monto_total || Number(item.cantidad_personas || 0) * Number(item.pago_unitario || 0)),
        0
    );

    const totalComprometido =
        proveedores.reduce(
            (acc, item) => acc + Number(item.monto_contratado || 0),
            0
        ) + totalPersonalEventual;

    const totalProgramado = programaciones.reduce(
        (acc, item) => acc + Number(item.monto || 0),
        0
    );

    const totalPagado = pagos.reduce((acc, item) => {
        if (item.estado !== "pagado" && item.estado !== "pagado_sin_comprobante") {
            return acc;
        }

        return acc + Number(item.monto || 0);
    }, 0);

    const totalPendiente = totalProgramado - totalPagado;

    const saldoPendienteClienteCapacidad =
        Number(evento.presupuesto_aprobado || 0) -
        Number(evento.monto_recibido_cliente || 0);

    const obligacionesPendientes = totalComprometido - totalPagado;

    const capacidadPago = saldoPendienteClienteCapacidad - obligacionesPendientes;
    const capacidadPagoOk = capacidadPago >= 0;
    const montoCapacidadPago = Math.abs(capacidadPago);

    const programacionesProximas = [...programaciones]
        .sort((a, b) =>
            new Date(a.fecha_programada).getTime() -
            new Date(b.fecha_programada).getTime()
        )
        .slice(0, 5);

    const pagosRecientes = [...pagos]
        .sort((a, b) => {
            const fechaA = a.fecha_real_pago
                ? new Date(a.fecha_real_pago).getTime()
                : 0;
            const fechaB = b.fecha_real_pago
                ? new Date(b.fecha_real_pago).getTime()
                : 0;
            return fechaB - fechaA;
        })
        .slice(0, 5);

    // Helper: calcular monto pagado para un servicio / proveedor (UI-only)
    function pagadoParaServicio(servicio?: string | null) {
        if (!servicio) return 0;
        return pagos.reduce((acc, p) => {
            const servicioPago = p.evento_proveedores?.servicio;
            if (servicioPago !== servicio) return acc;
            if (p.estado !== "pagado" && p.estado !== "pagado_sin_comprobante") return acc;
            return acc + Number(p.monto || 0);
        }, 0);
    }

    return (
        <MainLayout>
            <main className="min-h-screen bg-[#F6F8FB] p-8">
                <Link href="/eventos" className="text-sm font-medium text-[#2F73D9]">
                    &larr; Volver a eventos
                </Link>

                <div className="mt-6 flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-[#102033]">
                            {evento.nombre}
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Cliente: {evento.cliente || "No registrado"}
                        </p>
                        <p className="mt-2 text-sm text-slate-500">
                            {evento.fecha_inicio} - {evento.fecha_fin}{" "}
                            {evento.ubicacion || "Sin ubicacion"}
                        </p>
                    </div>

                    <Link
                        href={`/eventos/${evento.id}/editar`}
                        className="rounded-lg bg-[#2F73D9] px-5 py-2 text-sm font-semibold text-white shadow-sm"
                    >
                        Editar evento
                    </Link>
                </div>

                {/* Resumen financiero: agrupa dinero del cliente, operación y capacidad */}
                <section id="resumen-financiero" className="mt-8">
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div>
                            <h2 className="text-lg font-semibold text-[#102033]">Resumen financiero</h2>
                            <p className="mt-1 text-sm text-slate-500">Resumen rápido del presupuesto, cobros y obligaciones del evento.</p>
                        </div>

                        <div className="mt-4 space-y-6">
                            <DashboardSection titulo="Dinero del cliente">
                                <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-3">
                                    <ResumenCard
                                        icono="wallet"
                                        titulo="Presupuesto aprobado"
                                        valor={moneda(evento.presupuesto_aprobado)}
                                        subtitulo="Monto acordado con el cliente"
                                        color="azul"
                                    />

                                    <ResumenCard
                                        icono="arrow-down-circle"
                                        titulo="Recibido del cliente"
                                        valor={moneda(evento.monto_recibido_cliente)}
                                        subtitulo="Ingreso registrado para el evento"
                                        color="azul"
                                    />

                                    <ResumenCard
                                        icono="clock"
                                        titulo="Saldo cliente"
                                        valor={moneda(evento.saldo_pendiente_cliente || 0)}
                                        subtitulo="Monto pendiente de cobro"
                                        color="azul"
                                    />
                                </div>
                            </DashboardSection>

                            <DashboardSection titulo="Operación">
                                <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-3">
                                    <ResumenCard
                                        icono="dollar-sign"
                                        titulo="Comprometido"
                                        valor={moneda(totalComprometido)}
                                        subtitulo="Montos contratados"
                                        color="verde"
                                    />

                                    <ResumenCard
                                        icono="check-circle"
                                        titulo="Pagado"
                                        valor={moneda(totalPagado)}
                                        subtitulo="Pagos realizados"
                                        color="verde"
                                    />

                                    <ResumenCard
                                        icono={obligacionesPendientes < 0 ? "alert-triangle" : "clipboard-list"}
                                        titulo={obligacionesPendientes < 0 ? "Sobrecosto" : "Por pagar"}
                                        valor={moneda(Math.abs(obligacionesPendientes))}
                                        subtitulo={
                                            obligacionesPendientes < 0
                                                ? "Pagos exceden lo comprometido"
                                                : "Obligaciones pendientes"
                                        }
                                        color={obligacionesPendientes < 0 ? "rojo" : "verde"}
                                    />
                                </div>
                            </DashboardSection>
                        </div>
                    </div>
                </section>

                {/* Flow stepper inserted below financial summary and before event info */}
                <FlowStepper
                    proveedoresCount={proveedores.length}
                    programacionesCount={programaciones.length}
                    pagos={pagos}
                    saldoPendiente={Number(totalPendiente)}
                />

                <section id="informacion-evento" className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 bg-[#F6F8FB] px-6 py-5">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[#2F73D9]">
                            Información del evento
                        </p>
                        <h2 className="mt-2 text-2xl font-semibold text-[#102033]">
                            Datos generales y administrativos del evento
                        </h2>
                    </div>

                    <div className="grid gap-4 p-6 md:grid-cols-2">
                        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#2F73D9]">Nombre</p>
                            <p className="text-sm font-semibold text-[#102033]">{evento.nombre}</p>
                        </div>
                        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#2F73D9]">Cliente</p>
                            <p className="text-sm font-semibold text-[#102033]">{evento.cliente || "No registrado"}</p>
                        </div>
                        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#2F73D9]">Fecha inicio</p>
                            <p className="text-sm font-semibold text-[#102033]">{evento.fecha_inicio}</p>
                        </div>
                        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#2F73D9]">Fecha fin</p>
                            <p className="text-sm font-semibold text-[#102033]">{evento.fecha_fin}</p>
                        </div>
                        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#2F73D9]">Ubicación</p>
                            <p className="text-sm font-semibold text-[#102033]">{evento.ubicacion || "Sin ubicación"}</p>
                        </div>
                        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#2F73D9]">Tipo presupuesto</p>
                            <p className="text-sm font-semibold text-[#102033]">{formatearTipoPresupuesto(evento.tipo_presupuesto)}</p>
                        </div>
                        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#2F73D9]">Estado</p>
                            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${estadoBadgeClass(evento.estado)}`}>
                                <span className="h-2.5 w-2.5 rounded-full bg-[#2F73D9]" />
                                {formatearEstado(evento.estado)}
                            </span>
                            {evento.estado === "pendiente_cierre" && (
                                <button
                                    onClick={async () => {
                                        const confirmar = confirm(
                                            "¿Deseas finalizar este evento? Una vez finalizado pasará al historial."
                                        );

                                        if (!confirmar) return;

                                        await apiFetch(`/eventos/${evento.id}/finalizar`, {
                                            method: "PUT",
                                        });

                                        window.location.reload();
                                    }}
                                    className="mt-3 w-full rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700"
                                >
                                    Finalizar evento
                                </button>
                            )}
                        </div>
                        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#2F73D9]">Color identificador</p>
                            <div className="flex items-center gap-3">
                                <span className={`h-3.5 w-3.5 rounded-full shadow-sm ${colorIdentificadorClass(evento.color_card)}`} />
                                <p className="text-sm font-semibold text-[#102033]">{formatearColorCard(evento.color_card)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-slate-100 bg-[#F6F8FB] px-6 py-5">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[#2F73D9]">Observaciones</p>
                        <p className="mt-3 rounded-3xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700">
                            {evento.observaciones || "Sin observaciones"}
                        </p>
                    </div>
                </section>

                <section id="proveedores-asociados" className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b p-6">
                        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-[#102033]">
                                    Proveedores asociados
                                </h2>
                                <p className="text-sm text-slate-500">
                                    Resumen compacto de proveedores asociados. Para ver detalles completos vaya a cada proveedor.
                                </p>
                            </div>

                            <Link
                                href={`/eventos/${params.id}/asociar-proveedor`}
                                className="inline-flex items-center justify-center rounded-lg bg-[#2F73D9] px-4 py-2 text-sm font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-[#245DB3] hover:shadow-md"
                            >
                                + Asociar proveedor
                            </Link>
                        </div>
                    </div>

                    {proveedores.length === 0 ? (
                        <p className="p-6 text-slate-500">
                            Este evento aun no tiene proveedores asociados.
                        </p>
                    ) : (
                        <div className="overflow-x-auto p-6">
                            <table className="min-w-full text-sm">
                                <thead className="bg-slate-50 text-slate-600">
                                    <tr>
                                        <th className="px-4 py-3 text-left">Proveedor</th>
                                        <th className="px-4 py-3 text-left">Servicio</th>
                                        <th className="px-4 py-3 text-right">Monto contratado</th>
                                        <th className="px-4 py-3 text-right">Pagado</th>
                                        <th className="px-4 py-3 text-right">Saldo pendiente</th>
                                        <th className="px-4 py-3 text-left">Estado</th>
                                        <th className="px-4 py-3 text-left">Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {proveedores.map((item) => {
                                        const pagado = pagadoParaServicio(item.servicio);
                                        const saldo = Number(item.monto_contratado || 0) - pagado;

                                        return (
                                            <tr key={item.id} className="border-t border-slate-200 transition duration-200 hover:bg-slate-50">
                                                <td className="px-4 py-4 font-semibold text-[#102033]">
                                                    {item.proveedores?.razon_social || "No registrado"}
                                                </td>
                                                <td className="px-4 py-4 text-slate-600">
                                                    {item.servicio}
                                                </td>
                                                <td className="px-4 py-4 text-right font-semibold">
                                                    {moneda(item.monto_contratado)}
                                                </td>
                                                <td className="px-4 py-4 text-right font-semibold text-[#102033]">
                                                    {moneda(pagado)}
                                                </td>
                                                <td className="px-4 py-4 text-right font-semibold text-[#102033]">
                                                    {moneda(saldo)}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${estadoBadgeClass(item.estado || "pendiente")}`}>
                                                        {formatearEstado(item.estado || "pendiente")}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="relative inline-block text-left overflow-visible">
                                                        <details>
                                                            <summary className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50">
                                                                ...
                                                            </summary>

                                                            <div className="absolute right-0 bottom-full z-50 mb-2 w-40 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                                                                <Link
                                                                    href={`/eventos/${params.id}/proveedores/${item.id}`}
                                                                    className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                                                >
                                                                    Ver detalle
                                                                </Link>

                                                                <button
                                                                    type="button"
                                                                    onClick={() => eliminarProveedorAsociado(item.id)}
                                                                    className="rounded-lg px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
                                                                >
                                                                    Eliminar
                                                                </button>
                                                            </div>
                                                        </details>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                <section id="programaciones" className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-[#102033]">
                                Programaciones del evento
                            </h2>
                            <p className="text-sm text-slate-500">
                                Resumen de las próximas programaciones de pago.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <Link
                                href={`/eventos/${params.id}/programaciones`}
                                className="inline-flex items-center justify-center rounded-lg border border-[#2F73D9] bg-white px-4 py-2 text-sm font-semibold text-[#2F73D9] transition duration-200 hover:bg-[#F6F8FB]"
                            >
                                Ver todas las programaciones
                            </Link>
                        </div>
                    </div>

                    {programacionesProximas.length === 0 ? (
                        <p className="text-slate-500">
                            Este evento aun no tiene programaciones de pago.
                        </p>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {programacionesProximas.map((item) => (
                                <div
                                    key={item.id}
                                    className="rounded-2xl border border-slate-200 bg-[#F6F8FB] p-4 shadow-sm"
                                >
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-sm font-semibold text-[#102033]">
                                                {item.evento_proveedores?.proveedores?.razon_social || "Proveedor sin nombre"}
                                            </p>
                                            <p className="text-sm text-slate-600">
                                                {item.evento_proveedores?.servicio || "Servicio sin nombre"}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${estadoBadgeClass(item.estado)}`}>
                                                {formatearEstadoProgramacion(item.estado)}
                                            </span>

                                            <button
                                                type="button"
                                                onClick={() => eliminarProgramacion(item.id)}
                                                className="text-xs font-semibold text-red-600 hover:text-red-700"
                                            >
                                                Eliminar
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                                        <div className="rounded-2xl bg-white p-3">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tipo</p>
                                            <p className="mt-2 font-semibold text-[#102033]">{item.tipo_programacion}</p>
                                        </div>
                                        <div className="rounded-2xl bg-white p-3">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Monto</p>
                                            <p className="mt-2 font-semibold text-[#102033]">{moneda(item.monto)}</p>
                                        </div>
                                        <div className="rounded-2xl bg-white p-3">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Fecha</p>
                                            <p className="mt-2 font-semibold text-[#102033]">{item.fecha_programada}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <section id="pagos-asociados" className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b p-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-[#102033]">
                                    Pagos realizados
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Resumen de los últimos pagos registrados del evento.
                                </p>
                            </div>
                            <Link
                                href={`/eventos/${params.id}/pagos`}
                                className="inline-flex items-center justify-center rounded-lg border border-[#2F73D9] bg-white px-4 py-2 text-sm font-semibold text-[#2F73D9] transition duration-200 hover:bg-[#F6F8FB]"
                            >
                                Ver todos los pagos
                            </Link>
                        </div>
                    </div>

                    {pagosRecientes.length === 0 ? (
                        <p className="p-6 text-slate-500">
                            Aun no hay pagos registrados para este evento.
                        </p>
                    ) : (
                        <div className="overflow-x-auto p-6">
                            <table className="min-w-full text-sm">
                                <thead className="bg-slate-50 text-slate-600">
                                    <tr>
                                        <th className="px-4 py-3 text-left">Origen</th>
                                        <th className="px-4 py-3 text-left">Responsable</th>
                                        <th className="px-4 py-3 text-left">Concepto</th>
                                        <th className="px-4 py-3 text-right">Monto</th>
                                        <th className="px-4 py-3 text-left">Fecha</th>
                                        <th className="px-4 py-3 text-left">Estado</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {pagosRecientes.map((pago) => (
                                        <tr key={pago.id} className="border-t border-slate-200 hover:bg-slate-50">
                                            <td className="px-4 py-4">
                                                <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
                                                    {pago.origen === "personal_eventual" ? "Personal" : "Proveedor"}
                                                </span>
                                            </td>

                                            <td className="px-4 py-4 font-semibold text-[#102033]">
                                                {pago.origen === "personal_eventual"
                                                    ? pago.personal_eventual_grupos?.cargo_funcion || "Personal eventual"
                                                    : pago.proveedores?.razon_social || "No registrado"}
                                            </td>

                                            <td className="px-4 py-4 text-slate-600">
                                                {pago.origen === "personal_eventual"
                                                    ? `${pago.personal_eventual_grupos?.cantidad_personas ?? 0} personas / ${pago.tipo_pago}`
                                                    : `${pago.evento_proveedores?.servicio || "Sin servicio"} / ${pago.tipo_pago}`}
                                            </td>

                                            <td className="px-4 py-4 text-right font-semibold">
                                                {moneda(pago.monto)}
                                            </td>

                                            <td className="px-4 py-4">
                                                {pago.fecha_real_pago || pago.fecha_programada || "Sin registrar"}
                                            </td>

                                            <td className="px-4 py-4">
                                                <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${estadoBadgeClass(pago.estado)}`}>
                                                    {formatearEstadoPago(pago.estado)}
                                                </span>
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

function DashboardSection({
    titulo,
    children,
}: {
    titulo: string;
    children: ReactNode;
}) {
    return (
        <section>
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#2F73D9]">
                {titulo}
            </p>
            {children}
        </section>
    );
}

function ResumenCard({
    icono,
    titulo,
    valor,
    subtitulo,
    detalle,
    color,
}: {
    icono: IconName;
    titulo: string;
    valor: ReactNode;
    subtitulo?: string;
    detalle?: {
        etiqueta: string;
        valor: string;
    };
    color: "azul" | "verde" | "rojo";
}) {
    const acento =
        color === "rojo"
            ? {
                icono: "bg-red-50 text-red-700",
                valor: "text-red-700",
                detalle: "text-red-700",
            }
            : color === "verde"
                ? {
                    icono: "bg-[#92C83E]/15 text-green-700",
                    valor: "text-[#102033]",
                    detalle: "text-green-700",
                }
                : {
                    icono: "bg-[#2F73D9]/10 text-[#2F73D9]",
                    valor: "text-[#102033]",
                    detalle: "text-[#2F73D9]",
                };
    return (
        <article className="flex h-full min-h-40 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {titulo}
                    </p>
                    <p className={`mt-3 text-2xl font-bold ${acento.valor}`}>
                        {valor}
                    </p>
                </div>
                <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${acento.icono}`}
                >
                    <DashboardIcon name={icono} />
                </span>
            </div>

            {subtitulo ? (
                <p className="mt-3 text-sm leading-snug text-slate-500">
                    {subtitulo}
                </p>
            ) : null}

            {detalle ? (
                <div className="mt-auto border-t border-slate-200 pt-3">
                    <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-500">{detalle.etiqueta}</span>
                        <span className={`font-bold ${acento.detalle}`}>
                            {detalle.valor}
                        </span>
                    </div>
                </div>
            ) : null}
        </article>
    );
}

function OperacionPendienteCard({
    pendiente,
    programado,
    pagado,
}: {
    pendiente: string;
    programado: string;
    pagado: string;
}) {
    return (
        <article className="relative h-full min-h-40 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md md:col-span-2 xl:col-span-1">
            <div className="pr-14">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Pendiente
                </p>

                <p className="mt-3 text-2xl font-bold text-[#102033]">
                    {pendiente}
                </p>

                <p className="mt-3 text-sm leading-snug text-slate-500">
                    Por ejecutar
                </p>

                <div className="mt-4 grid gap-2 rounded-xl bg-[#F6F8FB] p-3 text-sm">
                    <div>
                        <p className="font-medium text-slate-500">Programado</p>
                        <p className="truncate font-bold text-[#102033]">{programado}</p>
                    </div>

                    <div className="border-t border-slate-200 pt-2">
                        <p className="font-medium text-slate-500">Pagado</p>
                        <p className="truncate font-bold text-[#102033]">{pagado}</p>
                    </div>
                </div>
            </div>

            <span className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full bg-[#92C83E]/15 text-green-700">
                <DashboardIcon name="clipboard-list" />
            </span>
        </article>
    );
}

function CapacidadPagoItem({
    icono,
    titulo,
    valor,
    color,
}: {
    icono: IconName;
    titulo: string;
    valor: string;
    color: "azul" | "verde";
}) {
    const estilos =
        color === "verde"
            ? {
                icono: "bg-[#92C83E]/15 text-green-700",
                valor: "text-green-700",
            }
            : {
                icono: "bg-[#2F73D9]/10 text-[#2F73D9]",
                valor: "text-[#2F73D9]",
            };

    return (
        <article className="flex min-h-32 items-center gap-4 rounded-2xl border border-slate-200 bg-[#F6F8FB] p-4">
            <span
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${estilos.icono}`}
            >
                <DashboardIcon name={icono} />
            </span>
            <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-500">{titulo}</p>
                <p className={`mt-1 truncate text-2xl font-bold ${estilos.valor}`}>
                    {valor}
                </p>
            </div>
        </article>
    );
}

function CapacidadPagoResultado({ ok, valor }: { ok: boolean; valor: string }) {
    return (
        <article
            className={`flex min-h-32 items-center gap-4 rounded-2xl border p-4 ${ok
                ? "border-green-100 bg-green-50 text-green-700"
                : "border-red-100 bg-red-50 text-red-700"
                }`}
        >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/80">
                <DashboardIcon name={ok ? "check-circle" : "alert-triangle"} />
            </span>
            <div className="min-w-0">
                <p className="text-sm font-bold">
                    {ok ? "Fondos suficientes" : "Déficit proyectado"}
                </p>
                <p className="mt-1 text-xs font-semibold uppercase text-slate-500">
                    {ok ? "Disponible después de pagar" : "Faltará financiar"}
                </p>
                <p className="mt-1 truncate text-2xl font-bold">{valor}</p>
            </div>
        </article>
    );
}

function DashboardIcon({ name }: { name: IconName }) {
    const common = {
        fill: "none",
        stroke: "currentColor",
        strokeLinecap: "round" as const,
        strokeLinejoin: "round" as const,
        strokeWidth: 2,
    };

    return (
        <svg
            aria-hidden="true"
            className="h-5 w-5"
            viewBox="0 0 24 24"
            {...common}
        >
            {name === "wallet" ? (
                <>
                    <path d="M19 7V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-1" />
                    <path d="M16 12h6v5h-6a2.5 2.5 0 0 1 0-5Z" />
                    <path d="M18 14.5h.01" />
                </>
            ) : null}
            {name === "arrow-down-circle" ? (
                <>
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 8v8" />
                    <path d="m8 12 4 4 4-4" />
                </>
            ) : null}
            {name === "clock" ? (
                <>
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 2" />
                </>
            ) : null}
            {name === "percent" ? (
                <>
                    <path d="m19 5-14 14" />
                    <circle cx="7" cy="7" r="2" />
                    <circle cx="17" cy="17" r="2" />
                </>
            ) : null}
            {name === "users" ? (
                <>
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </>
            ) : null}
            {name === "dollar-sign" ? (
                <>
                    <path d="M12 2v20" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6" />
                </>
            ) : null}
            {name === "clipboard-list" ? (
                <>
                    <path d="M9 5h6" />
                    <path d="M9 12h6" />
                    <path d="M9 16h6" />
                    <path d="M8 3h8v4H8z" />
                    <path d="M16 5h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2" />
                </>
            ) : null}
            {name === "check-circle" ? (
                <>
                    <circle cx="12" cy="12" r="9" />
                    <path d="m9 12 2 2 4-4" />
                </>
            ) : null}
            {name === "briefcase-business" ? (
                <>
                    <path d="M10 6V5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v1" />
                    <path d="M3 7h18v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
                    <path d="M3 13h18" />
                    <path d="M9 13v2h6v-2" />
                </>
            ) : null}
            {name === "alert-triangle" ? (
                <>
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                    <path d="M12 9v4" />
                    <path d="M12 17h.01" />
                </>
            ) : null}
        </svg>
    );
}

