"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import MainLayout from "@/components/layout/MainLayout";
import Toast from "@/components/ui/Toast";
import type { ToastTipo } from "@/components/ui/Toast";
import { apiFetch } from "@/lib/api";
import ListaCuentasBancarias, {
  type CuentaBancaria,
} from "@/components/proveedores/ListaCuentasBancarias";

type ProveedorForm = {
  tipo_proveedor: string;
  razon_social: string;
  documento: string;
  direccion: string;
  representante_legal_nombre: string;
  representante_legal_dni: string;
  contacto_nombre: string;
  contacto_cargo: string;
  contacto_celular: string;
  contacto_correo: string;
  cuenta_detracciones_bn: string;
  estado: string;
};

const initialForm: ProveedorForm = {
  tipo_proveedor: "",
  razon_social: "",
  documento: "",
  direccion: "",
  representante_legal_nombre: "",
  representante_legal_dni: "",
  contacto_nombre: "",
  contacto_cargo: "",
  contacto_celular: "",
  contacto_correo: "",
  cuenta_detracciones_bn: "",
  estado: "activo",
};

const selectClassName =
  "w-full cursor-pointer rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-[#2F73D9] focus:ring-2 focus:ring-[#2F73D9]/20";

const BANCO_OPTIONS = [
  { value: "BCP", label: "BCP", color: "#F58220" },
  { value: "BBVA", label: "BBVA", color: "#004481" },
  { value: "Interbank", label: "Interbank", color: "#00A94F" },
  { value: "Scotiabank", label: "Scotiabank", color: "#D71920" },
  {
    value: "Banco de la Naci\u00f3n",
    label: "Banco de la Naci\u00f3n",
    color: "#C8102E",
  },
  { value: "Otro", label: "Otro", color: "#FFFFFF" },
];

