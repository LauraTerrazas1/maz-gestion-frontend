"use client";

import Link from "next/link";
import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    ArrowLeft,
    Building2,
    CalendarDays,
    CreditCard,
    FileText,
    Landmark,
    Plus,
    ReceiptText,
    WalletCards,
    X,
} from "lucide-react";

import MainLayout from "@/components/layout/MainLayout";
import Toast from "@/components/ui/Toast";
import type { ToastTipo } from "@/components/ui/Toast";
import { apiFetch } from "@/lib/api";

type TipoOrigen =
    | "factura"
    | "personal_eventual";

type TipoDestino =
    | "proveedor"
    | "detraccion"
    | "personal_eventual";

type CuentaBancaria = {
    id: string;
    proveedor_id?: string | null;
    banco: string;
    tipo_cuenta: string;
    moneda: string;
    numero_cuenta: string;
    cci?: string | null;
    titular_cuenta?: string | null;
    es_principal?: boolean;
};

type Proveedor = {
    id: string;
    razon_social: string;
    documento?: string | null;
    contacto_nombre?: string | null;
    contacto_celular?: string | null;
    contacto_correo?: string | null;

    proveedores_cuentas_bancarias?:
    CuentaBancaria[];
};

type Evento = {
    id: string;
    nombre: string;
    cliente?: string | null;
};

type OrdenCompra = {
    id: string;
    numero_oc: string;
    evento_id?: string | null;
    proveedor_id?: string | null;

    eventos?: Evento | null;
    proveedores?: Proveedor | null;
};

type ResumenPagoFactura = {
    total_factura: number;
    tiene_detraccion: boolean;

    monto_proveedor: number;
    monto_detraccion: number;

    programado_proveedor: number;
    programado_detraccion: number;

    pendiente_proveedor: number;
    pendiente_detraccion: number;
};

type FacturaDisponible = {
    id: string;
    orden_compra_id: string;

    serie: string;
    numero: string;
    fecha_emision?: string | null;

    subtotal?: number | string | null;
    igv?: number | string | null;
    total: number | string;
    moneda: string;

    estado_conformidad?: string | null;

    codigo_detraccion?: string | null;
    porcentaje_detraccion?:
    number | string | null;
    monto_detraccion?:
    number | string | null;
    cuenta_detraccion_detectada?:
    string | null;

    ordenes_compra: OrdenCompra;
    resumen_pago: ResumenPagoFactura;
};

type PersonalGrupo = {
    id: string;
    evento_id: string;

    cargo_funcion: string;
    cantidad_personas: number;
    subtotal: number | string;

    fecha_pago?: string | null;
    estado: string;

    eventos?: Evento | null;
};

type ProgramacionExistente = {
    id: string;

    factura_id?: string | null;
    personal_grupo_id?: string | null;

    tipo_destino?: string | null;

    monto: number | string;
    estado: string;
};

type CuentaNuevaForm = {
    banco: string;
    tipo_cuenta: string;
    moneda: string;
    numero_cuenta: string;
    cci: string;
    titular_cuenta: string;
    es_principal: boolean;
};

type FormProgramacion = {
    origen: TipoOrigen;

    factura_id: string;
    personal_grupo_id: string;

    tipo_destino: TipoDestino;
    tipo_programacion: string;

    cuenta_bancaria_id: string;

    monto: string;

    fecha_programada: string;
    observaciones: string;
};

const inputClassName =
    "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2F73D9] focus:ring-2 focus:ring-[#2F73D9]/15";

const selectClassName =
    "w-full cursor-pointer rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2F73D9] focus:ring-2 focus:ring-[#2F73D9]/15 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";

const cuentaNuevaInicial: CuentaNuevaForm = {
    banco: "",
    tipo_cuenta: "corriente",
    moneda: "PEN",
    numero_cuenta: "",
    cci: "",
    titular_cuenta: "",
    es_principal: false,
};

const formInicial: FormProgramacion = {
    origen: "factura",

    factura_id: "",
    personal_grupo_id: "",

    tipo_destino: "proveedor",
    tipo_programacion: "pago_unico",

    cuenta_bancaria_id: "",

    monto: "",

    fecha_programada: "",
    observaciones: "",
};

