"use client";

import Link from "next/link";
import {
  useEffect,
  Suspense,
  useRef,
  useState,
} from "react";

import { useSearchParams } from "next/navigation";

import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  FileText,
  Landmark,
  ReceiptText,
  Smartphone,
  Upload,
  WalletCards,
  X,
} from "lucide-react";

import MainLayout from "@/components/layout/MainLayout";
import Toast from "@/components/ui/Toast";
import type { ToastTipo } from "@/components/ui/Toast";
import { apiFetch } from "@/lib/api";

type MetodoPago =
  | "transferencia"
  | "yape"
  | "plin"
  | "efectivo";

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
  contacto_nombre?: string | null;
  contacto_celular?: string | null;
};

type OrdenCompra = {
  id: string;
  numero_oc: string;
  evento_id?: string | null;
  proveedor_id?: string | null;

  eventos?: Evento | null;
  proveedores?: Proveedor | null;
};

type Factura = {
  id: string;
  orden_compra_id: string;

  serie: string;
  numero: string;

  total: number | string;
  moneda: string;

  cuenta_detraccion_detectada?: string | null;
  codigo_detraccion?: string | null;
  porcentaje_detraccion?: number | string | null;
  monto_detraccion?: number | string | null;

  ordenes_compra?: OrdenCompra | null;
};

type EventoProveedor = {
  id?: string;
  servicio?: string | null;

  proveedores?: Proveedor | null;
};

