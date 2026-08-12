"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
    AlertTriangle,
    CalendarDays,
    Clock3,
    Download,
    FileText,
    Landmark,
    Plus,
    Search,
    WalletCards,
} from "lucide-react";

import MainLayout from "@/components/layout/MainLayout";
import Toast from "@/components/ui/Toast";
import type { ToastTipo } from "@/components/ui/Toast";
import { apiFetch } from "@/lib/api";

type TipoDestino =
    | "proveedor"
    | "detraccion"
    | "personal_eventual";

type CuentaBancaria = {
    id: string;
    banco: string;
    tipo_cuenta?: string | null;
    moneda?: string | null;
    numero_cuenta?: string | null;
    cci?: string | null;
    titular_cuenta?: string | null;
};

type Evento = {
    id: string;
    nombre: string;
    cliente?: string | null;
};

type Proveedor = {
    id: string;
    razon_social: string;
    documento?: string | null;
};

type OrdenCompra = {
    id: string;
    numero_oc: string;

    proveedores?: Proveedor | null;
};

type Factura = {
    id: string;
    serie: string;
    numero: string;
    total?: number | string | null;
    moneda?: string | null;
    cuenta_detraccion_detectada?: string | null;
    monto_detraccion?: number | string | null;
    estado_conformidad?: string | null;

    ordenes_compra?: OrdenCompra | null;
};

type EventoProveedor = {
    id?: string;
    servicio?: string | null;
    monto_contratado?: number | string | null;

    proveedores?: {
        razon_social?: string | null;
    } | null;
};

type ProgramacionPago = {
    id: string;

    evento_id: string;
    factura_id?: string | null;
    orden_compra_id?: string | null;
    evento_proveedor_id?: string | null;
    cuenta_bancaria_id?: string | null;

    origen: string;

    tipo_destino?: TipoDestino | null;
    tipo_programacion: string;

    monto: number | string;
    porcentaje?: number | string | null;

    fecha_programada: string;
    estado: string;

    observaciones?: string | null;

    eventos?: Evento | null;
    facturas?: Factura | null;
    evento_proveedores?: EventoProveedor | null;
    proveedores_cuentas_bancarias?: CuentaBancaria | null;
};
type DetraccionPendiente = {
    factura_id: string;
    factura: string;

    orden_compra_id?: string | null;
    numero_oc?: string | null;

    proveedor_id?: string | null;
    proveedor?: string | null;
    ruc?: string | null;

    evento_id?: string | null;
    evento?: string | null;
    cliente?: string | null;

    fecha_emision?: string | null;

    codigo_detraccion?: string | null;
    porcentaje_detraccion?: number | null;

    monto_detraccion: number;
    programado_detraccion: number;
    pendiente_detraccion: number;

    cuenta_bn?: string | null;
    moneda?: string | null;
};

type CSVRow = Record<
    string,
    string | number | null | undefined
>;

const inputClassName =
    "w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[#2F73D9] focus:ring-2 focus:ring-[#2F73D9]/15";

const selectClassName =
    "h-[42px] w-full cursor-pointer rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-[#2F73D9] focus:ring-2 focus:ring-[#2F73D9]/15";

function formatearMoneda(
    valor?: number | string | null,
    moneda = "PEN"
) {
    return new Intl.NumberFormat("es-PE", {
        style: "currency",
        currency: moneda || "PEN",
        minimumFractionDigits: 2,
    }).format(Number(valor ?? 0));
}

function formatearFecha(fecha?: string | null) {
    if (!fecha) {
        return "Sin fecha";
    }

    return new Intl.DateTimeFormat("es-PE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(
        new Date(`${fecha}T00:00:00`)
    );
}

function textoDestino(
    destino?: string | null
) {
    if (destino === "proveedor") {
        return "Proveedor";
    }

    if (destino === "detraccion") {
        return "Detracción";
    }

    if (destino === "personal_eventual") {
        return "Personal eventual";
    }

    return "No registrado";
}

function textoEstado(estado: string) {
    if (estado === "pendiente") {
        return "Pendiente";
    }

    if (estado === "programado") {
        return "Programado";
    }

    if (estado === "vencido") {
        return "Vencido";
    }

    if (estado === "pagado") {
        return "Pagado";
    }

    if (estado === "pagado_sin_comprobante") {
        return "Pagado sin comprobante";
    }

    if (estado === "cancelado") {
        return "Cancelado";
    }

    return estado || "No registrado";
}