export default function EditarProveedorPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [form, setForm] = useState<ProveedorForm>(initialForm);
  const [cuentasBancarias, setCuentasBancarias] = useState<
    CuentaBancaria[]
  >([]);

  const [cuentasOriginales, setCuentasOriginales] = useState<
    CuentaBancaria[]
  >([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [toast, setToast] = useState<{ tipo: ToastTipo; mensaje: string } | null>(null);

  useEffect(() => {
    void Promise.resolve().then(async () => {
      try {
        const [data, cuentasData] = await Promise.all([
          apiFetch(`/proveedores/${params.id}`),
          apiFetch(`/proveedores-cuentas/proveedor/${params.id}`),
        ]);

        setForm({
          tipo_proveedor: data.tipo_proveedor || "",
          razon_social: data.razon_social || "",
          documento: data.documento || "",
          direccion: data.direccion || "",
          representante_legal_nombre: data.representante_legal_nombre || "",
          representante_legal_dni: data.representante_legal_dni || "",
          contacto_nombre: data.contacto_nombre || "",
          contacto_cargo: data.contacto_cargo || "",
          contacto_celular: data.contacto_celular || "",
          contacto_correo: data.contacto_correo || "",
          cuenta_detracciones_bn: data.cuenta_detracciones_bn || "",
          estado: data.estado || "activo",
        });
        const cuentas = Array.isArray(cuentasData)
          ? cuentasData
          : [];

        setCuentasBancarias(cuentas);
        setCuentasOriginales(cuentas);
      } catch (error) {
        console.error("Error al cargar proveedor:", error);
        setToast({ tipo: "error", mensaje: "No se pudo cargar el proveedor." });
      } finally {
        setCargando(false);
      }
    });
  }, [params.id]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function limpiarOpcional(value: string) {
    return value.trim() === "" ? null : value.trim();
  }

  async function guardarCuentasBancarias() {
    const idsActuales = cuentasBancarias
      .filter((cuenta) => cuenta.id)
      .map((cuenta) => cuenta.id);

    // Eliminar cuentas quitadas desde la interfaz
    for (const cuentaOriginal of cuentasOriginales) {
      if (
        cuentaOriginal.id &&
        !idsActuales.includes(cuentaOriginal.id)
      ) {
        await apiFetch(
          `/proveedores-cuentas/${cuentaOriginal.id}`,
          {
            method: "DELETE",
          }
        );
      }
    }

    // Crear o actualizar cuentas actuales
    for (const cuenta of cuentasBancarias) {
      const payload = {
        banco: cuenta.banco,
        tipo_cuenta: cuenta.tipo_cuenta,
        moneda: cuenta.moneda || "PEN",
        numero_cuenta: cuenta.numero_cuenta.trim(),
        cci: cuenta.cci?.trim() || null,
        titular_cuenta:
          cuenta.titular_cuenta?.trim() || null,
        es_principal: cuenta.es_principal,
        estado: "activo",
      };

      if (cuenta.id) {
        await apiFetch(
          `/proveedores-cuentas/${cuenta.id}`,
          {
            method: "PUT",
            body: JSON.stringify(payload),
          }
        );
      } else {
        await apiFetch(
          `/proveedores-cuentas/proveedor/${params.id}`,
          {
            method: "POST",
            body: JSON.stringify(payload),
          }
        );
      }
    }
  }
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);

    try {
      await apiFetch(`/proveedores/${params.id}`, {
        method: "PUT",
        body: JSON.stringify({
          tipo_proveedor: form.tipo_proveedor,
          razon_social: form.razon_social.trim(),
          documento: form.documento.trim(),
          direccion: limpiarOpcional(form.direccion),
          representante_legal_nombre: limpiarOpcional(
            form.representante_legal_nombre
          ),
          representante_legal_dni: limpiarOpcional(form.representante_legal_dni),
          contacto_nombre: limpiarOpcional(form.contacto_nombre),
          contacto_cargo: limpiarOpcional(form.contacto_cargo),
          contacto_celular: limpiarOpcional(form.contacto_celular),
          contacto_correo: limpiarOpcional(form.contacto_correo),
          cuenta_detracciones_bn: limpiarOpcional(form.cuenta_detracciones_bn),
          estado: form.estado || "activo",
        }),
      });
      await guardarCuentasBancarias();

      router.push(`/proveedores/${params.id}`);
    } catch (error) {
      console.error("Error al actualizar proveedor:", error);
      setToast({ tipo: "error", mensaje: "No se pudo actualizar el proveedor." });
    } finally {
      setGuardando(false);
    }
  }

  const documentoLabel =
    form.tipo_proveedor === "persona"
      ? "DNI"
      : form.tipo_proveedor === "empresa"
        ? "RUC"
        : "Documento";

  if (cargando) {
    return (
      <MainLayout>
        <main className="min-h-screen bg-[#F6F8FB] p-8">
          <p className="text-sm text-slate-500">Cargando proveedor...</p>
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

  return (
    <MainLayout>
      <main className="min-h-screen bg-[#F6F8FB] p-8">
        <Link
          href={`/proveedores/${params.id}`}
          className="text-sm font-medium text-[#2F73D9]"
        >
          ← Volver al proveedor
        </Link>

        <div className="mt-6">
          <h1 className="text-3xl font-bold text-[#102033]">
            Editar proveedor
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Actualiza la ficha general del proveedor.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-[#102033]">1. Datos generales</h2>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-[#102033]">
                  Tipo de proveedor
                </label>
                <select
                  name="tipo_proveedor"
                  value={form.tipo_proveedor}
                  onChange={handleChange}
                  required
                  className={selectClassName}
                >
                  <option value="">Seleccionar tipo</option>
                  <option value="empresa">Empresa</option>
                  <option value="persona">Persona</option>
                </select>
              </div>

              <Campo
                label="Razón social"
                name="razon_social"
                value={form.razon_social}
                onChange={handleChange}
                required
              />

              <Campo
                label={documentoLabel}
                name="documento"
                value={form.documento}
                onChange={handleChange}
                required
              />

              <Campo
                label="Dirección"
                name="direccion"
                value={form.direccion}
                onChange={handleChange}
              />

              <div>
                <label className="mb-1 block text-sm font-medium text-[#102033]">
                  Estado
                </label>
                <select
                  name="estado"
                  value={form.estado}
                  onChange={handleChange}
                  className={selectClassName}
                >
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-[#102033]">2. Representante legal</h2>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Campo
                label="Nombre del representante legal"
                name="representante_legal_nombre"
                value={form.representante_legal_nombre}
                onChange={handleChange}
              />

              <Campo
                label="DNI del representante legal"
                name="representante_legal_dni"
                value={form.representante_legal_dni}
                onChange={handleChange}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-sky-200 bg-sky-50 p-6 shadow-sm">
            <h2 className="font-semibold text-[#102033]">
              3. Contacto de pagos y coordinación
            </h2>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Campo
                label="Nombre de contacto"
                name="contacto_nombre"
                value={form.contacto_nombre}
                onChange={handleChange}
              />

              <Campo
                label="Cargo"
                name="contacto_cargo"
                value={form.contacto_cargo}
                onChange={handleChange}
              />

              <Campo
                label="Celular"
                name="contacto_celular"
                value={form.contacto_celular}
                onChange={handleChange}
              />

              <Campo
                label="Correo"
                name="contacto_correo"
                type="email"
                value={form.contacto_correo}
                onChange={handleChange}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-[#102033]">
              4. Cuenta de detracciones
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Opcional. Regístrala únicamente si el proveedor utiliza cuenta de detracciones.
            </p>

            <div className="mt-6 max-w-xl">
              <Campo
                label="Cuenta del Banco de la Nación"
                name="cuenta_detracciones_bn"
                value={form.cuenta_detracciones_bn}
                onChange={handleChange}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <ListaCuentasBancarias
              value={cuentasBancarias}
              onChange={setCuentasBancarias}
            />
          </section>

          <div className="flex justify-end gap-3 pb-8">
            <Link
              href={`/proveedores/${params.id}`}
              className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Cancelar
            </Link>

            <button
              type="submit"
              disabled={guardando}
              className="rounded-lg bg-[#2F73D9] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#245DB3] disabled:opacity-60"
            >
              {guardando ? "Guardando..." : "Guardar cambios"}
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
  type = "text",
  required = false,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  type?: string;
  required?: boolean;
}) {
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
        required={required}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-[#2F73D9]"
      />
    </div>
  );
}
