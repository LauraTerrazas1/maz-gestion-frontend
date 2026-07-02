"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import MainLayout from "@/components/layout/MainLayout";
import Toast from "@/components/ui/Toast";
import type { ToastTipo } from "@/components/ui/Toast";
import { apiFetch } from "@/lib/api";

type Pago = {
  id: string;
  evento_id: string;
  evento_proveedor_id?: string | null;
  programacion_pago_id?: string | null;
  origen: string;
  tipo_pago: string;
  metodo_pago: string;
  monto: number | string;
  fecha_programada: string | null;
  fecha_real_pago: string | null;
  banco: string | null;
  numero_operacion: string | null;
  observaciones: string | null;
  estado: string;
  eventos?: {
    nombre: string | null;
    cliente: string | null;
  };
  proveedores?: {
    razon_social: string | null;
  };
  evento_proveedores?: {
    servicio: string | null;
    monto_contratado: number | string | null;
  };
  personal_eventual_grupos?: {
    cargo_funcion: string | null;
    cantidad_personas: number | null;
    subtotal: number | string | null;
  };
  comprobantes_pago?: {
    id: string;
    archivo_nombre: string | null;
  }[];
};

type ComprobanteUrl = {
  archivo_nombre?: string;
  tipo_archivo?: string;
  signed_url?: string;
};

type CSVRow = Record<string, string | number | null | undefined>;

const selectClassName =
  "w-full cursor-pointer rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-[#2F73D9] focus:ring-2 focus:ring-[#2F73D9]/20";

function descargarCSV(
  nombreArchivo: string,
  columnas: { key: string; label: string }[],
  filas: CSVRow[]
) {
  const encabezados = columnas.map((col) => col.label).join(";");
  const contenido = filas.map((fila) =>
    columnas
      .map((col) => {
        const valor = fila[col.key] ?? "";
        return `"${String(valor).replaceAll('"', '""')}"`;
      })
      .join(";")
  );

  const csv = [encabezados, ...contenido].join("\n");
  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nombreArchivo;
  link.click();
  URL.revokeObjectURL(url);
}

