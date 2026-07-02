"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import Link from "next/link";
import Toast from "@/components/ui/Toast";
import type { ToastTipo } from "@/components/ui/Toast";
import { apiFetch } from "@/lib/api";

const COLOR_CARD_OPTIONS = [
  { value: "azul", label: "Azul", className: "bg-[#2F73D9]" },
  { value: "verde", label: "Verde", className: "bg-[#92C83E]" },
  { value: "naranja", label: "Naranja", className: "bg-orange-400" },
  { value: "morado", label: "Morado", className: "bg-purple-500" },
  { value: "rosado", label: "Rosado", className: "bg-pink-400" },
  { value: "rojo", label: "Rojo", className: "bg-red-500" },
  { value: "amarillo", label: "Amarillo", className: "bg-yellow-400" },
  { value: "celeste", label: "Celeste", className: "bg-sky-400" },
  { value: "gris", label: "Gris", className: "bg-slate-400" },
];

const inputClassName =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none transition focus:border-[#2F73D9] focus:ring-2 focus:ring-[#2F73D9]/15";

const selectClassName =
  "w-full cursor-pointer rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:border-[#2F73D9] focus:ring-2 focus:ring-[#2F73D9]/15";

const colorSelectClassName =
  "w-44 cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-[#102033] shadow-sm outline-none transition focus:border-[#2F73D9] focus:ring-2 focus:ring-[#2F73D9]/15";

const MONTO_FIELDS = ["presupuesto_aprobado", "monto_recibido_cliente"];

function bloquearTeclasNumero(e: React.KeyboardEvent<HTMLInputElement>) {
  if (["-", "e", "E", "+"].includes(e.key)) {
    e.preventDefault();
  }
}

type EventoForm = {
  nombre: string;
  cliente: string;
  fecha_inicio: string;
  fecha_fin: string;
  ubicacion: string;
  observaciones: string;
  presupuesto_aprobado: string;
  tipo_presupuesto: string;
  monto_recibido_cliente: string;
  color_card: string;
};

const formInicial: EventoForm = {
  nombre: "",
  cliente: "",
  fecha_inicio: "",
  fecha_fin: "",
  ubicacion: "",
  observaciones: "",
  presupuesto_aprobado: "",
  tipo_presupuesto: "",
  monto_recibido_cliente: "",
  color_card: "",
};

export default function NuevoEventoPage() {
  const router = useRouter();

  const [form, setForm] = useState<EventoForm>(formInicial);
  const [guardando, setGuardando] = useState(false);
  const [toast, setToast] = useState<{ tipo: ToastTipo; mensaje: string } | null>(null);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;

    if (MONTO_FIELDS.includes(name) && value !== "" && Number(value) < 0) {
      setToast({ tipo: "error", mensaje: "El monto no puede ser negativo" });
      return;
    }

    setForm({ ...form, [name]: value });
  }

  const presupuesto = Number(form.presupuesto_aprobado || 0);
  const recibido = Number(form.monto_recibido_cliente || 0);
  const saldoPendiente = Math.max(presupuesto - recibido, 0);
  const selectedColor = COLOR_CARD_OPTIONS.find(
    (color) => color.value === form.color_card
  );
  const porcentajeAdelanto =
    presupuesto > 0 ? Math.round((recibido / presupuesto) * 100) : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (presupuesto < 0 || recibido < 0) {
      setToast({
        tipo: "error",
        mensaje: "El presupuesto y el monto recibido no pueden ser negativos.",
      });
      return;
    }

    if (Number(form.presupuesto_aprobado || 0) < 0) {
      setToast({ tipo: "error", mensaje: "El monto no puede ser negativo" });
      return;
    }

    if (Number(form.monto_recibido_cliente || 0) < 0) {
      setToast({ tipo: "error", mensaje: "El monto no puede ser negativo" });
      return;
    }

    if (
      form.fecha_inicio &&
      form.fecha_fin &&
      form.fecha_fin < form.fecha_inicio
    ) {
      setToast({
        tipo: "error",
        mensaje: "La fecha fin no puede ser menor que la fecha de inicio",
      });
      return;
    }

    try {
      setGuardando(true);

      await apiFetch("/eventos/", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          presupuesto_aprobado: presupuesto,
          monto_recibido_cliente: recibido,
          saldo_pendiente_cliente: saldoPendiente,
          porcentaje_adelanto: porcentajeAdelanto,
          color_card: form.color_card || null,
        }),
      });

      router.push("/eventos");
    } catch (error) {
      console.error("Error al crear evento:", error);
      setToast({ tipo: "error", mensaje: "No se pudo guardar el evento." });
    } finally {
      setGuardando(false);
    }
  }

  return (
    <MainLayout>
      <main className="min-h-screen bg-[#F6F8FB] p-8">
        <Link
          href="/eventos"
          className="text-sm font-medium text-[#2F73D9] transition hover:text-[#245DB3]"
        >
          &larr; Volver a eventos
        </Link>

        <div className="mt-6">
          <h1 className="text-3xl font-bold text-[#102033]">Nuevo evento</h1>
          <p className="mt-1 text-sm text-slate-500">
            Registra los datos generales y la informacion financiera del cliente.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#102033]">
              Datos del evento
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Informacion general y logistica.
            </p>

            <div className="mt-6 space-y-5">
              <Campo
                label="Nombre del evento"
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                placeholder="Ej. Carrera New Balance 2026"
                required
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Campo
                  label="Cliente"
                  name="cliente"
                  value={form.cliente}
                  onChange={handleChange}
                  placeholder="Ej. New Balance"
                  required
                />

                <Campo
                  label="Ubicacion"
                  name="ubicacion"
                  value={form.ubicacion}
                  onChange={handleChange}
                  placeholder="Sede, distrito y referencia"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Campo
                  label="Fecha de inicio"
                  name="fecha_inicio"
                  type="date"
                  value={form.fecha_inicio}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Campo
                  label="Fecha de fin"
                  name="fecha_fin"
                  type="date"
                  value={form.fecha_fin}
                  onChange={handleChange}
                  min={form.fecha_inicio || undefined}
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[#102033]">
                  Observaciones
                </label>
                <textarea
                  name="observaciones"
                  value={form.observaciones}
                  onChange={handleChange}
                  placeholder="Notas internas sobre el evento..."
                  rows={4}
                  className={`${inputClassName} resize-y`}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[#102033]">
                  Color identificador
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`h-3 w-3 rounded-full ${
                      selectedColor?.className || "bg-slate-200"
                    }`}
                    aria-hidden="true"
                  />
                  <select
                    name="color_card"
                    value={form.color_card}
                    onChange={handleChange}
                    className={colorSelectClassName}
                  >
                    <option value="">Seleccionar</option>
                    {COLOR_CARD_OPTIONS.map((color) => (
                      <option key={color.value} value={color.value}>
                        {color.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#102033]">
              Informacion financiera del cliente
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Datos contractuales y de cobranza. El saldo y porcentaje se calculan automaticamente.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-[#102033]">
                  Presupuesto aprobado (S/)
                </label>
                <input
                  type="number"
                  name="presupuesto_aprobado"
                  value={form.presupuesto_aprobado}
                  onChange={handleChange}
                  onKeyDown={bloquearTeclasNumero}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className={inputClassName}
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[#102033]">
                  Monto recibido del cliente (S/)
                </label>
                <input
                  type="number"
                  name="monto_recibido_cliente"
                  value={form.monto_recibido_cliente}
                  onChange={handleChange}
                  onKeyDown={bloquearTeclasNumero}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className={inputClassName}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[#102033]">
                  Tipo de presupuesto
                </label>
                <select
                  name="tipo_presupuesto"
                  value={form.tipo_presupuesto}
                  onChange={handleChange}
                  className={selectClassName}
                  required
                >
                  <option value="">Seleccionar tipo</option>
                  <option value="incluye_igv">Incluye IGV</option>
                  <option value="no_incluye_igv">No incluye IGV</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[#102033]">
                  Saldo pendiente del cliente
                </label>
                <input
                  value={`S/ ${saldoPendiente.toLocaleString("es-PE", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`}
                  readOnly
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-[#102033] shadow-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[#102033]">
                  Porcentaje de adelanto recibido
                </label>
                <input
                  value={`${porcentajeAdelanto}%`}
                  readOnly
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-[#102033] shadow-sm"
                />
              </div>
            </div>
          </section>

          <div className="flex justify-end gap-3 pb-8">
            <Link
              href="/eventos"
              className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Cancelar
            </Link>

            <button
              type="submit"
              disabled={guardando}
              className="rounded-lg bg-[#2F73D9] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#245DB3] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {guardando ? "Guardando..." : "Guardar evento"}
            </button>
          </div>
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

function Campo({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  min,
  step,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  min?: string;
  step?: string;
}) {
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (type === "number") {
      bloquearTeclasNumero(e);
    }
  }

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-[#102033]">
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        min={min}
        step={step}
        onKeyDown={handleKeyDown}
        className={inputClassName}
      />
    </div>
  );
}
