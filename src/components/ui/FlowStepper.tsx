"use client";

import React from "react";

type Pago = {
    id: string;
    estado: string;
};

type Props = {
    proveedoresCount: number;
    programacionesCount: number;
    pagos: Pago[];
    saldoPendiente: number;
};

const BLUE = "#2F73D9";
const GREEN = "#92C83E";
const GRAY = "#94A3B8"; // slate-400
const ATTENTION = "#F59E0B";

function Icon({ name, className }: { name: string; className?: string }) {
    if (name === "check") {
        return (
            <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        );
    }

    if (name === "provider") {
        return (
            <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
            </svg>
        );
    }

    if (name === "calendar") {
        return (
            <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
        );
    }

    if (name === "wallet") {
        return (
            <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M21 12v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h14" />
                <path d="M16 12h.01" />
            </svg>
        );
    }

    if (name === "clip") {
        return (
            <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M21 11.5V6a2 2 0 0 0-2-2h-6" />
                <path d="M7 13v6a3 3 0 0 0 3 3h7a3 3 0 0 0 3-3V8" />
            </svg>
        );
    }

    return null;
}

export default function FlowStepper({ proveedoresCount, programacionesCount, pagos, saldoPendiente }: Props) {
    const hasProveedor = proveedoresCount > 0;
    const hasProgramacion = programacionesCount > 0;
    const pagosSinComprobante = pagos.some((p) => p.estado === "pagado_sin_comprobante");
    const pagosVencidos = pagos.some((p) => p.estado === "vencido" || p.estado === "pago_vencido");
    const tienePagos = pagos.length > 0;

    const pagoState = !hasProveedor
        ? "pending"
        : pagosVencidos
        ? "attention"
        : saldoPendiente > 0
        ? "current"
        : tienePagos
        ? "completed"
        : "pending";

    const comprobanteState = !tienePagos
        ? "pending"
        : pagosSinComprobante
        ? "current"
        : "completed";

    const steps = [
        {
            key: "creado",
            title: "Evento creado",
            icon: "check",
            state: "completed",
            target: "resumen-financiero",
        },
        {
            key: "proveedor",
            title: "Proveedor agregado",
            icon: "provider",
            state: hasProveedor ? "completed" : "pending",
            target: "proveedores-asociados",
        },
        {
            key: "programacion",
            title: "Programación creada",
            icon: "calendar",
            state: hasProgramacion ? "completed" : "pending",
            target: "programaciones",
        },
        {
            key: "pago",
            title: "Registrar pago",
            icon: "wallet",
            state: pagoState,
            target: "pagos-asociados",
        },
        {
            key: "comprobante",
            title: "Comprobante",
            icon: "clip",
            state: comprobanteState,
            target: "pagos-asociados",
        },
    ];

    function handleClick(targetId: string) {
        const el = document.getElementById(targetId);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    return (
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h3 className="text-base font-semibold text-[#102033]">Flujo del evento</h3>
                    <p className="mt-1 text-xs text-slate-500">Sigue estos pasos para completar la gestión del evento.</p>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1">
                        <span className="h-2.5 w-2.5 rounded-full bg-[#92C83E]" />
                        Verde: completado
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1">
                        <span className="h-2.5 w-2.5 rounded-full bg-[#2F73D9]" />
                        Azul: paso actual
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1">
                        <span className="h-2.5 w-2.5 rounded-full bg-[#94A3B8]" />
                        Gris: pendiente
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1">
                        <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" />
                        Ámbar/Rojo: requiere atención
                    </span>
                </div>
            </div>

            <div className="mt-4">
                <div className="hidden md:flex md:items-center md:justify-between">
                    {steps.map((step, idx) => (
                        <div key={step.key} className="flex items-center md:flex-1">
                            <button
                                onClick={() => handleClick(step.target)}
                                className="relative z-10 flex items-center gap-2 bg-transparent px-1 py-1"
                                aria-label={step.title}
                            >
                                <span
                                    className={`flex h-8 w-8 items-center justify-center rounded-full text-white ${step.state === "current" ? "step-pulse" : ""}`}
                                    style={{
                                        background:
                                            step.state === "completed"
                                                ? GREEN
                                                : step.state === "current"
                                                ? BLUE
                                                : step.state === "attention"
                                                ? ATTENTION
                                                : GRAY,
                                    }}
                                >
                                    <Icon name={step.icon} className="h-4 w-4" />
                                </span>

                                <div className="min-w-0 text-left">
                                    <p
                                        className={`text-xs font-semibold ${
                                            step.state === "completed"
                                                ? "text-[#92C83E]"
                                                : step.state === "current"
                                                ? "text-[#2F73D9]"
                                                : step.state === "attention"
                                                ? "text-[#B45309]"
                                                : "text-slate-500"
                                        }`}
                                    >
                                        {step.title}
                                    </p>
                                </div>
                            </button>

                            {idx < steps.length - 1 ? (
                                <div className="flex-1 px-1">
                                    <div className="h-[1px] bg-slate-200" />
                                </div>
                            ) : null}
                        </div>
                    ))}
                </div>

                <div className="md:hidden mt-4">
                    <ol className="space-y-3">
                        {steps.map((step) => (
                            <li key={step.key} className="flex items-center gap-3">
                                <button
                                    onClick={() => handleClick(step.target)}
                                    className="relative flex-shrink-0"
                                >
                                    <span
                                        className={`flex h-8 w-8 items-center justify-center rounded-full text-white ${step.state === "current" ? "step-pulse" : ""}`}
                                        style={{
                                            background:
                                                step.state === "completed"
                                                    ? GREEN
                                                    : step.state === "current"
                                                    ? BLUE
                                                    : step.state === "attention"
                                                    ? ATTENTION
                                                    : GRAY,
                                        }}
                                    >
                                        <Icon name={step.icon} className="h-4 w-4" />
                                    </span>
                                </button>

                                <div className="min-w-0">
                                    <p className={`text-xs font-semibold ${
                                        step.state === "completed"
                                            ? "text-[#92C83E]"
                                            : step.state === "current"
                                            ? "text-[#2F73D9]"
                                            : step.state === "attention"
                                            ? "text-[#B45309]"
                                            : "text-slate-500"
                                    }`}>
                                        {step.title}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ol>
                </div>
            </div>
        </section>
    );
}
