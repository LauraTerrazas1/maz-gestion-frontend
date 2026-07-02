"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import MainLayout from "@/components/layout/MainLayout";
import Toast from "@/components/ui/Toast";
import type { ToastTipo } from "@/components/ui/Toast";
import { apiFetch } from "@/lib/api";

type Pago = {
  id: string;
  origen: string;
  tipo_pago: string;
  metodo_pago: string;
  monto: number | string;
  fecha_programada: string | null;
  fecha_real_pago: string | null;
  estado: string;
  eventos?: {
    nombre: string | null;
    cliente: string | null;
  };
  proveedores?: {
    razon_social: string | null;
  };
  evento_proveedores?: {
    servicio: string | null;
  };
  personal_eventual_grupos?: {
    cargo_funcion: string | null;
    cantidad_personas: number | null;
  };
  comprobantes_pago?: {
    id: string;
    archivo_nombre: string | null;
  }[];
};

type ComprobanteUrl = {
  archivo_nombre?: string;
  tipo_archivo?: string;
  signed_url?: string;
};

function moneda(valor: number | string) {
  return Number(valor || 0).toLocaleString("es-PE", {
    style: "currency",
    currency: "PEN",
  });
}

function valor(v?: string | null) {
  return v && v.trim() !== "" ? v : "No registrado";
}

export default function HistorialPagosPage() {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [toast, setToast] = useState<{ tipo: ToastTipo; mensaje: string } | null>(null);

  async function cargarPagos() {
    try {
      const data = await apiFetch("/pagos/");
      setPagos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando historial de pagos:", error);
      setPagos([]);
    }
  }

  useEffect(() => {
    void cargarPagos();
  }, []);

  async function handleVerComprobante(pagoId: string) {
    const ventana = window.open("about:blank", "_blank");

    try {
      const data = (await apiFetch(`/pagos/${pagoId}/comprobante-url`)) as ComprobanteUrl;

      if (!data.signed_url) {
        ventana?.close();
        setToast({ tipo: "info", mensaje: "Este pago no tiene comprobante adjunto." });
        return;
      }

      if (ventana) ventana.location.href = data.signed_url;
      else window.open(data.signed_url, "_blank");
    } catch {
      ventana?.close();
      setToast({ tipo: "error", mensaje: "No se pudo abrir el comprobante." });
    }
  }

  const pagosHistorial = pagos
    .filter((pago) => {
      const tieneComprobante =
        pago.comprobantes_pago && pago.comprobantes_pago.length > 0;

      return pago.estado === "pagado" && tieneComprobante;
    })
    .filter((pago) => {
      const texto = `${pago.eventos?.nombre || ""} ${
        pago.proveedores?.razon_social || ""
      } ${pago.personal_eventual_grupos?.cargo_funcion || ""} ${
        pago.tipo_pago || ""
      } ${pago.metodo_pago || ""}`.toLowerCase();

      return texto.includes(busqueda.toLowerCase());
    });

  return (
    <MainLayout>
      <main className="min-h-screen bg-[#F6F8FB] p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#102033]">
              Historial de pagos
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Pagos cerrados correctamente con comprobante adjunto.
            </p>
          </div>

          <Link
            href="/pagos"
            className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-[#102033] shadow-sm hover:bg-slate-50"
          >
            ← Volver a pagos
          </Link>
        </div>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por evento, proveedor, personal o método..."
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#2F73D9]"
          />
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {pagosHistorial.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">
              No hay pagos cerrados en el historial.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-6 py-3 text-left">Origen</th>
                    <th className="px-6 py-3 text-left">Proveedor / Personal</th>
                    <th className="px-6 py-3 text-left">Evento</th>
                    <th className="px-6 py-3 text-left">Información</th>
                    <th className="px-6 py-3 text-right">Monto</th>
                    <th className="px-6 py-3 text-left">Fecha pago</th>
                    <th className="px-6 py-3 text-right">Comprobante</th>
                  </tr>
                </thead>

                <tbody>
                  {pagosHistorial.map((pago) => (
                    <tr key={pago.id} className="border-t border-slate-100">
                      <td className="px-6 py-4">
                        <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                          {pago.origen}
                        </span>
                      </td>

                      <td className="px-6 py-4 font-semibold text-[#102033]">
                        {pago.origen === "personal_eventual"
                          ? valor(pago.personal_eventual_grupos?.cargo_funcion)
                          : valor(pago.proveedores?.razon_social)}
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {valor(pago.eventos?.nombre)}
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {pago.origen === "personal_eventual"
                          ? `${pago.personal_eventual_grupos?.cantidad_personas ?? 0} personas / ${valor(pago.metodo_pago)}`
                          : `${valor(pago.evento_proveedores?.servicio)} / ${valor(pago.metodo_pago)}`}
                      </td>

                      <td className="px-6 py-4 text-right font-bold text-[#102033]">
                        {moneda(pago.monto)}
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {valor(pago.fecha_real_pago || pago.fecha_programada)}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleVerComprobante(pago.id)}
                          className="font-semibold text-[#2F73D9] hover:text-[#245DB3]"
                        >
                          Ver comprobante
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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