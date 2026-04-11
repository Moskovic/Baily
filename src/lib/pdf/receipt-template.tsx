import {
  Document,
  Image,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

export type ReceiptPdfData = {
  owner: {
    full_name: string;
    address: string | null;
    signature_data_url?: string | null;
  };
  tenant: {
    full_name: string;
    email: string;
  };
  property: {
    label: string;
    address: string;
    postal_code: string;
    city: string;
  };
  period: { month: number; year: number };
  rent_amount: number;
  charges_amount: number;
  payment_date: string;
};

const MONTHS = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontSize: 11,
    fontFamily: "Helvetica",
    color: "#111",
    lineHeight: 1.5,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  brand: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.5,
  },
  muted: { color: "#666" },
  block: { marginBottom: 18 },
  label: {
    fontSize: 9,
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    marginTop: 12,
    marginBottom: 24,
  },
  table: {
    borderTop: "1 solid #e5e5e5",
    borderBottom: "1 solid #e5e5e5",
    paddingVertical: 12,
    marginVertical: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  total: {
    fontFamily: "Helvetica-Bold",
    fontSize: 13,
    borderTop: "1 solid #e5e5e5",
    paddingTop: 10,
    marginTop: 10,
  },
  paragraph: { marginBottom: 12, textAlign: "justify" },
  signatureBlock: {
    marginTop: 28,
    alignItems: "flex-end",
  },
  signatureLabel: {
    fontSize: 9,
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  signatureImage: {
    width: 220,
    height: 90,
    objectFit: "contain",
  },
  signatureName: {
    fontSize: 10,
    color: "#444",
    marginTop: 4,
  },
  footer: {
    marginTop: 40,
    fontSize: 9,
    color: "#888",
    textAlign: "center",
  },
});

function formatEuro(n: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(n);
}

function formatDateFr(s: string) {
  const d = new Date(s);
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function ReceiptPdf({ data }: { data: ReceiptPdfData }) {
  const total = Number(data.rent_amount) + Number(data.charges_amount);
  const monthLabel = `${MONTHS[data.period.month - 1]} ${data.period.year}`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.brand}>Quittance de loyer</Text>
            <Text style={styles.muted}>Période : {monthLabel}</Text>
          </View>
          <View>
            <Text>{formatDateFr(data.payment_date)}</Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 32 }}>
          <View style={[styles.block, { flex: 1 }]}>
            <Text style={styles.label}>Bailleur</Text>
            <Text>{data.owner.full_name}</Text>
            {data.owner.address && <Text>{data.owner.address}</Text>}
          </View>
          <View style={[styles.block, { flex: 1 }]}>
            <Text style={styles.label}>Locataire</Text>
            <Text>{data.tenant.full_name}</Text>
            <Text style={styles.muted}>{data.tenant.email}</Text>
          </View>
        </View>

        <View style={styles.block}>
          <Text style={styles.label}>Bien loué</Text>
          <Text>{data.property.label}</Text>
          <Text style={styles.muted}>
            {data.property.address}, {data.property.postal_code} {data.property.city}
          </Text>
        </View>

        <Text style={styles.title}>Reçu pour solde de tout compte — {monthLabel}</Text>

        <Text style={styles.paragraph}>
          Je soussigné(e) {data.owner.full_name}, propriétaire du logement
          désigné ci-dessus, déclare avoir reçu de {data.tenant.full_name} la
          somme de {formatEuro(total)} au titre du loyer et des charges pour la
          période de {monthLabel}, et lui en donne quittance sous réserve de
          tous mes droits.
        </Text>

        <View style={styles.table}>
          <View style={styles.row}>
            <Text>Loyer hors charges</Text>
            <Text>{formatEuro(Number(data.rent_amount))}</Text>
          </View>
          <View style={styles.row}>
            <Text>Charges</Text>
            <Text>{formatEuro(Number(data.charges_amount))}</Text>
          </View>
          <View style={[styles.row, styles.total]}>
            <Text>Total payé</Text>
            <Text>{formatEuro(total)}</Text>
          </View>
        </View>

        <Text style={styles.paragraph}>
          Fait pour servir et valoir ce que de droit.
        </Text>

        {data.owner.signature_data_url ? (
          <View style={styles.signatureBlock}>
            <Text style={styles.signatureLabel}>Signature du bailleur</Text>
            <Image
              src={data.owner.signature_data_url}
              style={styles.signatureImage}
            />
            <Text style={styles.signatureName}>{data.owner.full_name}</Text>
          </View>
        ) : null}

        <Text style={styles.footer}>
          Document généré par Baily · {formatDateFr(new Date().toISOString())}
        </Text>
      </Page>
    </Document>
  );
}
