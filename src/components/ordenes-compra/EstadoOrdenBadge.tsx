type Props = {
  estado: string;
};

function formatearEstado(estado: string) {
  if (estado === "borrador") return "Borrador";
  if (estado === "pendiente_aprobacion") return "Pendiente de aprobación";
  if (estado === "pendiente_factura") return "Pendiente de factura";
  if (estado === "factura_parcial") return "Facturación parcial";
  if (estado === "factura_completa") return "Completamente facturada";
  if (estado === "factura_recibida") return "Factura recibida";
  if (estado === "en_conformidad") return "En conformidad";
  if (estado === "aprobada") return "Aprobada";
  if (estado === "pagos_programados") return "Pagos programados";
  if (estado === "finalizada") return "Finalizada";
  if (estado === "anulada") return "Anulada";

  return estado?.replaceAll("_", " ");
}

function estadoClass(estado: string) {
  if (estado === "aprobada") {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (estado === "finalizada") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (estado === "factura_completa") {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (estado === "factura_parcial") {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }

  if (estado === "factura_recibida") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (estado === "pagos_programados") {
    return "border-sky-200 bg-sky-50 text-sky-700";
  }

  if (estado === "en_conformidad") {
    return "border-purple-200 bg-purple-50 text-purple-700";
  }

  if (
    estado === "pendiente_aprobacion" ||
    estado === "pendiente_factura"
  ) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (estado === "anulada") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-600";
}

export default function EstadoOrdenBadge({ estado }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${estadoClass(
        estado
      )}`}
    >
      {formatearEstado(estado)}
    </span>
  );
}