"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MainLayout from "@/components/layout/MainLayout";
import Toast from "@/components/ui/Toast";
import type { ToastTipo } from "@/components/ui/Toast";
import { apiFetch } from "@/lib/api";

type Evento = {
  id: string;
  nombre: string;
  cliente: string;
};

type ProveedorEvento = {
  id: string;
  evento_id: string;
  proveedor_id: string;
  servicio: string | null;
  monto_contratado: number | string | null;
  proveedores?: {
    razon_social: string | null;
    banco: string | null;
    tipo_cuenta: string | null;
    numero_cuenta: string | null;
    cci: string | null;
    titular_cuenta: string | null;
  };
};

type Programacion = {
  id: string;
  tipo_programacion: string;
  monto: number | string;
  porcentaje: number | string | null;
  fecha_programada: string | null;
  estado: string;
};

type PagoExistente = {
  id: string;
  evento_proveedor_id: string | null;
  personal_grupo_id: string | null;
  monto: number | string;
  estado: string;
};

type PagoCreado = {
  id: string;
};

type PersonalGrupo = {
  id: string;
  evento_id: string;
  cargo_funcion: string;
  cantidad_personas: number;
  subtotal: number | string;
  fecha_pago: string | null;
  metodo_pago: string | null;
  estado: string;
};

const selectClassName =
  "w-full cursor-pointer rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-[#2F73D9] focus:ring-2 focus:ring-[#2F73D9]/20";

const comprobanteMaxBytes = 10 * 1024 * 1024;
const comprobanteTiposPermitidos = [
  "application/pdf",
  "image/jpeg",
  "image/png",
];

