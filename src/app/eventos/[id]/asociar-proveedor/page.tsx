"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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

type Proveedor = {
  id: string;
  razon_social: string | null;
  documento?: string | null;
  ruc_dni?: string | null;
  estado: string | null;
};

const selectClassName =
  "w-full cursor-pointer rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-[#2F73D9] focus:ring-2 focus:ring-[#2F73D9]/20";

export default function AsociarProveedorPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [evento, setEvento] = useState<Evento | null>(null);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [toast, setToast] = useState<{ tipo: ToastTipo; mensaje: string } | null>(null);

  const [form, setForm] = useState({
    proveedor_id: "",
    servicio: "",
    monto_contratado: "",
    observaciones: "",
    agregar_programacion: false,
    tipo_programacion: "",
    monto_programado: "",
    fecha_programada: "",
    observaciones_programacion: "",
  });

  useEffect(() => {
    void Promise.resolve().then(async () => {
      try {
        const eventoData = await apiFetch(`/eventos/${params.id}`);
        setEvento(eventoData);

        const proveedoresData = await apiFetch("/proveedores/");
        setProveedores(
          Array.isArray(proveedoresData)
            ? proveedoresData.filter((p: Proveedor) => p.estado === "activo")
            : []
        );
      } catch (error) {
        console.error("Error cargando datos:", error);
        setToast({ tipo: "error", mensaje: "No se pudo cargar la información." });
      }
    });
  }, [params.id]);

  function documentoProveedor(proveedor: Proveedor) {
    return proveedor.documento || proveedor.ruc_dni || "Sin documento";
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value, type } = e.target;

    setForm({
      ...form,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);

    try {
      const relacionCreada = await apiFetch("/evento-proveedores/", {
        method: "POST",
        body: JSON.stringify({
          evento_id: params.id,
          proveedor_id: form.proveedor_id,
          servicio: form.servicio.trim(),
          monto_contratado: Number(form.monto_contratado),
          estado: "activo",
          observaciones:
            form.observaciones.trim() === "" ? null : form.observaciones.trim(),
        }),
      });
      if (form.agregar_programacion) {
        await apiFetch("/programaciones-pago/", {
          method: "POST",
          body: JSON.stringify({
            evento_id: params.id,
            evento_proveedor_id: relacionCreada.id,
            tipo_programacion: form.tipo_programacion,
            monto: Number(form.monto_programado),
            fecha_programada: form.fecha_programada,
            observaciones:
              form.observaciones_programacion.trim() === ""
                ? null
                : form.observaciones_programacion.trim(),
            estado: "pendiente",
          }),
        });
      }
      router.push(`/eventos/${params.id}`);
    } catch (error) {
      console.error("Error asociando proveedor:", error);
      setToast({ tipo: "error", mensaje: "No se pudo asociar el proveedor al evento." });
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
          &larr; Volver al evento
        </Link>

        <div className="mt-6">
          <h1 className="text-3xl font-bold text-[#102033]">
            Asociar proveedor
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {evento
              ? `Evento: ${evento.nombre} - Cliente: ${evento.cliente}`
              : "Conecta un proveedor existente con este evento."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#102033]">
              Datos de la asociacion
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              El servicio y monto contratado pertenecen a este evento especifico.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-[#102033]">
                  Proveedor
                </label>
                <select
                  name="proveedor_id"
                  value={form.proveedor_id}
                  onChange={handleChange}
                  required
                  className={selectClassName}
                >
                  <option value="">Seleccionar proveedor</option>
                  {proveedores.map((proveedor) => (
                    <option key={proveedor.id} value={proveedor.id}>
                      {proveedor.razon_social || "Proveedor sin nombre"} -{" "}
                      {documentoProveedor(proveedor)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[#102033]">
                  Servicio brindado
                </label>
                <input
                  name="servicio"
                  value={form.servicio}
                  onChange={handleChange}
                  placeholder="Ej. Seguridad, ambulancia, hidratacion"
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-[#2F73D9]"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[#102033]">
                  Monto contratado (S/)
                </label>
                <input
                  type="number"
                  name="monto_contratado"
                  value={form.monto_contratado}
                  onChange={handleChange}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-[#2F73D9]"
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
                  placeholder="Notas internas sobre la contratacion del proveedor..."
                  rows={4}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-[#2F73D9]"
                />
              </div>
            </div>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <label className="flex items-center gap-3 text-sm font-semibold text-[#102033]">
              <input
                type="checkbox"
                name="agregar_programacion"
                checked={form.agregar_programacion}
                onChange={handleChange}
                className="h-4 w-4"
              />
              Agregar programación de pago inicial
            </label>

            {form.agregar_programacion && (
              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#102033]">
                    Tipo de programación
                  </label>
                  <select
                    name="tipo_programacion"
                    value={form.tipo_programacion}
                    onChange={handleChange}
                    required={form.agregar_programacion}
                    className={selectClassName}
                  >
                    <option value="">Seleccionar tipo</option>
                    <option value="adelanto">Adelanto</option>
                    <option value="saldo_final">Saldo final</option>
                    <option value="pago_unico">Pago único</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-[#102033]">
                    Monto programado (S/)
                  </label>
                  <input
                    type="number"
                    name="monto_programado"
                    value={form.monto_programado}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    required={form.agregar_programacion}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-[#2F73D9]"
                  />
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
                    required={form.agregar_programacion}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-[#2F73D9]"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-[#102033]">
                    Observaciones de programación
                  </label>
                  <textarea
                    name="observaciones_programacion"
                    value={form.observaciones_programacion}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Ej. 50% al inicio, saldo contra entrega..."
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-[#2F73D9]"
                  />
                </div>
              </div>
            )}
          </section>
          <div className="flex justify-end gap-3 pb-8">
            <Link
              href={`/eventos/${params.id}`}
              className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Cancelar
            </Link>

            <button
              type="submit"
              disabled={guardando}
              className="rounded-lg bg-[#2F73D9] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#245DB3] disabled:opacity-60"
            >
              {guardando ? "Guardando..." : "Asociar proveedor"}
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
