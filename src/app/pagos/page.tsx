"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  FileText,
  Landmark,
  Search,
  Upload,
  WalletCards,
} from "lucide-react";

import MainLayout from "@/components/layout/MainLayout";
import Toast from "@/components/ui/Toast";
import type { ToastTipo } from "@/components/ui/Toast";
import { apiFetch } from "@/lib/api";

type CuentaBancaria = {
  id: string;
  banco: string;
  tipo_cuenta: string;
  moneda: string;
  numero_cuenta: string;
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
  eventos?: Evento | null;
};

type Factura = {
  id: string;
  serie: string;
  numero: string;
  total: number | string;
  moneda: string;

  estado_conformidad?: string | null;
  estado_detraccion?: string | null;
  monto_detraccion?: number | string | null;
  cuenta_detraccion_detectada?: string | null;

  ordenes_compra?: OrdenCompra | null;
};

type ProgramacionPago = {
  id: string;
  factura_id?: string | null;
  tipo_destino?: "proveedor" | "detraccion" | null;
  monto: number | string;
  fecha_programada: string;
  estado: string;
};

type ComprobantePago = {
  id: string;
  archivo_nombre?: string | null;
  archivo_path?: string | null;
  tipo_archivo?: string | null;
  fecha_subida?: string | null;
};

type Pago = {
  id: string;

  evento_id: string;
  factura_id?: string | null;
  orden_compra_id?: string | null;
  programacion_pago_id?: string | null;
  cuenta_bancaria_id?: string | null;

  origen: string;
  tipo_destino?: "proveedor" | "detraccion" | null;

  tipo_pago: string;
  metodo_pago: string;
  monto: number | string;

  fecha_programada?: string | null;
  fecha_real_pago?: string | null;

  banco?: string | null;
  numero_operacion?: string | null;
  observaciones?: string | null;

  estado: string;

  eventos?: Evento | null;
  proveedores?: Proveedor | null;
  facturas?: Factura | null;
  programaciones_pago?: ProgramacionPago | null;
  proveedores_cuentas_bancarias?: CuentaBancaria | null;
  comprobantes_pago?: ComprobantePago[];
};

type ResumenPago = {
  pendiente: number;
  programado: number;
  pagado: number;
  vencido: number;
};

type ComprobanteUrl = {
  archivo_nombre?: string;
  tipo_archivo?: string;
  signed_url?: string;
};

type FiltroComprobante =
  | "todos"
  | "con_comprobante"
  | "sin_comprobante";

type CSVRow = Record<
  string,
  string | number | null | undefined
>;

const inputClassName =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[#2F73D9] focus:ring-2 focus:ring-[#2F73D9]/15";

const selectClassName =
  "w-full cursor-pointer rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[#2F73D9] focus:ring-2 focus:ring-[#2F73D9]/15";

function formatearMoneda(
  valor?: number | string | null,
  moneda: string = "PEN"
) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: moneda || "PEN",
    minimumFractionDigits: 2,
  }).format(Number(valor ?? 0));
}

function formatearFecha(
  fecha?: string | null
) {
  if (!fecha) return "No registrada";

  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(
    new Date(`${fecha}T00:00:00`)
  );
}

function textoEstado(estado: string) {
  if (estado === "pendiente") return "Pendiente";
  if (estado === "programado") return "Programado";
  if (estado === "pagado") return "Pagado";

  if (estado === "pagado_sin_comprobante") {
    return "Pagado sin comprobante";
  }

  if (estado === "vencido") return "Vencido";
  if (estado === "cancelado") return "Cancelado";

  return estado || "No registrado";
}

function claseEstado(estado: string) {
  if (estado === "pagado") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (estado === "pagado_sin_comprobante") {
    return "border-sky-200 bg-sky-50 text-sky-700";
  }

  if (estado === "vencido") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (estado === "pendiente") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (estado === "cancelado") {
    return "border-slate-200 bg-slate-100 text-slate-600";
  }

  return "border-blue-200 bg-blue-50 text-blue-700";
}

