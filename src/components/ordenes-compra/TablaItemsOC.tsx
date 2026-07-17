export type ItemOC = {
  id?: string;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
};

type Props = {
  items: ItemOC[];
  editable?: boolean;
  onEditar?: (index: number, campo: keyof ItemOC, valor: string) => void;
  onEliminar?: (index: number) => void;
};

function moneda(valor: number) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(Number(valor || 0));
}

export default function TablaItemsOC({
  items,
  editable = false,
  onEditar,
  onEliminar,
}: Props) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Descripción</th>
              <th className="px-4 py-3 text-center">Cantidad</th>
              <th className="px-4 py-3 text-right">Precio unitario</th>
              <th className="px-4 py-3 text-right">Subtotal</th>
              {editable && <th className="px-4 py-3 text-right">Acción</th>}
            </tr>
          </thead>

          <tbody>
            {items.length === 0 ? (
              <tr>
                <td
                  colSpan={editable ? 5 : 4}
                  className="px-4 py-8 text-center text-slate-500"
                >
                  No hay ítems registrados.
                </td>
              </tr>
            ) : (
              items.map((item, index) => (
                <tr key={item.id || index} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    {editable ? (
                      <input
                        value={item.descripcion}
                        onChange={(event) =>
                          onEditar?.(index, "descripcion", event.target.value)
                        }
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-[#2F73D9]"
                      />
                    ) : (
                      <span className="font-medium text-[#102033]">
                        {item.descripcion}
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-center">
                    {editable ? (
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={item.cantidad === 0 ? "" : String(item.cantidad)}
                        onChange={(event) =>
                          onEditar?.(index, "cantidad", event.target.value)
                        }
                        onBlur={(event) => {
                          const valor = Number(event.currentTarget.value || 0);
                          onEditar?.(index, "cantidad", String(valor));
                        }}
                        onWheel={(event) => event.currentTarget.blur()}
                        onKeyDown={(event) => {
                          if (event.key === "ArrowUp" || event.key === "ArrowDown") {
                            event.preventDefault();
                          }
                        }}
                        className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-center outline-none focus:border-[#2F73D9]"
                      />
                    ) : (
                      item.cantidad
                    )}
                  </td>

                  <td className="px-4 py-3 text-right">
                    {editable ? (
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          item.precio_unitario === 0
                            ? ""
                            : String(item.precio_unitario)
                        }
                        onChange={(event) =>
                          onEditar?.(
                            index,
                            "precio_unitario",
                            event.target.value
                          )
                        }
                        onBlur={(event) => {
                          const valor = Number(event.currentTarget.value || 0);
                          onEditar?.(index, "precio_unitario", String(valor));
                        }}
                        onWheel={(event) => event.currentTarget.blur()}
                        onKeyDown={(event) => {
                          if (event.key === "ArrowUp" || event.key === "ArrowDown") {
                            event.preventDefault();
                          }
                        }}
                        className="w-32 rounded-lg border border-slate-200 px-3 py-2 text-right outline-none focus:border-[#2F73D9]"
                      />
                    ) : (
                      moneda(item.precio_unitario)
                    )}
                  </td>

                  <td className="px-4 py-3 text-right font-semibold text-[#102033]">
                    {moneda(item.subtotal)}
                  </td>

                  {editable && (
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => onEliminar?.(index)}
                        className="text-sm font-semibold text-red-600 hover:text-red-700"
                      >
                        Eliminar
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}