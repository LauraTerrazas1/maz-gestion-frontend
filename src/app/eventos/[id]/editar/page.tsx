"use client";

import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import { apiFetch } from "@/lib/api";

const COLOR_CARD_OPTIONS = [
  "azul",
  "verde",
  "naranja",
  "morado",
  "rosado",
  "rojo",
  "amarillo",
  "turquesa",
  "indigo",
  "gris",
  "negro",
];

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

const selectClassName =
  "w-full cursor-pointer rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-[#2F73D9] focus:ring-2 focus:ring-[#2F73D9]/20";

export default function EditarEventoPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [form, setForm] = useState<EventoForm>(formInicial);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function cargarEvento() {
      try {
        setCargando(true);
        setError("");

        const data = await apiFetch(`/eventos/${params.id}`);

        setForm({
          nombre: data.nombre || "",
          cliente: data.cliente || "",
          fecha_inicio: data.fecha_inicio || "",
          fecha_fin: data.fecha_fin || "",
          ubicacion: data.ubicacion || "",
          observaciones: data.observaciones || "",
          presupuesto_aprobado: String(data.presupuesto_aprobado || ""),
          tipo_presupuesto: data.tipo_presupuesto || "",
          monto_recibido_cliente: String(data.monto_recibido_cliente || ""),
          color_card: data.color_card || "",
        });
      } catch (error) {
        console.error("Error cargando evento:", error);
        setError("No se pudo cargar el evento.");
      } finally {
        setCargando(false);
      }
    }

    cargarEvento();
  }, [params.id]);

  function handleChange(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    try {
      setGuardando(true);
      setError("");

      await apiFetch(`/eventos/${params.id}`, {
        method: "PUT",
        body: JSON.stringify({
          ...form,
          presupuesto_aprobado: Number(form.presupuesto_aprobado || 0),
          monto_recibido_cliente: Number(form.monto_recibido_cliente || 0),
          color_card: form.color_card || null,
        }),
      });

      router.push(`/eventos/${params.id}`);
    } catch (error) {
      console.error("Error guardando evento:", error);
      setError("No se pudieron guardar los cambios.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <MainLayout>
      <main className="min-h-screen bg-[#F6F8FB] p-8">
        <Link
          href={`/eventos/${params.id}`}
          className="text-sm font-medium text-[#2F73D9]"
        >
          &larr; Volver al detalle
        </Link>

        <div className="mt-6">
          <h1 className="text-3xl font-bold text-[#102033]">Editar evento</h1>
          <p className="mt-1 text-sm text-slate-500">
            Actualiza los datos generales y la informacion financiera del cliente.
          </p>
        </div>

        {cargando ? (
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Cargando evento...</p>
          </section>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm">
                {error}
              </div>
            )}

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-[#102033]">
                Datos del evento
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Informacion general y logistica.
              </p>

              <div className="mt-6 space-y-5">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Nombre del evento
                  </label>
                  <input
                    name="nombre"
                    value={form.nombre}
                    onChange={handleChange}
                    placeholder="Ej. Carrera New Balance 2026"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm shadow-sm outline-none focus:border-[#2F73D9]"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Cliente
                    </label>
                    <input
                      name="cliente"
                      value={form.cliente}
                      onChange={handleChange}
                      placeholder="Ej. New Balance"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm shadow-sm outline-none focus:border-[#2F73D9]"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Fecha de inicio
                    </label>
                    <input
                      type="date"
                      name="fecha_inicio"
                      value={form.fecha_inicio}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm shadow-sm outline-none focus:border-[#2F73D9]"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Fecha de fin
                    </label>
                    <input
                      type="date"
                      name="fecha_fin"
                      value={form.fecha_fin}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm shadow-sm outline-none focus:border-[#2F73D9]"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Ubicacion
                    </label>
                    <input
                      name="ubicacion"
                      value={form.ubicacion}
                      onChange={handleChange}
                      placeholder="Sede, distrito y referencia"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm shadow-sm outline-none focus:border-[#2F73D9]"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Observaciones
                  </label>
                  <textarea
                    name="observaciones"
                    value={form.observaciones}
                    onChange={handleChange}
                    placeholder="Notas internas sobre el evento..."
                    rows={4}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm shadow-sm outline-none focus:border-[#2F73D9]"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Color identificador
                  </label>
                  <select
                    name="color_card"
                    value={form.color_card}
                    onChange={handleChange}
                    className={selectClassName}
                  >
                    <option value="">Azul</option>
                    {COLOR_CARD_OPTIONS.map((color) => (
                      <option key={color} value={color}>
                        {color}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-[#102033]">
                Informacion financiera del cliente
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                El backend calcula automaticamente el estado, saldo y porcentaje.
              </p>

              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Presupuesto aprobado (S/)
                  </label>
                  <input
                    type="number"
                    name="presupuesto_aprobado"
                    value={form.presupuesto_aprobado}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm shadow-sm outline-none focus:border-[#2F73D9]"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Monto recibido del cliente (S/)
                  </label>
                  <input
                    type="number"
                    name="monto_recibido_cliente"
                    value={form.monto_recibido_cliente}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm shadow-sm outline-none focus:border-[#2F73D9]"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
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
              </div>
            </section>

            <div className="flex justify-end gap-3">
              <Link
                href={`/eventos/${params.id}`}
                className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm"
              >
                Cancelar
              </Link>

              <button
                disabled={guardando}
                className="rounded-lg bg-[#2F73D9] px-6 py-2.5 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-70"
              >
                {guardando ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </form>
        )}
      </main>
    </MainLayout>
  );
}