type ProgramacionPago = {
  id: string;

  evento_id: string;
  factura_id?: string | null;
  orden_compra_id?: string | null;
  evento_proveedor_id?: string | null;
  cuenta_bancaria_id?: string | null;
  personal_grupo_id?: string | null;

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

type PagoCreado = {
  id: string;
};

type FormPago = {
  metodo_pago: MetodoPago;
  fecha_real_pago: string;

  numero_yape_plin: string;
  titular_yape_plin: string;

  observaciones: string;
};

const inputClassName =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2F73D9] focus:ring-2 focus:ring-[#2F73D9]/15";

const selectClassName =
  "w-full cursor-pointer rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2F73D9] focus:ring-2 focus:ring-[#2F73D9]/15";

const comprobanteMaxBytes =
  10 * 1024 * 1024;

const comprobanteTiposPermitidos = [
  "application/pdf",
  "image/jpeg",
  "image/png",
];

const formInicial: FormPago = {
  metodo_pago: "transferencia",
  fecha_real_pago: "",
  numero_yape_plin: "",
  titular_yape_plin: "",
  observaciones: "",
};

function RegistrarPagoContent() {
  const searchParams =
    useSearchParams();

  const programacionId =
    searchParams.get(
      "programacion_pago_id"
    );

  const inputComprobanteRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const [
    programacion,
    setProgramacion,
  ] = useState<ProgramacionPago | null>(
    null
  );

  const [form, setForm] =
    useState<FormPago>(
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
    comprobante,
    setComprobante,
  ] = useState<File | null>(
    null
  );

  const [
    previewComprobante,
    setPreviewComprobante,
  ] = useState<string | null>(
    null
  );

  const [
    errores,
    setErrores,
  ] = useState<
    Record<string, string>
  >({});

  const [toast, setToast] =
    useState<{
      tipo: ToastTipo;
      mensaje: string;
    } | null>(null);

  const factura =
    programacion?.facturas ??
    null;

  const orden =
    factura?.ordenes_compra ??
    null;

  const proveedor =
    orden?.proveedores ??
    programacion
      ?.evento_proveedores
      ?.proveedores ??
    null;

  const evento =
    orden?.eventos ??
    programacion?.eventos ??
    null;

  const cuentaBancaria =
    programacion
      ?.proveedores_cuentas_bancarias ??
    null;

  const tipoDestino =
    programacion?.tipo_destino ??
    "proveedor";

  const esProveedor =
    tipoDestino ===
    "proveedor";

  const esDetraccion =
    tipoDestino ===
    "detraccion";

  const esPersonalEventual =
    tipoDestino ===
    "personal_eventual";

  const esTransferencia =
    form.metodo_pago ===
    "transferencia";

  const esYapePlin =
    form.metodo_pago === "yape" ||
    form.metodo_pago === "plin";

  const comprobanteEsImagen =
    comprobante?.type.startsWith(
      "image/"
    ) ?? false;

  const moneda =
    factura?.moneda ??
    cuentaBancaria?.moneda ??
    "PEN";

  const montoProgramado =
    Number(
      programacion?.monto ??
      0
    );

  function formatearMoneda(
    valor?:
      | number
      | string
      | null,
    monedaValor = "PEN"
  ) {
    return new Intl.NumberFormat(
      "es-PE",
      {
        style: "currency",
        currency:
          monedaValor ||
          "PEN",
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

  function textoDestino(
    destino?: string | null
  ) {
    if (
      destino === "proveedor"
    ) {
      return "Proveedor";
    }

    if (
      destino === "detraccion"
    ) {
      return "Detracción";
    }

    if (
      destino ===
      "personal_eventual"
    ) {
      return "Personal eventual";
    }

    return "No registrado";
  }

  function textoTipoProgramacion(
    tipo?: string | null
  ) {
    if (
      tipo === "pago_unico"
    ) {
      return "Pago único";
    }

    if (
      tipo === "adelanto"
    ) {
      return "Adelanto";
    }

    if (
      tipo === "segundo_pago"
    ) {
      return "Segundo pago";
    }

    if (
      tipo === "tercer_pago"
    ) {
      return "Tercer pago";
    }

    if (
      tipo === "cuarto_pago"
    ) {
      return "Cuarto pago";
    }

    if (
      tipo === "saldo_final"
    ) {
      return "Saldo final";
    }

    return tipo ?? "Otro";
  }

  async function cargarProgramacion() {
    if (!programacionId) {
      setToast({
        tipo: "error",
        mensaje:
          "No se recibió la programación que se desea pagar.",
      });

      setCargando(false);
      return;
    }

    try {
      setCargando(true);

      const data =
        await apiFetch(
          `/programaciones-pago/${programacionId}`
        );

      setProgramacion(
        data as ProgramacionPago
      );
    } catch (error) {
      console.error(
        "Error cargando programación:",
        error
      );

      setProgramacion(null);

      setToast({
        tipo: "error",
        mensaje:
          "No se pudo cargar la programación.",
      });
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarProgramacion();
  }, [programacionId]);

  useEffect(() => {
    if (!programacion) {
      return;
    }

    setForm((actual) => ({
      ...actual,

      metodo_pago:
        esDetraccion
          ? "transferencia"
          : "transferencia",

      fecha_real_pago:
        new Date()
          .toISOString()
          .slice(0, 10),

      titular_yape_plin:
        proveedor
          ?.contacto_nombre ??
        "",
    }));
  }, [
    programacion,
    esDetraccion,
    proveedor,
  ]);
  function limpiarError(
    campo: string
  ) {
    setErrores((actuales) => {
      const nuevos = {
        ...actuales,
      };

      delete nuevos[campo];

      return nuevos;
    });
  }

  function actualizarCampo<
    K extends keyof FormPago
  >(
    campo: K,
    valor: FormPago[K]
  ) {
    setForm((actual) => ({
      ...actual,
      [campo]: valor,
    }));

    limpiarError(campo);
  }

  function cambiarMetodoPago(
    metodo: MetodoPago
  ) {
    setForm((actual) => ({
      ...actual,
      metodo_pago: metodo,

      numero_yape_plin:
        metodo === "yape" ||
          metodo === "plin"
          ? actual
            .numero_yape_plin
          : "",

      titular_yape_plin:
        metodo === "yape" ||
          metodo === "plin"
          ? actual
            .titular_yape_plin
          : "",
    }));

    limpiarError(
      "metodo_pago"
    );

    limpiarError(
      "numero_yape_plin"
    );

    limpiarError(
      "titular_yape_plin"
    );
  }

  function validarComprobante(
    archivo: File
  ) {
    if (
      !comprobanteTiposPermitidos.includes(
        archivo.type
      )
    ) {
      setToast({
        tipo: "error",
        mensaje:
          "El comprobante debe ser PDF, JPG o PNG.",
      });

      return false;
    }

    if (
      archivo.size >
      comprobanteMaxBytes
    ) {
      setToast({
        tipo: "error",
        mensaje:
          "El comprobante no debe superar los 10 MB.",
      });

      return false;
    }

    return true;
  }

  function seleccionarComprobante(
    archivo?: File
  ) {
    if (
      !archivo ||
      !validarComprobante(
        archivo
      )
    ) {
      return;
    }

    if (
      previewComprobante
    ) {
      URL.revokeObjectURL(
        previewComprobante
      );
    }

    setComprobante(
      archivo
    );

    setPreviewComprobante(
      archivo.type.startsWith(
        "image/"
      )
        ? URL.createObjectURL(
          archivo
        )
        : null
    );
  }

  function limpiarComprobante() {
    if (
      previewComprobante
    ) {
      URL.revokeObjectURL(
        previewComprobante
      );
    }

    setComprobante(null);

    setPreviewComprobante(
      null
    );

    if (
      inputComprobanteRef.current
    ) {
      inputComprobanteRef.current.value =
        "";
    }
  }

  function handleComprobanteChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    seleccionarComprobante(
      event.target.files?.[0]
    );
  }

  function handleComprobanteDrop(
    event: React.DragEvent<HTMLLabelElement>
  ) {
    event.preventDefault();

    seleccionarComprobante(
      event.dataTransfer
        .files?.[0]
    );
  }

  useEffect(() => {
    return () => {
      if (
        previewComprobante
      ) {
        URL.revokeObjectURL(
          previewComprobante
        );
      }
    };
  }, [previewComprobante]);

  function validarFormulario() {
    const nuevosErrores:
      Record<string, string> = {};

    if (!programacion) {
      nuevosErrores.programacion =
        "No se encontró la programación.";
    }

    if (
      !form.metodo_pago
    ) {
      nuevosErrores.metodo_pago =
        "Selecciona el método de pago.";
    }

    if (
      !form.fecha_real_pago
    ) {
      nuevosErrores.fecha_real_pago =
        "Ingresa la fecha real del pago.";
    }

    if (
      esProveedor &&
      esTransferencia &&
      !cuentaBancaria
    ) {
      nuevosErrores.cuenta_bancaria =
        "La programación no tiene una cuenta bancaria vinculada.";
    }

    if (
      esDetraccion &&
      !factura
        ?.cuenta_detraccion_detectada
    ) {
      nuevosErrores.cuenta_detraccion =
        "La factura no tiene una cuenta BN detectada.";
    }

    if (
      esYapePlin &&
      !form.numero_yape_plin.trim()
    ) {
      nuevosErrores.numero_yape_plin =
        "Ingresa el número asociado a Yape o Plin.";
    }

    if (
      esYapePlin &&
      !form.titular_yape_plin.trim()
    ) {
      nuevosErrores.titular_yape_plin =
        "Ingresa el nombre del titular.";
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

  async function subirComprobantePago(
    pagoId: string
  ) {
    if (!comprobante) {
      return;
    }

    const apiUrl =
      process.env
        .NEXT_PUBLIC_API_URL;

    if (!apiUrl) {
      throw new Error(
        "NEXT_PUBLIC_API_URL no está configurada."
      );
    }

    const formData =
      new FormData();

    formData.append(
      "archivo",
      comprobante
    );

    const response =
      await fetch(
        `${apiUrl}/pagos/${pagoId}/comprobante`,
        {
          method: "POST",
          body: formData,
        }
      );

    if (!response.ok) {
      const mensaje =
        await response.text();

      throw new Error(
        mensaje ||
        "No se pudo subir el comprobante."
      );
    }
  }

  async function handleSubmit(
    event: React.FormEvent
  ) {
    event.preventDefault();

    if (
      !validarFormulario() ||
      !programacion
    ) {
      return;
    }

    try {
      setGuardando(true);

      const payload = {
        evento_id:
          programacion
            .evento_id,

        origen:
          programacion.origen,

        proveedor_id:
          proveedor?.id ??
          null,

        evento_proveedor_id:
          programacion
            .evento_proveedor_id ??
          null,

        personal_grupo_id:
          programacion
            .personal_grupo_id ??
          null,

        personal_persona_id:
          null,

        programacion_pago_id:
          programacion.id,

        factura_id:
          programacion
            .factura_id ??
          null,

        orden_compra_id:
          programacion
            .orden_compra_id ??
          factura
            ?.orden_compra_id ??
          null,

        cuenta_bancaria_id:
          esProveedor &&
            esTransferencia
            ? programacion
              .cuenta_bancaria_id ??
            null
            : null,

        tipo_destino:
          tipoDestino,

        tipo_pago:
          programacion
            .tipo_programacion,

        metodo_pago:
          form.metodo_pago,

        monto:
          montoProgramado,

        fecha_programada:
          programacion
            .fecha_programada,

        fecha_real_pago:
          form.fecha_real_pago,

        banco:
          esTransferencia
            ? esDetraccion
              ? "Banco de la Nación"
              : cuentaBancaria
                ?.banco ??
              null
            : esYapePlin
              ? form.metodo_pago.toUpperCase()
              : null,

        numero_operacion:
          null,

        observaciones: [
          programacion
            .observaciones?.trim() ??
          "",

          form.observaciones.trim(),

          esYapePlin
            ? `${form.metodo_pago.toUpperCase()}: ${form.numero_yape_plin.trim()} - Titular: ${form.titular_yape_plin.trim()}`
            : "",

          esDetraccion
            ? `Cuenta BN: ${factura
              ?.cuenta_detraccion_detectada ??
            ""
            }`
            : "",
        ]
          .filter(Boolean)
          .join(" | ") ||
          null,

        estado: "pagado_sin_comprobante",
      };

      const pagoCreado =
        (await apiFetch(
          "/pagos/",
          {
            method: "POST",

            body: JSON.stringify(
              payload
            ),
          }
        )) as PagoCreado;

      if (
        comprobante &&
        pagoCreado.id
      ) {
        try {
          await subirComprobantePago(
            pagoCreado.id
          );
        } catch (error) {
          console.error(
            "Error subiendo comprobante:",
            error
          );

          setToast({
            tipo: "error",
            mensaje:
              "El pago se registró, pero no se pudo subir el comprobante.",
          });

          window.setTimeout(
            () => {
              window.location.href =
                "/pagos";
            },
            1400
          );

          return;
        }
      }

      setToast({
        tipo: "success",
        mensaje:
          "Pago registrado correctamente.",
      });

      window.setTimeout(
        () => {
          window.location.href =
            "/pagos";
        },
        900
      );
    } catch (error) {
      console.error(
        "Error registrando pago:",
        error
      );

      setToast({
        tipo: "error",
        mensaje:
          "No se pudo registrar el pago.",
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
            Cargando programación...
          </p>
        </main>
      </MainLayout>
    );
  }

  if (
    !programacion
  ) {
    return (
      <MainLayout>
        <main className="min-h-screen bg-[#F6F8FB] p-6 md:p-8">
          <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <FileText className="mx-auto h-10 w-10 text-slate-300" />

            <h1 className="mt-4 text-xl font-bold text-[#102033]">
              Programación no encontrada
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              No fue posible cargar la programación seleccionada.
            </p>

            <Link
              href="/programaciones-pago"
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#2F73D9] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#245DB3]"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver a programaciones
            </Link>
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
              Registrar pago
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Confirma la ejecución del pago programado y adjunta el comprobante cuando corresponda.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-6 grid gap-6 xl:grid-cols-3"
          >
            <section className="space-y-6 xl:col-span-2">
              {/* Datos de la programación */}

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
                      La información fue cargada automáticamente desde la programación seleccionada.
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
                  <InfoItem
                    label="Tipo"
                    value={textoTipoProgramacion(
                      programacion.tipo_programacion
                    )}
                  />

                  <InfoItem
                    label="Destino"
                    value={textoDestino(
                      programacion.tipo_destino
                    )}
                  />

                  <InfoItem
                    label="Fecha programada"
                    value={formatearFecha(
                      programacion.fecha_programada
                    )}
                  />

                  <InfoItem
                    label="Estado"
                    value={
                      programacion.estado ||
                      "No registrado"
                    }
                  />

                  <InfoItem
                    label="Monto programado"
                    value={formatearMoneda(
                      programacion.monto,
                      moneda
                    )}
                  />

                  <InfoItem
                    label="Origen"
                    value={
                      programacion.origen ===
                        "personal_eventual"
                        ? "Personal eventual"
                        : "Factura aprobada"
                    }
                  />
                </div>
              </div>

              {/* Información asociada */}

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-slate-100 p-2.5 text-slate-700">
                    <ReceiptText className="h-5 w-5" />
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold text-[#102033]">
                      Información asociada
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Revisa la factura, OC, proveedor y evento antes de registrar el pago.
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <InfoItem
                    label="Factura"
                    value={
                      factura
                        ? `${factura.serie}-${factura.numero}`
                        : "Sin factura"
                    }
                  />

                  <InfoItem
                    label="Orden de compra"
                    value={
                      orden?.numero_oc ??
                      "No registrada"
                    }
                  />

                  <InfoItem
                    label="Proveedor"
                    value={
                      proveedor?.razon_social ??
                      (esPersonalEventual
                        ? "Personal eventual"
                        : "No registrado")
                    }
                  />

                  <InfoItem
                    label="Evento"
                    value={
                      evento?.nombre ??
                      "No registrado"
                    }
                  />

                  <InfoItem
                    label="Cliente"
                    value={
                      evento?.cliente ??
                      "No registrado"
                    }
                  />

                  <InfoItem
                    label="Monto de factura"
                    value={
                      factura
                        ? formatearMoneda(
                          factura.total,
                          factura.moneda
                        )
                        : "No aplica"
                    }
                  />
                </div>
              </div>

              {/* Método de pago */}

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-blue-50 p-2.5 text-[#2F73D9]">
                    <WalletCards className="h-5 w-5" />
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold text-[#102033]">
                      Datos del pago realizado
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Registra cómo y cuándo se realizó el pago.
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Método de pago *
                    </label>

                    <select
                      value={
                        form.metodo_pago
                      }
                      onChange={(event) =>
                        cambiarMetodoPago(
                          event.target
                            .value as MetodoPago
                        )
                      }
                      className={`${selectClassName} ${errores.metodo_pago
                        ? "border-red-400"
                        : ""
                        }`}
                    >
                      <option value="transferencia">
                        Transferencia bancaria
                      </option>

                      <option value="yape">
                        Yape
                      </option>

                      <option value="plin">
                        Plin
                      </option>

                      <option value="efectivo">
                        Efectivo
                      </option>
                    </select>

                    {errores.metodo_pago && (
                      <p className="mt-1.5 text-xs font-medium text-red-600">
                        {
                          errores.metodo_pago
                        }
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Fecha real de pago *
                    </label>

                    <input
                      type="date"
                      value={
                        form.fecha_real_pago
                      }
                      onChange={(event) =>
                        actualizarCampo(
                          "fecha_real_pago",
                          event.target.value
                        )
                      }
                      className={`${inputClassName} ${errores.fecha_real_pago
                        ? "border-red-400"
                        : ""
                        }`}
                    />

                    {errores.fecha_real_pago && (
                      <p className="mt-1.5 text-xs font-medium text-red-600">
                        {
                          errores.fecha_real_pago
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
                          event.target.value
                        )
                      }
                      className={inputClassName}
                      placeholder="Notas adicionales sobre el pago realizado..."
                    />
                  </div>
                </div>
              </div>

              {/* Cuenta bancaria */}

              {esProveedor &&
                esTransferencia && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="rounded-xl bg-blue-50 p-2.5 text-[#2F73D9]">
                        <CreditCard className="h-5 w-5" />
                      </div>

                      <div>
                        <h2 className="text-lg font-semibold text-[#102033]">
                          Cuenta bancaria
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                          Cuenta seleccionada en la programación.
                        </p>
                      </div>
                    </div>

                    {cuentaBancaria ? (
                      <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <InfoItem
                            label="Banco"
                            value={
                              cuentaBancaria.banco
                            }
                          />

                          <InfoItem
                            label="Tipo de cuenta"
                            value={
                              cuentaBancaria.tipo_cuenta ??
                              "No registrado"
                            }
                          />

                          <InfoItem
                            label="Número de cuenta"
                            value={
                              cuentaBancaria.numero_cuenta ??
                              "No registrado"
                            }
                          />

                          <InfoItem
                            label="CCI"
                            value={
                              cuentaBancaria.cci ??
                              "No registrado"
                            }
                          />

                          <InfoItem
                            label="Titular"
                            value={
                              cuentaBancaria.titular_cuenta ??
                              "No registrado"
                            }
                          />

                          <InfoItem
                            label="Moneda"
                            value={
                              cuentaBancaria.moneda ??
                              "PEN"
                            }
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4">
                        <p className="text-sm font-semibold text-red-700">
                          La programación no tiene una cuenta bancaria vinculada.
                        </p>
                      </div>
                    )}

                    {errores.cuenta_bancaria && (
                      <p className="mt-2 text-xs font-medium text-red-600">
                        {
                          errores.cuenta_bancaria
                        }
                      </p>
                    )}
                  </div>
                )}

              {/* Cuenta de detracción */}

              {esDetraccion && (
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
                        El depósito corresponde al Banco de la Nación.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-3">
                    <InfoItem
                      label="Cuenta BN"
                      value={
                        factura?.cuenta_detraccion_detectada ??
                        "No registrada"
                      }
                    />

                    <InfoItem
                      label="Código"
                      value={
                        factura?.codigo_detraccion ??
                        "No registrado"
                      }
                    />

                    <InfoItem
                      label="Porcentaje"
                      value={`${Number(
                        factura?.porcentaje_detraccion ??
                        0
                      ).toFixed(2)}%`}
                    />
                  </div>

                  {errores.cuenta_detraccion && (
                    <p className="mt-2 text-xs font-medium text-red-600">
                      {
                        errores.cuenta_detraccion
                      }
                    </p>
                  )}
                </div>
              )}

              {/* Yape o Plin */}

              {esYapePlin && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-violet-50 p-2.5 text-violet-700">
                      <Smartphone className="h-5 w-5" />
                    </div>

                    <div>
                      <h2 className="text-lg font-semibold text-[#102033]">
                        Datos de{" "}
                        {form.metodo_pago ===
                          "yape"
                          ? "Yape"
                          : "Plin"}
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        Registra el número y el titular que recibió el pago.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-5 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Número de celular *
                      </label>

                      <input
                        value={
                          form.numero_yape_plin
                        }
                        onChange={(event) =>
                          actualizarCampo(
                            "numero_yape_plin",
                            event.target.value
                          )
                        }
                        className={`${inputClassName} ${errores.numero_yape_plin
                          ? "border-red-400"
                          : ""
                          }`}
                        placeholder="Ej. 999 999 999"
                      />

                      {errores.numero_yape_plin && (
                        <p className="mt-1.5 text-xs font-medium text-red-600">
                          {
                            errores.numero_yape_plin
                          }
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Titular *
                      </label>

                      <input
                        value={
                          form.titular_yape_plin
                        }
                        onChange={(event) =>
                          actualizarCampo(
                            "titular_yape_plin",
                            event.target.value
                          )
                        }
                        className={`${inputClassName} ${errores.titular_yape_plin
                          ? "border-red-400"
                          : ""
                          }`}
                        placeholder="Nombre del titular"
                      />

                      {errores.titular_yape_plin && (
                        <p className="mt-1.5 text-xs font-medium text-red-600">
                          {
                            errores.titular_yape_plin
                          }
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Comprobante */}

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-[#102033]">
                  Comprobante
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Adjunta el voucher o constancia del pago. Puedes dejarlo pendiente y subirlo después.
                </p>

                <input
                  ref={
                    inputComprobanteRef
                  }
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={
                    handleComprobanteChange
                  }
                  className="hidden"
                />

                {comprobante ? (
                  <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start gap-3">
                      {comprobanteEsImagen &&
                        previewComprobante ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={
                            previewComprobante
                          }
                          alt="Vista previa del comprobante"
                          className="h-16 w-16 rounded-lg border border-slate-200 object-cover"
                        />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-blue-200 bg-blue-50">
                          <FileText className="h-7 w-7 text-[#2F73D9]" />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#102033]">
                          {
                            comprobante.name
                          }
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {(
                            comprobante.size /
                            1024 /
                            1024
                          ).toFixed(2)}{" "}
                          MB
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={
                          limpiarComprobante
                        }
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white hover:text-red-600"
                        aria-label="Eliminar comprobante"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label
                    onClick={() =>
                      inputComprobanteRef.current?.click()
                    }
                    onDragOver={(event) =>
                      event.preventDefault()
                    }
                    onDrop={
                      handleComprobanteDrop
                    }
                    className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#2F73D9]/30 bg-blue-50/40 px-5 py-8 text-center transition hover:border-[#2F73D9] hover:bg-blue-50"
                  >
                    <Upload className="h-8 w-8 text-[#2F73D9]" />

                    <span className="mt-3 text-sm font-semibold text-[#102033]">
                      Subir comprobante
                    </span>

                    <span className="mt-1 text-xs text-slate-500">
                      PDF, JPG o PNG · Máximo 10 MB
                    </span>
                  </label>
                )}
              </div>
            </section>

            {/* Resumen */}

            <aside className="space-y-6">
              <div className="sticky top-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold text-[#102033]">
                      Resumen del pago
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Verifica los datos antes de confirmar.
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  <ResumenItem
                    label="Programación"
                    value={textoTipoProgramacion(
                      programacion.tipo_programacion
                    )}
                  />

                  <ResumenItem
                    label="Destino"
                    value={textoDestino(
                      programacion.tipo_destino
                    )}
                  />

                  <ResumenItem
                    label="Factura"
                    value={
                      factura
                        ? `${factura.serie}-${factura.numero}`
                        : "No aplica"
                    }
                  />

                  <ResumenItem
                    label="Proveedor"
                    value={
                      proveedor?.razon_social ??
                      (esPersonalEventual
                        ? "Personal eventual"
                        : "No registrado")
                    }
                  />

                  <ResumenItem
                    label="Método"
                    value={
                      form.metodo_pago ===
                        "transferencia"
                        ? "Transferencia bancaria"
                        : form.metodo_pago ===
                          "yape"
                          ? "Yape"
                          : form.metodo_pago ===
                            "plin"
                            ? "Plin"
                            : "Efectivo"
                    }
                  />

                  <ResumenItem
                    label="Fecha real"
                    value={formatearFecha(
                      form.fecha_real_pago
                    )}
                  />

                  <ResumenItem
                    label="Comprobante"
                    value={
                      comprobante
                        ? comprobante.name
                        : "Pendiente"
                    }
                  />

                  <div className="border-t border-slate-200 pt-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Monto a registrar
                    </p>

                    <p className="mt-2 text-2xl font-bold text-[#102033]">
                      {formatearMoneda(
                        montoProgramado,
                        moneda
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
                    <CheckCircle2 className="h-4 w-4" />

                    {guardando
                      ? "Registrando..."
                      : "Registrar pago"}
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
export default function RegistrarPagoPage() {
  return (
    <Suspense
      fallback={
        <MainLayout>
          <main className="min-h-screen bg-[#F6F8FB] p-6 md:p-8">
            <div className="mx-auto max-w-7xl">
              <p className="text-sm text-slate-500">
                Cargando información del pago...
              </p>
            </div>
          </main>
        </MainLayout>
      }
    >
      <RegistrarPagoContent />
    </Suspense>
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