function claseEstado(estado: string) {
    if (estado === "pendiente") {
        return "border-amber-200 bg-amber-50 text-amber-700";
    }

    if (estado === "programado") {
        return "border-blue-200 bg-blue-50 text-blue-700";
    }

    if (estado === "vencido") {
        return "border-red-200 bg-red-50 text-red-700";
    }

    if (
        estado === "pagado" ||
        estado === "pagado_sin_comprobante"
    ) {
        return "border-emerald-200 bg-emerald-50 text-emerald-700";
    }

    return "border-slate-200 bg-slate-100 text-slate-600";
}

function textoTipoProgramacion(tipo: string) {
    if (tipo === "pago_unico") {
        return "Pago único";
    }

    if (tipo === "adelanto") {
        return "Adelanto";
    }

    if (tipo === "segundo_pago") {
        return "Segundo pago";
    }

    if (tipo === "tercer_pago") {
        return "Tercer pago";
    }

    if (tipo === "cuarto_pago") {
        return "Cuarto pago";
    }

    if (tipo === "saldo_final") {
        return "Saldo final";
    }

    return tipo || "Otro";
}

function descargarCSV(
    nombreArchivo: string,
    columnas: {
        key: string;
        label: string;
    }[],
    filas: CSVRow[]
) {
    const encabezados = columnas
        .map((columna) => columna.label)
        .join(";");

    const contenido = filas.map((fila) =>
        columnas
            .map((columna) => {
                const valor =
                    fila[columna.key] ?? "";

                return `"${String(valor).replaceAll(
                    '"',
                    '""'
                )}"`;
            })
            .join(";")
    );

    const csv = [
        encabezados,
        ...contenido,
    ].join("\n");

    const blob = new Blob(
        ["\uFEFF" + csv],
        {
            type: "text/csv;charset=utf-8;",
        }
    );

    const url =
        URL.createObjectURL(blob);

    const enlace =
        document.createElement("a");

    enlace.href = url;
    enlace.download = nombreArchivo;
    enlace.click();

    URL.revokeObjectURL(url);
}

