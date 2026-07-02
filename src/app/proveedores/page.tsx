"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import MainLayout from "@/components/layout/MainLayout";
import Toast from "@/components/ui/Toast";
import type { ToastTipo } from "@/components/ui/Toast";
import { apiFetch } from "@/lib/api";

type Proveedor = {
  id: string;
  razon_social: string | null;
  tipo?: string | null;
  tipo_proveedor?: string | null;
  ruc_dni?: string | null;
  documento?: string | null;
  contacto_nombre: string | null;
  contacto_celular: string | null;
  contacto_correo: string | null;
  estado: string | null;
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

function textoSiExiste(valor?: string | null) {
  return valor && valor.trim() !== "" ? valor : null;
}

function tipoProveedor(proveedor: Proveedor) {
  return textoSiExiste(proveedor.tipo_proveedor) || textoSiExiste(proveedor.tipo);
}

function documentoProveedor(proveedor: Proveedor) {
  return textoSiExiste(proveedor.documento) || textoSiExiste(proveedor.ruc_dni);
}

function formatearEstado(estado: string) {
  return estado?.replaceAll("_", " ");
}

function estadoBadgeClass(estado: string) {
  if (estado === "pagado" || estado === "activo" || estado === "resuelta" || estado === "aprobado") {
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

function coincideBusqueda(proveedor: Proveedor, busqueda: string) {
  const texto = busqueda.trim().toLowerCase();

  if (!texto) return true;

  return [
    proveedor.razon_social,
    proveedor.documento,
    proveedor.ruc_dni,
    proveedor.contacto_nombre,
    proveedor.contacto_correo,
  ].some((valor) => valor?.toLowerCase().includes(texto));
}

export default function ProveedoresPage() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("todos");
  const [cargando, setCargando] = useState(true);
  const [toast, setToast] = useState<{ tipo: ToastTipo; mensaje: string } | null>(null);

  useEffect(() => {
    async function cargarProveedores() {
      try {
        const data = await apiFetch("/proveedores/");
        setProveedores(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error cargando proveedores:", error);
      } finally {
        setCargando(false);
      }
    }

    cargarProveedores();
  }, []);

  const proveedoresFiltrados = proveedores.filter((proveedor) => {
    const coincideEstado =
      estadoFiltro === "todos" || proveedor.estado === estadoFiltro;

    return coincideEstado && coincideBusqueda(proveedor, busqueda);
  });

  function handleDescargarCSV() {
    if (proveedoresFiltrados.length === 0) {
      setToast({ tipo: "info", mensaje: "No hay datos para exportar" });
      return;
    }

    descargarCSV(
      "proveedores_maz.csv",
      [
        { key: "razon_social", label: "Razón social" },
        { key: "tipo_proveedor", label: "Tipo" },
        { key: "documento", label: "Documento" },
        { key: "contacto_nombre", label: "Contacto" },
        { key: "contacto_celular", label: "Celular" },
        { key: "contacto_correo", label: "Correo" },
        { key: "estado", label: "Estado" },
      ],
      proveedoresFiltrados.map((proveedor) => ({
        razon_social: proveedor.razon_social,
        tipo_proveedor: tipoProveedor(proveedor),
        documento: documentoProveedor(proveedor),
        contacto_nombre: proveedor.contacto_nombre,
        contacto_celular: proveedor.contacto_celular,
        contacto_correo: proveedor.contacto_correo,
        estado: formatearEstado(proveedor.estado || ""),
      }))
    );
  }

  return (
    <MainLayout>
      <main className="min-h-screen bg-[#F6F8FB] p-8">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#102033]">Proveedores</h1>
            <p className="mt-1 text-sm text-slate-500">
              Proveedores registrados para eventos de MAZ Producciones.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleDescargarCSV}
              className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-[#102033] shadow-sm hover:bg-slate-50"
            >
              Descargar Excel
            </button>

            <Link
              href="/proveedores/nuevo"
              className="rounded-lg bg-[#2F73D9] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#245DB3]"
            >
              Nuevo proveedor
            </Link>
          </div>
        </div>

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_220px]">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Buscar proveedor
              </label>
              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Razón social, RUC/DNI, contacto o correo"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm shadow-sm outline-none focus:border-[#2F73D9]"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Estado
              </label>
              <select
                value={estadoFiltro}
                onChange={(e) => setEstadoFiltro(e.target.value)}
                className={selectClassName}
              >
                <option value="todos">Todos</option>
                <option value="activo">activo</option>
                <option value="inactivo">inactivo</option>
              </select>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {cargando ? (
            <p className="p-6 text-sm text-slate-500">Cargando proveedores...</p>
          ) : proveedoresFiltrados.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">
              No hay proveedores registrados.
            </p>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-6 py-3 text-left font-semibold">
                        Proveedor
                      </th>
                      <th className="px-6 py-3 text-left font-semibold">
                        Documento
                      </th>
                      <th className="px-6 py-3 text-left font-semibold">
                        Contacto principal
                      </th>
                      <th className="px-6 py-3 text-left font-semibold">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-right font-semibold">
                        Acción
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {proveedoresFiltrados.map((proveedor) => (
                      <tr
                        key={proveedor.id}
                        className="border-t border-slate-100"
                      >
                        <td className="px-6 py-4">
                          <p className="font-semibold text-[#102033]">
                            {textoSiExiste(proveedor.razon_social) || "Proveedor pendiente"}
                          </p>
                          {tipoProveedor(proveedor) ? (
                            <p className="mt-1 text-xs text-slate-500">
                              {tipoProveedor(proveedor)}
                            </p>
                          ) : null}
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {documentoProveedor(proveedor) || "Pendiente"}
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {textoSiExiste(proveedor.contacto_nombre) ||
                            textoSiExiste(proveedor.contacto_celular) ||
                            textoSiExiste(proveedor.contacto_correo) ? (
                            <>
                              {textoSiExiste(proveedor.contacto_nombre) ? (
                                <p className="font-medium text-[#102033]">
                                  {proveedor.contacto_nombre}
                                </p>
                              ) : null}
                              {textoSiExiste(proveedor.contacto_celular) ? (
                                <p className="mt-1 text-xs">
                                  {proveedor.contacto_celular}
                                </p>
                              ) : null}
                              {textoSiExiste(proveedor.contacto_correo) ? (
                                <p className="mt-1 text-xs">
                                  {proveedor.contacto_correo}
                                </p>
                              ) : null}
                            </>
                          ) : (
                            <span className="text-slate-400">Sin contacto</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${estadoBadgeClass(proveedor.estado || "pendiente")}`}>
                            {formatearEstado(proveedor.estado || "pendiente")}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/proveedores/${proveedor.id}`}
                            className="font-semibold text-[#2F73D9] hover:text-[#245DB3]"
                          >
                            Ver detalle
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-1 gap-4 p-4 md:hidden">
                {proveedoresFiltrados.map((proveedor) => (
                  <article
                    key={proveedor.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="font-bold text-[#102033]">
                          {textoSiExiste(proveedor.razon_social) || "Proveedor pendiente"}
                        </h2>
                        {tipoProveedor(proveedor) ? (
                          <p className="mt-1 text-sm text-slate-500">
                            {tipoProveedor(proveedor)}
                          </p>
                        ) : null}
                      </div>

                      <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${estadoBadgeClass(proveedor.estado || "pendiente")}`}>
                        {formatearEstado(proveedor.estado || "pendiente")}
                      </span>
                    </div>

                    <div className="mt-4 space-y-2 text-sm text-slate-600">
                      <p>
                        <b>Documento:</b> {documentoProveedor(proveedor) || "Pendiente"}
                      </p>
                      {textoSiExiste(proveedor.contacto_nombre) ? (
                        <p>
                          <b>Contacto:</b> {proveedor.contacto_nombre}
                        </p>
                      ) : null}
                      {textoSiExiste(proveedor.contacto_celular) ? (
                        <p>
                          <b>Celular:</b> {proveedor.contacto_celular}
                        </p>
                      ) : null}
                      {textoSiExiste(proveedor.contacto_correo) ? (
                        <p>
                          <b>Correo:</b> {proveedor.contacto_correo}
                        </p>
                      ) : null}
                      {!textoSiExiste(proveedor.contacto_nombre) &&
                        !textoSiExiste(proveedor.contacto_celular) &&
                        !textoSiExiste(proveedor.contacto_correo) ? (
                        <p className="text-slate-400">Sin contacto</p>
                      ) : null}
                    </div>

                    <Link
                      href={`/proveedores/${proveedor.id}`}
                      className="mt-5 block w-full rounded-lg border border-slate-300 py-2 text-center font-semibold text-[#102033] hover:bg-slate-50"
                    >
                      Ver detalle
                    </Link>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>

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
