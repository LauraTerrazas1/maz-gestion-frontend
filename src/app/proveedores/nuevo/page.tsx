"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MainLayout from "@/components/layout/MainLayout";
import CustomSelect from "@/components/ui/CustomSelect";
import Toast from "@/components/ui/Toast";
import type { ToastTipo } from "@/components/ui/Toast";
import { apiFetch } from "@/lib/api";

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
  banco: string;
  tipo_cuenta: string;
  numero_cuenta: string;
  cci: string;
  moneda: string;
  titular_cuenta: string;
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
  banco: "",
  tipo_cuenta: "",
  numero_cuenta: "",
  cci: "",
  moneda: "PEN",
  titular_cuenta: "",
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

export default function NuevoProveedorPage() {
  const router = useRouter();
  const [form, setForm] = useState<ProveedorForm>(initialForm);
  const [guardando, setGuardando] = useState(false);
  const [toast, setToast] = useState<{ tipo: ToastTipo; mensaje: string } | null>(null);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function limpiarOpcional(value: string) {
    return value.trim() === "" ? null : value.trim();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);

    try {
      await apiFetch("/proveedores/", {
        method: "POST",
        body: JSON.stringify({
          tipo_proveedor: form.tipo_proveedor,
          razon_social: form.razon_social.trim(),
          documento: form.documento.trim(),
          direccion: limpiarOpcional(form.direccion),
          representante_legal_nombre: limpiarOpcional(form.representante_legal_nombre),
          representante_legal_dni: limpiarOpcional(form.representante_legal_dni),
          contacto_nombre: limpiarOpcional(form.contacto_nombre),
          contacto_cargo: limpiarOpcional(form.contacto_cargo),
          contacto_celular: limpiarOpcional(form.contacto_celular),
          contacto_correo: limpiarOpcional(form.contacto_correo),
          banco: limpiarOpcional(form.banco),
          tipo_cuenta: limpiarOpcional(form.tipo_cuenta),
          numero_cuenta: limpiarOpcional(form.numero_cuenta),
          cci: limpiarOpcional(form.cci),
          moneda: form.moneda || "PEN",
          titular_cuenta: limpiarOpcional(form.titular_cuenta),
          estado: form.estado || "activo",
        }),
      });

      router.push("/proveedores");
    } catch (error) {
      console.error("Error al crear proveedor:", error);
      setToast({ tipo: "error", mensaje: "No se pudo crear el proveedor." });
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

  const documentoPlaceholder =
    form.tipo_proveedor === "persona"
      ? "8 dígitos"
      : form.tipo_proveedor === "empresa"
      ? "11 dígitos"
      : "RUC o DNI";

  return (
    <MainLayout>
      <main className="min-h-screen bg-[#F6F8FB] p-8">
        <Link href="/proveedores" className="text-sm font-medium text-[#2F73D9]">
          ← Volver a proveedores
        </Link>

        <div className="mt-6">
          <h1 className="text-3xl font-bold text-[#102033]">Nuevo proveedor</h1>
          <p className="mt-1 text-sm text-slate-500">
            Registra la ficha general del proveedor para habilitarlo en la operación.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-[#102033]">1. Datos generales</h2>
            <p className="mt-1 text-sm text-slate-500">
              Información de identificación del proveedor.
            </p>

            <div className="mt-6">
              <label className="mb-2 block text-sm font-medium text-[#102033]">
                Tipo de proveedor
              </label>

              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="tipo_proveedor"
                    value="empresa"
                    checked={form.tipo_proveedor === "empresa"}
                    onChange={handleChange}
                    required
                  />
                  Empresa
                </label>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="tipo_proveedor"
                    value="persona"
                    checked={form.tipo_proveedor === "persona"}
                    onChange={handleChange}
                    required
                  />
                  Persona
                </label>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Campo
                label="Razón social"
                name="razon_social"
                value={form.razon_social}
                onChange={handleChange}
                placeholder="Ej. Kits Perú S.A.C."
                required
              />

              <Campo
                label={documentoLabel}
                name="documento"
                value={form.documento}
                onChange={handleChange}
                placeholder={documentoPlaceholder}
                required
              />

              <Campo
                label="Dirección"
                name="direccion"
                value={form.direccion}
                onChange={handleChange}
                placeholder="Av. / Calle, número, distrito"
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
            <p className="mt-1 text-sm text-slate-500">
              Persona que firma contratos y documentación legal del proveedor.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Campo
                label="Nombre del representante legal"
                name="representante_legal_nombre"
                value={form.representante_legal_nombre}
                onChange={handleChange}
                placeholder="Ej. Pedro Aliaga Torres"
              />

              <Campo
                label="DNI del representante legal"
                name="representante_legal_dni"
                value={form.representante_legal_dni}
                onChange={handleChange}
                placeholder="8 dígitos"
              />
            </div>
          </section>

          <section className="rounded-2xl border border-sky-200 bg-sky-50 p-6 shadow-sm">
            <h2 className="font-semibold text-[#102033]">
              3. Contacto de pagos y coordinación
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Persona con quien se coordinan pagos, documentación y temas operativos.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Campo
                label="Nombre de contacto"
                name="contacto_nombre"
                value={form.contacto_nombre}
                onChange={handleChange}
                placeholder="Ej. María Quispe Rojas"
              />

              <Campo
                label="Cargo"
                name="contacto_cargo"
                value={form.contacto_cargo}
                onChange={handleChange}
                placeholder="Ej. Jefa Comercial"
              />

              <Campo
                label="Celular"
                name="contacto_celular"
                value={form.contacto_celular}
                onChange={handleChange}
                placeholder="+51 9XX XXX XXX"
              />

              <Campo
                label="Correo"
                name="contacto_correo"
                type="email"
                value={form.contacto_correo}
                onChange={handleChange}
                placeholder="contacto@empresa.pe"
              />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-[#102033]">4. Datos bancarios</h2>
            <p className="mt-1 text-sm text-slate-500">
              Cuenta donde se realizarán las transferencias al proveedor.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-[#102033]">
                  Banco
                </label>
                <CustomSelect
                  name="banco"
                  value={form.banco}
                  options={BANCO_OPTIONS}
                  onChange={(value) =>
                    setForm((prev) => ({ ...prev, banco: value }))
                  }
                  placeholder="Selecciona un banco"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[#102033]">
                  Tipo de cuenta
                </label>
                <select
                  name="tipo_cuenta"
                  value={form.tipo_cuenta}
                  onChange={handleChange}
                  className={selectClassName}
                >
                  <option value="">Selecciona el tipo</option>
                  <option value="ahorros">Ahorros</option>
                  <option value="corriente">Corriente</option>
                  <option value="detracciones">Detracciones</option>
                </select>
              </div>

              <Campo
                label="Número de cuenta"
                name="numero_cuenta"
                value={form.numero_cuenta}
                onChange={handleChange}
                placeholder="Ej. 194-3215678-0-12"
              />

              <Campo
                label="CCI"
                name="cci"
                value={form.cci}
                onChange={handleChange}
                placeholder="20 dígitos"
              />

              <div>
                <label className="mb-1 block text-sm font-medium text-[#102033]">
                  Moneda
                </label>
                <select
                  name="moneda"
                  value={form.moneda}
                  onChange={handleChange}
                  className={selectClassName}
                >
                  <option value="PEN">Soles (PEN)</option>
                  <option value="USD">Dólares (USD)</option>
                </select>
              </div>

              <Campo
                label="Titular de la cuenta"
                name="titular_cuenta"
                value={form.titular_cuenta}
                onChange={handleChange}
                placeholder="Nombre completo o razón social"
              />
            </div>
          </section>

          <div className="flex justify-end gap-3 pb-8">
            <Link
              href="/proveedores"
              className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Cancelar
            </Link>

            <button
              type="submit"
              disabled={guardando}
              className="rounded-lg bg-[#2F73D9] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#245DB3] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {guardando ? "Guardando..." : "Guardar proveedor"}
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
}: {
  label: string;
  name: string;
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => void;
  placeholder?: string;
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
        placeholder={placeholder}
        required={required}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-[#2F73D9]"
      />
    </div>
  );
}