export default function ProgramacionesPagoPage() {
    const [
        programaciones,
        setProgramaciones,
    ] = useState<ProgramacionPago[]>([]);
    const [
        detraccionesPendientes,
        setDetraccionesPendientes,
    ] = useState<DetraccionPendiente[]>([]);

    const [
        mostrarDetracciones,
        setMostrarDetracciones,
    ] = useState(false);

    const [cargando, setCargando] =
        useState(true);

    const [busqueda, setBusqueda] =
        useState("");

    const [
        estadoFiltro,
        setEstadoFiltro,
    ] = useState("todos");

    const [
        destinoFiltro,
        setDestinoFiltro,
    ] = useState("todos");

    const [
        fechaDesde,
        setFechaDesde,
    ] = useState("");

    const [
        fechaHasta,
        setFechaHasta,
    ] = useState("");

    const [toast, setToast] =
        useState<{
            tipo: ToastTipo;
            mensaje: string;
        } | null>(null);

    async function cargarProgramaciones() {
        try {
            setCargando(true);

            const data = await apiFetch(
                "/programaciones-pago/"
            );

            setProgramaciones(
                Array.isArray(data)
                    ? data
                    : []
            );
        } catch (error) {
            console.error(
                "Error cargando programaciones:",
                error
            );

            setProgramaciones([]);

            setToast({
                tipo: "error",
                mensaje:
                    "No se pudieron cargar las programaciones.",
            });
        } finally {
            setCargando(false);
        }
    }

    useEffect(() => {
        cargarProgramaciones();
        cargarDetraccionesPendientes();
    }, []);

    async function cargarDetraccionesPendientes() {
        try {
            const data = await apiFetch(
                "/programaciones-pago/detracciones-pendientes"
            );

            setDetraccionesPendientes(
                Array.isArray(data)
                    ? data
                    : []
            );
        } catch (error) {
            console.error(
                "Error cargando detracciones pendientes:",
                error
            );

            setDetraccionesPendientes([]);
        }
    }

    const programacionesFiltradas =
        useMemo(() => {
            return programaciones.filter(
                (programacion) => {
                    const factura =
                        programacion.facturas;

                    const orden =
                        factura?.ordenes_compra;

                    const proveedor =
                        orden?.proveedores;

                    const evento =
                        programacion.eventos;

                    const proveedorAnterior =
                        programacion
                            .evento_proveedores
                            ?.proveedores;

                    const textoBusqueda = [
                        factura
                            ? `${factura.serie}-${factura.numero}`
                            : "",
                        orden?.numero_oc ?? "",
                        proveedor
                            ?.razon_social ?? "",
                        proveedor
                            ?.documento ?? "",
                        proveedorAnterior
                            ?.razon_social ?? "",
                        evento?.nombre ?? "",
                        evento?.cliente ?? "",
                        programacion
                            .tipo_destino ?? "",
                        programacion
                            .observaciones ?? "",
                    ]
                        .join(" ")
                        .toLowerCase();

                    const coincideBusqueda =
                        textoBusqueda.includes(
                            busqueda
                                .trim()
                                .toLowerCase()
                        );

                    const coincideEstado =
                        estadoFiltro ===
                        "todos" ||
                        programacion.estado ===
                        estadoFiltro;

                    const coincideDestino =
                        destinoFiltro ===
                        "todos" ||
                        programacion
                            .tipo_destino ===
                        destinoFiltro;

                    const coincideDesde =
                        !fechaDesde ||
                        programacion
                            .fecha_programada >=
                        fechaDesde;

                    const coincideHasta =
                        !fechaHasta ||
                        programacion
                            .fecha_programada <=
                        fechaHasta;

                    return (
                        coincideBusqueda &&
                        coincideEstado &&
                        coincideDestino &&
                        coincideDesde &&
                        coincideHasta
                    );
                }
            );
        }, [
            programaciones,
            busqueda,
            estadoFiltro,
            destinoFiltro,
            fechaDesde,
            fechaHasta,
        ]);

    const resumen = useMemo(() => {
        return programaciones.reduce(
            (acumulado, programacion) => {
                const monto = Number(
                    programacion.monto ?? 0
                );

                if (
                    programacion.estado ===
                    "vencido"
                ) {
                    acumulado.vencido +=
                        monto;
                } else if (
                    programacion.estado ===
                    "pagado"
                ) {
                    acumulado.pagado +=
                        monto;
                } else if (
                    programacion.estado ===
                    "pendiente" ||
                    programacion.estado ===
                    "programado"
                ) {
                    acumulado.programado +=
                        monto;
                }

                return acumulado;
            },
            {
                programado: 0,
                vencido: 0,
                pagado: 0,
            }
        );
    }, [programaciones]);
    function limpiarFiltros() {
        setBusqueda("");
        setEstadoFiltro("todos");
        setDestinoFiltro("todos");
        setFechaDesde("");
        setFechaHasta("");
    }

    function obtenerFactura(
        programacion: ProgramacionPago
    ) {
        return (
            programacion.facturas ?? null
        );
    }

    function obtenerOrden(
        programacion: ProgramacionPago
    ) {
        return (
            programacion.facturas
                ?.ordenes_compra ?? null
        );
    }

    function obtenerProveedor(
        programacion: ProgramacionPago
    ) {
        return (
            programacion.facturas
                ?.ordenes_compra
                ?.proveedores ?? null
        );
    }

    function obtenerEvento(
        programacion: ProgramacionPago
    ) {
        return (
            programacion.eventos ?? null
        );
    }

    function obtenerNombreOrigen(
        programacion: ProgramacionPago
    ) {
        const proveedor =
            obtenerProveedor(programacion);

        if (proveedor) {
            return proveedor.razon_social;
        }

        const proveedorAnterior =
            programacion
                .evento_proveedores
                ?.proveedores
                ?.razon_social;

        if (proveedorAnterior) {
            return proveedorAnterior;
        }

        if (
            programacion.origen ===
            "personal_eventual"
        ) {
            return "Personal eventual";
        }

        return "No registrado";
    }

    function handleDescargarCSV() {
        if (programacionesFiltradas.length === 0) {
            setToast({
                tipo: "info",
                mensaje: "No hay programaciones para exportar.",
            });
            return;
        }

        descargarCSV(
            "programaciones_pago_maz.csv",
            [
                {
                    key: "factura",
                    label: "Factura",
                },
                {
                    key: "orden_compra",
                    label: "Orden de compra",
                },
                {
                    key: "proveedor",
                    label: "Proveedor u origen",
                },
                {
                    key: "ruc",
                    label: "RUC / Documento",
                },
                {
                    key: "evento",
                    label: "Evento",
                },
                {
                    key: "destino",
                    label: "Destino",
                },
                {
                    key: "banco",
                    label: "Banco",
                },
                {
                    key: "tipo_cuenta",
                    label: "Tipo de cuenta",
                },
                {
                    key: "numero_cuenta",
                    label: "Número de cuenta",
                },
                {
                    key: "cci",
                    label: "CCI",
                },
                {
                    key: "titular",
                    label: "Titular de cuenta",
                },
                {
                    key: "tipo",
                    label: "Tipo de programación",
                },
                {
                    key: "monto",
                    label: "Monto",
                },
                {
                    key: "fecha",
                    label: "Fecha programada",
                },
                {
                    key: "estado",
                    label: "Estado",
                },
                {
                    key: "observaciones",
                    label: "Observaciones",
                },
            ],

            programacionesFiltradas.map((programacion) => {
                const factura = obtenerFactura(programacion);
                const orden = obtenerOrden(programacion);
                const proveedor = obtenerProveedor(programacion);
                const evento = obtenerEvento(programacion);

                const cuenta =
                    programacion.proveedores_cuentas_bancarias ?? null;

                const esDetraccion =
                    programacion.tipo_destino === "detraccion";

                return {
                    factura: factura
                        ? `${factura.serie}-${factura.numero}`
                        : "Sin factura",

                    orden_compra:
                        orden?.numero_oc ?? "No registrada",

                    proveedor:
                        obtenerNombreOrigen(programacion),

                    ruc:
                        proveedor?.documento
                            ? `="${proveedor.documento}"`
                            : "",

                    evento:
                        evento?.nombre ?? "No registrado",

                    destino:
                        textoDestino(programacion.tipo_destino),

                    banco: esDetraccion
                        ? "Banco de la Nación"
                        : cuenta?.banco ?? "",

                    tipo_cuenta: esDetraccion
                        ? "Cuenta de detracciones"
                        : cuenta?.tipo_cuenta ?? "",

                    numero_cuenta: esDetraccion
                        ? factura?.cuenta_detraccion_detectada
                            ? `="${factura.cuenta_detraccion_detectada}"`
                            : ""
                        : cuenta?.numero_cuenta
                            ? `="${cuenta.numero_cuenta}"`
                            : "",

                    cci: esDetraccion
                        ? ""
                        : cuenta?.cci
                            ? `="${cuenta.cci}"`
                            : "",

                    titular: esDetraccion
                        ? obtenerNombreOrigen(programacion)
                        : cuenta?.titular_cuenta ?? "",

                    tipo:
                        textoTipoProgramacion(
                            programacion.tipo_programacion
                        ),

                    monto: Number(
                        programacion.monto ?? 0
                    ).toFixed(2),

                    fecha:
                        programacion.fecha_programada,

                    estado:
                        textoEstado(programacion.estado),

                    observaciones:
                        esDetraccion
                            ? ""
                            : programacion.observaciones ?? "",
                };
            })
        );
    }
    const totalDetraccionesPendientes =
        detraccionesPendientes.reduce(
            (total, item) =>
                total +
                Number(
                    item.pendiente_detraccion ?? 0
                ),
            0
        );

    return (
        <MainLayout>
            <main className="min-h-screen bg-[#F6F8FB] p-6 md:p-8">
                <div className="mx-auto max-w-7xl">
                    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                        <div>
                            <h1 className="text-3xl font-bold text-[#102033]">
                                Programación de pagos
                            </h1>

                            <p className="mt-1 text-sm text-slate-500">
                                Programa y controla los pagos pendientes de proveedores y personal eventual.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <button
                                type="button"
                                onClick={
                                    handleDescargarCSV
                                }
                                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-[#102033] shadow-sm transition hover:bg-slate-50"
                            >
                                <Download className="h-4 w-4" />
                                Descargar CSV
                            </button>

                            <Link
                                href="/programaciones-pago/nuevo"
                                className="inline-flex items-center gap-2 rounded-lg bg-[#2F73D9] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#245DB3]"
                            >
                                <Plus className="h-4 w-4" />
                                Nueva programación
                            </Link>
                        </div>
                    </div>

                    <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <ResumenCard
                            titulo="Programados"
                            monto={
                                resumen.programado
                            }
                            descripcion="Pagos pendientes con fecha"
                            icono={
                                <CalendarDays className="h-5 w-5" />
                            }
                            tipo="programado"
                        />

                        <ResumenCard
                            titulo="Vencidos"
                            monto={resumen.vencido}
                            descripcion="Pagos fuera de fecha"
                            icono={
                                <AlertTriangle className="h-5 w-5" />
                            }
                            tipo="vencido"
                        />

                        <ResumenCard
                            titulo="Pagados"
                            monto={resumen.pagado}
                            descripcion="Programaciones completadas"
                            icono={
                                <WalletCards className="h-5 w-5" />
                            }
                            tipo="pagado"
                        />
                        <button
                            type="button"
                            onClick={() =>
                                setMostrarDetracciones(
                                    (actual) => !actual
                                )
                            }
                            className="text-left"
                        >
                            <ResumenCard
                                titulo="Detracciones pendientes"
                                monto={
                                    totalDetraccionesPendientes
                                }
                                descripcion={`${detraccionesPendientes.length} pendiente${detraccionesPendientes.length === 1
                                    ? ""
                                    : "s"
                                    } de programación`}
                                icono={
                                    <Landmark className="h-5 w-5" />
                                }
                                tipo="detraccion"
                            />
                        </button>
                    </section>
                    {mostrarDetracciones && (
                        <section className="mt-6 overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm">
                            <div className="flex flex-col justify-between gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center">
                                <div>
                                    <h2 className="font-semibold text-[#102033]">
                                        Detracciones pendientes de programación
                                    </h2>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Facturas con detracción aún no programada.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        if (detraccionesPendientes.length === 0) {
                                            setToast({
                                                tipo: "info",
                                                mensaje:
                                                    "No hay detracciones pendientes para descargar.",
                                            });

                                            return;
                                        }

                                        descargarCSV(
                                            "detracciones_pendientes_programacion.csv",
                                            [
                                                {
                                                    key: "factura",
                                                    label: "Factura",
                                                },
                                                {
                                                    key: "orden_compra",
                                                    label: "Orden de compra",
                                                },
                                                {
                                                    key: "proveedor",
                                                    label: "Proveedor",
                                                },
                                                {
                                                    key: "ruc",
                                                    label: "RUC",
                                                },
                                                {
                                                    key: "evento",
                                                    label: "Evento",
                                                },
                                                {
                                                    key: "cuenta_bn",
                                                    label: "Cuenta Banco de la Nación",
                                                },
                                                {
                                                    key: "codigo",
                                                    label: "Código detracción",
                                                },
                                                {
                                                    key: "porcentaje",
                                                    label: "Porcentaje detracción",
                                                },
                                                {
                                                    key: "monto",
                                                    label: "Monto pendiente",
                                                },
                                            ],
                                            detraccionesPendientes.map(
                                                (item) => ({
                                                    factura:
                                                        item.factura ||
                                                        "No registrada",

                                                    orden_compra:
                                                        item.numero_oc ||
                                                        "No registrada",

                                                    proveedor:
                                                        item.proveedor ||
                                                        "No registrado",

                                                    ruc:
                                                        item.ruc ||
                                                        "",

                                                    evento:
                                                        item.evento ||
                                                        "No registrado",

                                                    cuenta_bn:
                                                        item.cuenta_bn ||
                                                        "",

                                                    codigo:
                                                        item.codigo_detraccion ||
                                                        "",

                                                    porcentaje:
                                                        item.porcentaje_detraccion ??
                                                        0,

                                                    monto:
                                                        Number(
                                                            item.pendiente_detraccion ??
                                                            0
                                                        ).toFixed(2),
                                                })
                                            )
                                        );
                                    }}
                                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-[#102033] shadow-sm transition hover:bg-slate-50"
                                >
                                    <Download className="h-4 w-4" />
                                    Descargar CSV
                                </button>
                            </div>

                            {detraccionesPendientes.length === 0 ? (
                                <div className="p-8 text-center text-sm text-slate-500">
                                    No hay detracciones pendientes de programación.
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[1050px] text-sm">
                                        <thead className="bg-amber-50 text-slate-600">
                                            <tr>
                                                <th className="px-5 py-3 text-left">
                                                    Factura
                                                </th>

                                                <th className="px-5 py-3 text-left">
                                                    OC
                                                </th>

                                                <th className="px-5 py-3 text-left">
                                                    Proveedor
                                                </th>

                                                <th className="px-5 py-3 text-left">
                                                    RUC
                                                </th>

                                                <th className="px-5 py-3 text-left">
                                                    Cuenta BN
                                                </th>

                                                <th className="px-5 py-3 text-left">
                                                    %
                                                </th>

                                                <th className="px-5 py-3 text-right">
                                                    Monto pendiente
                                                </th>

                                                <th className="px-5 py-3 text-right">
                                                    Acción
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {detraccionesPendientes.map(
                                                (item) => (
                                                    <tr
                                                        key={item.factura_id}
                                                        className="border-t border-slate-100"
                                                    >
                                                        <td className="px-5 py-4 font-semibold text-[#102033]">
                                                            {item.factura ||
                                                                "No registrada"}
                                                        </td>

                                                        <td className="px-5 py-4">
                                                            {item.numero_oc ||
                                                                "No registrada"}
                                                        </td>

                                                        <td className="px-5 py-4">
                                                            {item.proveedor ||
                                                                "No registrado"}
                                                        </td>

                                                        <td className="px-5 py-4">
                                                            {item.ruc ||
                                                                "No registrado"}
                                                        </td>

                                                        <td className="px-5 py-4">
                                                            {item.cuenta_bn ||
                                                                "No registrada"}
                                                        </td>

                                                        <td className="px-5 py-4">
                                                            {Number(
                                                                item.porcentaje_detraccion ??
                                                                0
                                                            ).toFixed(2)}
                                                            %
                                                        </td>

                                                        <td className="px-5 py-4 text-right font-bold text-[#102033]">
                                                            {formatearMoneda(
                                                                item.pendiente_detraccion,
                                                                item.moneda ||
                                                                "PEN"
                                                            )}
                                                        </td>

                                                        <td className="px-5 py-4 text-right">
                                                            <Link
                                                                href="/programaciones-pago/nuevo"
                                                                className="inline-flex items-center rounded-lg bg-[#2F73D9] px-3 py-2 text-xs font-semibold text-white hover:bg-[#245DB3]"
                                                            >
                                                                Programar
                                                            </Link>
                                                        </td>
                                                    </tr>
                                                )
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </section>
                    )}
                    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                            <div>
                                <h2 className="font-semibold text-[#102033]">
                                    Filtros
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Busca por factura, OC, proveedor o evento.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={
                                    limpiarFiltros
                                }
                                className="text-sm font-semibold text-[#2F73D9] hover:text-[#245DB3]"
                            >
                                Limpiar filtros
                            </button>
                        </div>

                        <div className="mt-5 grid items-end gap-4 md:grid-cols-2 xl:grid-cols-5">
                            <div className="relative xl:col-span-2">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                                <input
                                    value={busqueda}
                                    onChange={(
                                        event
                                    ) =>
                                        setBusqueda(
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                    placeholder="Factura, OC, proveedor o evento"
                                    className={`${inputClassName} pl-10`}
                                />
                            </div>

                            <select
                                value={
                                    estadoFiltro
                                }
                                onChange={(
                                    event
                                ) =>
                                    setEstadoFiltro(
                                        event.target
                                            .value
                                    )
                                }
                                className={
                                    selectClassName
                                }
                            >
                                <option value="todos">
                                    Todos los estados
                                </option>

                                <option value="pendiente">
                                    Pendiente
                                </option>

                                <option value="programado">
                                    Programado
                                </option>

                                <option value="vencido">
                                    Vencido
                                </option>

                                <option value="pagado">
                                    Pagado
                                </option>
                            </select>

                            <select
                                value={
                                    destinoFiltro
                                }
                                onChange={(
                                    event
                                ) =>
                                    setDestinoFiltro(
                                        event.target
                                            .value
                                    )
                                }
                                className={
                                    selectClassName
                                }
                            >
                                <option value="todos">
                                    Todos los destinos
                                </option>

                                <option value="proveedor">
                                    Proveedor
                                </option>

                                <option value="detraccion">
                                    Detracción
                                </option>

                                <option value="personal_eventual">
                                    Personal eventual
                                </option>
                            </select>

                            <div>
                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                                    Desde
                                </label>

                                <input
                                    type="date"
                                    value={fechaDesde}
                                    onChange={(
                                        event
                                    ) =>
                                        setFechaDesde(
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                    className={
                                        inputClassName
                                    }
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                                    Hasta
                                </label>

                                <input
                                    type="date"
                                    value={fechaHasta}
                                    onChange={(
                                        event
                                    ) =>
                                        setFechaHasta(
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                    className={
                                        inputClassName
                                    }
                                />
                            </div>
                        </div>
                    </section>
                    <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex flex-col justify-between gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center">
                            <div>
                                <h2 className="font-semibold text-[#102033]">
                                    Programaciones registradas
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    {
                                        programacionesFiltradas.length
                                    }{" "}
                                    resultado
                                    {programacionesFiltradas.length ===
                                        1
                                        ? ""
                                        : "s"}
                                </p>
                            </div>

                            <p className="text-sm text-slate-500">
                                Total filtrado:{" "}
                                <span className="font-bold text-[#102033]">
                                    {formatearMoneda(
                                        programacionesFiltradas.reduce(
                                            (
                                                total,
                                                programacion
                                            ) =>
                                                total +
                                                Number(
                                                    programacion.monto ??
                                                    0
                                                ),
                                            0
                                        )
                                    )}
                                </span>
                            </p>
                        </div>

                        {cargando ? (
                            <div className="p-10 text-center text-sm text-slate-500">
                                Cargando programaciones...
                            </div>
                        ) : programacionesFiltradas.length ===
                            0 ? (
                            <div className="p-10 text-center">
                                <FileText className="mx-auto h-10 w-10 text-slate-300" />

                                <h3 className="mt-3 font-semibold text-[#102033]">
                                    No hay programaciones registradas
                                </h3>

                                <p className="mt-1 text-sm text-slate-500">
                                    Crea una nueva programación para comenzar.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[1150px] text-sm">
                                    <thead className="bg-slate-50 text-slate-600">
                                        <tr>
                                            <th className="px-5 py-3 text-left">
                                                Factura
                                            </th>

                                            <th className="px-5 py-3 text-left">
                                                OC
                                            </th>

                                            <th className="px-5 py-3 text-left">
                                                Proveedor / origen
                                            </th>

                                            <th className="px-5 py-3 text-left">
                                                Evento
                                            </th>

                                            <th className="px-5 py-3 text-left">
                                                Destino
                                            </th>

                                            <th className="px-5 py-3 text-left">
                                                Tipo
                                            </th>

                                            <th className="px-5 py-3 text-right">
                                                Monto
                                            </th>

                                            <th className="px-5 py-3 text-left">
                                                Fecha programada
                                            </th>

                                            <th className="px-5 py-3 text-left">
                                                Estado
                                            </th>

                                            <th className="px-5 py-3 text-right">
                                                Acción
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {programacionesFiltradas.map(
                                            (
                                                programacion
                                            ) => {
                                                const factura =
                                                    obtenerFactura(
                                                        programacion
                                                    );

                                                const orden =
                                                    obtenerOrden(
                                                        programacion
                                                    );

                                                const evento =
                                                    obtenerEvento(
                                                        programacion
                                                    );

                                                return (
                                                    <tr
                                                        key={
                                                            programacion.id
                                                        }
                                                        className="border-t border-slate-100 transition hover:bg-slate-50/60"
                                                    >
                                                        <td className="px-5 py-4">
                                                            <p className="font-semibold text-[#102033]">
                                                                {factura
                                                                    ? `${factura.serie}-${factura.numero}`
                                                                    : "Sin factura"}
                                                            </p>

                                                            {factura && (
                                                                <p className="mt-1 text-xs text-slate-500">
                                                                    {formatearMoneda(
                                                                        factura.total,
                                                                        factura.moneda ??
                                                                        "PEN"
                                                                    )}
                                                                </p>
                                                            )}
                                                        </td>

                                                        <td className="px-5 py-4 text-slate-700">
                                                            {orden?.numero_oc ??
                                                                "No registrada"}
                                                        </td>

                                                        <td className="px-5 py-4">
                                                            <p className="font-semibold text-[#102033]">
                                                                {obtenerNombreOrigen(
                                                                    programacion
                                                                )}
                                                            </p>
                                                        </td>

                                                        <td className="px-5 py-4">
                                                            <p className="font-medium text-slate-700">
                                                                {evento?.nombre ??
                                                                    "No registrado"}
                                                            </p>

                                                            {evento?.cliente && (
                                                                <p className="mt-1 text-xs text-slate-500">
                                                                    {
                                                                        evento.cliente
                                                                    }
                                                                </p>
                                                            )}
                                                        </td>

                                                        <td className="px-5 py-4">
                                                            <DestinoBadge
                                                                tipo={
                                                                    programacion.tipo_destino
                                                                }
                                                            />
                                                        </td>

                                                        <td className="px-5 py-4 text-slate-700">
                                                            {textoTipoProgramacion(
                                                                programacion.tipo_programacion
                                                            )}
                                                        </td>

                                                        <td className="px-5 py-4 text-right font-bold text-[#102033]">
                                                            {formatearMoneda(
                                                                programacion.monto,
                                                                factura?.moneda ??
                                                                "PEN"
                                                            )}
                                                        </td>

                                                        <td className="px-5 py-4 text-slate-700">
                                                            {formatearFecha(
                                                                programacion.fecha_programada
                                                            )}
                                                        </td>

                                                        <td className="px-5 py-4">
                                                            <span
                                                                className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${claseEstado(
                                                                    programacion.estado
                                                                )}`}
                                                            >
                                                                {textoEstado(
                                                                    programacion.estado
                                                                )}
                                                            </span>
                                                        </td>

                                                        <td className="px-5 py-4 text-right">
                                                            {![
                                                                "pagado",
                                                                "cancelado",
                                                            ].includes(
                                                                programacion.estado
                                                            ) ? (
                                                                <Link
                                                                    href={`/pagos/registrar?programacion_pago_id=${programacion.id}`}
                                                                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2F73D9] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#245DB3]"
                                                                >
                                                                    <WalletCards className="h-4 w-4" />
                                                                    Registrar pago
                                                                </Link>
                                                            ) : (
                                                                <span className="text-xs font-medium text-slate-400">
                                                                    Sin acciones
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            }
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                </div>

                {toast && (
                    <Toast
                        tipo={toast.tipo}
                        mensaje={toast.mensaje}
                        onClose={() =>
                            setToast(null)
                        }
                    />
                )}
            </main>
        </MainLayout>
    );
}

function ResumenCard({
    titulo,
    monto,
    descripcion,
    icono,
    tipo,
}: {
    titulo: string;
    monto: number;
    descripcion: string;
    icono: React.ReactNode;
    tipo:
    | "programado"
    | "vencido"
    | "pagado"
    | "detraccion";
}) {
    const estilos = {
        programado:
            "border-blue-200 bg-blue-50 text-blue-700",

        vencido:
            "border-red-200 bg-red-50 text-red-700",

        pagado:
            "border-emerald-200 bg-emerald-50 text-emerald-700",
        detraccion:
            "border-amber-200 bg-amber-50 text-amber-700",
    };

    return (
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-medium text-slate-500">
                        {titulo}
                    </p>

                    <p className="mt-2 text-2xl font-bold text-[#102033]">
                        {formatearMoneda(monto)}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                        {descripcion}
                    </p>
                </div>

                <div
                    className={`rounded-xl border p-2.5 ${estilos[tipo]}`}
                >
                    {icono}
                </div>
            </div>
        </article>
    );
}

function DestinoBadge({
    tipo,
}: {
    tipo?: string | null;
}) {
    if (tipo === "detraccion") {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                <Landmark className="h-3.5 w-3.5" />
                Detracción
            </span>
        );
    }

    if (tipo === "proveedor") {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                <WalletCards className="h-3.5 w-3.5" />
                Proveedor
            </span>
        );
    }

    if (tipo === "personal_eventual") {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                <Clock3 className="h-3.5 w-3.5" />
                Personal eventual
            </span>
        );
    }

    return (
        <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
            No registrado
        </span>
    );
}