function textoDestino(
  tipoDestino?: string | null
) {
  if (tipoDestino === "detraccion") {
    return "Detracción";
  }

  if (tipoDestino === "proveedor") {
    return "Proveedor";
  }

  return "No registrado";
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

export default function PagosPage() {
  const [pagos, setPagos] =
    useState<Pago[]>([]);

  const [cargando, setCargando] =
    useState(true);

  const [busqueda, setBusqueda] =
    useState("");

  const [estadoFiltro, setEstadoFiltro] =
    useState("todos");

  const [destinoFiltro, setDestinoFiltro] =
    useState("todos");

  const [
    comprobanteFiltro,
    setComprobanteFiltro,
  ] = useState<FiltroComprobante>(
    "todos"
  );

  const [
    fechaDesde,
    setFechaDesde,
  ] = useState("");

  const [
    fechaHasta,
    setFechaHasta,
  ] = useState("");

  const [
    pagoSeleccionado,
    setPagoSeleccionado,
  ] = useState<Pago | null>(null);

  const [
    archivoComprobante,
    setArchivoComprobante,
  ] = useState<File | null>(null);

  const [
    subiendoComprobante,
    setSubiendoComprobante,
  ] = useState(false);

  const [toast, setToast] =
    useState<{
      tipo: ToastTipo;
      mensaje: string;
    } | null>(null);

  async function cargarPagos() {
    try {
      setCargando(true);

      const data = await apiFetch(
        "/pagos/"
      );

      setPagos(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (error) {
      console.error(
        "Error cargando pagos:",
        error
      );

      setPagos([]);

      setToast({
        tipo: "error",
        mensaje:
          "No se pudieron cargar los pagos.",
      });
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarPagos();
  }, []);

  const pagosFiltrados = useMemo(() => {
    return pagos.filter((pago) => {
      const factura =
        pago.facturas;

      const orden =
        factura?.ordenes_compra;

      const proveedor =
        orden?.proveedores ??
        pago.proveedores;

      const evento =
        orden?.eventos ??
        pago.eventos;

      const comprobantes =
        pago.comprobantes_pago ?? [];

      const textoBusqueda = [
        factura
          ? `${factura.serie}-${factura.numero}`
          : "",
        orden?.numero_oc ?? "",
        proveedor?.razon_social ?? "",
        proveedor?.documento ?? "",
        evento?.nombre ?? "",
        evento?.cliente ?? "",
        pago.numero_operacion ?? "",
        pago.metodo_pago ?? "",
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
        estadoFiltro === "todos" ||
        pago.estado === estadoFiltro;

      const coincideDestino =
        destinoFiltro === "todos" ||
        pago.tipo_destino ===
        destinoFiltro;

      const tieneComprobante =
        comprobantes.length > 0;

      const coincideComprobante =
        comprobanteFiltro === "todos" ||
        (
          comprobanteFiltro ===
          "con_comprobante" &&
          tieneComprobante
        ) ||
        (
          comprobanteFiltro ===
          "sin_comprobante" &&
          !tieneComprobante
        );

      const fechaReferencia =
        pago.fecha_real_pago ??
        pago.fecha_programada ??
        "";

      const coincideDesde =
        !fechaDesde ||
        (
          fechaReferencia &&
          fechaReferencia >=
          fechaDesde
        );

      const coincideHasta =
        !fechaHasta ||
        (
          fechaReferencia &&
          fechaReferencia <=
          fechaHasta
        );

      return (
        coincideBusqueda &&
        coincideEstado &&
        coincideDestino &&
        coincideComprobante &&
        coincideDesde &&
        coincideHasta
      );
    });
  }, [
    pagos,
    busqueda,
    estadoFiltro,
    destinoFiltro,
    comprobanteFiltro,
    fechaDesde,
    fechaHasta,
  ]);

  const resumen = useMemo<ResumenPago>(
    () => {
      return pagos.reduce(
        (acumulado, pago) => {
          const monto =
            Number(pago.monto ?? 0);

          if (
            pago.estado ===
            "pagado" ||
            pago.estado ===
            "pagado_sin_comprobante"
          ) {
            acumulado.pagado +=
              monto;
          } else if (
            pago.estado ===
            "vencido"
          ) {
            acumulado.vencido +=
              monto;
          } else if (
            pago.programacion_pago_id
          ) {
            acumulado.programado +=
              monto;
          } else {
            acumulado.pendiente +=
              monto;
          }

          return acumulado;
        },
        {
          pendiente: 0,
          programado: 0,
          pagado: 0,
          vencido: 0,
        }
      );
    },
    [pagos]
  );
  function obtenerFactura(pago: Pago) {
    return pago.facturas ?? null;
  }

  function obtenerOrden(pago: Pago) {
    return pago.facturas?.ordenes_compra ?? null;
  }

  function obtenerProveedor(pago: Pago) {
    return (
      pago.facturas?.ordenes_compra?.proveedores ??
      pago.proveedores ??
      null
    );
  }

  function obtenerEvento(pago: Pago) {
    return (
      pago.facturas?.ordenes_compra?.eventos ??
      pago.eventos ??
      null
    );
  }

  function obtenerComprobante(pago: Pago) {
    return pago.comprobantes_pago?.[0] ?? null;
  }

  function limpiarFiltros() {
    setBusqueda("");
    setEstadoFiltro("todos");
    setDestinoFiltro("todos");
    setComprobanteFiltro("todos");
    setFechaDesde("");
    setFechaHasta("");
  }

  function handleDescargarCSV() {
    if (pagosFiltrados.length === 0) {
      setToast({
        tipo: "info",
        mensaje:
          "No hay pagos para exportar con los filtros seleccionados.",
      });

      return;
    }

    descargarCSV(
      "pagos_maz.csv",
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
          key: "evento",
          label: "Evento",
        },
        {
          key: "destino",
          label: "Destino",
        },
        {
          key: "monto",
          label: "Monto",
        },
        {
          key: "fecha_programada",
          label: "Fecha programada",
        },
        {
          key: "fecha_real_pago",
          label: "Fecha real de pago",
        },
        {
          key: "metodo_pago",
          label: "Método de pago",
        },
        {
          key: "banco",
          label: "Banco",
        },
        {
          key: "numero_operacion",
          label: "Número de operación",
        },
        {
          key: "estado",
          label: "Estado",
        },
        {
          key: "comprobante",
          label: "Comprobante",
        },
      ],
      pagosFiltrados.map((pago) => {
        const factura =
          obtenerFactura(pago);

        const orden =
          obtenerOrden(pago);

        const proveedor =
          obtenerProveedor(pago);

        const evento =
          obtenerEvento(pago);

        const comprobante =
          obtenerComprobante(pago);

        return {
          factura: factura
            ? `${factura.serie}-${factura.numero}`
            : "No registrada",

          orden_compra:
            orden?.numero_oc ??
            "No registrada",

          proveedor:
            proveedor?.razon_social ??
            "No registrado",

          evento:
            evento?.nombre ??
            "No registrado",

          destino: textoDestino(
            pago.tipo_destino
          ),

          monto: Number(
            pago.monto ?? 0
          ).toFixed(2),

          fecha_programada:
            pago.fecha_programada ??
            "",

          fecha_real_pago:
            pago.fecha_real_pago ??
            "",

          metodo_pago:
            pago.metodo_pago ??
            "",

          banco:
            pago.proveedores_cuentas_bancarias
              ?.banco ??
            pago.banco ??
            "",

          numero_operacion:
            pago.numero_operacion ??
            "",

          estado: textoEstado(
            pago.estado
          ),

          comprobante:
            comprobante
              ? comprobante.archivo_nombre ??
              "Sí"
              : "No",
        };
      })
    );
  }

  async function handleVerComprobante(
    pagoId: string
  ) {
    const ventana = window.open(
      "about:blank",
      "_blank"
    );

    try {
      const data =
        (await apiFetch(
          `/pagos/${pagoId}/comprobante-url`
        )) as ComprobanteUrl;

      if (!data.signed_url) {
        ventana?.close();

        setToast({
          tipo: "info",
          mensaje:
            "Este pago no tiene un comprobante disponible.",
        });

        return;
      }

      if (ventana) {
        ventana.location.href =
          data.signed_url;
      } else {
        window.open(
          data.signed_url,
          "_blank"
        );
      }
    } catch (error) {
      console.error(
        "Error abriendo comprobante:",
        error
      );

      ventana?.close();

      setToast({
        tipo: "error",
        mensaje:
          "No se pudo abrir el comprobante.",
      });
    }
  }

  function seleccionarComprobante(
    pago: Pago
  ) {
    setPagoSeleccionado(pago);
    setArchivoComprobante(null);
  }

  function cerrarModalComprobante() {
    if (subiendoComprobante) {
      return;
    }

    setPagoSeleccionado(null);
    setArchivoComprobante(null);
  }

  async function subirComprobanteExistente() {
    if (!pagoSeleccionado) {
      return;
    }

    if (!archivoComprobante) {
      setToast({
        tipo: "info",
        mensaje:
          "Selecciona un archivo de comprobante.",
      });

      return;
    }

    const tiposPermitidos = [
      "application/pdf",
      "image/jpeg",
      "image/png",
    ];

    if (
      !tiposPermitidos.includes(
        archivoComprobante.type
      )
    ) {
      setToast({
        tipo: "error",
        mensaje:
          "El comprobante debe ser PDF, JPG o PNG.",
      });

      return;
    }

    const maximoBytes =
      10 * 1024 * 1024;

    if (
      archivoComprobante.size >
      maximoBytes
    ) {
      setToast({
        tipo: "error",
        mensaje:
          "El archivo supera el límite de 10 MB.",
      });

      return;
    }

    const formData =
      new FormData();

    formData.append(
      "archivo",
      archivoComprobante
    );

    try {
      setSubiendoComprobante(true);

      const apiUrl =
        process.env
          .NEXT_PUBLIC_API_URL;

      if (!apiUrl) {
        throw new Error(
          "NEXT_PUBLIC_API_URL no está configurada."
        );
      }

      const response =
        await fetch(
          `${apiUrl}/pagos/${pagoSeleccionado.id}/comprobante`,
          {
            method: "POST",
            body: formData,
          }
        );

      if (!response.ok) {
        const mensaje =
          await response.text();

        throw new Error(mensaje);
      }

      setToast({
        tipo: "success",
        mensaje:
          "Comprobante subido correctamente.",
      });

      cerrarModalComprobante();
      await cargarPagos();
    } catch (error) {
      console.error(
        "Error subiendo comprobante:",
        error
      );

      setToast({
        tipo: "error",
        mensaje:
          "No se pudo subir el comprobante.",
      });
    } finally {
      setSubiendoComprobante(false);
    }
  }

  function renderAccionPago(pago: Pago) {
    const comprobante = obtenerComprobante(pago);

    if (comprobante) {
      return (
        <button
          type="button"
          onClick={() => handleVerComprobante(pago.id)}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-[#102033] transition hover:bg-slate-50"
        >
          <Eye className="h-4 w-4" />
          Ver comprobante
        </button>
      );
    }

    if (
      pago.estado === "pagado" ||
      pago.estado === "pagado_sin_comprobante"
    ) {
      return (
        <button
          type="button"
          onClick={() => seleccionarComprobante(pago)}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
        >
          <Upload className="h-4 w-4" />
          Subir comprobante
        </button>
      );
    }

    return (
      <Link
        href={`/pagos/${pago.id}`}
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-[#102033] transition hover:bg-slate-50"
      >
        <Eye className="h-4 w-4" />
        Ver detalle
      </Link>
    );
  }
  return (
    <MainLayout>
      <main className="min-h-screen bg-[#F6F8FB] p-6 md:p-8">
        <div className="mx-auto max-w-7xl">

          {/* Encabezado */}

          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
            <div>
              <h1 className="text-3xl font-bold text-[#102033]">
                Pagos realizados
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Consulta los pagos ejecutados, sus comprobantes y métodos de pago.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/pagos/historial"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-[#102033] shadow-sm transition hover:bg-slate-50"
              >
                <Clock3 className="h-4 w-4" />
                Historial
              </Link>

              <button
                type="button"
                onClick={handleDescargarCSV}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-[#102033] shadow-sm transition hover:bg-slate-50"
              >
                <Download className="h-4 w-4" />
                Descargar CSV
              </button>
            </div>
          </div>

          {/* Resumen */}

          <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <ResumenCard
              titulo="Total pagado"
              monto={resumen.pagado}
              descripcion="Pagos ejecutados"
              icono={
                <CheckCircle2 className="h-5 w-5" />
              }
              tipo="pagado"
            />

            <ResumenCard
              titulo="Con comprobante"
              monto={pagos
                .filter(
                  (pago) =>
                    (pago.comprobantes_pago ?? []).length > 0
                )
                .reduce(
                  (total, pago) =>
                    total + Number(pago.monto ?? 0),
                  0
                )}
              descripcion="Pagos con sustento adjunto"
              icono={
                <FileText className="h-5 w-5" />
              }
              tipo="pagado"
            />

            <ResumenCard
              titulo="Sin comprobante"
              monto={pagos
                .filter(
                  (pago) =>
                    (pago.comprobantes_pago ?? []).length === 0
                )
                .reduce(
                  (total, pago) =>
                    total + Number(pago.monto ?? 0),
                  0
                )}
              descripcion="Comprobantes pendientes"
              icono={
                <Upload className="h-5 w-5" />
              }
              tipo="pendiente"
            />
          </section>

          {/* Filtros */}

          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div>
                <h2 className="font-semibold text-[#102033]">
                  Filtros
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Busca por factura, OC, proveedor, evento o número de operación.
                </p>
              </div>

              <button
                type="button"
                onClick={limpiarFiltros}
                className="text-sm font-semibold text-[#2F73D9] transition hover:text-[#245DB3]"
              >
                Limpiar filtros
              </button>
            </div>

            <div className="mt-5 grid items-end gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  value={busqueda}
                  onChange={(event) =>
                    setBusqueda(
                      event.target.value
                    )
                  }
                  placeholder="Factura, OC, proveedor o evento"
                  className={`${inputClassName} pl-10`}
                />
              </div>

              <select
                value={estadoFiltro}
                onChange={(event) =>
                  setEstadoFiltro(
                    event.target.value
                  )
                }
                className={selectClassName}
              >
                <option value="todos">
                  Todos los estados
                </option>

                <option value="pagado">
                  Pagado
                </option>

                <option value="pagado_sin_comprobante">
                  Pagado sin comprobante
                </option>

                <option value="cancelado">
                  Cancelado
                </option>
              </select>

              <select
                value={destinoFiltro}
                onChange={(event) =>
                  setDestinoFiltro(
                    event.target.value
                  )
                }
                className={selectClassName}
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
              </select>

              <select
                value={comprobanteFiltro}
                onChange={(event) =>
                  setComprobanteFiltro(
                    event.target.value as FiltroComprobante
                  )
                }
                className="h-[42px] w-full cursor-pointer rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-[#2F73D9] focus:ring-2 focus:ring-[#2F73D9]/15"
              >
                <option value="todos">
                  Todos los comprobantes
                </option>

                <option value="con_comprobante">
                  Con comprobante
                </option>

                <option value="sin_comprobante">
                  Sin comprobante
                </option>
              </select>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Desde
                </label>

                <input
                  type="date"
                  value={fechaDesde}
                  onChange={(event) =>
                    setFechaDesde(
                      event.target.value
                    )
                  }
                  className={inputClassName}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Hasta
                </label>

                <input
                  type="date"
                  value={fechaHasta}
                  onChange={(event) =>
                    setFechaHasta(
                      event.target.value
                    )
                  }
                  className={inputClassName}
                />
              </div>
            </div>
          </section>

          {/* Tabla */}

          <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col justify-between gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="font-semibold text-[#102033]">
                  Pagos registrados
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {pagosFiltrados.length} resultado
                  {pagosFiltrados.length === 1
                    ? ""
                    : "s"}
                </p>
              </div>

              <div className="text-sm text-slate-500">
                Total filtrado:{" "}
                <span className="font-bold text-[#102033]">
                  {formatearMoneda(
                    pagosFiltrados.reduce(
                      (
                        acumulado,
                        pago
                      ) =>
                        acumulado +
                        Number(
                          pago.monto ??
                          0
                        ),
                      0
                    )
                  )}
                </span>
              </div>
            </div>

            {cargando ? (
              <div className="p-8 text-center text-sm text-slate-500">
                Cargando pagos...
              </div>
            ) : pagosFiltrados.length === 0 ? (
              <div className="p-10 text-center">
                <FileText className="mx-auto h-10 w-10 text-slate-300" />

                <h3 className="mt-3 font-semibold text-[#102033]">
                  No hay pagos registrados
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Todavía no existen pagos que coincidan con los filtros.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1180px] text-sm">
                  <thead className="bg-slate-50 text-slate-600">
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
                        Evento
                      </th>

                      <th className="px-5 py-3 text-left">
                        Destino
                      </th>

                      <th className="px-5 py-3 text-right">
                        Monto
                      </th>

                      <th className="px-5 py-3 text-left">
                        Fecha
                      </th>

                      <th className="px-5 py-3 text-left">
                        Método
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
                    {pagosFiltrados.map(
                      (pago) => {
                        const factura =
                          obtenerFactura(
                            pago
                          );

                        const orden =
                          obtenerOrden(
                            pago
                          );

                        const proveedor =
                          obtenerProveedor(
                            pago
                          );

                        const evento =
                          obtenerEvento(
                            pago
                          );

                        const cuenta =
                          pago
                            .proveedores_cuentas_bancarias;

                        return (
                          <tr
                            key={
                              pago.id
                            }
                            className="border-t border-slate-100 transition hover:bg-slate-50/60"
                          >
                            <td className="px-5 py-4">
                              <div>
                                <p className="font-semibold text-[#102033]">
                                  {factura
                                    ? `${factura.serie}-${factura.numero}`
                                    : "No registrada"}
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                  {factura
                                    ? formatearMoneda(
                                      factura.total,
                                      factura.moneda
                                    )
                                    : "Sin factura vinculada"}
                                </p>
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <p className="font-medium text-slate-700">
                                {orden?.numero_oc ??
                                  "No registrada"}
                              </p>
                            </td>

                            <td className="px-5 py-4">
                              <div>
                                <p className="font-semibold text-[#102033]">
                                  {proveedor?.razon_social ??
                                    "No registrado"}
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                  {proveedor?.documento ??
                                    "Sin documento"}
                                </p>
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <div>
                                <p className="font-medium text-slate-700">
                                  {evento?.nombre ??
                                    "No registrado"}
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                  {evento?.cliente ??
                                    "Sin cliente"}
                                </p>
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <DestinoBadge
                                tipo={
                                  pago.tipo_destino
                                }
                              />

                              {pago.tipo_destino ===
                                "proveedor" &&
                                cuenta && (
                                  <p className="mt-2 text-xs text-slate-500">
                                    {
                                      cuenta.banco
                                    }{" "}
                                    ·{" "}
                                    {
                                      cuenta.numero_cuenta
                                    }
                                  </p>
                                )}

                              {pago.tipo_destino ===
                                "detraccion" && (
                                  <p className="mt-2 text-xs text-slate-500">
                                    Cuenta BN
                                  </p>
                                )}
                            </td>

                            <td className="px-5 py-4 text-right">
                              <p className="font-bold text-[#102033]">
                                {formatearMoneda(
                                  pago.monto,
                                  factura?.moneda ??
                                  "PEN"
                                )}
                              </p>
                            </td>

                            <td className="px-5 py-4">
                              <div>
                                <p className="font-medium text-slate-700">
                                  {formatearFecha(pago.fecha_real_pago)}
                                </p>

                                {pago.fecha_programada && (
                                  <p className="mt-1 text-xs text-slate-500">
                                    Programado: {formatearFecha(pago.fecha_programada)}
                                  </p>
                                )}
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <div>
                                <p className="font-medium text-slate-700">
                                  {pago.metodo_pago ||
                                    "No registrado"}
                                </p>

                                {pago.numero_operacion && (
                                  <p className="mt-1 text-xs text-slate-500">
                                    Op.{" "}
                                    {
                                      pago.numero_operacion
                                    }
                                  </p>
                                )}
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${claseEstado(
                                  pago.estado
                                )}`}
                              >
                                {textoEstado(
                                  pago.estado
                                )}
                              </span>
                            </td>

                            <td className="px-5 py-4 text-right">
                              {renderAccionPago(
                                pago
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

        {pagoSeleccionado && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onMouseDown={
              cerrarModalComprobante
            }
          >
            <div
              className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
              onMouseDown={(
                event
              ) =>
                event.stopPropagation()
              }
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-[#102033]">
                    Subir comprobante
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Adjunta el comprobante del pago realizado.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    cerrarModalComprobante
                  }
                  disabled={
                    subiendoComprobante
                  }
                  className="rounded-lg px-2 py-1 text-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed"
                  aria-label="Cerrar modal"
                >
                  ×
                </button>
              </div>

              <div className="mt-5 rounded-xl bg-slate-50 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Monto
                    </p>

                    <p className="mt-1 font-bold text-[#102033]">
                      {formatearMoneda(
                        pagoSeleccionado.monto,
                        pagoSeleccionado
                          .facturas
                          ?.moneda ??
                        "PEN"
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Destino
                    </p>

                    <p className="mt-1 font-semibold text-[#102033]">
                      {textoDestino(
                        pagoSeleccionado.tipo_destino
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Archivo *
                </label>

                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(event) =>
                    setArchivoComprobante(
                      event.target
                        .files?.[0] ??
                      null
                    )
                  }
                  disabled={
                    subiendoComprobante
                  }
                  className="block w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[#102033] hover:file:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                />

                <p className="mt-2 text-xs text-slate-500">
                  Formatos permitidos:
                  PDF, JPG o PNG.
                  Máximo 10 MB.
                </p>

                {archivoComprobante && (
                  <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <p className="break-all text-sm font-medium text-slate-700">
                      {
                        archivoComprobante.name
                      }
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {(
                        archivoComprobante.size /
                        1024 /
                        1024
                      ).toFixed(
                        2
                      )}{" "}
                      MB
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={
                    cerrarModalComprobante
                  }
                  disabled={
                    subiendoComprobante
                  }
                  className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={
                    subirComprobanteExistente
                  }
                  disabled={
                    subiendoComprobante ||
                    !archivoComprobante
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2F73D9] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#245DB3] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Upload className="h-4 w-4" />

                  {subiendoComprobante
                    ? "Subiendo..."
                    : "Subir comprobante"}
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
  | "pendiente"
  | "programado"
  | "pagado"
  | "vencido";
}) {
  const estilos = {
    pendiente:
      "border-amber-200 bg-amber-50 text-amber-700",
    programado:
      "border-blue-200 bg-blue-50 text-blue-700",
    pagado:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
    vencido:
      "border-red-200 bg-red-50 text-red-700",
  };

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {titulo}
          </p>

          <p className="mt-2 text-2xl font-bold text-[#102033]">
            {formatearMoneda(
              monto
            )}
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

  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
      No registrado
    </span>
  );
}