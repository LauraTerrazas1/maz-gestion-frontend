"use client";

import { useEffect } from "react";

export type ToastTipo = "success" | "error" | "info";

type ToastProps = {
  tipo: ToastTipo;
  mensaje: string;
  onClose: () => void;
};

function toastClass(tipo: ToastTipo) {
  if (tipo === "success") {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (tipo === "error") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-blue-200 bg-blue-50 text-blue-700";
}

export default function Toast({ tipo, mensaje, onClose }: ToastProps) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, 3000);

    return () => window.clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      role="status"
      className={`fixed right-4 top-4 z-50 max-w-sm rounded-xl border px-4 py-3 text-sm font-semibold shadow-lg ${toastClass(
        tipo
      )}`}
    >
      <div className="flex items-start gap-3">
        <span className="leading-5">{mensaje}</span>
        <button
          type="button"
          onClick={onClose}
          className="ml-auto text-base leading-5 opacity-70 hover:opacity-100"
          aria-label="Cerrar notificacion"
        >
          x
        </button>
      </div>
    </div>
  );
}
