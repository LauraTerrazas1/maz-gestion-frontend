import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from "@react-pdf/renderer";

type PagoHistorial = {
  pago_id?: string | null;
  monto_pagado: number;
  fecha_pago?: string | null;
  metodo_pago?: string | null;
  numero_operacion?: string | null;
  estado_pago?: string | null;
  observaciones_pago?: string | null;
};

type ProgramacionHistorial = {
  programacion_id: string;
  tipo_destino?: string | null;
  tipo_programacion?: string | null;
  monto_programado: number;
  fecha_programada?: string | null;
  estado_programacion?: string | null;
  observaciones_programacion?: string | null;
  pago?: PagoHistorial | null;
};

type FacturaHistorial = {
  factura_id: string;
  factura: string;
  fecha_emision?: string | null;
  total: number;
  moneda?: string | null;
  estado_factura?: string | null;
  estado_detraccion?: string | null;
  monto_detraccion?: number;
  conformidad?: {
    conformidad_id?: string | null;
    estado?: string | null;
    revisado_por?: string | null;
    fecha_revision?: string | null;
    observaciones?: string | null;
  } | null;
  programaciones?: ProgramacionHistorial[];
};

type Props = {
  orden: {
    numero_oc: string;
    moneda: string;

    proveedores?: {
      razon_social?: string | null;
      documento?: string | null;
    } | null;

    eventos?: {
      nombre?: string | null;
      cliente?: string | null;
    } | null;

    resumen_pagos?: {
      total_oc: number;
      total_pagado: number;
      total_programado_pendiente: number;
      saldo_pendiente: number;
      saldo_sin_programar: number;
    };

    historial_financiero?: {
      facturas?: FacturaHistorial[];
    };
  };
};

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 8.5,
    color: "#102033",
  },

  titulo: {
    fontSize: 18,
    fontWeight: 700,
  },

  subtitulo: {
    marginTop: 4,
    fontSize: 9,
    color: "#64748B",
  },

  section: {
    marginTop: 18,
  },

  sectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    marginBottom: 8,
    textTransform: "uppercase",
  },

  infoRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingVertical: 5,
  },

  label: {
    width: "32%",
    color: "#64748B",
  },

  value: {
    width: "68%",
    fontWeight: 700,
  },

  facturaBox: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 5,
    marginBottom: 12,
    padding: 10,
  },

  facturaTitulo: {
    fontSize: 10,
    fontWeight: 700,
    marginBottom: 7,
  },

  tablaHeader: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderBottomWidth: 1,
    borderBottomColor: "#CBD5E1",
    paddingVertical: 5,
  },

  tablaRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingVertical: 5,
  },

  colFecha: { width: "14%" },
  colDestino: { width: "16%" },
  colMonto: { width: "14%", textAlign: "right" },
  colMetodo: { width: "16%" },
  colOperacion: { width: "18%" },
  colEstado: { width: "22%" },

  resumenGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  resumenBox: {
    width: "48%",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    padding: 9,
    borderRadius: 5,
  },

  resumenLabel: {
    fontSize: 7.5,
    color: "#64748B",
    textTransform: "uppercase",
  },

  resumenValue: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: 700,
  },

  footer: {
    position: "absolute",
    bottom: 16,
    left: 30,
    right: 30,
    fontSize: 7,
    color: "#94A3B8",
    textAlign: "center",
  },
});

function dinero(
  valor: number | string | null | undefined,
  moneda = "PEN"
) {
  const numero = Number(valor || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return moneda === "USD"
    ? `US$ ${numero}`
    : `S/ ${numero}`;
}

function fecha(valor?: string | null) {
  if (!valor) return "-";

  const soloFecha = valor.slice(0, 10);
  const [year, month, day] = soloFecha.split("-");

  return `${day}/${month}/${year}`;
}

function texto(valor?: string | null) {
  if (!valor) return "-";

  return valor
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letra) => letra.toUpperCase());
}