export default function PagosPage() {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("todos");
  const [origenFiltro, setOrigenFiltro] = useState("todos");
  const [toast, setToast] = useState<{ tipo: ToastTipo; mensaje: string } | null>(null);
  const [pagoSeleccionado, setPagoSeleccionado] = useState<Pago | null>(null);
  const [archivoComprobante, setArchivoComprobante] = useState<File | null>(null);

  async function cargarPagos() {
    try {
      const data = await apiFetch("/pagos/");
      setPagos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando pagos:", error);
      setPagos([]);
    }
  }

  useEffect(() => {
    void Promise.resolve().then(cargarPagos);
  }, []);

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
    if (estado === "pagado_sin_comprobante") return "Pagado sin comprobante";
    if (estado === "vencido") return "Vencido";
    return estado;
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

    if (estado === "pendiente" || estado === "planificacion") {
      return "border-amber-200 bg-amber-50 text-amber-700";
    }

    if (estado === "pagado_sin_comprobante" || estado === "comprobante_pendiente") {
      return "border-sky-200 bg-sky-50 text-sky-700";
    }

    if (estado === "vencido" || estado === "pago_vencido") {
      return "border-red-200 bg-red-50 text-red-700";
    }

    if (estado === "inactivo") {
      return "border-slate-200 bg-slate-100 text-slate-600";
    }

    if (estado === "en_curso") {
      return "border-blue-200 bg-blue-50 text-blue-700";
    }

    if (estado === "finalizado") {
      return "border-slate-300 bg-slate-100 text-slate-700";
    }

    return "border-slate-200 bg-slate-50 text-slate-600";
  }

  const pagosOperativos = pagos.filter((pago) => {
    const tieneComprobante =
      pago.comprobantes_pago && pago.comprobantes_pago.length > 0;

    return !(pago.estado === "pagado" && tieneComprobante) && pago.estado !== "cancelado";
  });

  const pagosFiltrados = pagosOperativos.filter((pago) => {
    const texto = `${pago.eventos?.nombre || ""} ${pago.proveedores?.razon_social || ""
      } ${pago.personal_eventual_grupos?.cargo_funcion || ""} ${pago.tipo_pago || ""
      } ${pago.metodo_pago || ""}`.toLowerCase();

    const coincideBusqueda = texto.includes(busqueda.toLowerCase());
    const coincideEstado = estadoFiltro === "todos" || pago.estado === estadoFiltro;
    const coincideOrigen = origenFiltro === "todos" || pago.origen === origenFiltro;

    return coincideBusqueda && coincideEstado && coincideOrigen;
  });
  function handleDescargarCSV() {
    if (pagosFiltrados.length === 0) {
      setToast({ tipo: "info", mensaje: "No hay datos para exportar" });
      return;
    }

    descargarCSV(
      "pagos_operativos_maz.csv",
      [
        { key: "origen", label: "Origen" },
        { key: "proveedor_personal", label: "Proveedor / Personal" },
        { key: "evento", label: "Evento" },
        { key: "informacion", label: "Información" },
        { key: "monto", label: "Monto" },
        { key: "fecha_programada", label: "Fecha programada" },
        { key: "fecha_real_pago", label: "Fecha real de pago" },
        { key: "estado", label: "Estado" },
        { key: "comprobante", label: "Comprobante" },
      ],
      pagosFiltrados.map((pago) => {
        const tieneComprobante =
          pago.comprobantes_pago && pago.comprobantes_pago.length > 0;

        const proveedorPersonal =
          pago.origen === "personal_eventual"
            ? pago.personal_eventual_grupos?.cargo_funcion || "Personal eventual"
            : pago.proveedores?.razon_social || "No registrado";

        const informacion =
          pago.origen === "personal_eventual"
            ? `${pago.personal_eventual_grupos?.cantidad_personas ?? 0} personas / ${pago.tipo_pago} / ${pago.metodo_pago}`
            : `${pago.evento_proveedores?.servicio || "No registrado"} / ${pago.tipo_pago} / ${pago.metodo_pago}`;

        return {
          origen: pago.origen,
          proveedor_personal: proveedorPersonal,
          evento: pago.eventos?.nombre || "No registrado",
          informacion,
          monto: pago.monto,
          fecha_programada: pago.fecha_programada,
          fecha_real_pago: pago.fecha_real_pago,
          estado: formatearEstado(pago.estado),
          comprobante: tieneComprobante ? "Sí" : "No",
        };
      })
    );
  }

  async function handleVerComprobante(pagoId: string) {
    const ventana = window.open("about:blank", "_blank");

    try {
      const data = (await apiFetch(
        `/pagos/${pagoId}/comprobante-url`
      )) as ComprobanteUrl;

      if (!data.signed_url) {
        ventana?.close();
        setToast({ tipo: "info", mensaje: "Este pago no tiene comprobante adjunto." });
        return;
      }

      if (ventana) {
        ventana.location.href = data.signed_url;
      } else {
        window.open(data.signed_url, "_blank");
      }
    } catch {
      ventana?.close();
      setToast({ tipo: "info", mensaje: "Este pago no tiene comprobante adjunto." });
    }
  }

  function renderAccionComprobante(pago: Pago) {
    const tieneComprobante =
      pago.comprobantes_pago && pago.comprobantes_pago.length > 0;

    if (tieneComprobante) {
      return (
        <button
          type="button"
          onClick={() => handleVerComprobante(pago.id)}
          className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-700 hover:bg-sky-100"
        >
          Ver comprobante
        </button>
      );
    }

    if (["pagado", "pagado_sin_comprobante"].includes(pago.estado)) {
      return (
        <button
          type="button"
          onClick={() => {
            // Abrirá el modal para subir comprobante
            setPagoSeleccionado(pago);
          }}
          className="inline-flex items-center whitespace-nowrap rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
        >
          Subir comprobante
        </button>
      );
    }

    if (pago.estado === "pendiente") {
      return (
        <a
          href={`/pagos/nuevo?evento_id=${pago.evento_id}&programacion_pago_id=${pago.programacion_pago_id || ""}`}
          className="inline-flex items-center whitespace-nowrap rounded-full bg-[#2F73D9] px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-[#245DB3]"
        >
          Registrar pago
        </a >
      );
    }

    if (pago.estado === "vencido") {
      return (
        <span className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
          Vencido
        </span>
      );
    }

    return (
      <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
        Revisar
      </span>
    );
  }
  async function subirComprobanteExistente() {
    if (!pagoSeleccionado || !archivoComprobante) return;

    const formData = new FormData();
    formData.append("archivo", archivoComprobante);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/pagos/${pagoSeleccionado.id}/comprobante`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(await response.text());
      }

      setToast({ tipo: "success", mensaje: "Comprobante subido correctamente." });
      setPagoSeleccionado(null);
      setArchivoComprobante(null);
      await cargarPagos();
    } catch (error) {
      console.error("Error subiendo comprobante:", error);
      setToast({ tipo: "error", mensaje: "No se pudo subir el comprobante." });
    }
  }
  return (
    <MainLayout>
      <main className="min-h-screen bg-[#F6F8FB] p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#102033]">Pagos</h1>
            <p className="mt-1 text-sm text-slate-500">
              Historial general de pagos del sistema, independiente del flujo de cada evento.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/pagos/historial"
              className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-[#102033] shadow-sm hover:bg-slate-50"
            >
              Historial
            </Link>

            <button
              onClick={handleDescargarCSV}
              className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-[#102033] shadow-sm hover:bg-slate-50"
            >
              Descargar Excel
            </button>

            <Link
              href="/pagos/nuevo"
              className="rounded-lg border border-[#2F73D9] bg-white px-5 py-2.5 text-sm font-semibold text-[#2F73D9] shadow-sm hover:bg-[#F6F8FB]"
            >
              Registrar pago
            </Link>
          </div>
        </div>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por evento, proveedor, tipo o metodo"
              className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm shadow-sm outline-none focus:border-[#2F73D9]"
            />

            <select
              value={origenFiltro}
              onChange={(e) => setOrigenFiltro(e.target.value)}
              className={selectClassName}
            >
              <option value="todos">Todos los origenes</option>
              <option value="proveedor">Proveedor</option>
              <option value="personal_eventual">Personal eventual</option>
            </select>

            <select
              value={estadoFiltro}
              onChange={(e) => setEstadoFiltro(e.target.value)}
              className={selectClassName}
            >
              <option value="todos">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="pagado">Pagado</option>
              <option value="pagado_sin_comprobante">Pagado sin comprobante</option>
              <option value="vencido">Vencido</option>
            </select>
          </div>
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {pagosFiltrados.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">
              No hay pagos registrados.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-6 py-3 text-left">Origen</th>
                    <th className="px-6 py-3 text-left">Proveedor / Personal</th>
                    <th className="px-6 py-3 text-left">Evento</th>
                    <th className="px-6 py-3 text-left">Informacion</th>
                    <th className="px-6 py-3 text-right">Monto</th>
                    <th className="px-6 py-3 text-left">Fecha programada</th>
                    <th className="px-6 py-3 text-left">Estado</th>
                    <th className="min-w-[140px] px-6 py-3 text-right">Acción</th>
                  </tr>
                </thead>

                <tbody>
                  {pagosFiltrados.map((pago) => (
                    <tr key={pago.id} className="border-t border-slate-100">
                      <td className="px-6 py-4">
                        <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
                          {pago.origen}
                        </span>
                      </td>

                      <td className="px-6 py-4 font-semibold text-[#102033]">
                        {pago.origen === "personal_eventual"
                          ? valor(pago.personal_eventual_grupos?.cargo_funcion)
                          : valor(pago.proveedores?.razon_social)}
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {valor(pago.eventos?.nombre)}
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {pago.origen === "personal_eventual"
                          ? `${pago.personal_eventual_grupos?.cantidad_personas ?? 0} personas / ${valor(pago.tipo_pago)} / ${valor(pago.metodo_pago)}`
                          : `${valor(pago.evento_proveedores?.servicio)} / ${valor(pago.tipo_pago)} / ${valor(pago.metodo_pago)}`}
                      </td>

                      <td className="px-6 py-4 text-right font-bold text-[#102033]">
                        {moneda(pago.monto)}
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {valor(pago.fecha_programada)}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${estadoBadgeClass(
                            pago.estado
                          )}`}
                        >
                          {formatearEstado(pago.estado)}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        {renderAccionComprobante(pago)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        {pagoSeleccionado && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
              <h2 className="text-xl font-bold text-[#102033]">
                Subir comprobante
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Adjunta el comprobante del pago ya registrado.
              </p>

              <div className="mt-6 space-y-4">

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Archivo
                  </label>

                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) =>
                      setArchivoComprobante(e.target.files?.[0] ?? null)
                    }
                    className="block w-full rounded-xl border border-slate-300 p-3 text-sm"
                  />
                </div>

              </div>

              <div className="mt-6 flex justify-end gap-3">

                <button
                  onClick={() => {
                    setPagoSeleccionado(null);
                    setArchivoComprobante(null);
                  }}
                  className="rounded-lg border border-slate-300 px-5 py-2"
                >
                  Cancelar
                </button>

                <button
                  onClick={subirComprobanteExistente}
                  className="rounded-lg bg-[#2F73D9] px-5 py-2 text-white"
                >
                  Subir comprobante
                </button>

              </div>
            </div>
          </div>
        )}
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