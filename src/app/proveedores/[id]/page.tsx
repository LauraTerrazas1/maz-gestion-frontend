"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import MainLayout from "@/components/layout/MainLayout";
import Toast from "@/components/ui/Toast";
import type { ToastTipo } from "@/components/ui/Toast";
import { apiFetch } from "@/lib/api";

type Proveedor = {
    id: string;
    tipo_proveedor: string | null;
    razon_social: string | null;
    documento: string | null;
    direccion: string | null;
    representante_legal_nombre: string | null;
    representante_legal_dni: string | null;
    contacto_nombre: string | null;
    contacto_cargo: string | null;
    contacto_celular: string | null;
    contacto_correo: string | null;
    estado: string | null;
    cuenta_detracciones_bn: string | null;
};

type CuentaBancaria = {
    id: string;
    banco: string;
    tipo_cuenta: string;
    moneda: string;
    numero_cuenta: string;
    cci: string | null;
    titular_cuenta: string | null;
    es_principal: boolean;
    estado: string;
};

export default function DetalleProveedorPage() {
    const params = useParams<{ id: string }>();
    const [proveedor, setProveedor] = useState<Proveedor | null>(null);
    const [cuentasBancarias, setCuentasBancarias] = useState<CuentaBancaria[]>([]);
    const [cargando, setCargando] = useState(true);
    const [toast, setToast] = useState<{ tipo: ToastTipo; mensaje: string } | null>(null);

    useEffect(() => {
        void Promise.resolve().then(async () => {
            try {
                const [data, cuentasData] = await Promise.all([
                    apiFetch(`/proveedores/${params.id}`),
                    apiFetch(`/proveedores-cuentas/proveedor/${params.id}`),
                ]);

                setProveedor(data);
                setCuentasBancarias(
                    Array.isArray(cuentasData) ? cuentasData : []
                );
            } catch (error) {
                console.error("Error al cargar proveedor:", error);
                setToast({ tipo: "error", mensaje: "No se pudo cargar el proveedor." });
            } finally {
                setCargando(false);
            }
        });
    }, [params.id]);

    function valor(value?: string | null) {
        return value && value.trim() !== "" ? value : "No registrado";
    }

    function formatearTipo(tipo?: string | null) {
        if (tipo === "empresa") return "Empresa";
        if (tipo === "persona") return "Persona";
        return "No registrado";
    }

    function formatearEstado(estado?: string | null) {
        if (estado === "activo") return "Activo";
        if (estado === "inactivo") return "Inactivo";
        return "No registrado";
    }

    async function desactivarProveedor() {
        if (!proveedor?.id) return;

        try {
            await apiFetch(`/proveedores/${proveedor.id}`, {
                method: "DELETE",
            });

            setProveedor((actual) =>
                actual
                    ? {
                        ...actual,
                        estado: "inactivo",
                    }
                    : actual
            );

            setToast({
                tipo: "success",
                mensaje: "Proveedor desactivado correctamente.",
            });
        } catch (error) {
            console.error("Error desactivando proveedor:", error);

            setToast({
                tipo: "error",
                mensaje: "No se pudo desactivar el proveedor.",
            });
        }
    }

    async function activarProveedor() {
        if (!proveedor?.id) return;

        try {
            await apiFetch(`/proveedores/${proveedor.id}/activar`, {
                method: "PUT",
            });

            setProveedor((actual) =>
                actual
                    ? {
                        ...actual,
                        estado: "activo",
                    }
                    : actual
            );

            setToast({
                tipo: "success",
                mensaje: "Proveedor activado correctamente.",
            });
        } catch (error) {
            console.error("Error activando proveedor:", error);

            setToast({
                tipo: "error",
                mensaje: "No se pudo activar el proveedor.",
            });
        }
    }

    if (cargando) {
        return (
            <MainLayout>
                <main className="min-h-screen bg-[#F6F8FB] p-8">
                    <p className="text-sm text-slate-500">Cargando proveedor...</p>
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

    if (!proveedor) {
        return (
            <MainLayout>
                <main className="min-h-screen bg-[#F6F8FB] p-8">
                    <Link href="/proveedores" className="text-sm font-medium text-[#2F73D9]">
                        ← Volver a proveedores
                    </Link>
                    <p className="mt-6 text-sm text-slate-500">
                        No se encontró el proveedor.
                    </p>
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


    return (
        <MainLayout>
            <main className="min-h-screen bg-[#F6F8FB] p-8">
                <Link href="/proveedores" className="text-sm font-medium text-[#2F73D9]">
                    ← Volver a proveedores
                </Link>

                <div className="mt-6 flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-[#102033]">
                            {valor(proveedor.razon_social)}
                        </h1>

                        <p className="mt-1 text-sm text-slate-500">
                            Ficha general del proveedor registrado en MAZ Producciones.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <Link
                            href={`/proveedores/${proveedor.id}/editar`}
                            className="rounded-lg bg-[#2F73D9] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#245DB3]"
                        >
                            Editar proveedor
                        </Link>

                        {proveedor.estado === "activo" ? (
                            <button
                                type="button"
                                onClick={desactivarProveedor}
                                className="rounded-lg border border-orange-200 bg-orange-50 px-5 py-2.5 text-sm font-semibold text-orange-600 hover:bg-orange-100"
                            >
                                Desactivar
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={activarProveedor}
                                className="rounded-lg border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
                            >
                                Activar
                            </button>
                        )}
                    </div>
                </div>

                <section className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-4">
                    <ResumenCard titulo="Tipo" valor={formatearTipo(proveedor.tipo_proveedor)} />
                    <ResumenCard titulo="Documento" valor={valor(proveedor.documento)} />
                    <ResumenCard titulo="Contacto" valor={valor(proveedor.contacto_nombre)} />
                    <ResumenCard titulo="Estado" valor={formatearEstado(proveedor.estado)} />
                </section>

                <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-[#102033]">
                        Información general
                    </h2>

                    <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
                        <InfoItem label="Tipo de proveedor" value={formatearTipo(proveedor.tipo_proveedor)} />
                        <InfoItem label="Razón social" value={valor(proveedor.razon_social)} />
                        <InfoItem label="Documento" value={valor(proveedor.documento)} />
                        <InfoItem label="Dirección" value={valor(proveedor.direccion)} />
                        <InfoItem label="Estado" value={formatearEstado(proveedor.estado)} />
                    </div>
                </section>

                <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-[#102033]">
                        Representante legal
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Persona que firma contratos y documentación legal del proveedor.
                    </p>

                    <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
                        <InfoItem
                            label="Nombre del representante legal"
                            value={valor(proveedor.representante_legal_nombre)}
                        />
                        <InfoItem
                            label="DNI del representante legal"
                            value={valor(proveedor.representante_legal_dni)}
                        />
                    </div>
                </section>

                <section className="mt-6 rounded-2xl border border-sky-200 bg-sky-50 p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-[#102033]">
                        Contacto de pagos y coordinación
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                        Persona con quien se coordinan pagos, documentación y temas operativos.
                    </p>

                    <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
                        <InfoItem label="Nombre de contacto" value={valor(proveedor.contacto_nombre)} />
                        <InfoItem label="Cargo" value={valor(proveedor.contacto_cargo)} />
                        <InfoItem label="Celular" value={valor(proveedor.contacto_celular)} />
                        <InfoItem label="Correo" value={valor(proveedor.contacto_correo)} />
                    </div>
                </section>

                <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div>
                        <h2 className="text-lg font-semibold text-[#102033]">
                            Cuentas bancarias
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Cuentas registradas para realizar transferencias al proveedor.
                        </p>
                    </div>

                    {cuentasBancarias.length === 0 ? (
                        <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5">
                            <p className="text-sm text-slate-500">
                                No hay cuentas bancarias registradas.
                            </p>
                        </div>
                    ) : (
                        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                            {cuentasBancarias.map((cuenta) => (
                                <div
                                    key={cuenta.id}
                                    className="rounded-xl border border-slate-200 bg-slate-50 p-5"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            {cuenta.es_principal && (
                                                <p className="mb-1 text-xs font-semibold text-amber-600">
                                                    ★ Cuenta principal
                                                </p>
                                            )}

                                            <p className="text-lg font-bold text-[#102033]">
                                                {cuenta.banco}
                                            </p>

                                            <p className="mt-1 text-sm text-slate-500">
                                                {cuenta.tipo_cuenta} · {cuenta.moneda}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <InfoItem
                                            label="Número de cuenta"
                                            value={valor(cuenta.numero_cuenta)}
                                        />

                                        <InfoItem
                                            label="CCI"
                                            value={valor(cuenta.cci)}
                                        />

                                        <InfoItem
                                            label="Titular"
                                            value={valor(cuenta.titular_cuenta)}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
                <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-[#102033]">
                        Cuenta de detracciones
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Cuenta del Banco de la Nación para depósitos de detracciones.
                    </p>

                    <div className="mt-5">
                        <InfoItem
                            label="Cuenta Banco de la Nación"
                            value={valor(proveedor.cuenta_detracciones_bn)}
                        />
                    </div>
                </section>

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

function ResumenCard({ titulo, valor }: { titulo: string; valor: string }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase text-slate-500">{titulo}</p>
            <p className="mt-3 text-lg font-bold text-[#102033]">{valor}</p>
        </div>
    );
}

function InfoItem({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
            <p className="mt-1 text-sm font-semibold text-[#102033]">{value}</p>
        </div>
    );
}
