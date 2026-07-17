type Props = {
  subtotal: number;
  igv: number;
  total: number;
  moneda?: string;
};

function moneda(valor: number, tipo: string) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: tipo === "USD" ? "USD" : "PEN",
    minimumFractionDigits: 2,
  }).format(Number(valor || 0));
}

export default function ResumenTotalesOC({
  subtotal,
  igv,
  total,
  moneda: tipoMoneda = "PEN",
}: Props) {
  return (
    <div className="ml-auto w-full max-w-sm rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between py-2 text-sm text-slate-600">
        <span>Subtotal</span>
        <span className="font-semibold text-[#102033]">
          {moneda(subtotal, tipoMoneda)}
        </span>
      </div>

      <div className="flex items-center justify-between border-t border-slate-200 py-2 text-sm text-slate-600">
        <span>IGV</span>
        <span className="font-semibold text-[#102033]">
          {moneda(igv, tipoMoneda)}
        </span>
      </div>

      <div className="flex items-center justify-between border-t border-slate-200 pt-3">
        <span className="text-sm font-bold text-[#102033]">Total</span>
        <span className="text-xl font-bold text-[#2F73D9]">
          {moneda(total, tipoMoneda)}
        </span>
      </div>
    </div>
  );
}