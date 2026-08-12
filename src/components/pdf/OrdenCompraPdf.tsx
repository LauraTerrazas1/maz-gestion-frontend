import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";

const logoUrl =
  "https://yoqporwshbseefndrtuu.supabase.co/storage/v1/object/public/logo/Logo%20MAZ.jpeg";

type ItemOC = {
  id: string;
  descripcion: string;
  cantidad: number | string;
  precio_unitario: number | string;
  subtotal: number | string;
};

export type OrdenCompraPdfData = {
  numero_oc: string;
  fecha_emision: string;
  fecha_requerida?: string | null;

  participacion_evento?: string | null;
  lugar_entrega?: string | null;

  moneda: string;
  condiciones_pago?: string | null;
  porcentaje_max_adelanto?: number | string | null;
  observaciones?: string | null;

  porcentaje_igv: number | string;
  subtotal: number | string;
  igv: number | string;
  total: number | string;

  eventos?: {
    nombre?: string | null;
    fecha_inicio?: string | null;
    ubicacion?: string | null;
  } | null;

  proveedores?: {
    razon_social?: string | null;
    documento?: string | null;
    direccion?: string | null;
    contacto_nombre?: string | null;
    contacto_celular?: string | null;
    contacto_correo?: string | null;
  } | null;

  evento_proveedores?: {
    servicio?: string | null;
  } | null;

  orden_compra_items?: ItemOC[];
};

type Props = {
  orden: OrdenCompraPdfData;
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingBottom: 28,
    paddingHorizontal: 30,
    fontSize: 8.5,
    color: "#102033",
    backgroundColor: "#FFFFFF",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#CDE9BC",
    paddingBottom: 14,
    marginBottom: 16,
  },

  companyBlock: {
    flexDirection: "row",
    width: "66%",
  },

  logo: {
    width: 70,
    height: 70,
    objectFit: "contain",
    marginRight: 14,
  },

  companyInfo: {
    flexGrow: 1,
  },

  companyName: {
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 6,
  },

  companyLine: {
    fontSize: 8.5,
    marginBottom: 3,
    color: "#425466",
  },

  orderBlock: {
    width: "30%",
    borderWidth: 1,
    borderColor: "#CDE9BC",
    backgroundColor: "#F3FAEF",
    padding: 10,
    alignItems: "flex-end",
  },

  orderLabel: {
    fontSize: 8,
    color: "#2F73D9",
    fontWeight: 700,
    marginBottom: 5,
  },

  orderNumber: {
    fontSize: 15,
    fontWeight: 700,
    marginBottom: 6,
  },

  section: {
    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 9,
    fontWeight: 700,
    textTransform: "uppercase",
    backgroundColor: "#EFF8EB",
    color: "#315B25",
    paddingVertical: 5,
    paddingHorizontal: 7,
    borderLeftWidth: 3,
    borderLeftColor: "#78B94A",
  },

  dataTable: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#D8E0E8",
  },

  dataRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#D8E0E8",
    minHeight: 20,
  },

  dataLabel: {
    width: "31%",
    backgroundColor: "#F7FAF5",
    paddingVertical: 5,
    paddingHorizontal: 7,
    fontWeight: 700,
    color: "#3F6632",
  },

  dataValue: {
    width: "69%",
    paddingVertical: 5,
    paddingHorizontal: 7,
  },

  conditionsRow: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#D8E0E8",
    marginBottom: 14,
  },

  conditionCell: {
    width: "25%",
    minHeight: 46,
    padding: 7,
    borderRightWidth: 1,
    borderRightColor: "#D8E0E8",
  },

  conditionCellLast: {
    width: "25%",
    minHeight: 46,
    padding: 7,
  },

  conditionLabel: {
    fontSize: 7.5,
    fontWeight: 700,
    color: "#3F6632",
    marginBottom: 5,
    textTransform: "uppercase",
  },

  conditionValue: {
    fontSize: 8.5,
    lineHeight: 1.25,
  },

  itemsTable: {
    borderWidth: 1,
    borderColor: "#D8E0E8",
  },

  itemsHeader: {
    flexDirection: "row",
    backgroundColor: "#EFF8EB",
    borderBottomWidth: 1,
    borderBottomColor: "#D8E0E8",
  },

  itemRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#D8E0E8",
    minHeight: 22,
  },

  itemDescription: {
    width: "52%",
    paddingVertical: 6,
    paddingHorizontal: 7,
  },

  itemQuantity: {
    width: "13%",
    paddingVertical: 6,
    paddingHorizontal: 7,
    textAlign: "center",
    borderLeftWidth: 1,
    borderLeftColor: "#D8E0E8",
  },

  itemPrice: {
    width: "17.5%",
    paddingVertical: 6,
    paddingHorizontal: 7,
    textAlign: "right",
    borderLeftWidth: 1,
    borderLeftColor: "#D8E0E8",
  },

  itemTotal: {
    width: "17.5%",
    paddingVertical: 6,
    paddingHorizontal: 7,
    textAlign: "right",
    borderLeftWidth: 1,
    borderLeftColor: "#D8E0E8",
  },

  headerText: {
    fontSize: 7.5,
    fontWeight: 700,
    color: "#315B25",
    textTransform: "uppercase",
  },

  totalsWrapper: {
    alignItems: "flex-end",
    marginTop: 10,
    marginBottom: 14,
  },

  totalsBox: {
    width: "42%",
    borderWidth: 1,
    borderColor: "#D8E0E8",
  },

  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#D8E0E8",
  },

  finalTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: "#EFF8EB",
  },

  totalLabel: {
    fontWeight: 700,
  },

  finalTotalLabel: {
    fontSize: 9,
    fontWeight: 700,
    color: "#24491C",
  },

  finalTotalValue: {
    fontSize: 11,
    fontWeight: 700,
    color: "#1E6B2D",
  },

  observations: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#D8E0E8",
    padding: 8,
    lineHeight: 1.35,
  },
  requisitosBox: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#BFC7D1",
    paddingTop: 10,
  },

  requisitosTitulo: {
    fontSize: 8,
    fontWeight: 700,
    marginBottom: 6,
  },

  requisito: {
    fontSize: 7.5,
    lineHeight: 1.5,
    marginBottom: 4,
    textAlign: "justify",
  },

  footer: {
    position: "absolute",
    bottom: 14,
    left: 30,
    right: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7,
    color: "#7A8795",
  },
});