export default function NuevoPagoPage() {
  const router = useRouter();
  const inputComprobanteRef = useRef<HTMLInputElement | null>(null);

  const [eventos, setEventos] = useState<Evento[]>([]);
  const [proveedoresEvento, setProveedoresEvento] = useState<ProveedorEvento[]>([]);
  const [programaciones, setProgramaciones] = useState<Programacion[]>([]);
  const [gruposPersonalEvento, setGruposPersonalEvento] = useState<PersonalGrupo[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [toast, setToast] = useState<{ tipo: ToastTipo; mensaje: string } | null>(null);
  const [comprobante, setComprobante] = useState<File | null>(null);
  const [previewComprobante, setPreviewComprobante] = useState<string | null>(null);
  const [pagosExistentes, setPagosExistentes] = useState<PagoExistente[]>([]);

  const [form, setForm] = useState({
    origen: "proveedor",
    evento_id: "",
    evento_proveedor_id: "",
    programacion_pago_id: "",
    personal_grupo_id: "",
    tipo_pago: "",
    metodo_pago: "transferencia",
    monto: "",
    fecha_programada: "",
    fecha_real_pago: "",
    banco: "",
    numero_operacion: "",
    observaciones: "",
    // `estado` is calculated by the backend; user must not set it.
  });

  const esProveedor = form.origen === "proveedor";
  const esPersonalEventual = form.origen === "personal_eventual";
  const esEfectivo = form.metodo_pago === "efectivo";

  const proveedorSeleccionado = proveedoresEvento.find(
    (item) => item.id === form.evento_proveedor_id
  );

  const grupoSeleccionado = gruposPersonalEvento.find(
    (item) => item.id === form.personal_grupo_id
  );

  const totalPagadoPersonal = pagosExistentes
    .filter(
      (pago) =>
        pago.personal_grupo_id === form.personal_grupo_id &&
        ["pagado", "pagado_sin_comprobante"].includes(pago.estado)
    )
    .reduce((total, pago) => total + Number(pago.monto || 0), 0);

  const subtotalGrupoPersonal = Number(grupoSeleccionado?.subtotal || 0);

  const saldoPendientePersonal = Math.max(
    subtotalGrupoPersonal - totalPagadoPersonal,
    0
  );
  const totalPagadoProveedor = pagosExistentes
    .filter(
      (pago) =>
        pago.evento_proveedor_id === form.evento_proveedor_id &&
        ["pagado", "pagado_sin_comprobante"].includes(pago.estado)
    )
    .reduce((total, pago) => total + Number(pago.monto || 0), 0);

  const montoContratadoProveedor = Number(
    proveedorSeleccionado?.monto_contratado || 0
  );

  const saldoPendienteProveedor = Math.max(
    montoContratadoProveedor - totalPagadoProveedor,
    0
  );
  const comprobanteEsImagen = comprobante?.type.startsWith("image/") || false;

  async function cargarEventos() {
    try {
      const data = await apiFetch("/eventos/");
      setEventos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando eventos:", error);
      setEventos([]);
    }
  }

  useEffect(() => {
    void Promise.resolve().then(async () => {
      await cargarEventos();
      await cargarPagosExistentes();
    });
  }, []);

  async function cargarProveedoresEvento(eventoId: string) {
    try {
      const data = await apiFetch(`/evento-proveedores/evento/${eventoId}`);
      setProveedoresEvento(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando proveedores del evento:", error);
      setProveedoresEvento([]);
    }
  }

  async function cargarProgramaciones(eventoProveedorId: string) {
    try {
      const data = await apiFetch(
        `/programaciones-pago/evento-proveedor/${eventoProveedorId}`
      );
      setProgramaciones(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando programaciones:", error);
      setProgramaciones([]);
    }
  }

  async function cargarGruposPersonal(eventoId: string) {
    try {
      const data = await apiFetch(`/personal-eventual/grupos/evento/${eventoId}`);
      setGruposPersonalEvento(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando grupos de personal eventual:", error);
      setGruposPersonalEvento([]);
    }
  }

  async function cargarPagosExistentes() {
    try {
      const data = await apiFetch("/pagos/");
      setPagosExistentes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando pagos existentes:", error);
      setPagosExistentes([]);
    }
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "origen") {
      setForm((prev) => ({
        ...prev,
        origen: value,
        evento_proveedor_id: "",
        programacion_pago_id: "",
        personal_grupo_id: "",
        tipo_pago: "",
        monto: "",
        fecha_programada: "",
        banco: "",
        numero_operacion: "",
      }));
    }

    if (name === "metodo_pago") {
      const proveedorSeleccionado = proveedoresEvento.find(
        (item) => item.id === form.evento_proveedor_id
      );

      setForm((prev) => ({
        ...prev,
        metodo_pago: value,
        banco:
          value === "efectivo"
            ? ""
            : proveedorSeleccionado?.proveedores?.banco || "",
        numero_operacion:
          value === "efectivo" ? "" : prev.numero_operacion,
      }));
    }

    if (name === "evento_id") {
      setForm((prev) => ({
        ...prev,
        evento_id: value,
        evento_proveedor_id: "",
        programacion_pago_id: "",
        personal_grupo_id: "",
        tipo_pago: "",
        monto: "",
        fecha_programada: "",
        banco: "",
        numero_operacion: "",
      }));
      setProveedoresEvento([]);
      setProgramaciones([]);
      setGruposPersonalEvento([]);

      if (value) {
        cargarProveedoresEvento(value);
        cargarGruposPersonal(value);
      }
    }

    if (name === "evento_proveedor_id") {
      const seleccionado = proveedoresEvento.find((item) => item.id === value);

      setForm((prev) => ({
        ...prev,
        evento_proveedor_id: value,
        programacion_pago_id: "",
        tipo_pago: "",
        monto: "",
        fecha_programada: "",
        banco:
          prev.metodo_pago === "efectivo"
            ? ""
            : seleccionado?.proveedores?.banco || "",
        numero_operacion:
          prev.metodo_pago === "efectivo" ? "" : prev.numero_operacion,
      }));

      setProgramaciones([]);
      if (value) cargarProgramaciones(value);
    }

    if (name === "programacion_pago_id") {
      const seleccionada = programaciones.find((item) => item.id === value);

      setForm((prev) => ({
        ...prev,
        programacion_pago_id: value,
        tipo_pago: seleccionada?.tipo_programacion || "",
        monto: seleccionada ? String(seleccionada.monto || "") : "",
        fecha_programada: seleccionada?.fecha_programada || "",
      }));
    }

    if (name === "personal_grupo_id") {
      const seleccionado = gruposPersonalEvento.find((item) => item.id === value);

      setForm((prev) => ({
        ...prev,
        personal_grupo_id: value,
        tipo_pago: "pago_unico",
        monto: seleccionado
          ? String(
            Math.max(
              Number(seleccionado.subtotal || 0) -
              pagosExistentes
                .filter(
                  (pago) =>
                    pago.personal_grupo_id === seleccionado.id &&
                    ["pagado", "pagado_sin_comprobante"].includes(pago.estado)
                )
                .reduce((total, pago) => total + Number(pago.monto || 0), 0),
              0
            )
          )
          : "",
        fecha_programada: seleccionado?.fecha_pago || "",
        metodo_pago: seleccionado?.metodo_pago || prev.metodo_pago,
      }));
    }
  }

  function limpiarOpcional(value: string) {
    return value.trim() === "" ? null : value.trim();
  }

  function formatearTipo(tipo: string) {
    if (tipo === "adelanto") return "Adelanto";
    if (tipo === "segundo_pago") return "Segundo pago";
    if (tipo === "tercer_pago") return "Tercer pago";
    if (tipo === "cuarto_pago") return "Cuarto pago";
    if (tipo === "saldo_final") return "Saldo final";
    if (tipo === "otro") return "Otro";
    return tipo;
  }

  function formatearTamano(bytes: number) {
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  function validarComprobante(file: File) {
    if (!comprobanteTiposPermitidos.includes(file.type)) {
      setToast({ tipo: "error", mensaje: "Formato inválido. Sube PDF, JPG o PNG." });
      return false;
    }

    if (file.size > comprobanteMaxBytes) {
      setToast({ tipo: "error", mensaje: "El comprobante no debe superar 10 MB." });
      return false;
    }

    return true;
  }

  function seleccionarComprobante(file?: File) {
    if (!file || !validarComprobante(file)) return;

    setComprobante(file);
    setPreviewComprobante(file.type.startsWith("image/") ? URL.createObjectURL(file) : null);
  }

  function limpiarComprobante() {
    if (previewComprobante) {
      URL.revokeObjectURL(previewComprobante);
    }

    setComprobante(null);
    setPreviewComprobante(null);

    if (inputComprobanteRef.current) {
      inputComprobanteRef.current.value = "";
    }
  }

  function handleComprobanteChange(e: React.ChangeEvent<HTMLInputElement>) {
    seleccionarComprobante(e.target.files?.[0]);
  }

  function handleComprobanteDrop(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    seleccionarComprobante(e.dataTransfer.files?.[0]);
  }

  useEffect(() => {
    return () => {
      if (previewComprobante) {
        URL.revokeObjectURL(previewComprobante);
      }
    };
  }, [previewComprobante]);

  function volverAlListado() {
    window.setTimeout(() => router.push("/pagos"), 900);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);

    const montoIngresado = Number(form.monto || 0);

    if (montoIngresado <= 0) {
      setToast({ tipo: "error", mensaje: "El monto del pago debe ser mayor a cero." });
      setGuardando(false);
      return;
    }

    if (
      esProveedor &&
      form.evento_proveedor_id &&
      montoIngresado > saldoPendienteProveedor
    ) {
      setToast({
        tipo: "error",
        mensaje:
          "El monto ingresado supera el saldo pendiente de este proveedor/servicio.",
      });
      setGuardando(false);
      return;
    }

    if (esPersonalEventual && !form.personal_grupo_id) {
      setToast({ tipo: "error", mensaje: "Selecciona un grupo de personal eventual." });
      setGuardando(false);
      return;
    }
    if (
      esPersonalEventual &&
      form.personal_grupo_id &&
      montoIngresado > saldoPendientePersonal
    ) {
      setToast({
        tipo: "error",
        mensaje: "El monto ingresado supera el saldo pendiente de este grupo.",
      });
      setGuardando(false);
      return;
    }

    try {
      const payload = esProveedor
        ? {
          evento_id: form.evento_id,
          origen: "proveedor",
          proveedor_id: proveedorSeleccionado?.proveedor_id || null,
          evento_proveedor_id: form.evento_proveedor_id || null,
          personal_grupo_id: null,
          personal_persona_id: null,
          programacion_pago_id: form.programacion_pago_id || null,
          tipo_pago: form.tipo_pago,
          metodo_pago: form.metodo_pago,
          monto: Number(form.monto || 0),
          fecha_programada: limpiarOpcional(form.fecha_programada),
          fecha_real_pago: limpiarOpcional(form.fecha_real_pago),
          banco: limpiarOpcional(form.banco),
          numero_operacion: limpiarOpcional(form.numero_operacion),
          observaciones: limpiarOpcional(form.observaciones),
        }
        : {
          evento_id: form.evento_id,
          origen: "personal_eventual",
          proveedor_id: null,
          evento_proveedor_id: null,
          personal_grupo_id: form.personal_grupo_id,
          personal_persona_id: null,
          programacion_pago_id: null,
          tipo_pago: "pago_unico",
          metodo_pago: form.metodo_pago,
          monto: Number(form.monto || 0),
          fecha_programada: limpiarOpcional(form.fecha_programada),
          fecha_real_pago: limpiarOpcional(form.fecha_real_pago),
          banco: null,
          numero_operacion: limpiarOpcional(form.numero_operacion),
          observaciones: limpiarOpcional(form.observaciones),
        };

      const pagoCreado = (await apiFetch("/pagos/", {
        method: "POST",
        body: JSON.stringify(payload),
      })) as PagoCreado;

      if (comprobante) {
        if (!pagoCreado.id) {
          setToast({
            tipo: "error",
            mensaje: "Pago registrado, pero no se pudo subir el comprobante.",
          });
          volverAlListado();
          return;
        }

        const formData = new FormData();
        formData.append("archivo", comprobante);

        try {
          const url = `${process.env.NEXT_PUBLIC_API_URL}/pagos/${pagoCreado.id}/comprobante`;

          console.log("Subiendo comprobante a:", url);
          console.log("Archivo:", comprobante);

          const response = await fetch(url, {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error("Error backend comprobante:", response.status, errorText);
            throw new Error(errorText || "No se pudo subir el comprobante");
          }
        } catch (error) {
          console.error("Error al subir comprobante:", error);
          setToast({
            tipo: "error",
            mensaje: "Pago registrado, pero el comprobante no pudo subirse.",
          });
          volverAlListado();
          return;
        }
      }

      setToast({ tipo: "success", mensaje: "Pago registrado correctamente." });
      volverAlListado();
    } catch (error) {
      console.error("Error al registrar pago:", error);
      setToast({ tipo: "error", mensaje: "No se pudo registrar el pago." });
    } finally {
      setGuardando(false);
    }
  }

  return (
    <MainLayout>
      <main className="min-h-screen bg-[#F6F8FB] p-8">
        <Link href="/pagos" className="text-sm font-medium text-[#2F73D9]">
          ← Volver a pagos
        </Link>

        <div className="mt-6">
          <h1 className="text-3xl font-bold text-[#102033]">Registrar pago</h1>
          <p className="mt-1 text-sm text-slate-500">
            Completa los datos del pago realizado o programado, ya sea a un
            proveedor o a un grupo de personal eventual.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
          <section className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#102033]">Datos del pago</h2>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-[#102033]">
                  Origen del pago
                </label>
                <select
                  name="origen"
                  value={form.origen}
                  onChange={handleChange}
                  className={selectClassName}
                >
                  <option value="proveedor">Proveedor</option>
                  <option value="personal_eventual">Personal eventual</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-[#102033]">
                  Evento
                </label>
                <select
                  name="evento_id"
                  value={form.evento_id}
                  onChange={handleChange}
                  required
                  className={selectClassName}
                >
                  <option value="">Selecciona un evento</option>
                  {eventos.map((evento) => (
                    <option key={evento.id} value={evento.id}>
                      {evento.nombre} - {evento.cliente}
                    </option>
                  ))}
                </select>
              </div>

              {esProveedor && (
                <>
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-[#102033]">
                      Proveedor asociado
                    </label>
                    <select
                      name="evento_proveedor_id"
                      value={form.evento_proveedor_id}
                      onChange={handleChange}
                      required
                      disabled={!form.evento_id}
                      className={`${selectClassName} disabled:bg-slate-50`}
                    >
                      <option value="">
                        {form.evento_id
                          ? "Selecciona proveedor"
                          : "Selecciona primero un evento"}
                      </option>
                      {proveedoresEvento.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.proveedores?.razon_social || "Proveedor sin nombre"} ·{" "}
                          {item.servicio || "Sin servicio"}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-[#102033]">
                      Programación de pago
                    </label>
                    <select
                      name="programacion_pago_id"
                      value={form.programacion_pago_id}
                      onChange={handleChange}
                      disabled={!form.evento_proveedor_id}
                      className={`${selectClassName} disabled:bg-slate-50`}
                    >
                      <option value="">
                        {form.evento_proveedor_id
                          ? "Pago manual o selecciona programación"
                          : "Selecciona primero un proveedor"}
                      </option>
                      {programaciones.map((item) => (
                        <option key={item.id} value={item.id}>
                          {formatearTipo(item.tipo_programacion)} · S/{" "}
                          {Number(item.monto || 0).toLocaleString("es-PE")} ·{" "}
                          {item.fecha_programada || "Sin fecha"}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {esPersonalEventual && (
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-[#102033]">
                    Grupo de personal eventual
                  </label>
                  <select
                    name="personal_grupo_id"
                    value={form.personal_grupo_id}
                    onChange={handleChange}
                    required
                    disabled={!form.evento_id}
                    className={`${selectClassName} disabled:bg-slate-50`}
                  >
                    <option value="">
                      {form.evento_id
                        ? "Selecciona un grupo"
                        : "Selecciona primero un evento"}
                    </option>
                    {gruposPersonalEvento.map((grupo) => (
                      <option key={grupo.id} value={grupo.id}>
                        {grupo.cargo_funcion} · {grupo.cantidad_personas} personas · S/{" "}
                        {Number(grupo.subtotal || 0).toLocaleString("es-PE")}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-[#102033]">
                  Tipo de pago
                </label>
                <select
                  name="tipo_pago"
                  value={form.tipo_pago}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-[#2F73D9]"
                >
                  <option value="">Seleccionar tipo</option>
                  <option value="pago_unico">Pago único</option>
                  <option value="adelanto">Adelanto</option>
                  <option value="segundo_pago">Segundo pago</option>
                  <option value="tercer_pago">Tercer pago</option>
                  <option value="cuarto_pago">Cuarto pago</option>
                  <option value="saldo_final">Saldo final</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[#102033]">
                  Método de pago
                </label>
                <select
                  name="metodo_pago"
                  value={form.metodo_pago}
                  onChange={handleChange}
                  className={selectClassName}
                >
                  <option value="transferencia">Transferencia bancaria</option>
                  <option value="yape">Yape</option>
                  <option value="plin">Plin</option>
                  <option value="efectivo">Efectivo</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[#102033]">
                  Monto (S/)
                </label>
                <input
                  type="number"
                  name="monto"
                  value={form.monto}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  required
                  disabled={
                    esProveedor &&
                    !!form.evento_proveedor_id &&
                    saldoPendienteProveedor <= 0
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm shadow-sm outline-none focus:border-[#2F73D9] disabled:bg-slate-50"
                />
                {esProveedor &&
                  form.evento_proveedor_id &&
                  (saldoPendienteProveedor > 0 ? (
                    <div className="mt-2 rounded-lg bg-green-50 px-3 py-2 text-sm font-semibold text-green-700 border border-green-200">
                      Saldo pendiente del proveedor: S/ {saldoPendienteProveedor.toLocaleString("es-PE", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                  ) : (
                    <div className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 border border-red-200">
                      Este proveedor/servicio ya está completamente pagado.
                    </div>
                  ))}
                {esPersonalEventual && grupoSeleccionado && (
                  saldoPendientePersonal > 0 ? (
                    <div className="mt-2 rounded-lg bg-green-50 px-3 py-2 text-sm font-semibold text-green-700 border border-green-200">
                      Saldo pendiente del grupo: S/{" "}
                      {saldoPendientePersonal.toLocaleString("es-PE", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                  ) : (
                    <div className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 border border-red-200">
                      Este grupo ya está completamente pagado.
                    </div>
                  )
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[#102033]">
                  Fecha programada
                </label>
                <input
                  type="date"
                  name="fecha_programada"
                  value={form.fecha_programada}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm shadow-sm outline-none focus:border-[#2F73D9]"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[#102033]">
                  Fecha real de pago
                </label>
                <input
                  type="date"
                  name="fecha_real_pago"
                  value={form.fecha_real_pago}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm shadow-sm outline-none focus:border-[#2F73D9]"
                />
              </div>

              {esProveedor && (
                <div className="md:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-sm font-semibold text-[#102033]">
                    Datos bancarios del proveedor
                  </h3>

                  {esEfectivo ? (
                    <p className="mt-3 text-sm text-slate-500">
                      Pago en efectivo. No se requieren datos bancarios.
                    </p>
                  ) : (
                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-[#102033]">
                          Banco
                        </label>
                        <input
                          value={proveedorSeleccionado?.proveedores?.banco || "No registrado"}
                          readOnly
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium text-[#102033]">
                          Tipo de cuenta
                        </label>
                        <input
                          value={proveedorSeleccionado?.proveedores?.tipo_cuenta || "No registrado"}
                          readOnly
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium text-[#102033]">
                          Número de cuenta
                        </label>
                        <input
                          value={proveedorSeleccionado?.proveedores?.numero_cuenta || "No registrado"}
                          readOnly
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium text-[#102033]">
                          CCI
                        </label>
                        <input
                          value={proveedorSeleccionado?.proveedores?.cci || "No registrado"}
                          readOnly
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="mb-1 block text-sm font-medium text-[#102033]">
                          Titular de cuenta
                        </label>
                        <input
                          value={proveedorSeleccionado?.proveedores?.titular_cuenta || "No registrado"}
                          readOnly
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-[#102033]">
                  Número de operación
                </label>
                <input
                  name="numero_operacion"
                  value={form.numero_operacion}
                  onChange={handleChange}
                  placeholder="Ej. 00231445"
                  disabled={esEfectivo}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm shadow-sm outline-none focus:border-[#2F73D9] disabled:bg-slate-50"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-[#102033]">
                  Observaciones
                </label>
                <textarea
                  name="observaciones"
                  value={form.observaciones}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Notas internas sobre el pago..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm shadow-sm outline-none focus:border-[#2F73D9]"
                />
              </div>
            </div>
          </section>

          <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#102033]">
              Comprobante
            </h2>

            <p className="hidden">
              La carga real del comprobante se implementará después con Storage.
            </p>

            <div className="hidden">
              Si registras el pago como “Pagado sin comprobante”, el backend
              generará automáticamente una alerta de comprobante pendiente.
            </div>

            <p className="mt-2 text-sm text-slate-500">
              Adjunta el voucher o constancia del pago.
            </p>

            <input
              ref={inputComprobanteRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleComprobanteChange}
              className="hidden"
            />

            {comprobante ? (
              <div className="mt-5 rounded-xl border border-slate-200 bg-[#F6F8FB] p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  {comprobanteEsImagen && previewComprobante ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={previewComprobante}
                      alt="Vista previa del comprobante"
                      className="h-14 w-14 rounded-lg border border-slate-200 object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-sky-200 bg-sky-50 text-xs font-bold text-[#2F73D9]">
                      PDF
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#102033]">
                      {comprobante.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatearTamano(comprobante.size)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={limpiarComprobante}
                    className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-sm font-bold text-slate-500 shadow-sm hover:border-red-200 hover:text-red-600"
                    aria-label="Eliminar comprobante"
                  >
                    x
                  </button>
                </div>
              </div>
            ) : (
              <label
                onClick={() => inputComprobanteRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleComprobanteDrop}
                className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#2F73D9]/30 bg-sky-50/60 px-5 py-8 text-center shadow-sm transition hover:border-[#2F73D9] hover:bg-sky-50"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-xl font-bold text-[#2F73D9] shadow-sm">
                  ^
                </span>
                <span className="mt-3 text-sm font-bold text-[#102033]">
                  Subir comprobante
                </span>
                <span className="mt-1 text-xs text-slate-500">
                  PDF, JPG o PNG (max 10 MB)
                </span>
              </label>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <Link
                href="/pagos"
                className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Cancelar
              </Link>

              <button
                type="submit"
                disabled={
                  guardando ||
                  (esProveedor &&
                    !!form.evento_proveedor_id &&
                    saldoPendienteProveedor <= 0)
                }
                className="rounded-lg bg-[#2F73D9] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#245DB3] disabled:opacity-60"
              >
                {guardando ? "Guardando..." : "Guardar pago"}
              </button>
            </div>
          </aside>
        </form>

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