export default function NuevaProgramacionPagoPage() {
    const [
        facturas,
        setFacturas,
    ] = useState<FacturaDisponible[]>([]);

    const [
        gruposPersonal,
        setGruposPersonal,
    ] = useState<PersonalGrupo[]>([]);

    const [
        programacionesExistentes,
        setProgramacionesExistentes,
    ] = useState<ProgramacionExistente[]>([]);

    const [
        form,
        setForm,
    ] = useState<FormProgramacion>(
        formInicial
    );

    const [
        cargando,
        setCargando,
    ] = useState(true);

    const [
        guardando,
        setGuardando,
    ] = useState(false);

    const [
        errores,
        setErrores,
    ] = useState<
        Record<string, string>
    >({});

    const [
        mostrarModalCuenta,
        setMostrarModalCuenta,
    ] = useState(false);

    const [
        guardandoCuenta,
        setGuardandoCuenta,
    ] = useState(false);

    const [
        cuentaNueva,
        setCuentaNueva,
    ] = useState<CuentaNuevaForm>(
        cuentaNuevaInicial
    );

    const [
        toast,
        setToast,
    ] = useState<{
        tipo: ToastTipo;
        mensaje: string;
    } | null>(null);

    const esFactura =
        form.origen === "factura";

    const esPersonalEventual =
        form.origen ===
        "personal_eventual";

    const esProveedor =
        form.tipo_destino ===
        "proveedor";

    const esDetraccion =
        form.tipo_destino ===
        "detraccion";

    const facturaSeleccionada =
        useMemo(() => {
            return (
                facturas.find(
                    (factura) =>
                        factura.id ===
                        form.factura_id
                ) ?? null
            );
        }, [
            facturas,
            form.factura_id,
        ]);

    const ordenSeleccionada =
        facturaSeleccionada
            ?.ordenes_compra ?? null;

    const proveedorSeleccionado =
        ordenSeleccionada
            ?.proveedores ?? null;

    const eventoSeleccionado =
        ordenSeleccionada
            ?.eventos ?? null;

    const cuentasProveedor =
        proveedorSeleccionado
            ?.proveedores_cuentas_bancarias ??
        [];

    const cuentaSeleccionada =
        cuentasProveedor.find(
            (cuenta) =>
                cuenta.id ===
                form.cuenta_bancaria_id
        ) ?? null;

    const grupoSeleccionado =
        useMemo(() => {
            return (
                gruposPersonal.find(
                    (grupo) =>
                        grupo.id ===
                        form.personal_grupo_id
                ) ?? null
            );
        }, [
            gruposPersonal,
            form.personal_grupo_id,
        ]);

    const saldoDestino = useMemo(() => {
        if (!facturaSeleccionada) {
            return 0;
        }

        if (esDetraccion) {
            return Number(
                facturaSeleccionada
                    .resumen_pago
                    .pendiente_detraccion ??
                0
            );
        }

        return Number(
            facturaSeleccionada
                .resumen_pago
                .pendiente_proveedor ??
            0
        );
    }, [
        facturaSeleccionada,
        esDetraccion,
    ]);

    const totalProgramadoPersonal =
        useMemo(() => {
            if (
                !form.personal_grupo_id
            ) {
                return 0;
            }

            return programacionesExistentes
                .filter(
                    (programacion) =>
                        programacion
                            .personal_grupo_id ===
                        form.personal_grupo_id &&
                        ![
                            "cancelado",
                        ].includes(
                            programacion.estado
                        )
                )
                .reduce(
                    (
                        acumulado,
                        programacion
                    ) =>
                        acumulado +
                        Number(
                            programacion.monto ??
                            0
                        ),
                    0
                );
        }, [
            programacionesExistentes,
            form.personal_grupo_id,
        ]);

    const saldoPersonal = Math.max(
        Number(
            grupoSeleccionado?.subtotal ??
            0
        ) - totalProgramadoPersonal,
        0
    );

    function formatearMoneda(
        valor?:
            | number
            | string
            | null,
        moneda = "PEN"
    ) {
        return new Intl.NumberFormat(
            "es-PE",
            {
                style: "currency",
                currency:
                    moneda || "PEN",
                minimumFractionDigits: 2,
            }
        ).format(
            Number(valor ?? 0)
        );
    }

    function formatearFecha(
        fecha?: string | null
    ) {
        if (!fecha) {
            return "No registrada";
        }

        return new Intl.DateTimeFormat(
            "es-PE",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
            }
        ).format(
            new Date(
                `${fecha}T00:00:00`
            )
        );
    }

    async function cargarFacturas() {
        try {
            const data = await apiFetch(
                "/programaciones-pago/facturas-disponibles"
            );

            setFacturas(
                Array.isArray(data)
                    ? data
                    : []
            );
        } catch (error) {
            console.error(
                "Error cargando facturas:",
                error
            );

            setFacturas([]);

            setToast({
                tipo: "error",
                mensaje:
                    "No se pudieron cargar las facturas disponibles.",
            });
        }
    }

    async function cargarGruposPersonal() {
        try {
            const data = await apiFetch(
                "/personal-eventual/grupos"
            );

            setGruposPersonal(
                Array.isArray(data)
                    ? data
                    : []
            );
        } catch (error) {
            console.error(
                "Error cargando personal eventual:",
                error
            );

            setGruposPersonal([]);
        }
    }

    async function cargarProgramaciones() {
        try {
            const data = await apiFetch(
                "/programaciones-pago/"
            );

            setProgramacionesExistentes(
                Array.isArray(data)
                    ? data
                    : []
            );
        } catch (error) {
            console.error(
                "Error cargando programaciones:",
                error
            );

            setProgramacionesExistentes(
                []
            );
        }
    }

    async function cargarDatosIniciales() {
        try {
            setCargando(true);

            await Promise.all([
                cargarFacturas(),
                cargarGruposPersonal(),
                cargarProgramaciones(),
            ]);
        } finally {
            setCargando(false);
        }
    }

    useEffect(() => {
        cargarDatosIniciales();
    }, []);
    function limpiarError(campo: string) {
        setErrores((actuales) => {
            const nuevos = {
                ...actuales,
            };

            delete nuevos[campo];

            return nuevos;
        });
    }

    function actualizarCampo<
        K extends keyof FormProgramacion
    >(
        campo: K,
        valor: FormProgramacion[K]
    ) {
        setForm((actual) => ({
            ...actual,
            [campo]: valor,
        }));

        limpiarError(campo);
    }

    function cambiarOrigen(
        origen: TipoOrigen
    ) {
        setForm({
            ...formInicial,
            origen,
            tipo_destino:
                origen === "factura"
                    ? "proveedor"
                    : "personal_eventual",
        });

        setErrores({});
    }

    function cambiarFactura(
        facturaId: string
    ) {
        const factura =
            facturas.find(
                (item) =>
                    item.id === facturaId
            ) ?? null;

        const saldoProveedor =
            Number(
                factura
                    ?.resumen_pago
                    .pendiente_proveedor ??
                0
            );

        const saldoDetraccion =
            Number(
                factura
                    ?.resumen_pago
                    .pendiente_detraccion ??
                0
            );

        const tieneDetraccion =
            Boolean(
                factura
                    ?.resumen_pago
                    .tiene_detraccion
            );

        let destino:
            TipoDestino = "proveedor";

        if (
            saldoProveedor <= 0 &&
            tieneDetraccion &&
            saldoDetraccion > 0
        ) {
            destino = "detraccion";
        }

        const cuentas =
            factura
                ?.ordenes_compra
                ?.proveedores
                ?.proveedores_cuentas_bancarias ??
            [];

        const cuentaPrincipal =
            cuentas.find(
                (cuenta) =>
                    cuenta.es_principal
            ) ?? cuentas[0];

        const saldoInicial =
            destino === "detraccion"
                ? saldoDetraccion
                : saldoProveedor;

        setForm((actual) => ({
            ...actual,
            factura_id: facturaId,
            tipo_destino: destino,
            tipo_programacion:
                "pago_unico",
            cuenta_bancaria_id:
                destino === "proveedor"
                    ? cuentaPrincipal?.id ??
                    ""
                    : "",
            monto:
                saldoInicial > 0
                    ? String(saldoInicial)
                    : "",
            fecha_programada: "",
            observaciones: "",
        }));

        setErrores({});
    }

    function cambiarDestino(
        destino: TipoDestino
    ) {
        if (
            destino === "detraccion" &&
            !facturaSeleccionada
                ?.resumen_pago
                .tiene_detraccion
        ) {
            setToast({
                tipo: "info",
                mensaje:
                    "La factura seleccionada no tiene detracción.",
            });

            return;
        }

        const nuevoSaldo =
            destino === "detraccion"
                ? Number(
                    facturaSeleccionada
                        ?.resumen_pago
                        .pendiente_detraccion ??
                    0
                )
                : Number(
                    facturaSeleccionada
                        ?.resumen_pago
                        .pendiente_proveedor ??
                    0
                );

        const cuentaPrincipal =
            cuentasProveedor.find(
                (cuenta) =>
                    cuenta.es_principal
            ) ?? cuentasProveedor[0];

        setForm((actual) => ({
            ...actual,
            tipo_destino: destino,
            cuenta_bancaria_id:
                destino === "proveedor"
                    ? cuentaPrincipal?.id ??
                    ""
                    : "",
            monto:
                nuevoSaldo > 0
                    ? String(nuevoSaldo)
                    : "",
        }));

        limpiarError(
            "tipo_destino"
        );

        limpiarError(
            "cuenta_bancaria_id"
        );

        limpiarError("monto");
    }

    function cambiarGrupoPersonal(
        grupoId: string
    ) {
        const grupo =
            gruposPersonal.find(
                (item) =>
                    item.id === grupoId
            ) ?? null;

        const totalProgramado =
            programacionesExistentes
                .filter(
                    (programacion) =>
                        programacion
                            .personal_grupo_id ===
                        grupoId &&
                        programacion.estado !==
                        "cancelado"
                )
                .reduce(
                    (
                        acumulado,
                        programacion
                    ) =>
                        acumulado +
                        Number(
                            programacion.monto ??
                            0
                        ),
                    0
                );

        const saldo = Math.max(
            Number(
                grupo?.subtotal ?? 0
            ) - totalProgramado,
            0
        );

        setForm((actual) => ({
            ...actual,
            personal_grupo_id:
                grupoId,
            tipo_destino:
                "personal_eventual",
            tipo_programacion:
                "pago_unico",
            cuenta_bancaria_id:
                "",
            monto:
                saldo > 0
                    ? String(saldo)
                    : "",
            fecha_programada:
                grupo?.fecha_pago ?? "",
            observaciones: "",
        }));

        setErrores({});
    }

    function abrirModalCuenta() {
        if (!proveedorSeleccionado) {
            setToast({
                tipo: "info",
                mensaje:
                    "Selecciona primero una factura.",
            });

            return;
        }

        setCuentaNueva({
            ...cuentaNuevaInicial,
            titular_cuenta:
                proveedorSeleccionado
                    .razon_social,
        });

        setMostrarModalCuenta(true);
    }

    function cerrarModalCuenta() {
        if (guardandoCuenta) {
            return;
        }

        setMostrarModalCuenta(
            false
        );

        setCuentaNueva(
            cuentaNuevaInicial
        );
    }

    function cambiarCuentaNueva(
        campo:
            keyof CuentaNuevaForm,
        valor:
            | string
            | boolean
    ) {
        setCuentaNueva(
            (actual) => ({
                ...actual,
                [campo]: valor,
            })
        );
    }

    async function guardarNuevaCuenta() {
        if (!proveedorSeleccionado) {
            return;
        }

        if (
            !cuentaNueva.banco.trim() ||
            !cuentaNueva
                .numero_cuenta
                .trim() ||
            !cuentaNueva
                .titular_cuenta
                .trim()
        ) {
            setToast({
                tipo: "info",
                mensaje:
                    "Completa banco, número de cuenta y titular.",
            });

            return;
        }

        try {
            setGuardandoCuenta(
                true
            );

            const cuentaCreada =
                (await apiFetch(
                    "/proveedores-cuentas/",
                    {
                        method: "POST",
                        body: JSON.stringify(
                            {
                                proveedor_id:
                                    proveedorSeleccionado.id,

                                banco:
                                    cuentaNueva.banco.trim(),

                                tipo_cuenta:
                                    cuentaNueva.tipo_cuenta,

                                moneda:
                                    cuentaNueva.moneda,

                                numero_cuenta:
                                    cuentaNueva.numero_cuenta.trim(),

                                cci:
                                    cuentaNueva.cci.trim() ||
                                    null,

                                titular_cuenta:
                                    cuentaNueva.titular_cuenta.trim(),

                                es_principal:
                                    cuentaNueva.es_principal,
                            }
                        ),
                    }
                )) as CuentaBancaria;

            await cargarFacturas();

            setForm(
                (actual) => ({
                    ...actual,
                    cuenta_bancaria_id:
                        cuentaCreada.id,
                })
            );

            setToast({
                tipo: "success",
                mensaje:
                    "Cuenta bancaria registrada correctamente.",
            });

            cerrarModalCuenta();
        } catch (error) {
            console.error(
                "Error registrando cuenta:",
                error
            );

            setToast({
                tipo: "error",
                mensaje:
                    "No se pudo registrar la cuenta bancaria.",
            });
        } finally {
            setGuardandoCuenta(
                false
            );
        }
    }

    function validarFormulario() {
        const nuevosErrores:
            Record<string, string> = {};

        const montoIngresado =
            Number(form.monto || 0);

        if (
            esFactura &&
            !form.factura_id
        ) {
            nuevosErrores.factura_id =
                "Selecciona una factura aprobada.";
        }

        if (
            esPersonalEventual &&
            !form.personal_grupo_id
        ) {
            nuevosErrores.personal_grupo_id =
                "Selecciona un grupo de personal eventual.";
        }

        if (
            esFactura &&
            !form.tipo_destino
        ) {
            nuevosErrores.tipo_destino =
                "Selecciona el destino del pago.";
        }

        if (
            esFactura &&
            esProveedor &&
            !form.cuenta_bancaria_id
        ) {
            nuevosErrores.cuenta_bancaria_id =
                "Selecciona una cuenta bancaria.";
        }

        if (
            esFactura &&
            esDetraccion &&
            !facturaSeleccionada
                ?.cuenta_detraccion_detectada
        ) {
            nuevosErrores.tipo_destino =
                "La factura no tiene una cuenta BN detectada.";
        }

        if (montoIngresado <= 0) {
            nuevosErrores.monto =
                "El monto debe ser mayor a cero.";
        }

        if (
            esFactura &&
            montoIngresado >
            saldoDestino
        ) {
            nuevosErrores.monto =
                `El monto supera el saldo disponible de ${formatearMoneda(
                    saldoDestino,
                    facturaSeleccionada
                        ?.moneda ??
                    "PEN"
                )}.`;
        }

        if (
            esPersonalEventual &&
            montoIngresado >
            saldoPersonal
        ) {
            nuevosErrores.monto =
                `El monto supera el saldo disponible de ${formatearMoneda(
                    saldoPersonal
                )}.`;
        }

        if (
            !form.fecha_programada
        ) {
            nuevosErrores.fecha_programada =
                "Selecciona la fecha programada.";
        }

        setErrores(
            nuevosErrores
        );

        return (
            Object.keys(
                nuevosErrores
            ).length === 0
        );
    }

    async function handleSubmit(
        event: React.FormEvent
    ) {
        event.preventDefault();

        if (!validarFormulario()) {
            return;
        }

        try {
            setGuardando(true);

            let payload:
                Record<string, unknown>;

            if (
                esFactura &&
                facturaSeleccionada &&
                ordenSeleccionada
            ) {
                payload = {
                    evento_id:
                        ordenSeleccionada
                            .evento_id ??
                        eventoSeleccionado
                            ?.id,

                    evento_proveedor_id:
                        null,

                    origen:
                        "factura",

                    factura_id:
                        facturaSeleccionada.id,

                    orden_compra_id:
                        facturaSeleccionada
                            .orden_compra_id,

                    cuenta_bancaria_id:
                        esProveedor
                            ? form
                                .cuenta_bancaria_id
                            : null,

                    tipo_destino:
                        form.tipo_destino,

                    tipo_programacion:
                        form.tipo_programacion,

                    monto:
                        Number(
                            form.monto
                        ),

                    fecha_programada:
                        form.fecha_programada,

                    estado:
                        "pendiente",

                    observaciones:
                        form.observaciones.trim() ||
                        (
                            esDetraccion
                                ? `Cuenta BN: ${facturaSeleccionada
                                    .cuenta_detraccion_detectada ??
                                ""
                                }`
                                : null
                        ),
                };
            } else {
                payload = {
                    evento_id:
                        grupoSeleccionado
                            ?.evento_id,

                    evento_proveedor_id:
                        null,

                    origen:
                        "personal_eventual",

                    factura_id: null,
                    orden_compra_id:
                        null,

                    cuenta_bancaria_id:
                        null,

                    tipo_destino:
                        "personal_eventual",

                    tipo_programacion:
                        form.tipo_programacion,

                    monto:
                        Number(
                            form.monto
                        ),

                    fecha_programada:
                        form.fecha_programada,

                    estado:
                        "pendiente",

                    observaciones:
                        form.observaciones.trim() ||
                        null,

                    personal_grupo_id:
                        form.personal_grupo_id,
                };
            }

            await apiFetch(
                "/programaciones-pago/",
                {
                    method: "POST",
                    body: JSON.stringify(
                        payload
                    ),
                }
            );

            setToast({
                tipo: "success",
                mensaje:
                    "Programación registrada correctamente.",
            });

            window.setTimeout(
                () => {
                    window.location.href =
                        "/programaciones-pago";
                },
                900
            );
        } catch (error) {
            console.error(
                "Error registrando programación:",
                error
            );

            setToast({
                tipo: "error",
                mensaje:
                    "No se pudo registrar la programación.",
            });
        } finally {
            setGuardando(false);
        }
    }

    if (cargando) {
        return (
            <MainLayout>
                <main className="min-h-screen bg-[#F6F8FB] p-8">
                    <p className="text-sm text-slate-500">
                        Cargando datos para la programación...
                    </p>
                </main>
            </MainLayout>
        );
    }
    return (
        <MainLayout>
            <main className="min-h-screen bg-[#F6F8FB] p-6 md:p-8">
                <div className="mx-auto max-w-7xl">
                    <Link
                        href="/programaciones-pago"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-[#2F73D9] transition hover:text-[#245DB3]"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Volver a programaciones
                    </Link>

                    <div className="mt-5">
                        <h1 className="text-3xl font-bold text-[#102033]">
                            Nueva programación
                        </h1>

                        <p className="mt-1 text-sm text-slate-500">
                            Define el monto, destino y fecha del próximo pago.
                        </p>
                    </div>

                    <form
                        onSubmit={handleSubmit}
                        className="mt-6 grid gap-6 xl:grid-cols-3"
                    >
                        <section className="space-y-6 xl:col-span-2">
                            {/* Origen */}

                            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                <h2 className="text-lg font-semibold text-[#102033]">
                                    Origen de la programación
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Selecciona si corresponde a una factura aprobada o a personal eventual.
                                </p>

                                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            cambiarOrigen(
                                                "factura"
                                            )
                                        }
                                        className={`rounded-xl border p-4 text-left transition ${esFactura
                                            ? "border-[#2F73D9] bg-blue-50"
                                            : "border-slate-200 bg-white hover:bg-slate-50"
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="rounded-lg bg-white p-2 text-[#2F73D9] shadow-sm">
                                                <ReceiptText className="h-5 w-5" />
                                            </div>

                                            <div>
                                                <p className="font-semibold text-[#102033]">
                                                    Factura aprobada
                                                </p>

                                                <p className="mt-1 text-xs text-slate-500">
                                                    Proveedor o detracción
                                                </p>
                                            </div>
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            cambiarOrigen(
                                                "personal_eventual"
                                            )
                                        }
                                        className={`rounded-xl border p-4 text-left transition ${esPersonalEventual
                                            ? "border-[#2F73D9] bg-blue-50"
                                            : "border-slate-200 bg-white hover:bg-slate-50"
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="rounded-lg bg-white p-2 text-[#2F73D9] shadow-sm">
                                                <WalletCards className="h-5 w-5" />
                                            </div>

                                            <div>
                                                <p className="font-semibold text-[#102033]">
                                                    Personal eventual
                                                </p>

                                                <p className="mt-1 text-xs text-slate-500">
                                                    Programación por grupo
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Factura */}

                            {esFactura && (
                                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                    <h2 className="text-lg font-semibold text-[#102033]">
                                        Factura y destino
                                    </h2>

                                    <div className="mt-5 space-y-5">
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                                Factura aprobada *
                                            </label>

                                            <select
                                                value={
                                                    form.factura_id
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    cambiarFactura(
                                                        event
                                                            .target
                                                            .value
                                                    )
                                                }
                                                className={`${selectClassName} ${errores.factura_id
                                                    ? "border-red-400"
                                                    : ""
                                                    }`}
                                            >
                                                <option value="">
                                                    Selecciona una factura
                                                </option>

                                                {facturas.map(
                                                    (
                                                        factura
                                                    ) => (
                                                        <option
                                                            key={
                                                                factura.id
                                                            }
                                                            value={
                                                                factura.id
                                                            }
                                                        >
                                                            {
                                                                factura.serie
                                                            }
                                                            -
                                                            {
                                                                factura.numero
                                                            }{" "}
                                                            ·{" "}
                                                            {
                                                                factura
                                                                    .ordenes_compra
                                                                    .numero_oc
                                                            }{" "}
                                                            ·{" "}
                                                            {
                                                                factura
                                                                    .ordenes_compra
                                                                    .proveedores
                                                                    ?.razon_social
                                                            }
                                                        </option>
                                                    )
                                                )}
                                            </select>

                                            {errores.factura_id && (
                                                <p className="mt-1.5 text-xs font-medium text-red-600">
                                                    {
                                                        errores.factura_id
                                                    }
                                                </p>
                                            )}
                                        </div>

                                        {facturaSeleccionada && (
                                            <>
                                                <div className="grid gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
                                                    <InfoItem
                                                        label="Orden de compra"
                                                        value={
                                                            ordenSeleccionada
                                                                ?.numero_oc ??
                                                            "No registrada"
                                                        }
                                                    />

                                                    <InfoItem
                                                        label="Proveedor"
                                                        value={
                                                            proveedorSeleccionado
                                                                ?.razon_social ??
                                                            "No registrado"
                                                        }
                                                    />

                                                    <InfoItem
                                                        label="Evento"
                                                        value={
                                                            eventoSeleccionado
                                                                ?.nombre ??
                                                            "No registrado"
                                                        }
                                                    />

                                                    <InfoItem
                                                        label="Total factura"
                                                        value={formatearMoneda(
                                                            facturaSeleccionada.total,
                                                            facturaSeleccionada.moneda
                                                        )}
                                                    />
                                                </div>

                                                <div>
                                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                                        Destino *
                                                    </label>

                                                    <div className="grid gap-3 sm:grid-cols-2">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                cambiarDestino(
                                                                    "proveedor"
                                                                )
                                                            }
                                                            disabled={
                                                                Number(
                                                                    facturaSeleccionada
                                                                        .resumen_pago
                                                                        .pendiente_proveedor
                                                                ) <=
                                                                0
                                                            }
                                                            className={`rounded-xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${esProveedor
                                                                ? "border-blue-300 bg-blue-50"
                                                                : "border-slate-200 bg-white hover:bg-slate-50"
                                                                }`}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <Building2 className="h-5 w-5 text-[#2F73D9]" />

                                                                <div>
                                                                    <p className="font-semibold text-[#102033]">
                                                                        Proveedor
                                                                    </p>

                                                                    <p className="mt-1 text-xs text-slate-500">
                                                                        Saldo:{" "}
                                                                        {formatearMoneda(
                                                                            facturaSeleccionada
                                                                                .resumen_pago
                                                                                .pendiente_proveedor,
                                                                            facturaSeleccionada.moneda
                                                                        )}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </button>

                                                        {facturaSeleccionada
                                                            .resumen_pago
                                                            .tiene_detraccion && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        cambiarDestino(
                                                                            "detraccion"
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        Number(
                                                                            facturaSeleccionada
                                                                                .resumen_pago
                                                                                .pendiente_detraccion
                                                                        ) <=
                                                                        0
                                                                    }
                                                                    className={`rounded-xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${esDetraccion
                                                                        ? "border-amber-300 bg-amber-50"
                                                                        : "border-slate-200 bg-white hover:bg-slate-50"
                                                                        }`}
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <Landmark className="h-5 w-5 text-amber-700" />

                                                                        <div>
                                                                            <p className="font-semibold text-[#102033]">
                                                                                Detracción
                                                                            </p>

                                                                            <p className="mt-1 text-xs text-slate-500">
                                                                                Saldo:{" "}
                                                                                {formatearMoneda(
                                                                                    facturaSeleccionada
                                                                                        .resumen_pago
                                                                                        .pendiente_detraccion,
                                                                                    facturaSeleccionada.moneda
                                                                                )}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </button>
                                                            )}
                                                    </div>

                                                    {errores.tipo_destino && (
                                                        <p className="mt-1.5 text-xs font-medium text-red-600">
                                                            {
                                                                errores.tipo_destino
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Personal eventual */}

                            {esPersonalEventual && (
                                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                    <h2 className="text-lg font-semibold text-[#102033]">
                                        Personal eventual
                                    </h2>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Selecciona el grupo que deseas programar.
                                    </p>

                                    <div className="mt-5">
                                        <label className="mb-2 block text-sm font-medium text-slate-700">
                                            Grupo *
                                        </label>

                                        <select
                                            value={
                                                form.personal_grupo_id
                                            }
                                            onChange={(event) =>
                                                cambiarGrupoPersonal(
                                                    event.target
                                                        .value
                                                )
                                            }
                                            className={`${selectClassName} ${errores.personal_grupo_id
                                                ? "border-red-400"
                                                : ""
                                                }`}
                                        >
                                            <option value="">
                                                Selecciona un grupo
                                            </option>

                                            {gruposPersonal.map(
                                                (grupo) => (
                                                    <option
                                                        key={
                                                            grupo.id
                                                        }
                                                        value={
                                                            grupo.id
                                                        }
                                                    >
                                                        {
                                                            grupo.cargo_funcion
                                                        }{" "}
                                                        ·{" "}
                                                        {
                                                            grupo.cantidad_personas
                                                        }{" "}
                                                        personas ·{" "}
                                                        {formatearMoneda(
                                                            grupo.subtotal
                                                        )}
                                                    </option>
                                                )
                                            )}
                                        </select>

                                        {errores.personal_grupo_id && (
                                            <p className="mt-1.5 text-xs font-medium text-red-600">
                                                {
                                                    errores.personal_grupo_id
                                                }
                                            </p>
                                        )}

                                        {grupoSeleccionado && (
                                            <div className="mt-4 grid gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-3">
                                                <InfoItem
                                                    label="Función"
                                                    value={
                                                        grupoSeleccionado.cargo_funcion
                                                    }
                                                />

                                                <InfoItem
                                                    label="Personas"
                                                    value={String(
                                                        grupoSeleccionado.cantidad_personas
                                                    )}
                                                />

                                                <InfoItem
                                                    label="Saldo disponible"
                                                    value={formatearMoneda(
                                                        saldoPersonal
                                                    )}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Datos de programación */}

                            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                <div className="flex items-start gap-3">
                                    <div className="rounded-xl bg-blue-50 p-2.5 text-[#2F73D9]">
                                        <CalendarDays className="h-5 w-5" />
                                    </div>

                                    <div>
                                        <h2 className="text-lg font-semibold text-[#102033]">
                                            Datos de la programación
                                        </h2>

                                        <p className="mt-1 text-sm text-slate-500">
                                            Define el monto y la fecha prevista.
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-5 grid gap-5 md:grid-cols-2">
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700">
                                            Tipo de programación
                                        </label>

                                        <select
                                            value={
                                                form.tipo_programacion
                                            }
                                            onChange={(event) =>
                                                actualizarCampo(
                                                    "tipo_programacion",
                                                    event.target
                                                        .value
                                                )
                                            }
                                            className={selectClassName}
                                        >
                                            <option value="pago_unico">
                                                Pago único
                                            </option>

                                            <option value="adelanto">
                                                Adelanto
                                            </option>

                                            <option value="segundo_pago">
                                                Segundo pago
                                            </option>

                                            <option value="tercer_pago">
                                                Tercer pago
                                            </option>

                                            <option value="cuarto_pago">
                                                Cuarto pago
                                            </option>

                                            <option value="saldo_final">
                                                Saldo final
                                            </option>

                                            <option value="otro">
                                                Otro
                                            </option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700">
                                            Monto a programar *
                                        </label>

                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={
                                                form.monto
                                            }
                                            onChange={(event) =>
                                                actualizarCampo(
                                                    "monto",
                                                    event.target
                                                        .value
                                                )
                                            }
                                            className={`${inputClassName} ${errores.monto
                                                ? "border-red-400"
                                                : ""
                                                }`}
                                            placeholder="0.00"
                                        />

                                        {errores.monto ? (
                                            <p className="mt-1.5 text-xs font-medium text-red-600">
                                                {
                                                    errores.monto
                                                }
                                            </p>
                                        ) : (
                                            <p className="mt-1.5 text-xs text-slate-500">
                                                Saldo disponible:{" "}
                                                {formatearMoneda(
                                                    esFactura
                                                        ? saldoDestino
                                                        : saldoPersonal,
                                                    facturaSeleccionada
                                                        ?.moneda ??
                                                    "PEN"
                                                )}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700">
                                            Fecha programada *
                                        </label>

                                        <input
                                            type="date"
                                            value={
                                                form.fecha_programada
                                            }
                                            onChange={(event) =>
                                                actualizarCampo(
                                                    "fecha_programada",
                                                    event.target
                                                        .value
                                                )
                                            }
                                            className={`${inputClassName} ${errores.fecha_programada
                                                ? "border-red-400"
                                                : ""
                                                }`}
                                        />

                                        {errores.fecha_programada && (
                                            <p className="mt-1.5 text-xs font-medium text-red-600">
                                                {
                                                    errores.fecha_programada
                                                }
                                            </p>
                                        )}
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="mb-2 block text-sm font-medium text-slate-700">
                                            Observaciones
                                        </label>

                                        <textarea
                                            rows={4}
                                            value={
                                                form.observaciones
                                            }
                                            onChange={(event) =>
                                                actualizarCampo(
                                                    "observaciones",
                                                    event.target
                                                        .value
                                                )
                                            }
                                            className={inputClassName}
                                            placeholder="Notas internas sobre la programación..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Cuenta bancaria */}

                            {esFactura &&
                                esProveedor &&
                                facturaSeleccionada && (
                                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                                            <div>
                                                <h2 className="text-lg font-semibold text-[#102033]">
                                                    Cuenta bancaria prevista
                                                </h2>

                                                <p className="mt-1 text-sm text-slate-500">
                                                    Selecciona la cuenta donde se realizará el pago.
                                                </p>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={
                                                    abrirModalCuenta
                                                }
                                                className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#2F73D9] bg-white px-4 py-2.5 text-sm font-semibold text-[#2F73D9] transition hover:bg-blue-50"
                                            >
                                                <Plus className="h-4 w-4" />
                                                Nueva cuenta
                                            </button>
                                        </div>

                                        {cuentasProveedor.length ===
                                            0 ? (
                                            <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
                                                <CreditCard className="mx-auto h-8 w-8 text-slate-300" />

                                                <p className="mt-2 text-sm font-semibold text-[#102033]">
                                                    No hay cuentas registradas
                                                </p>

                                                <p className="mt-1 text-xs text-slate-500">
                                                    Agrega una cuenta para continuar.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="mt-5 grid gap-3">
                                                {cuentasProveedor.map(
                                                    (cuenta) => {
                                                        const seleccionada =
                                                            cuenta.id ===
                                                            form.cuenta_bancaria_id;

                                                        return (
                                                            <button
                                                                key={
                                                                    cuenta.id
                                                                }
                                                                type="button"
                                                                onClick={() =>
                                                                    actualizarCampo(
                                                                        "cuenta_bancaria_id",
                                                                        cuenta.id
                                                                    )
                                                                }
                                                                className={`rounded-xl border p-4 text-left transition ${seleccionada
                                                                    ? "border-[#2F73D9] bg-blue-50"
                                                                    : "border-slate-200 bg-white hover:bg-slate-50"
                                                                    }`}
                                                            >
                                                                <div className="flex items-start justify-between gap-4">
                                                                    <div className="flex items-start gap-3">
                                                                        <div className="rounded-lg bg-white p-2 text-[#2F73D9] shadow-sm">
                                                                            <CreditCard className="h-5 w-5" />
                                                                        </div>

                                                                        <div>
                                                                            <p className="font-semibold text-[#102033]">
                                                                                {
                                                                                    cuenta.banco
                                                                                }
                                                                            </p>

                                                                            <p className="mt-1 text-sm text-slate-600">
                                                                                {
                                                                                    cuenta.tipo_cuenta
                                                                                }{" "}
                                                                                ·{" "}
                                                                                {
                                                                                    cuenta.moneda
                                                                                }
                                                                            </p>

                                                                            <p className="mt-1 text-xs text-slate-500">
                                                                                Cuenta:{" "}
                                                                                {
                                                                                    cuenta.numero_cuenta
                                                                                }
                                                                            </p>

                                                                            {cuenta.cci && (
                                                                                <p className="mt-1 text-xs text-slate-500">
                                                                                    CCI:{" "}
                                                                                    {
                                                                                        cuenta.cci
                                                                                    }
                                                                                </p>
                                                                            )}

                                                                            <p className="mt-1 text-xs text-slate-500">
                                                                                Titular:{" "}
                                                                                {
                                                                                    cuenta.titular_cuenta
                                                                                }
                                                                            </p>
                                                                        </div>
                                                                    </div>

                                                                    {cuenta.es_principal && (
                                                                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                                                            Principal
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </button>
                                                        );
                                                    }
                                                )}
                                            </div>
                                        )}

                                        {errores.cuenta_bancaria_id && (
                                            <p className="mt-2 text-xs font-medium text-red-600">
                                                {
                                                    errores.cuenta_bancaria_id
                                                }
                                            </p>
                                        )}
                                    </div>
                                )}

                            {/* Detracción */}

                            {esFactura &&
                                esDetraccion &&
                                facturaSeleccionada && (
                                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
                                        <div className="flex items-start gap-3">
                                            <div className="rounded-xl bg-white p-2.5 text-amber-700 shadow-sm">
                                                <Landmark className="h-5 w-5" />
                                            </div>

                                            <div>
                                                <h2 className="text-lg font-semibold text-[#102033]">
                                                    Cuenta de detracción
                                                </h2>

                                                <p className="mt-1 text-sm text-slate-600">
                                                    La programación utilizará la cuenta BN detectada en la factura.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-5 grid gap-4 sm:grid-cols-3">
                                            <InfoItem
                                                label="Cuenta BN"
                                                value={
                                                    facturaSeleccionada.cuenta_detraccion_detectada ??
                                                    "No registrada"
                                                }
                                            />

                                            <InfoItem
                                                label="Porcentaje"
                                                value={
                                                    facturaSeleccionada.porcentaje_detraccion != null
                                                        ? `${Number(
                                                            facturaSeleccionada.porcentaje_detraccion
                                                        ).toFixed(2)}%`
                                                        : "No registrado"
                                                }
                                            />

                                            <InfoItem
                                                label="Monto total"
                                                value={formatearMoneda(
                                                    facturaSeleccionada.monto_detraccion,
                                                    facturaSeleccionada.moneda
                                                )}
                                            />
                                        </div>
                                    </div>
                                )}
                        </section>

                        {/* Resumen */}

                        <aside className="space-y-6">
                            <div className="sticky top-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                <div className="flex items-start gap-3">
                                    <div className="rounded-xl bg-blue-50 p-2.5 text-[#2F73D9]">
                                        <FileText className="h-5 w-5" />
                                    </div>

                                    <div>
                                        <h2 className="text-lg font-semibold text-[#102033]">
                                            Resumen
                                        </h2>

                                        <p className="mt-1 text-sm text-slate-500">
                                            Revisa los datos antes de guardar.
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-5 space-y-4">
                                    <ResumenItem
                                        label="Origen"
                                        value={
                                            esFactura
                                                ? "Factura aprobada"
                                                : "Personal eventual"
                                        }
                                    />

                                    {esFactura && (
                                        <>
                                            <ResumenItem
                                                label="Factura"
                                                value={
                                                    facturaSeleccionada
                                                        ? `${facturaSeleccionada.serie}-${facturaSeleccionada.numero}`
                                                        : "No seleccionada"
                                                }
                                            />

                                            <ResumenItem
                                                label="Proveedor"
                                                value={
                                                    proveedorSeleccionado
                                                        ?.razon_social ??
                                                    "No registrado"
                                                }
                                            />

                                            <ResumenItem
                                                label="Destino"
                                                value={
                                                    esDetraccion
                                                        ? "Detracción"
                                                        : "Proveedor"
                                                }
                                            />
                                        </>
                                    )}

                                    {esPersonalEventual && (
                                        <ResumenItem
                                            label="Grupo"
                                            value={
                                                grupoSeleccionado
                                                    ?.cargo_funcion ??
                                                "No seleccionado"
                                            }
                                        />
                                    )}

                                    <ResumenItem
                                        label="Fecha"
                                        value={formatearFecha(
                                            form.fecha_programada
                                        )}
                                    />

                                    {esProveedor &&
                                        cuentaSeleccionada && (
                                            <ResumenItem
                                                label="Cuenta"
                                                value={`${cuentaSeleccionada.banco} · ${cuentaSeleccionada.numero_cuenta}`}
                                            />
                                        )}

                                    {esDetraccion &&
                                        facturaSeleccionada && (
                                            <ResumenItem
                                                label="Cuenta BN"
                                                value={
                                                    facturaSeleccionada.cuenta_detraccion_detectada ??
                                                    "No registrada"
                                                }
                                            />
                                        )}

                                    <div className="border-t border-slate-200 pt-4">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                            Monto programado
                                        </p>

                                        <p className="mt-2 text-2xl font-bold text-[#102033]">
                                            {formatearMoneda(
                                                form.monto,
                                                facturaSeleccionada
                                                    ?.moneda ??
                                                "PEN"
                                            )}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-6 flex flex-col gap-3">
                                    <button
                                        type="submit"
                                        disabled={
                                            guardando
                                        }
                                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2F73D9] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#245DB3] disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        <CalendarDays className="h-4 w-4" />

                                        {guardando
                                            ? "Guardando..."
                                            : "Guardar programación"}
                                    </button>

                                    <Link
                                        href="/programaciones-pago"
                                        className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                    >
                                        Cancelar
                                    </Link>
                                </div>
                            </div>
                        </aside>
                    </form>
                </div>

                {/* Modal nueva cuenta */}

                {mostrarModalCuenta && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
                        onMouseDown={
                            cerrarModalCuenta
                        }
                    >
                        <div
                            className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl"
                            onMouseDown={(event) =>
                                event.stopPropagation()
                            }
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h2 className="text-xl font-bold text-[#102033]">
                                        Nueva cuenta bancaria
                                    </h2>

                                    <p className="mt-1 text-sm text-slate-500">
                                        La cuenta quedará registrada para el proveedor.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={
                                        cerrarModalCuenta
                                    }
                                    disabled={
                                        guardandoCuenta
                                    }
                                    className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                                    aria-label="Cerrar modal"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="mt-6 grid gap-5 md:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Banco *
                                    </label>

                                    <input
                                        value={
                                            cuentaNueva.banco
                                        }
                                        onChange={(event) =>
                                            cambiarCuentaNueva(
                                                "banco",
                                                event.target
                                                    .value
                                            )
                                        }
                                        className={inputClassName}
                                        placeholder="Ej. BCP"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Tipo de cuenta
                                    </label>

                                    <select
                                        value={
                                            cuentaNueva.tipo_cuenta
                                        }
                                        onChange={(event) =>
                                            cambiarCuentaNueva(
                                                "tipo_cuenta",
                                                event.target
                                                    .value
                                            )
                                        }
                                        className={selectClassName}
                                    >
                                        <option value="corriente">
                                            Cuenta corriente
                                        </option>

                                        <option value="ahorros">
                                            Cuenta de ahorros
                                        </option>
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Moneda
                                    </label>

                                    <select
                                        value={
                                            cuentaNueva.moneda
                                        }
                                        onChange={(event) =>
                                            cambiarCuentaNueva(
                                                "moneda",
                                                event.target
                                                    .value
                                            )
                                        }
                                        className={selectClassName}
                                    >
                                        <option value="PEN">
                                            Soles
                                        </option>

                                        <option value="USD">
                                            Dólares
                                        </option>
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Número de cuenta *
                                    </label>

                                    <input
                                        value={
                                            cuentaNueva.numero_cuenta
                                        }
                                        onChange={(event) =>
                                            cambiarCuentaNueva(
                                                "numero_cuenta",
                                                event.target
                                                    .value
                                            )
                                        }
                                        className={inputClassName}
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        CCI
                                    </label>

                                    <input
                                        value={
                                            cuentaNueva.cci
                                        }
                                        onChange={(event) =>
                                            cambiarCuentaNueva(
                                                "cci",
                                                event.target
                                                    .value
                                            )
                                        }
                                        className={inputClassName}
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Titular *
                                    </label>

                                    <input
                                        value={
                                            cuentaNueva.titular_cuenta
                                        }
                                        onChange={(event) =>
                                            cambiarCuentaNueva(
                                                "titular_cuenta",
                                                event.target
                                                    .value
                                            )
                                        }
                                        className={inputClassName}
                                    />
                                </div>

                                <label className="flex items-center gap-3 md:col-span-2">
                                    <input
                                        type="checkbox"
                                        checked={
                                            cuentaNueva.es_principal
                                        }
                                        onChange={(event) =>
                                            cambiarCuentaNueva(
                                                "es_principal",
                                                event.target
                                                    .checked
                                            )
                                        }
                                        className="h-4 w-4 rounded border-slate-300 text-[#2F73D9]"
                                    />

                                    <span className="text-sm font-medium text-slate-700">
                                        Marcar como cuenta principal
                                    </span>
                                </label>
                            </div>

                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={
                                        cerrarModalCuenta
                                    }
                                    disabled={
                                        guardandoCuenta
                                    }
                                    className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="button"
                                    onClick={
                                        guardarNuevaCuenta
                                    }
                                    disabled={
                                        guardandoCuenta
                                    }
                                    className="inline-flex items-center gap-2 rounded-lg bg-[#2F73D9] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#245DB3] disabled:opacity-60"
                                >
                                    <Plus className="h-4 w-4" />

                                    {guardandoCuenta
                                        ? "Guardando..."
                                        : "Guardar cuenta"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

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

function InfoItem({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {label}
            </p>

            <p className="mt-1 text-sm font-semibold text-[#102033]">
                {value}
            </p>
        </div>
    );
}

function ResumenItem({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div className="flex items-start justify-between gap-4">
            <span className="text-sm text-slate-500">
                {label}
            </span>

            <span className="text-right text-sm font-semibold text-[#102033]">
                {value}
            </span>
        </div>
    );
}