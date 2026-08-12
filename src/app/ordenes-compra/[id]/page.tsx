"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import EstadoOrdenBadge from "@/components/ordenes-compra/EstadoOrdenBadge";
import { apiFetch } from "@/lib/api";
import Link from "next/link";
import { pdf } from "@react-pdf/renderer";
import OrdenCompraPdf from "@/components/pdf/OrdenCompraPdf";
import Toast from "@/components/ui/Toast";
import type { ToastTipo } from "@/components/ui/Toast";
import ResumenFinancieroOcPdf from "@/components/pdf/ResumenFinancieroOcPdf";

const logoUrl =
  "https://yoqporwshbseefndrtuu.supabase.co/storage/v1/object/public/logo/Logo%20MAZ.jpeg";

type ItemOC = {
  id: string;
  descripcion: string;
  cantidad: number | string;
  precio_unitario: number | string;
  subtotal: number | string;
};

type OrdenCompra = {
  id: string;
  numero_oc: string;

  fecha_emision: string;
  fecha_requerida?: string | null;

  participacion_evento?: string | null;
  lugar_entrega?: string | null;

  moneda: string;
  condiciones_pago?: string | null;
  porcentaje_max_adelanto?: number | string | null;
  observaciones?: string | null;

  porcentaje_igv: number | string;
  subtotal: number | string;
  igv: number | string;
  total: number | string;

  requiere_factura: boolean;
  estado: string;
  estado_financiero?: string;

  archivo_cotizacion_url?: string | null;
  archivo_cotizacion_nombre?: string | null;

  eventos?: {
    nombre?: string | null;
    cliente?: string | null;
    fecha_inicio?: string | null;
    fecha_fin?: string | null;
    ubicacion?: string | null;
  } | null;

  proveedores?: {
    razon_social?: string | null;
    documento?: string | null;
    direccion?: string | null;
    representante_legal_nombre?: string | null;
    contacto_nombre?: string | null;
    contacto_cargo?: string | null;
    contacto_celular?: string | null;
    contacto_correo?: string | null;
  } | null;

  evento_proveedores?: {
    servicio?: string | null;
    monto_contratado?: number | string | null;
    estado?: string | null;
  } | null;

  orden_compra_items?: ItemOC[];

  resumen_pagos?: {
    total_oc: number;
    total_pagado: number;
    total_programado_pendiente: number;
    saldo_pendiente: number;
    saldo_sin_programar: number;
    proxima_fecha_pago: string | null;
    proximo_monto: number;
  };

  evento_id: string;

  historial_financiero?: {
    facturas: Array<{
      factura_id: string;
      factura: string;
      fecha_emision: string | null;
      total: number;
      moneda: string;
      estado_factura: string | null;
      estado_detraccion: string | null;
      monto_detraccion: number;

      conformidad?: {
        conformidad_id: string;
        estado: string | null;
        revisado_por: string | null;
        fecha_revision: string | null;
        observaciones: string | null;
      } | null;

      programaciones: Array<{
        programacion_id: string;
        tipo_destino: string | null;
        tipo_programacion: string | null;
        monto_programado: number;
        fecha_programada: string | null;
        estado_programacion: string | null;
        observaciones_programacion: string | null;

        pago?: {
          pago_id: string;
          monto_pagado: number;
          fecha_pago: string | null;
          metodo_pago: string | null;
          numero_operacion: string | null;
          estado_pago: string | null;
          observaciones_pago: string | null;
        } | null;
      }>;
    }>;
  };
};

