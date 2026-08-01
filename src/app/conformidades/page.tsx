"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import MainLayout from "@/components/layout/MainLayout";
import { apiFetch } from "@/lib/api";
import {
    Eye,
    FileCheck,
    Search,
} from "lucide-react";

type Conformidad = {
    id: string;
    estado: "pendiente" | "aprobada" | "observada";
    revisado_por: string;
    fecha_revision: string;
    observaciones?: string;

    facturas: {
        id: string;
        serie: string;
        numero: string;
        total: number;
        estado: string;

        ordenes_compra: {
            id: string;
            numero_oc: string;

            proveedores: {
                razon_social: string;
            };

            eventos: {
                nombre: string;
            };
        };
    };
};

export default function ConformidadesPage() {
    const [conformidades, setConformidades] = useState<Conformidad[]>([]);
    const [cargando, setCargando] = useState(true);

    const [buscar, setBuscar] = useState("");
    const [estadoFiltro, setEstadoFiltro] = useState("");

    async function cargarConformidades() {
        try {
            setCargando(true);

            const data = await apiFetch("/conformidades");

            setConformidades(
                Array.isArray(data) ? data : []
            );
        } catch (error) {
            console.error(error);
        } finally {
            setCargando(false);
        }
    }

    useEffect(() => {
        cargarConformidades();
    }, []);

    const conformidadesFiltradas = useMemo(() => {
        return conformidades.filter((item) => {
            const numeroFactura =
                `${item.facturas.serie}-${item.facturas.numero}`;

            const coincideBusqueda =
                buscar === "" ||
                numeroFactura
                    .toLowerCase()
                    .includes(buscar.toLowerCase()) ||
                item.facturas.ordenes_compra.numero_oc
                    .toLowerCase()
                    .includes(buscar.toLowerCase()) ||
                item.facturas.ordenes_compra.proveedores.razon_social
                    .toLowerCase()
                    .includes(buscar.toLowerCase());

            const coincideEstado =
                estadoFiltro === "" ||
                item.estado === estadoFiltro;

            return coincideBusqueda && coincideEstado;
        });
    }, [
        conformidades,
        buscar,
        estadoFiltro,
    ]);

    function limpiarFiltros() {
        setBuscar("");
        setEstadoFiltro("");
    }

    function formatearFecha(fecha: string) {
        return new Date(fecha).toLocaleDateString("es-PE", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    }

    function colorEstado(estado: string) {
        switch (estado) {
            case "aprobada":
                return "bg-green-100 text-green-700";

            case "observada":
                return "bg-red-100 text-red-700";

            default:
                return "bg-yellow-100 text-yellow-700";
        }
    }
    return (
        <MainLayout>
            <main className="min-h-screen bg-[#F6F8FB] p-8">

                {/* Header */}

                <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                    <div>
                        <h1 className="text-3xl font-bold text-[#102033]">
                            Conformidades
                        </h1>

                        <p className="mt-1 text-sm text-slate-500">
                            Gestiona la revisión y aprobación de las facturas antes
                            de su programación de pagos.
                        </p>
                    </div>

                    <Link
                        href="/conformidades/nueva"
                        className="inline-flex items-center gap-2 rounded-xl bg-[#2F73D9] px-5 py-3 text-sm font-semibold text-white hover:bg-[#245DB3]"
                    >
                        <FileCheck className="h-4 w-4" />
                        Nueva conformidad
                    </Link>

                </div>

                {/* Filtros */}

                <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                    <div className="grid gap-4 md:grid-cols-3">

                        <div className="md:col-span-2">

                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Buscar
                            </label>

                            <div className="relative">

                                <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />

                                <input
                                    value={buscar}
                                    onChange={(e) =>
                                        setBuscar(e.target.value)
                                    }
                                    placeholder="Factura, OC o proveedor..."
                                    className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm"
                                />

                            </div>

                        </div>

                        <div>

                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Estado
                            </label>

                            <select
                                value={estadoFiltro}
                                onChange={(e) =>
                                    setEstadoFiltro(e.target.value)
                                }
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                            >
                                <option value="">
                                    Todos
                                </option>

                                <option value="pendiente">
                                    Pendiente
                                </option>

                                <option value="aprobada">
                                    Aprobada
                                </option>

                                <option value="observada">
                                    Observada
                                </option>

                            </select>

                        </div>

                    </div>

                    <div className="mt-4">

                        <button
                            onClick={limpiarFiltros}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold"
                        >
                            Limpiar filtros
                        </button>

                    </div>

                </section>

                {/* Tabla */}

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                    <div className="border-b border-slate-200 px-6 py-4">

                        <h2 className="font-semibold text-[#102033]">
                            Historial de conformidades
                        </h2>

                        <p className="mt-1 text-xs text-slate-500">
                            {conformidadesFiltradas.length} registros
                        </p>

                    </div>

                    {cargando ? (

                        <div className="p-10 text-center">
                            Cargando...
                        </div>

                    ) : conformidadesFiltradas.length === 0 ? (

                        <div className="py-16 text-center text-slate-500">

                            No se encontraron conformidades.

                        </div>

                    ) : (

                        <div className="overflow-x-auto">

                            <table className="w-full min-w-[1200px]">

                                <thead className="bg-slate-50 text-xs uppercase text-slate-500">

                                    <tr>

                                        <th className="px-6 py-4 text-left">
                                            Estado
                                        </th>

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
                                            Revisado por
                                        </th>

                                        <th className="px-6 py-4 text-left">
                                            Fecha
                                        </th>

                                        <th className="px-6 py-4 text-center">
                                            Acciones
                                        </th>

                                    </tr>

                                </thead>

                                <tbody>

                                    {conformidadesFiltradas.map((item) => (

                                        <tr
                                            key={item.id}
                                            className="border-t hover:bg-slate-50"
                                        >

                                            <td className="px-6 py-4">

                                                <span
                                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${colorEstado(
                                                        item.estado
                                                    )}`}
                                                >
                                                    {item.estado === "aprobada"
                                                        ? "Aprobada"
                                                        : item.estado === "observada"
                                                            ? "Observada"
                                                            : "Pendiente"}
                                                </span>

                                            </td>

                                            <td className="px-6 py-4 font-medium">
                                                {item.facturas.serie}-{item.facturas.numero}
                                            </td>

                                            <td className="px-6 py-4">
                                                {item.facturas.ordenes_compra.numero_oc}
                                            </td>

                                            <td className="px-6 py-4">
                                                {item.facturas.ordenes_compra.proveedores.razon_social}
                                            </td>

                                            <td className="px-6 py-4">
                                                {item.facturas.ordenes_compra.eventos.nombre}
                                            </td>

                                            <td className="px-6 py-4">
                                                {item.revisado_por}
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {formatearFecha(item.fecha_revision)}
                                            </td>

                                            <td className="px-6 py-4">

                                                <div className="flex justify-center">

                                                    <Link
                                                        href={`/conformidades/${item.id}`}
                                                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-[#102033] hover:bg-slate-50"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                        Ver
                                                    </Link>

                                                </div>

                                            </td>

                                        </tr>

                                    ))}

                                </tbody>

                            </table>

                        </div>

                    )}

                </section>

            </main>

        </MainLayout >

    );

}