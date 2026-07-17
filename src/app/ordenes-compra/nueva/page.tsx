"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import TablaItemsOC, {
    ItemOC,
} from "@/components/ordenes-compra/TablaItemsOC";
import ResumenTotalesOC from "@/components/ordenes-compra/ResumenTotalesOC";
import { apiFetch } from "@/lib/api";

type Evento = {
    id: string;
    nombre: string;
    cliente?: string | null;
    ubicacion?: string | null;
    fecha_inicio?: string;
    fecha_fin?: string;
};

type EventoProveedor = {
    id: string;
    evento_id: string;
    proveedor_id: string;
    servicio: string;
    monto_contratado: number | string;
    estado?: string | null;

    proveedores?: {
        razon_social?: string | null;
        documento?: string | null;
        direccion?: string | null;
    } | null;
};

type OrdenCreada = {
    id: string;
    numero_oc: string;
};

const itemInicial: ItemOC = {
    descripcion: "",
    cantidad: 0,
    precio_unitario: 0,
    subtotal: 0,
};

export default function NuevaOrdenCompraPage() {
    const router = useRouter();

    const [eventos, setEventos] = useState<Evento[]>([]);
    const [proveedoresEvento, setProveedoresEvento] = useState<
        EventoProveedor[]
    >([]);

    const [eventoId, setEventoId] = useState("");
    const [eventoProveedorId, setEventoProveedorId] = useState("");

    const [fechaEmision, setFechaEmision] = useState(
        new Date().toISOString().split("T")[0]
    );
    const [participacionEvento, setParticipacionEvento] = useState("");
    const [descripcion, setDescripcion] = useState("");
    const [lugarEntrega, setLugarEntrega] = useState("");
    const [fechaRequerida, setFechaRequerida] = useState("");
    const [moneda, setMoneda] = useState("PEN");
    const [condicionesPago, setCondicionesPago] = useState("");
    const [porcentajeIgv, setPorcentajeIgv] = useState(18);
    const [observaciones, setObservaciones] = useState("");
    const [requiereFactura, setRequiereFactura] = useState(true);
    const [archivoCotizacion, setArchivoCotizacion] = useState<File | null>(null);

    const [items, setItems] = useState<ItemOC[]>([{ ...itemInicial }]);

    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState("");

    const proveedorSeleccionado = useMemo(
        () =>
            proveedoresEvento.find(
                (item) => item.id === eventoProveedorId
            ) || null,
        [proveedoresEvento, eventoProveedorId]
    );

    const eventoSeleccionado = useMemo(
        () => eventos.find((evento) => evento.id === eventoId) || null,
        [eventos, eventoId]
    );

    const subtotal = useMemo(
        () =>
            items.reduce(
                (acumulado, item) => acumulado + Number(item.subtotal || 0),
                0
            ),
        [items]
    );

    const igv = useMemo(
        () => Number((subtotal * (porcentajeIgv / 100)).toFixed(2)),
        [subtotal, porcentajeIgv]
    );

    const total = useMemo(
        () => Number((subtotal + igv).toFixed(2)),
        [subtotal, igv]
    );

    useEffect(() => {
        async function cargarEventos() {
            try {
                const data = await apiFetch("/eventos/");
                setEventos(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Error cargando eventos:", error);
                setError("No se pudieron cargar los eventos.");
            }
        }

        cargarEventos();
    }, []);

    useEffect(() => {
        async function cargarProveedoresEvento() {
            if (!eventoId) {
                setProveedoresEvento([]);
                setEventoProveedorId("");
                return;
            }

            try {
                const data = await apiFetch(
                    `/eventos/${eventoId}/proveedores`
                );

                setProveedoresEvento(Array.isArray(data) ? data : []);
                setEventoProveedorId("");
            } catch (error) {
                console.error(
                    "Error cargando proveedores del evento:",
                    error
                );
                setProveedoresEvento([]);
                setError(
                    "No se pudieron cargar los proveedores asociados al evento."
                );
            }
        }

        cargarProveedoresEvento();
    }, [eventoId]);

    useEffect(() => {
        if (!eventoSeleccionado) return;

        if (!lugarEntrega && eventoSeleccionado.ubicacion) {
            setLugarEntrega(eventoSeleccionado.ubicacion);
        }
    }, [eventoSeleccionado]);

    useEffect(() => {
        if (
            proveedorSeleccionado?.servicio &&
            !participacionEvento
        ) {
            setParticipacionEvento(proveedorSeleccionado.servicio);
        }
    }, [proveedorSeleccionado]);

    function agregarItem() {
        setItems((actuales) => [...actuales, { ...itemInicial }]);
    }

    function editarItem(
        index: number,
        campo: keyof ItemOC,
        valor: string
    ) {
        setItems((actuales) =>
            actuales.map((item, itemIndex) => {
                if (itemIndex !== index) return item;

                const actualizado = { ...item };

                if (campo === "descripcion") {
                    actualizado.descripcion = valor;
                }

                if (campo === "cantidad") {
                    actualizado.cantidad = Number(valor || 0);
                }

                if (campo === "precio_unitario") {
                    actualizado.precio_unitario = Number(valor || 0);
                }

                actualizado.subtotal = Number(
                    (
                        Number(actualizado.cantidad || 0) *
                        Number(actualizado.precio_unitario || 0)
                    ).toFixed(2)
                );

                return actualizado;
            })
        );
    }

    function eliminarItem(index: number) {
        setItems((actuales) => {
            if (actuales.length === 1) {
                return [{ ...itemInicial }];
            }

            return actuales.filter(
                (_, itemIndex) => itemIndex !== index
            );
        });
    }

    function validarFormulario() {
        if (!eventoId) {
            return "Selecciona un evento.";
        }

        if (!proveedorSeleccionado) {
            return "Selecciona un proveedor asociado al evento.";
        }

        if (!participacionEvento.trim()) {
            return "Ingresa la participación o servicio principal.";
        }

        if (!fechaRequerida) {
            return "Selecciona la fecha requerida.";
        }

        const itemsValidos = items.filter(
            (item) =>
                item.descripcion.trim() &&
                Number(item.cantidad) > 0 &&
                Number(item.precio_unitario) >= 0
        );

        if (itemsValidos.length === 0) {
            return "Agrega al menos un ítem válido a la orden.";
        }

        if (
            itemsValidos.some(
                (item) =>
                    !item.descripcion.trim() ||
                    Number(item.cantidad) <= 0
            )
        ) {
            return "Revisa la descripción y cantidad de los ítems.";
        }

        return "";
    }

    async function guardarOrden(
        estadoDestino: "borrador" | "pendiente_factura" | "en_conformidad"
    ) {
        const mensajeValidacion = validarFormulario();

        if (mensajeValidacion) {
            setError(mensajeValidacion);
            return;
        }

        if (!proveedorSeleccionado) return;

        try {
            setGuardando(true);
            setError("");

            const ordenCreada: OrdenCreada = await apiFetch(
                "/ordenes-compra/",
                {
                    method: "POST",
                    body: JSON.stringify({
                        evento_id: eventoId,
                        proveedor_id:
                            proveedorSeleccionado.proveedor_id,
                        evento_proveedor_id: eventoProveedorId,
                        fecha_emision: fechaEmision,
                        participacion_evento:
                            participacionEvento.trim(),
                        descripcion: descripcion.trim() || null,
                        lugar_entrega: lugarEntrega.trim() || null,
                        fecha_requerida: fechaRequerida,
                        moneda,
                        condiciones_pago:
                            condicionesPago.trim() || null,
                        porcentaje_igv: porcentajeIgv,
                        observaciones: observaciones.trim() || null,
                        requiere_factura: requiereFactura,
                    }),
                }
            );

            const itemsValidos = items.filter(
                (item) =>
                    item.descripcion.trim() &&
                    Number(item.cantidad) > 0
            );

            for (const item of itemsValidos) {
                await apiFetch(
                    `/ordenes-compra/${ordenCreada.id}/items`,
                    {
                        method: "POST",
                        body: JSON.stringify({
                            descripcion: item.descripcion.trim(),
                            cantidad: Number(item.cantidad),
                            precio_unitario: Number(item.precio_unitario),
                        }),
                    }
                );
            }
            console.log("archivoCotizacion:", archivoCotizacion);
            // SUBIR COTIZACIÓN ANTES DE EMITIR LA OC
            if (archivoCotizacion) {
                console.log("Subiendo cotización para OC:", ordenCreada.id);
                const formData = new FormData();
                formData.append("archivo", archivoCotizacion);

                await apiFetch(
                    `/ordenes-compra/${ordenCreada.id}/cotizacion`,
                    {
                        method: "POST",
                        body: formData,
                    }
                );
            }

            // RECIÉN DESPUÉS CAMBIAR EL ESTADO
            if (estadoDestino !== "borrador") {
                await apiFetch(
                    `/ordenes-compra/${ordenCreada.id}/estado`,
                    {
                        method: "PUT",
                        body: JSON.stringify({
                            estado: estadoDestino,
                        }),
                    }
                );
            }

            router.push(`/ordenes-compra/${ordenCreada.id}`);
        } catch (error) {
            console.error(
                "Error guardando la orden de compra:",
                error
            );
            setError(
                "No se pudo guardar la orden de compra. Revisa los datos e inténtalo nuevamente."
            );
        } finally {
            setGuardando(false);
        }
    }

    return (
        <MainLayout>
            <main className="min-h-screen bg-[#F6F8FB] p-8">
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                    }}
                >
                    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="mb-3 text-sm font-semibold text-slate-500 hover:text-[#2F73D9]"
                            >
                                ← Volver a órdenes
                            </button>

                            <h1 className="text-3xl font-bold text-[#102033]">
                                Nueva Orden de Compra
                            </h1>

                            <p className="mt-1 text-sm text-slate-500">
                                Registra los datos e ítems de la orden.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <button
                                type="button"
                                disabled={guardando}
                                onClick={() => guardarOrden("borrador")}
                                className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-[#102033] hover:bg-slate-50 disabled:opacity-60"
                            >
                                {guardando ? "Guardando..." : "Guardar borrador"}
                            </button>

                            <button
                                type="button"
                                disabled={guardando}
                                onClick={() =>
                                    guardarOrden(
                                        requiereFactura ? "pendiente_factura" : "en_conformidad"
                                    )
                                }
                                className="rounded-xl bg-[#2F73D9] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#245DB3] disabled:opacity-60"
                            >
                                Emitir orden
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                            {error}
                        </div>
                    )}

                    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-6 border-b border-slate-200 pb-4">
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2F73D9]">
                                Orden de compra / servicio
                            </p>

                            <h2 className="mt-2 text-xl font-bold text-[#102033]">
                                Información principal
                            </h2>
                        </div>

                        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                            <Campo label="Evento" obligatorio>
                                <select
                                    value={eventoId}
                                    onChange={(event) => {
                                        setEventoId(event.target.value);
                                        setParticipacionEvento("");
                                    }}
                                    className={inputClass}
                                >
                                    <option value="">
                                        Selecciona un evento
                                    </option>

                                    {eventos.map((evento) => (
                                        <option
                                            key={evento.id}
                                            value={evento.id}
                                        >
                                            {evento.nombre}
                                        </option>
                                    ))}
                                </select>
                            </Campo>

                            <Campo label="Proveedor asociado" obligatorio>
                                <select
                                    value={eventoProveedorId}
                                    onChange={(event) =>
                                        setEventoProveedorId(event.target.value)
                                    }
                                    disabled={!eventoId}
                                    className={inputClass}
                                >
                                    <option value="">
                                        {eventoId
                                            ? "Selecciona un proveedor"
                                            : "Primero selecciona un evento"}
                                    </option>

                                    {proveedoresEvento.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.proveedores?.razon_social ||
                                                "Proveedor"}{" "}
                                            — {item.servicio}
                                        </option>
                                    ))}
                                </select>
                            </Campo>

                            <Campo label="Fecha de emisión">
                                <input
                                    type="date"
                                    value={fechaEmision}
                                    onChange={(event) =>
                                        setFechaEmision(event.target.value)
                                    }
                                    className={inputClass}
                                />
                            </Campo>

                            <Campo
                                label="Participación / servicio principal"
                                obligatorio
                            >
                                <input
                                    value={participacionEvento}
                                    onChange={(event) =>
                                        setParticipacionEvento(event.target.value)
                                    }
                                    placeholder="Ej. Logística del evento"
                                    className={inputClass}
                                />
                            </Campo>

                            <Campo label="Fecha requerida" obligatorio>
                                <input
                                    type="date"
                                    value={fechaRequerida}
                                    onChange={(event) =>
                                        setFechaRequerida(event.target.value)
                                    }
                                    className={inputClass}
                                />
                            </Campo>

                            <Campo label="Lugar de entrega">
                                <input
                                    value={lugarEntrega}
                                    onChange={(event) =>
                                        setLugarEntrega(event.target.value)
                                    }
                                    placeholder="Lugar de entrega o servicio"
                                    className={inputClass}
                                />
                            </Campo>

                            <Campo label="Moneda">
                                <select
                                    value={moneda}
                                    onChange={(event) =>
                                        setMoneda(event.target.value)
                                    }
                                    className={inputClass}
                                >
                                    <option value="PEN">Soles (PEN)</option>
                                    <option value="USD">
                                        Dólares (USD)
                                    </option>
                                </select>
                            </Campo>
                        </div>

                        <div className="mt-5 grid gap-5 md:grid-cols-2">
                            <Campo label="Condiciones de pago">
                                <textarea
                                    value={condicionesPago}
                                    onChange={(event) =>
                                        setCondicionesPago(event.target.value)
                                    }
                                    placeholder="Ej. 50% de adelanto y 50% al finalizar"
                                    rows={3}
                                    className={inputClass}
                                />
                            </Campo>

                            <Campo label="Descripción general">
                                <textarea
                                    value={descripcion}
                                    onChange={(event) =>
                                        setDescripcion(event.target.value)
                                    }
                                    placeholder="Descripción general de la orden"
                                    rows={3}
                                    className={inputClass}
                                />
                            </Campo>
                        </div>
                        <div className="mt-5">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                ¿Se recibirá factura?
                            </p>

                            <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                <button
                                    type="button"
                                    role="switch"
                                    aria-label="Indicar si la orden recibirá factura"
                                    aria-checked={requiereFactura}
                                    onClick={() => setRequiereFactura((actual) => !actual)}
                                    className={`relative h-6 w-11 shrink-0 rounded-full transition ${requiereFactura ? "bg-[#2F73D9]" : "bg-slate-300"
                                        }`}
                                >
                                    <span
                                        className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${requiereFactura ? "left-6" : "left-1"
                                            }`}
                                    />
                                </button>

                                <div>
                                    <p className="text-sm font-semibold text-[#102033]">
                                        {requiereFactura
                                            ? "Sí, se recibirá factura"
                                            : "No se recibirá factura"}
                                    </p>

                                    <p className="mt-1 text-xs text-slate-500">
                                        {requiereFactura
                                            ? "Luego continuará a la vista de Facturas."
                                            : "La orden pasará directamente a Conformidad."}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-5 flex items-center justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-bold text-[#102033]">
                                    Detalle de bienes y servicios
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Agrega todos los ítems que formarán parte de
                                    la orden.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={agregarItem}
                                className="rounded-xl border border-[#2F73D9] bg-blue-50 px-4 py-2.5 text-sm font-semibold text-[#2F73D9] hover:bg-blue-100"
                            >
                                + Agregar ítem
                            </button>
                        </div>

                        <TablaItemsOC
                            items={items}
                            editable
                            onEditar={editarItem}
                            onEliminar={eliminarItem}
                        />

                        <div className="mt-6">
                            <ResumenTotalesOC
                                subtotal={subtotal}
                                igv={igv}
                                total={total}
                                moneda={moneda}
                            />
                        </div>
                    </section>

                    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="mb-5 text-lg font-bold text-[#102033]">
                            Información adicional
                        </h2>

                        <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
                            <Campo label="IGV (%)">
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    value={porcentajeIgv}
                                    onChange={(event) =>
                                        setPorcentajeIgv(Number(event.target.value || 0))
                                    }
                                    onWheel={(event) => event.currentTarget.blur()}
                                    className={inputClass}
                                />
                            </Campo>

                            <Campo label="Observaciones">
                                <textarea
                                    value={observaciones}
                                    onChange={(event) => setObservaciones(event.target.value)}
                                    placeholder="Información adicional de la orden"
                                    rows={4}
                                    className={inputClass}
                                />
                            </Campo>
                        </div>
                    </section>
                    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-bold text-[#102033]">
                            Cotización del proveedor
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Adjunta el presupuesto o cotización que respalda esta orden.
                        </p>

                        <div className="mt-5 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-6">
                            <input
                                type="file"
                                accept=".pdf,.png,.jpg,.jpeg"
                                onChange={(event) => {
                                    const archivo = event.target.files?.[0] || null;
                                    setArchivoCotizacion(archivo);
                                }}
                                className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-[#2F73D9] file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-[#245DB3]"
                            />
                            {archivoCotizacion && (
                                <p className="mt-3 text-sm font-medium text-[#102033]">
                                    Archivo seleccionado: {archivoCotizacion.name}
                                </p>
                            )}
                            <p className="mt-2 text-xs text-slate-500">
                                Formatos permitidos: PDF, JPG o PNG.
                            </p>
                        </div>
                    </section>
                </form>
            </main>
        </MainLayout>
    );
}

const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#102033] outline-none transition placeholder:text-slate-400 focus:border-[#2F73D9] focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-400";

function Campo({
    label,
    obligatorio = false,
    children,
}: {
    label: string;
    obligatorio?: boolean;
    children: React.ReactNode;
}) {
    return (
        <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                {label}
                {obligatorio && (
                    <span className="ml-1 text-red-500">*</span>
                )}
            </span>

            {children}
        </label>
    );
}