function formatearFecha(fecha?: string | null) {
  if (!fecha) return "No registrada";

  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${fecha}T00:00:00`));
}

function formatearMoneda(
  valor: number | string | null | undefined,
  moneda = "PEN"
) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: moneda === "USD" ? "USD" : "PEN",
    minimumFractionDigits: 2,
  }).format(Number(valor || 0));
}

function textoMoneda(moneda: string) {
  return moneda === "USD" ? "DÓLARES" : "SOLES";
}

export default function DetalleOrdenCompraPage() {
  const params = useParams();
  const router = useRouter();

  const ordenId = params.id as string;

  const [orden, setOrden] = useState<OrdenCompra | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [abriendoCotizacion, setAbriendoCotizacion] = useState(false);
  const [generandoPdf, setGenerandoPdf] = useState(false);
  const [generandoResumen, setGenerandoResumen] = useState(false);
  const [mostrarModalEmitir, setMostrarModalEmitir] = useState(false);
  const [emitiendoOrden, setEmitiendoOrden] = useState(false);
  const [mostrarModalEliminar, setMostrarModalEliminar] = useState(false);
  const [eliminandoOrden, setEliminandoOrden] = useState(false);


  const [mostrarModalAlerta, setMostrarModalAlerta] = useState(false);
  const [fechaAlertaSaldo, setFechaAlertaSaldo] = useState("");
  const [creandoAlerta, setCreandoAlerta] = useState(false);
  const [toast, setToast] = useState<{
    tipo: ToastTipo;
    mensaje: string;
  } | null>(null);

  useEffect(() => {
    async function cargarOrden() {
      try {
        setCargando(true);
        setError("");

        const data = await apiFetch(
          `/ordenes-compra/${ordenId}`
        );

        setOrden(data);
      } catch (error) {
        console.error(
          "Error cargando la orden de compra:",
          error
        );

        setError(
          "No se pudo cargar la información de la orden de compra."
        );
      } finally {
        setCargando(false);
      }
    }

    if (ordenId) {
      cargarOrden();
    }
  }, [ordenId]);
  async function abrirCotizacion() {
    if (!orden) return;

    try {
      setAbriendoCotizacion(true);

      const data = await apiFetch(
        `/ordenes-compra/${orden.id}/cotizacion-url`
      );

      if (!data.signed_url) {
        throw new Error("No se recibió la URL de la cotización");
      }

      window.open(
        data.signed_url,
        "_blank",
        "noopener,noreferrer"
      );
    } catch (error) {
      console.error("Error abriendo la cotización:", error);
      alert("No se pudo abrir la cotización.");
    } finally {
      setAbriendoCotizacion(false);
    }
  }
  async function descargarPdf() {
    if (!orden) return;

    try {
      setGenerandoPdf(true);

      const documento = <OrdenCompraPdf orden={orden} />;
      const blob = await pdf(documento).toBlob();

      const url = URL.createObjectURL(blob);
      const enlace = document.createElement("a");

      enlace.href = url;
      enlace.download = `${orden.numero_oc}.pdf`;

      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generando el PDF:", error);
      setToast({
        tipo: "error",
        mensaje: "No se pudo generar el PDF.",
      });
    } finally {
      setGenerandoPdf(false);
    }
  }

  async function descargarResumenFinanciero() {
    if (!orden) return;

    try {
      setGenerandoResumen(true);

      const documento = (
        <ResumenFinancieroOcPdf orden={orden} />
      );

      const blob = await pdf(documento).toBlob();

      const url = URL.createObjectURL(blob);
      const enlace = document.createElement("a");

      enlace.href = url;
      enlace.download = `Resumen-${orden.numero_oc}.pdf`;

      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(
        "Error generando resumen financiero:",
        error
      );

      setToast({
        tipo: "error",
        mensaje:
          "No se pudo generar el resumen financiero.",
      });
    } finally {
      setGenerandoResumen(false);
    }
  }
  async function emitirOrden() {
    if (!orden) return;

    try {
      setEmitiendoOrden(true);

      const estadoDestino = orden.requiere_factura
        ? "pendiente_factura"
        : "en_conformidad";

      await apiFetch(
        `/ordenes-compra/${orden.id}/estado`,
        {
          method: "PUT",
          body: JSON.stringify({
            estado: estadoDestino,
          }),
        }
      );

      setOrden((actual) =>
        actual
          ? {
            ...actual,
            estado: estadoDestino,
          }
          : actual
      );

      setMostrarModalEmitir(false);
    } catch (error) {
      console.error("Error emitiendo la orden:", error);
      alert("No se pudo emitir la orden de compra.");
    } finally {
      setEmitiendoOrden(false);
    }
  }
  async function eliminarOrden() {
    if (!orden) return;

    try {
      setEliminandoOrden(true);

      await apiFetch(`/ordenes-compra/${orden.id}`, {
        method: "DELETE",
      });

      router.push("/ordenes-compra");
    } catch (error) {
      console.error("Error eliminando la orden:", error);
      alert("No se pudo eliminar la orden de compra.");
    } finally {
      setEliminandoOrden(false);
    }
  }

  async function crearAlertaSaldo() {
    if (!orden || !fechaAlertaSaldo) {
      setToast({
        tipo: "info",
        mensaje: "Selecciona una fecha para la alerta.",
      });
      return;
    }

    try {
      setCreandoAlerta(true);

      await apiFetch("/alertas/", {
        method: "POST",
        body: JSON.stringify({
          evento_id: orden.evento_id,
          tipo_alerta: "pago_pendiente",
          origen: "orden_compra",
          titulo: `Saldo pendiente ${orden.numero_oc}`,
          descripcion: `La orden ${orden.numero_oc} tiene un saldo pendiente de ${formatearMoneda(
            orden.resumen_pagos?.saldo_pendiente ?? 0,
            orden.moneda
          )}.`,
          fecha_alerta: fechaAlertaSaldo,
        }),
      });

      setMostrarModalAlerta(false);
      setFechaAlertaSaldo("");

      setToast({
        tipo: "success",
        mensaje: "Alerta creada correctamente.",
      });
    } catch (error) {
      console.error("Error creando alerta:", error);
      setToast({
        tipo: "error",
        mensaje: "No se pudo crear la alerta.",
      });
    } finally {
      setCreandoAlerta(false);
    }
  }

  return (
    <MainLayout>
      <main className="min-h-screen bg-[#F6F8FB] p-6 lg:p-8">
        <div className="mx-auto max-w-[1200px]">
          <button
            type="button"
            onClick={() => router.push("/ordenes-compra")}
            className="no-print mb-5 text-sm font-semibold text-slate-500 transition hover:text-[#2F73D9]"
          >
            ← Volver a órdenes de compra
          </button>

          {cargando ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
              Cargando orden de compra...
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm font-medium text-red-700">
              {error}
            </div>
          ) : !orden ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
              Orden de compra no encontrada.
            </div>
          ) : (
            <>
              {/* Acciones superiores */}
              <div className="no-print mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2F73D9]">
                    Documento comercial
                  </p>

                  <h1 className="mt-1 text-2xl font-bold text-[#102033]">
                    Detalle de Orden de Compra
                  </h1>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <EstadoOrdenBadge
                    estado={orden.estado_financiero || orden.estado}
                  />

                  {orden.estado === "borrador" && (
                    <Link
                      href={`/ordenes-compra/${orden.id}/editar`}
                      className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-[#102033] transition hover:bg-slate-50"
                    >
                      Editar
                    </Link>
                  )}
                  {orden.estado === "borrador" && (
                    <button
                      type="button"
                      onClick={() => setMostrarModalEmitir(true)}
                      className="rounded-xl bg-[#78B94A] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#659F3E]"
                    >
                      Emitir orden
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setMostrarModalEliminar(true)}
                    className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                  >
                    Eliminar
                  </button>
                  {orden.estado !== "borrador" && (
                    <button
                      type="button"
                      onClick={descargarPdf}
                      disabled={generandoPdf}
                      className="rounded-xl bg-[#2F73D9] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#245DB3] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {generandoPdf ? "Generando PDF..." : "Descargar PDF"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={descargarResumenFinanciero}
                    disabled={generandoResumen}
                    className="rounded-xl border border-[#2F73D9] bg-white px-4 py-2.5 text-sm font-semibold text-[#2F73D9] transition hover:bg-blue-50 disabled:opacity-60"
                  >
                    {generandoResumen
                      ? "Generando resumen..."
                      : "Descargar resumen"}
                  </button>
                </div>
              </div>

              {/* Documento principal */}
              <article
                id="orden-compra-documento"
                className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
              >
                {/* Cabecera formal */}
                <header className="border-b border-slate-200 bg-gradient-to-r from-[#F3FAEF] via-white to-[#EEF5FF] px-6 py-6 lg:px-9">
                  <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-5">
                      <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border border-[#CDE9BC] bg-white p-2 shadow-sm">
                        <img
                          src={logoUrl}
                          alt="Logo MAZ"
                          className="h-full w-full object-contain"
                        />
                      </div>

                      <div className="pt-1">
                        <h2 className="text-xl font-extrabold uppercase tracking-wide text-[#102033]">
                          MAZ S.A.C.
                        </h2>

                        <div className="mt-3 space-y-1 text-sm leading-6 text-slate-600">

                          <p>
                            <span className="font-semibold text-[#102033]">
                              R.U.C.:
                            </span>{" "}
                            20601664934
                          </p>

                          <p>
                            <span className="font-semibold text-[#102033]">
                              Dirección:
                            </span>{" "}
                            Calle Madrid 436, Interior B
                          </p>

                          <p>
                            Miraflores - Lima
                          </p>

                          <p>
                            <span className="font-semibold text-[#102033]">
                              E-mail:
                            </span>{" "}
                            contabilidad@mazproducciones.com
                          </p>

                        </div>
                      </div>
                    </div>

                    <div className="text-left md:text-right">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2F73D9]">
                        Orden de compra
                      </p>

                      <p className="mt-2 text-3xl font-extrabold text-[#102033]">
                        {orden.numero_oc}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        Fecha de emisión:{" "}
                        <span className="font-semibold text-[#102033]">
                          {formatearFecha(orden.fecha_emision)}
                        </span>
                      </p>
                    </div>
                  </div>
                </header>
                {/* Estado de pagos */}
                {orden.resumen_pagos && (
                  <div className="no-print border-b border-slate-200 bg-white px-6 py-5 lg:px-9">
                    <SeccionDocumento titulo="Estado de pagos de la OC">
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

                        {/* Total OC */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Total OC
                          </p>

                          <p className="mt-2 text-xl font-bold text-[#102033]">
                            {formatearMoneda(
                              orden.resumen_pagos.total_oc,
                              orden.moneda
                            )}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            Importe total de la orden
                          </p>
                        </div>

                        {/* Total pagado */}
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                            Total pagado
                          </p>

                          <p className="mt-2 text-xl font-bold text-emerald-700">
                            {formatearMoneda(
                              orden.resumen_pagos.total_pagado,
                              orden.moneda
                            )}
                          </p>

                          <p className="mt-1 text-xs text-emerald-700/70">
                            Pagos ejecutados
                          </p>
                        </div>

                        {/* Programado pendiente */}
                        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                            Programado pendiente
                          </p>

                          <p className="mt-2 text-xl font-bold text-blue-700">
                            {formatearMoneda(
                              orden.resumen_pagos.total_programado_pendiente,
                              orden.moneda
                            )}
                          </p>

                          <p className="mt-1 text-xs text-blue-700/70">
                            Pagos programados aún no ejecutados
                          </p>
                        </div>

                        {/* Saldo sin programar */}
                        <div
                          className={`rounded-2xl border p-4 ${orden.resumen_pagos.saldo_sin_programar > 0
                            ? "border-amber-200 bg-amber-50"
                            : "border-emerald-200 bg-emerald-50"
                            }`}
                        >
                          <p
                            className={`text-xs font-semibold uppercase tracking-wide ${orden.resumen_pagos.saldo_sin_programar > 0
                              ? "text-amber-700"
                              : "text-emerald-700"
                              }`}
                          >
                            Saldo sin programar
                          </p>

                          <p
                            className={`mt-2 text-xl font-bold ${orden.resumen_pagos.saldo_sin_programar > 0
                              ? "text-amber-700"
                              : "text-emerald-700"
                              }`}
                          >
                            {formatearMoneda(
                              orden.resumen_pagos.saldo_sin_programar,
                              orden.moneda
                            )}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {orden.resumen_pagos.saldo_sin_programar > 0
                              ? "Importe que falta programar"
                              : "Todo el saldo está cubierto"}
                          </p>
                        </div>
                      </div>

                      {/* Aviso de saldo sin programar */}
                      {orden.resumen_pagos.saldo_sin_programar > 0 && (
                        <div className="mt-3 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-start gap-3">
                            <span className="mt-0.5 text-amber-600">
                              ⚠
                            </span>

                            <p className="text-sm text-amber-800">
                              Hay{" "}
                              <strong>
                                {formatearMoneda(
                                  orden.resumen_pagos.saldo_sin_programar,
                                  orden.moneda
                                )}
                              </strong>{" "}
                              de esta OC que todavía no tienen programación de pago.
                            </p>
                          </div>

                          <Link
                            href="/programaciones-pago/nuevo"
                            className="shrink-0 rounded-lg bg-[#2F73D9] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#245DB3]"
                          >
                            Programar saldo
                          </Link>
                        </div>
                      )}
                    </SeccionDocumento>
                  </div>
                )}
                <div className="space-y-7 p-6 lg:p-9">
                  {/* Datos del proveedor */}
                  <SeccionDocumento titulo="Datos del proveedor">
                    <TablaDatos
                      filas={[
                        {
                          etiqueta: "Razón social",
                          valor:
                            orden.proveedores?.razon_social ||
                            "No registrado",
                        },
                        {
                          etiqueta: "RUC / Documento",
                          valor:
                            orden.proveedores?.documento ||
                            "No registrado",
                        },
                        {
                          etiqueta: "Dirección",
                          valor:
                            orden.proveedores?.direccion ||
                            "No registrada",
                        },
                        {
                          etiqueta: "Contacto",
                          valor:
                            orden.proveedores?.contacto_nombre ||
                            "No registrado",
                        },
                        {
                          etiqueta: "Correo",
                          valor:
                            orden.proveedores?.contacto_correo ||
                            "No registrado",
                        },
                        {
                          etiqueta: "Teléfono",
                          valor:
                            orden.proveedores?.contacto_celular ||
                            "No registrado",
                        },
                      ]}
                    />
                  </SeccionDocumento>

                  {/* Datos del evento */}
                  <SeccionDocumento titulo="Datos del evento">
                    <TablaDatos
                      filas={[
                        {
                          etiqueta: "Nombre del evento",
                          valor:
                            orden.eventos?.nombre ||
                            "No registrado",
                        },
                        {
                          etiqueta: "Participación del evento",
                          valor:
                            orden.participacion_evento ||
                            orden.evento_proveedores?.servicio ||
                            "No registrada",
                        },
                        {
                          etiqueta: "Fecha del evento",
                          valor: formatearFecha(
                            orden.eventos?.fecha_inicio
                          ),
                        },
                        {
                          etiqueta: "Bien / Servicio",
                          valor: "SERVICIO",
                        },
                      ]}
                    />
                  </SeccionDocumento>

                  {/* Condiciones */}
                  <section className="overflow-hidden rounded-2xl border border-slate-200">
                    <div className="grid md:grid-cols-5">
                      <DatoCondicion
                        etiqueta="Lugar de entrega"
                        valor={
                          orden.lugar_entrega ||
                          orden.eventos?.ubicacion ||
                          "No registrado"
                        }
                      />

                      <DatoCondicion
                        etiqueta="Condición de pago"
                        valor={
                          orden.condiciones_pago ||
                          "No registrada"
                        }
                      />

                      <DatoCondicion
                        etiqueta="Moneda"
                        valor={textoMoneda(orden.moneda)}
                      />
                      <DatoCondicion
                        etiqueta="Adelanto máximo"
                        valor={`${Number(
                          orden.porcentaje_max_adelanto ?? 60
                        ).toFixed(0)}%`}
                      />
                      <DatoCondicion
                        etiqueta="Fecha requerida"
                        valor={formatearFecha(
                          orden.fecha_requerida
                        )}
                        ultimo
                      />
                    </div>
                  </section>

                  {/* Facturación */}
                  <section className="no-print rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                          Flujo de facturación
                        </p>

                        <p className="mt-1 text-sm font-semibold text-[#102033]">
                          {orden.requiere_factura
                            ? "Esta orden requiere factura del proveedor."
                            : "Esta orden no requiere factura."}
                        </p>
                      </div>

                      <span
                        className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold ${orden.requiere_factura
                          ? "border-blue-200 bg-blue-50 text-blue-700"
                          : "border-green-200 bg-green-50 text-green-700"
                          }`}
                      >
                        {orden.requiere_factura
                          ? "Continúa a Facturas"
                          : "Continúa a Conformidad"}
                      </span>
                    </div>
                  </section>

                  {/* Tabla de ítems */}
                  <SeccionDocumento titulo="Descripción del bien / servicio">
                    <div className="overflow-hidden rounded-2xl border border-slate-200">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px] text-left text-sm">
                          <thead className="bg-[#EFF8EB] text-xs font-bold uppercase tracking-wide text-[#315B25]">
                            <tr>
                              <th className="px-5 py-3.5">
                                Descripción del bien / servicio
                              </th>
                              <th className="px-5 py-3.5 text-center">
                                Cantidad
                              </th>
                              <th className="px-5 py-3.5 text-right">
                                Precio unitario
                              </th>
                              <th className="px-5 py-3.5 text-right">
                                Precio total
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            {(orden.orden_compra_items || [])
                              .length === 0 ? (
                              <tr>
                                <td
                                  colSpan={4}
                                  className="px-5 py-8 text-center text-slate-500"
                                >
                                  No hay ítems registrados.
                                </td>
                              </tr>
                            ) : (
                              orden.orden_compra_items?.map(
                                (item) => (
                                  <tr
                                    key={item.id}
                                    className="border-t border-slate-200"
                                  >
                                    <td className="px-5 py-3.5 font-medium text-[#102033]">
                                      {item.descripcion}
                                    </td>

                                    <td className="px-5 py-3.5 text-center text-slate-700">
                                      {Number(item.cantidad)}
                                    </td>

                                    <td className="px-5 py-3.5 text-right text-slate-700">
                                      {formatearMoneda(
                                        item.precio_unitario,
                                        orden.moneda
                                      )}
                                    </td>

                                    <td className="px-5 py-3.5 text-right font-semibold text-[#102033]">
                                      {formatearMoneda(
                                        item.subtotal,
                                        orden.moneda
                                      )}
                                    </td>
                                  </tr>
                                )
                              )
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </SeccionDocumento>

                  {/* Totales */}
                  <div className="flex justify-end">
                    <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200">
                      <FilaTotal
                        etiqueta="Valor de compra (sin IGV)"
                        valor={formatearMoneda(
                          orden.subtotal,
                          orden.moneda
                        )}
                      />

                      <FilaTotal
                        etiqueta={`IGV (${Number(
                          orden.porcentaje_igv || 0
                        ).toFixed(2)}%)`}
                        valor={formatearMoneda(
                          orden.igv,
                          orden.moneda
                        )}
                      />

                      <div className="flex items-center justify-between border-t border-[#CDE9BC] bg-[#EFF8EB] px-5 py-4">
                        <span className="text-sm font-extrabold uppercase text-[#24491C]">
                          Precio de compra
                        </span>

                        <span className="text-xl font-extrabold text-[#1E6B2D]">
                          {formatearMoneda(
                            orden.total,
                            orden.moneda
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Cotización */}
                  <div className="no-print">
                    <SeccionDocumento titulo="Cotización del proveedor">
                      {orden.archivo_cotizacion_url ? (
                        <div className="flex flex-col gap-4 rounded-2xl border border-[#CDE9BC] bg-[#F5FBF1] p-5 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
                              📄
                            </div>

                            <div>
                              <p className="font-semibold text-[#102033]">
                                {orden.archivo_cotizacion_nombre ||
                                  "Cotización adjunta"}
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                Documento de respaldo del proveedor.
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={abrirCotizacion}
                            disabled={abriendoCotizacion}
                            className="inline-flex justify-center rounded-xl border border-[#78B94A] bg-white px-4 py-2.5 text-sm font-semibold text-[#347326] transition hover:bg-[#EFF8EB] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {abriendoCotizacion ? "Abriendo..." : "Ver documento"}
                          </button>
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                          <p className="text-sm font-medium text-slate-600">
                            No se adjuntó una cotización para esta orden.
                          </p>
                        </div>
                      )}
                    </SeccionDocumento>
                  </div>

                  {/* Observaciones */}
                  <SeccionDocumento titulo="Observaciones">
                    <div className="min-h-24 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-700">
                      {orden.observaciones ||
                        "No se registraron observaciones."}
                    </div>
                  </SeccionDocumento>
                  <SeccionDocumento titulo="Requisitos para el trámite de la factura">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-700">
                      <ol className="list-decimal space-y-3 pl-5">
                        <li>
                          El proveedor deberá emitir su Factura o Recibo por Honorarios
                          Electrónico (RHE) dentro de los tres (3) días calendario
                          siguientes a la recepción de la presente Orden de Compra.
                        </li>

                        <li>
                          Los ítems e importes de la Factura deben ser los mismos que la
                          Orden de Compra o Servicio.
                        </li>

                        <li>
                          Enviar al correo <strong>contabilidad@mazproducciones.com</strong>{" "}
                          la Orden de Compra y la Factura/RHE en un solo archivo PDF.
                          Asimismo, si la factura está sujeta al Sistema de Pago de
                          Obligaciones Tributarias (SPOT), deberá incluir el número de
                          cuenta del Banco de la Nación, el código de detracción del bien o
                          servicio y el porcentaje correspondiente. La factura que no
                          presente esta información no será recibida.
                        </li>

                        <li>
                          Si el importe de la Factura corresponde a un adelanto, este no
                          deberá exceder el{" "}
                          <strong>
                            {Number(
                              orden.porcentaje_max_adelanto ?? 60
                            ).toFixed(0)}
                            %
                          </strong>{" "}
                          del monto total presupuestado.
                        </li>

                        <li>
                          Los plazos de pago se darán según lo estipulado en las
                          condiciones de pago que figuran en el cuadro superior de la
                          presente Orden de Compra o Servicio.
                        </li>
                      </ol>
                    </div>
                  </SeccionDocumento>
                </div>
              </article>
            </>
          )}
        </div>
        {toast && (
          <Toast
            tipo={toast.tipo}
            mensaje={toast.mensaje}
            onClose={() => setToast(null)}
          />
        )}
      </main>
      {mostrarModalEmitir && orden && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#2F73D9]">
                  Confirmación
                </p>

                <h2 className="mt-2 text-xl font-bold text-[#102033]">
                  Emitir Orden de Compra
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setMostrarModalEmitir(false)}
                disabled={emitiendoOrden}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-600">
              Estás por emitir la orden{" "}
              <span className="font-semibold text-[#102033]">
                {orden.numero_oc}
              </span>
              .
            </p>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-[#102033]">
                Al emitir esta orden:
              </p>

              <div className="mt-3 space-y-2 text-sm text-slate-600">
                <p>✓ Ya no podrá editarse.</p>

                <p>
                  ✓ Pasará a{" "}
                  <span className="font-semibold text-[#102033]">
                    {orden.requiere_factura
                      ? "Pendiente de factura"
                      : "Conformidad"}
                  </span>
                  .
                </p>

                <p>✓ Continuará al siguiente módulo del flujo.</p>
              </div>
            </div>

            <p className="mt-4 text-sm font-medium text-slate-700">
              ¿Deseas continuar?
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setMostrarModalEmitir(false)}
                disabled={emitiendoOrden}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={emitirOrden}
                disabled={emitiendoOrden}
                className="rounded-xl bg-[#78B94A] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#659F3E] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {emitiendoOrden
                  ? "Emitiendo..."
                  : "Sí, emitir OC"}
              </button>
            </div>
          </div>
        </div>
      )}
      {mostrarModalEliminar && orden && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-500">
              Acción irreversible
            </p>

            <h2 className="mt-2 text-xl font-bold text-[#102033]">
              Eliminar Orden de Compra
            </h2>

            <p className="mt-4 text-sm leading-6 text-slate-600">
              Se eliminará definitivamente la orden{" "}
              <span className="font-semibold text-[#102033]">
                {orden.numero_oc}
              </span>
              {" "}junto con sus facturas, conformidades,
              programaciones, pagos y registros asociados.
            </p>

            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-semibold text-red-700">
                Esta acción no podrá deshacerse.
              </p>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setMostrarModalEliminar(false)}
                disabled={eliminandoOrden}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={eliminarOrden}
                disabled={eliminandoOrden}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {eliminandoOrden ? "Eliminando..." : "Sí, eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
      {mostrarModalAlerta && orden && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-600">
              Recordatorio de pago
            </p>

            <h2 className="mt-2 text-xl font-bold text-[#102033]">
              Crear alerta de saldo
            </h2>

            <p className="mt-3 text-sm text-slate-600">
              Saldo pendiente de{" "}
              <strong>
                {formatearMoneda(
                  orden.resumen_pagos?.saldo_pendiente ?? 0,
                  orden.moneda
                )}
              </strong>
              {" "}para {orden.numero_oc}.
            </p>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Fecha de alerta *
              </label>

              <input
                type="date"
                value={fechaAlertaSaldo}
                onChange={(event) =>
                  setFechaAlertaSaldo(event.target.value)
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#2F73D9]"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setMostrarModalAlerta(false)}
                disabled={creandoAlerta}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={crearAlertaSaldo}
                disabled={creandoAlerta || !fechaAlertaSaldo}
                className="rounded-xl bg-[#2F73D9] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#245DB3] disabled:opacity-60"
              >
                {creandoAlerta
                  ? "Creando..."
                  : "Crear alerta"}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}

function SeccionDocumento({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-3">
        <span className="h-6 w-1 rounded-full bg-[#78B94A]" />

        <h3 className="text-sm font-extrabold uppercase tracking-wide text-[#102033]">
          {titulo}
        </h3>
      </div>

      {children}
    </section>
  );
}

function TablaDatos({
  filas,
}: {
  filas: Array<{
    etiqueta: string;
    valor: string | number;
  }>;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200">
      {filas.map((fila, index) => (
        <div
          key={`${fila.etiqueta}-${index}`}
          className={`grid md:grid-cols-[230px_1fr] ${index > 0 ? "border-t border-slate-200" : ""
            }`}
        >
          <div className="bg-[#F5FAF2] px-5 py-3 text-xs font-bold uppercase tracking-wide text-[#3F6632]">
            {fila.etiqueta}
          </div>

          <div className="px-5 py-3 text-sm font-medium text-[#102033]">
            {fila.valor}
          </div>
        </div>
      ))}
    </div>
  );
}

function DatoCondicion({
  etiqueta,
  valor,
  ultimo = false,
}: {
  etiqueta: string;
  valor: string;
  ultimo?: boolean;
}) {
  return (
    <div
      className={`min-h-24 px-5 py-4 ${ultimo
        ? ""
        : "border-b border-slate-200 md:border-b-0 md:border-r"
        }`}
    >
      <p className="text-xs font-bold uppercase tracking-wide text-[#3F6632]">
        {etiqueta}
      </p>

      <p className="mt-2 text-sm font-semibold leading-5 text-[#102033]">
        {valor}
      </p>
    </div>
  );
}

function FilaTotal({
  etiqueta,
  valor,
}: {
  etiqueta: string;
  valor: string;
}) {
  return (
    <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3 first:border-t-0">
      <span className="text-sm font-semibold text-slate-600">
        {etiqueta}
      </span>

      <span className="font-bold text-[#102033]">
        {valor}
      </span>
    </div>
  );
}