export default function ResumenFinancieroOcPdf({
  orden,
}: Props) {
  const facturas =
    orden.historial_financiero?.facturas || [];

  const resumen = orden.resumen_pagos;

  const totalOc = Number(resumen?.total_oc || 0);
  const totalPagado = Number(
    resumen?.total_pagado || 0
  );

  const porcentajePagado =
    totalOc > 0
      ? (totalPagado / totalOc) * 100
      : 0;

  return (
    <Document
      title={`Resumen financiero ${orden.numero_oc}`}
      author="MAZ Producciones"
    >
      <Page size="A4" style={styles.page}>
        <Text style={styles.titulo}>
          Resumen financiero de Orden de Compra
        </Text>

        <Text style={styles.subtitulo}>
          Estado actualizado de {orden.numero_oc}
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Datos generales
          </Text>

          <View style={styles.infoRow}>
            <Text style={styles.label}>
              Orden de compra
            </Text>
            <Text style={styles.value}>
              {orden.numero_oc}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>
              Proveedor
            </Text>
            <Text style={styles.value}>
              {orden.proveedores?.razon_social ||
                "No registrado"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>
              RUC / Documento
            </Text>
            <Text style={styles.value}>
              {orden.proveedores?.documento ||
                "No registrado"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>
              Evento
            </Text>
            <Text style={styles.value}>
              {orden.eventos?.nombre ||
                "No registrado"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>
              Cliente
            </Text>
            <Text style={styles.value}>
              {orden.eventos?.cliente ||
                "No registrado"}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Facturación, conformidad y pagos
          </Text>

          {facturas.length === 0 ? (
            <Text>
              Esta OC todavía no tiene facturas asociadas.
            </Text>
          ) : (
            facturas.map((factura) => (
              <View
                key={factura.factura_id}
                style={styles.facturaBox}
                wrap={false}
              >
                <Text style={styles.facturaTitulo}>
                  Factura {factura.factura || "-"}
                </Text>

                <View style={styles.infoRow}>
                  <Text style={styles.label}>
                    Fecha emisión
                  </Text>
                  <Text style={styles.value}>
                    {fecha(factura.fecha_emision)}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.label}>
                    Total factura
                  </Text>
                  <Text style={styles.value}>
                    {dinero(
                      factura.total,
                      factura.moneda || orden.moneda
                    )}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.label}>
                    Estado factura
                  </Text>
                  <Text style={styles.value}>
                    {texto(factura.estado_factura)}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.label}>
                    Detracción
                  </Text>
                  <Text style={styles.value}>
                    {factura.estado_detraccion ===
                    "detectada"
                      ? `${dinero(
                          factura.monto_detraccion,
                          factura.moneda ||
                            orden.moneda
                        )} - Detectada`
                      : texto(
                          factura.estado_detraccion
                        )}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.label}>
                    Conformidad
                  </Text>
                  <Text style={styles.value}>
                    {factura.conformidad
                      ? `${texto(
                          factura.conformidad.estado
                        )} - ${factura.conformidad.revisado_por || "Sin revisor"} - ${fecha(
                          factura.conformidad.fecha_revision
                        )}`
                      : "Sin conformidad"}
                  </Text>
                </View>

                <View style={{ marginTop: 10 }}>
                  <View style={styles.tablaHeader}>
                    <Text style={styles.colFecha}>
                      Programado
                    </Text>
                    <Text style={styles.colDestino}>
                      Destino
                    </Text>
                    <Text style={styles.colMonto}>
                      Monto
                    </Text>
                    <Text style={styles.colMetodo}>
                      Método
                    </Text>
                    <Text style={styles.colOperacion}>
                      Operación
                    </Text>
                    <Text style={styles.colEstado}>
                      Estado
                    </Text>
                  </View>

                  {(factura.programaciones || [])
                    .length === 0 ? (
                    <Text
                      style={{
                        paddingVertical: 7,
                        color: "#64748B",
                      }}
                    >
                      Sin programaciones registradas.
                    </Text>
                  ) : (
                    factura.programaciones?.map(
                      (programacion) => (
                        <View
                          key={
                            programacion.programacion_id
                          }
                          style={styles.tablaRow}
                        >
                          <Text style={styles.colFecha}>
                            {fecha(
                              programacion.fecha_programada
                            )}
                          </Text>

                          <Text style={styles.colDestino}>
                            {texto(
                              programacion.tipo_destino
                            )}
                          </Text>

                          <Text style={styles.colMonto}>
                            {dinero(
                              programacion.monto_programado,
                              factura.moneda ||
                                orden.moneda
                            )}
                          </Text>

                          <Text style={styles.colMetodo}>
                            {programacion.pago
                              ? texto(
                                  programacion.pago
                                    .metodo_pago
                                )
                              : "-"}
                          </Text>

                          <Text style={styles.colOperacion}>
                            {programacion.pago
                              ?.numero_operacion || "-"}
                          </Text>

                          <Text style={styles.colEstado}>
                            {programacion.pago
                              ? `${texto(
                                  programacion.pago
                                    .estado_pago
                                )} / ${fecha(
                                  programacion.pago
                                    .fecha_pago
                                )}`
                              : texto(
                                  programacion.estado_programacion
                                )}
                          </Text>
                        </View>
                      )
                    )
                  )}
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Estado actual de la OC
          </Text>

          <View style={styles.resumenGrid}>
            <View style={styles.resumenBox}>
              <Text style={styles.resumenLabel}>
                Total OC
              </Text>
              <Text style={styles.resumenValue}>
                {dinero(
                  resumen?.total_oc,
                  orden.moneda
                )}
              </Text>
            </View>

            <View style={styles.resumenBox}>
              <Text style={styles.resumenLabel}>
                Total pagado
              </Text>
              <Text style={styles.resumenValue}>
                {dinero(
                  resumen?.total_pagado,
                  orden.moneda
                )}
              </Text>
            </View>

            <View style={styles.resumenBox}>
              <Text style={styles.resumenLabel}>
                Programado pendiente
              </Text>
              <Text style={styles.resumenValue}>
                {dinero(
                  resumen?.total_programado_pendiente,
                  orden.moneda
                )}
              </Text>
            </View>

            <View style={styles.resumenBox}>
              <Text style={styles.resumenLabel}>
                Saldo sin programar
              </Text>
              <Text style={styles.resumenValue}>
                {dinero(
                  resumen?.saldo_sin_programar,
                  orden.moneda
                )}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>
              Saldo pendiente total
            </Text>
            <Text style={styles.value}>
              {dinero(
                resumen?.saldo_pendiente,
                orden.moneda
              )}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>
              Porcentaje pagado
            </Text>
            <Text style={styles.value}>
              {porcentajePagado.toFixed(2)}%
            </Text>
          </View>
        </View>

        <Text style={styles.footer}>
          MAZ Producciones - Resumen financiero actualizado
        </Text>
      </Page>
    </Document>
  );
}