function fecha(fechaValor?: string | null) {
  if (!fechaValor) return "No registrada";

  const [year, month, day] = fechaValor.split("-");
  return `${day}/${month}/${year}`;
}

function dinero(
  valor: number | string | null | undefined,
  moneda: string
) {
  const numero = Number(valor || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return moneda === "USD"
    ? `US$ ${numero}`
    : `S/ ${numero}`;
}

function DataRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.dataRow}>
      <Text style={styles.dataLabel}>{label}</Text>
      <Text style={styles.dataValue}>{value}</Text>
    </View>
  );
}

export default function OrdenCompraPdf({ orden }: Props) {
  const items = orden.orden_compra_items || [];

  return (
    <Document
      title={orden.numero_oc}
      author="MAZ Producciones"
      subject="Orden de Compra"
    >
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.header} fixed>
          <View style={styles.companyBlock}>
            <Image src={logoUrl} style={styles.logo} />

            <View style={styles.companyInfo}>
              <Text style={styles.companyName}>
                MAZ PRODUCCIONES Y MAZ S.A.C.
              </Text>

              <Text style={styles.companyLine}>
                R.U.C.: 20601664934
              </Text>

              <Text style={styles.companyLine}>
                Calle Madrid 436, Interior B
              </Text>

              <Text style={styles.companyLine}>
                Miraflores - Lima
              </Text>

              <Text style={styles.companyLine}>
                contabilidad@mazproducciones.com
              </Text>
            </View>
          </View>

          <View style={styles.orderBlock}>
            <Text style={styles.orderLabel}>
              ORDEN DE COMPRA
            </Text>

            <Text style={styles.orderNumber}>
              {orden.numero_oc}
            </Text>

            <Text>
              Fecha de emisión: {fecha(orden.fecha_emision)}
            </Text>
          </View>
        </View>

        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>
            Datos del proveedor
          </Text>

          <View style={styles.dataTable}>
            <DataRow
              label="Razón social"
              value={
                orden.proveedores?.razon_social ||
                "No registrada"
              }
            />

            <DataRow
              label="RUC / Documento"
              value={
                orden.proveedores?.documento ||
                "No registrado"
              }
            />

            <DataRow
              label="Dirección"
              value={
                orden.proveedores?.direccion ||
                "No registrada"
              }
            />

            <DataRow
              label="Contacto"
              value={
                orden.proveedores?.contacto_nombre ||
                "No registrado"
              }
            />

            <DataRow
              label="Correo"
              value={
                orden.proveedores?.contacto_correo ||
                "No registrado"
              }
            />

            <DataRow
              label="Teléfono"
              value={
                orden.proveedores?.contacto_celular ||
                "No registrado"
              }
            />
          </View>
        </View>

        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>
            Datos del evento
          </Text>

          <View style={styles.dataTable}>
            <DataRow
              label="Nombre del evento"
              value={
                orden.eventos?.nombre || "No registrado"
              }
            />

            <DataRow
              label="Participación del evento"
              value={
                orden.participacion_evento ||
                orden.evento_proveedores?.servicio ||
                "No registrada"
              }
            />

            <DataRow
              label="Fecha del evento"
              value={fecha(orden.eventos?.fecha_inicio)}
            />

            <DataRow
              label="Bien / Servicio"
              value="SERVICIO"
            />
          </View>
        </View>

        <View style={styles.conditionsRow} wrap={false}>
          <View style={styles.conditionCell}>
            <Text style={styles.conditionLabel}>
              Lugar de entrega
            </Text>
            <Text style={styles.conditionValue}>
              {orden.lugar_entrega ||
                orden.eventos?.ubicacion ||
                "No registrado"}
            </Text>
          </View>

          <View style={styles.conditionCell}>
            <Text style={styles.conditionLabel}>
              Condición de pago
            </Text>
            <Text style={styles.conditionValue}>
              {orden.condiciones_pago || "No registrada"}
            </Text>
          </View>

          <View style={styles.conditionCell}>
            <Text style={styles.conditionLabel}>
              Moneda
            </Text>
            <Text style={styles.conditionValue}>
              {orden.moneda === "USD"
                ? "DÓLARES"
                : "SOLES"}
            </Text>
          </View>

          <View style={styles.conditionCellLast}>
            <Text style={styles.conditionLabel}>
              Fecha requerida
            </Text>
            <Text style={styles.conditionValue}>
              {fecha(orden.fecha_requerida)}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Descripción del bien / servicio
          </Text>

          <View style={styles.itemsTable}>
            <View style={styles.itemsHeader} fixed>
              <Text
                style={[
                  styles.itemDescription,
                  styles.headerText,
                ]}
              >
                Descripción
              </Text>

              <Text
                style={[
                  styles.itemQuantity,
                  styles.headerText,
                ]}
              >
                Cantidad
              </Text>

              <Text
                style={[
                  styles.itemPrice,
                  styles.headerText,
                ]}
              >
                Precio unitario
              </Text>

              <Text
                style={[
                  styles.itemTotal,
                  styles.headerText,
                ]}
              >
                Precio total
              </Text>
            </View>

            {items.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <Text style={styles.itemDescription}>
                  {item.descripcion}
                </Text>

                <Text style={styles.itemQuantity}>
                  {Number(item.cantidad)}
                </Text>

                <Text style={styles.itemPrice}>
                  {dinero(
                    item.precio_unitario,
                    orden.moneda
                  )}
                </Text>

                <Text style={styles.itemTotal}>
                  {dinero(item.subtotal, orden.moneda)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.totalsWrapper} wrap={false}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                Valor de compra (sin IGV)
              </Text>
              <Text>
                {dinero(orden.subtotal, orden.moneda)}
              </Text>
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                IGV (
                {Number(
                  orden.porcentaje_igv || 0
                ).toFixed(2)}
                %)
              </Text>
              <Text>
                {dinero(orden.igv, orden.moneda)}
              </Text>
            </View>

            <View style={styles.finalTotalRow}>
              <Text style={styles.finalTotalLabel}>
                Precio de compra
              </Text>

              <Text style={styles.finalTotalValue}>
                {dinero(orden.total, orden.moneda)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>
            Observaciones
          </Text>

          <Text style={styles.observations}>
            {orden.observaciones ||
              "No se registraron observaciones."}
          </Text>
        </View>
        <View style={styles.requisitosBox} wrap={false}>
          <Text style={styles.requisitosTitulo}>
            Para el trámite de su Factura, debe tener en cuenta los siguientes requisitos:
          </Text>

          <Text style={styles.requisito}>
            1. El proveedor deberá emitir su Factura o Recibo por Honorarios Electrónico
            (RHE) dentro de los tres (3) días calendario siguientes a la recepción de la
            presente Orden de Compra.
          </Text>

          <Text style={styles.requisito}>
            2. Los ítems e importes de la Factura deben ser los mismos que la Orden de
            Compra o Servicio.
          </Text>

          <Text style={styles.requisito}>
            3. Enviar al correo contabilidad@mazproducciones.com la Orden de Compra y la
            Factura/RHE en un solo archivo PDF. Asimismo, si la factura está sujeta al
            Sistema de Pago de Obligaciones Tributarias (SPOT), deberá incluir el número
            de cuenta del Banco de la Nación, el código de detracción del bien o servicio
            y el porcentaje correspondiente. La factura que no presente esta información
            no será recibida.
          </Text>

          <Text style={styles.requisito}>
            4. Si el importe de la Factura corresponde a un adelanto, este no deberá
            exceder el{" "}
            <Text style={{ fontWeight: 700 }}>
              {Number(orden.porcentaje_max_adelanto ?? 60).toFixed(0)}%
            </Text>{" "}
            del monto total presupuestado.
          </Text>

          <Text style={styles.requisito}>
            5. Los plazos de pago se darán según lo estipulado en las condiciones de pago
            que figuran en el cuadro superior de la presente Orden de Compra o Servicio.
          </Text>
        </View>

        <View style={styles.footer} fixed>
          <Text>MAZ Producciones</Text>

          <Text
            render={({ pageNumber, totalPages }) =>
              `Página ${pageNumber} de ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}