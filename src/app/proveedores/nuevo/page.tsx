"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import MainLayout from "@/components/layout/MainLayout";
import Toast from "@/components/ui/Toast";
import type { ToastTipo } from "@/components/ui/Toast";

import ListaCuentasBancarias, {
  type CuentaBancaria,
} from "@/components/proveedores/ListaCuentasBancarias";

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

  cuenta_detracciones_bn: string;

  estado: string;
};

type ErroresProveedor = Partial<Record<keyof ProveedorForm, string>>;

type ProveedorCreado = {
  id: string;
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
  "w-full cursor-pointer rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:border-[#2F73D9] focus:ring-2 focus:ring-[#2F73D9]/20";

const inputErrorClassName =
  "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100";

function soloNumeros(value: string) {
  return value.replace(/\D/g, "");
}

function limpiarOpcional(value: string) {
  const limpio = value.trim();
  return limpio === "" ? null : limpio;
}

export default function NuevoProveedorPage() {
  const router = useRouter();

  const [form, setForm] = useState<ProveedorForm>(initialForm);

  const [cuentasBancarias, setCuentasBancarias] = useState<
    CuentaBancaria[]
  >([]);

  const [errores, setErrores] = useState<ErroresProveedor>({});

  const [tocados, setTocados] = useState<
    Partial<Record<keyof ProveedorForm, boolean>>
  >({});

  const [guardando, setGuardando] = useState(false);

  const [toast, setToast] = useState<{
    tipo: ToastTipo;
    mensaje: string;
  } | null>(null);

  function validarCampo(
    nombre: keyof ProveedorForm,
    valor: string,
    datos: ProveedorForm = form
  ): string {
    const valorLimpio = valor.trim();

    switch (nombre) {
      case "tipo_proveedor":
        if (!valorLimpio) {
          return "Selecciona el tipo de proveedor.";
        }
        return "";

      case "razon_social":
        if (!valorLimpio) {
          return datos.tipo_proveedor === "persona"
            ? "Ingresa el nombre completo."
            : "Ingresa la razón social.";
        }

        if (valorLimpio.length < 3) {
          return "Debe tener al menos 3 caracteres.";
        }

        return "";

      case "documento": {
        if (!valorLimpio) {
          return datos.tipo_proveedor === "persona"
            ? "Ingresa el DNI."
            : "Ingresa el RUC.";
        }

        const documento = soloNumeros(valorLimpio);

        if (datos.tipo_proveedor === "persona" && documento.length !== 8) {
          return "El DNI debe tener exactamente 8 dígitos.";
        }

        if (datos.tipo_proveedor === "empresa" && documento.length !== 11) {
          return "El RUC debe tener exactamente 11 dígitos.";
        }

        return "";
      }

      case "contacto_nombre":
        if (!valorLimpio) {
          return "Ingresa el nombre del contacto.";
        }

        if (valorLimpio.length < 3) {
          return "Debe tener al menos 3 caracteres.";
        }

        return "";

      case "contacto_celular": {
        if (!valorLimpio) {
          return "Ingresa el número de celular.";
        }

        const celular = soloNumeros(valorLimpio);

        if (celular.length !== 9) {
          return "El celular debe tener exactamente 9 dígitos.";
        }

        return "";
      }

      case "contacto_correo":
        if (
          valorLimpio &&
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valorLimpio)
        ) {
          return "Ingresa un correo electrónico válido.";
        }

        return "";

      case "representante_legal_dni":
        if (
          valorLimpio &&
          soloNumeros(valorLimpio).length !== 8
        ) {
          return "El DNI del representante debe tener 8 dígitos.";
        }

        return "";

      case "cuenta_detracciones_bn":
        if (
          valorLimpio &&
          !/^[0-9-]+$/.test(valorLimpio)
        ) {
          return "La cuenta de detracciones solo puede contener números y guiones.";
        }

        return "";

      default:
        return "";
    }
  }

  function validarFormulario() {
    const nuevosErrores: ErroresProveedor = {};

    const campos: (keyof ProveedorForm)[] = [
      "tipo_proveedor",
      "razon_social",
      "documento",
      "direccion",
      "representante_legal_nombre",
      "representante_legal_dni",
      "contacto_nombre",
      "contacto_cargo",
      "contacto_celular",
      "contacto_correo",
      "cuenta_detracciones_bn",
      "estado",
    ];

    campos.forEach((campo) => {
      const error = validarCampo(campo, form[campo], form);

      if (error) {
        nuevosErrores[campo] = error;
      }
    });

    setErrores(nuevosErrores);

    const camposTocados: Partial<
      Record<keyof ProveedorForm, boolean>
    > = {};

    campos.forEach((campo) => {
      camposTocados[campo] = true;
    });

    setTocados(camposTocados);

    return Object.keys(nuevosErrores).length === 0;
  }

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) {
    const { name, value } = e.target;
    const campo = name as keyof ProveedorForm;

    let nuevoValor = value;

    if (
      campo === "documento" ||
      campo === "representante_legal_dni" ||
      campo === "contacto_celular"
    ) {
      nuevoValor = soloNumeros(value);
    }

    const nuevoForm = {
      ...form,
      [campo]: nuevoValor,
    };

    setForm(nuevoForm);

    if (tocados[campo]) {
      setErrores((prev) => ({
        ...prev,
        [campo]: validarCampo(campo, nuevoValor, nuevoForm),
      }));
    }

    if (campo === "tipo_proveedor") {
      setErrores((prev) => ({
        ...prev,
        tipo_proveedor: validarCampo(
          "tipo_proveedor",
          nuevoValor,
          nuevoForm
        ),
        documento: validarCampo(
          "documento",
          nuevoForm.documento,
          nuevoForm
        ),
      }));
    }
  }

  function handleBlur(
    e: React.FocusEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) {
    const campo = e.target.name as keyof ProveedorForm;

    setTocados((prev) => ({
      ...prev,
      [campo]: true,
    }));

    setErrores((prev) => ({
      ...prev,
      [campo]: validarCampo(campo, form[campo], form),
    }));
  }

  async function registrarCuentasBancarias(
    proveedorId: string
  ) {
    for (const cuenta of cuentasBancarias) {
      await apiFetch(
        `/proveedores-cuentas/proveedor/${proveedorId}`,
        {
          method: "POST",
          body: JSON.stringify({
            banco: cuenta.banco,
            tipo_cuenta: cuenta.tipo_cuenta,
            moneda: cuenta.moneda,
            numero_cuenta: cuenta.numero_cuenta.trim(),
            cci: cuenta.cci.trim(),
            titular_cuenta: cuenta.titular_cuenta.trim(),
            es_principal: cuenta.es_principal,
          }),
        }
      );
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const formularioValido = validarFormulario();

    if (!formularioValido) {
      setToast({
        tipo: "error",
        mensaje:
          "Revisa los campos marcados antes de guardar el proveedor.",
      });

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    setGuardando(true);

    try {
      const proveedorCreado = (await apiFetch(
        "/proveedores/",
        {
          method: "POST",
          body: JSON.stringify({
            tipo_proveedor: form.tipo_proveedor,
            razon_social: form.razon_social.trim(),
            documento: soloNumeros(form.documento),
            direccion: limpiarOpcional(form.direccion),

            representante_legal_nombre: limpiarOpcional(
              form.representante_legal_nombre
            ),

            representante_legal_dni: limpiarOpcional(
              soloNumeros(form.representante_legal_dni)
            ),

            contacto_nombre: form.contacto_nombre.trim(),

            contacto_cargo: limpiarOpcional(
              form.contacto_cargo
            ),

            contacto_celular: soloNumeros(
              form.contacto_celular
            ),

            contacto_correo: limpiarOpcional(
              form.contacto_correo
            ),

            cuenta_detracciones_bn: limpiarOpcional(
              form.cuenta_detracciones_bn
            ),

            estado: form.estado || "activo",
          }),
        }
      )) as ProveedorCreado;

      if (!proveedorCreado?.id) {
        throw new Error(
          "El backend no devolvió el ID del proveedor."
        );
      }

      if (cuentasBancarias.length > 0) {
        await registrarCuentasBancarias(proveedorCreado.id);
      }

      router.push("/proveedores");
    } catch (error) {
      console.error("Error al crear proveedor:", error);

      setToast({
        tipo: "error",
        mensaje:
          "No se pudo completar el registro del proveedor. Revisa la información e inténtalo nuevamente.",
      });
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
        : "Selecciona primero el tipo de proveedor";

  const razonSocialLabel =
    form.tipo_proveedor === "persona"
      ? "Nombre completo"
      : "Razón social";

  const razonSocialPlaceholder =
    form.tipo_proveedor === "persona"
      ? "Ej. Juan Pérez Torres"
      : "Ej. Kits Perú S.A.C.";

  return (
    <MainLayout>
      <main className="min-h-screen bg-[#F6F8FB] p-4 md:p-8">
        <Link
          href="/proveedores"
          className="text-sm font-medium text-[#2F73D9]"
        >
          ← Volver a proveedores
        </Link>

        <div className="mt-6">
          <h1 className="text-3xl font-bold text-[#102033]">
            Nuevo proveedor
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Registra la información disponible. Los datos
            complementarios y las cuentas bancarias pueden añadirse
            después.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="mt-6 space-y-6"
        >
          {/* 1. DATOS GENERALES */}

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-[#102033]">
              1. Datos generales
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Información principal para identificar al proveedor.
            </p>

            <div className="mt-6">
              <label className="mb-2 block text-sm font-medium text-[#102033]">
                Tipo de proveedor{" "}
                <span className="text-red-500">*</span>
              </label>

              <div className="flex flex-wrap gap-6">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="tipo_proveedor"
                    value="empresa"
                    checked={form.tipo_proveedor === "empresa"}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                  Empresa
                </label>

                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="tipo_proveedor"
                    value="persona"
                    checked={form.tipo_proveedor === "persona"}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                  Persona
                </label>
              </div>

              {errores.tipo_proveedor && (
                <p className="mt-2 text-xs font-medium text-red-600">
                  {errores.tipo_proveedor}
                </p>
              )}
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Campo
                label={razonSocialLabel}
                name="razon_social"
                value={form.razon_social}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder={razonSocialPlaceholder}
                required
                error={errores.razon_social}
              />

              <Campo
                label={documentoLabel}
                name="documento"
                value={form.documento}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder={documentoPlaceholder}
                maxLength={
                  form.tipo_proveedor === "persona" ? 8 : 11
                }
                required
                error={errores.documento}
              />

              <Campo
                label="Dirección"
                name="direccion"
                value={form.direccion}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Av. / Calle, número y distrito"
                error={errores.direccion}
              />

              <div>
                <label className="mb-1 block text-sm font-medium text-[#102033]">
                  Estado
                </label>

                <select
                  name="estado"
                  value={form.estado}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={selectClassName}
                >
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </div>
            </div>
          </section>

          {/* 2. REPRESENTANTE LEGAL */}

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-[#102033]">
              2. Representante legal
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Información opcional. Puede completarse posteriormente.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Campo
                label="Nombre del representante legal"
                name="representante_legal_nombre"
                value={form.representante_legal_nombre}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Ej. Pedro Aliaga Torres"
                error={errores.representante_legal_nombre}
              />

              <Campo
                label="DNI del representante legal"
                name="representante_legal_dni"
                value={form.representante_legal_dni}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="8 dígitos"
                maxLength={8}
                error={errores.representante_legal_dni}
              />
            </div>
          </section>

          {/* 3. CONTACTO */}

          <section className="rounded-2xl border border-sky-200 bg-sky-50 p-6 shadow-sm">
            <h2 className="font-semibold text-[#102033]">
              3. Contacto de pagos y coordinación
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Persona con quien MAZ coordinará pagos, documentos y
              servicios.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Campo
                label="Nombre de contacto"
                name="contacto_nombre"
                value={form.contacto_nombre}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Ej. María Quispe Rojas"
                required
                error={errores.contacto_nombre}
              />

              <Campo
                label="Cargo"
                name="contacto_cargo"
                value={form.contacto_cargo}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Ej. Jefa comercial"
                error={errores.contacto_cargo}
              />

              <Campo
                label="Celular"
                name="contacto_celular"
                value={form.contacto_celular}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="9 dígitos"
                maxLength={9}
                required
                error={errores.contacto_celular}
              />

              <Campo
                label="Correo"
                name="contacto_correo"
                type="email"
                value={form.contacto_correo}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="contacto@empresa.pe"
                error={errores.contacto_correo}
              />
            </div>
          </section>

          {/* 4. DETRACCIONES */}

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-[#102033]">
              4. Cuenta de detracciones
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Opcional. Regístrala únicamente si el proveedor emite
              facturas sujetas a detracción.
            </p>

            <div className="mt-6 max-w-xl">
              <Campo
                label="Cuenta del Banco de la Nación"
                name="cuenta_detracciones_bn"
                value={form.cuenta_detracciones_bn}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Ej. 00-123-456789"
                error={errores.cuenta_detracciones_bn}
              />
            </div>
          </section>

          {/* 5. CUENTAS BANCARIAS */}

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <ListaCuentasBancarias
              value={cuentasBancarias}
              onChange={setCuentasBancarias}
            />
          </section>

          {/* BOTONES */}

          <div className="flex justify-end gap-3 pb-8">
            <Link
              href="/proveedores"
              className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Cancelar
            </Link>

            <button
              type="submit"
              disabled={guardando}
              className="rounded-lg bg-[#2F73D9] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#245DB3] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {guardando
                ? "Guardando..."
                : "Guardar proveedor"}
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
  onBlur,
  placeholder,
  type = "text",
  required = false,
  maxLength,
  error,
}: {
  label: string;
  name: keyof ProveedorForm;
  value: string;

  onChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => void;

  onBlur: (
    e: React.FocusEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => void;

  placeholder?: string;
  type?: string;
  required?: boolean;
  maxLength?: number;
  error?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-[#102033]">
        {label}

        {required && (
          <span className="ml-1 text-red-500">*</span>
        )}
      </label>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        maxLength={maxLength}
        aria-invalid={Boolean(error)}
        className={`w-full rounded-xl border bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:ring-2 ${error
          ? inputErrorClassName
          : "border-slate-300 focus:border-[#2F73D9] focus:ring-[#2F73D9]/20"
          }`}
      />

      {error && (
        <p className="mt-1.5 text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}