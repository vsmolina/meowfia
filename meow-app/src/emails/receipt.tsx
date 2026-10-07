import { Column, Row, Section, Text } from "@react-email/components";
import { EmailButton, EmailLayout, emailStyles as s } from "./layout";

export type ReceiptLine = { name: string; quantity: number; totalCents: number };
const money = (c: number) => `$${(c / 100).toFixed(2)}`;

export function ReceiptEmail({
  orderNumber,
  lines,
  totals,
  downloads,
  shipping,
  accountUrl,
}: {
  orderNumber: number;
  lines: ReceiptLine[];
  totals: { label: string; cents: number }[];
  downloads: { name: string; url: string }[];
  shipping: boolean;
  accountUrl: string;
}) {
  return (
    <EmailLayout preview={`Order #${orderNumber} confirmed${downloads.length ? ". Your downloads are inside" : ""}`} fileNo={String(orderNumber)}>
      <Text style={s.h1}>Requisition #{orderNumber} approved</Text>
      <Text style={s.p}>Thank you for supporting the motor pool! Here&apos;s your receipt.</Text>

      {downloads.length > 0 && (
        <>
          <Text style={s.h2}>Your templates</Text>
          {downloads.map((d) => (
            <Section key={d.url} style={{ margin: "0 0 10px" }}>
              <Text style={{ ...s.p, margin: "0 0 6px" }}>
                <b>{d.name}</b>
              </Text>
              <EmailButton href={d.url}>Download</EmailButton>
            </Section>
          ))}
          <Text style={s.small}>Links last 7 days. Your templates live in your account forever. Sign in with this email at {accountUrl}.</Text>
        </>
      )}

      <Text style={s.h2}>Order summary</Text>
      {lines.map((l, i) => (
        <Row key={i}>
          <Column style={{ ...s.p, margin: 0 }}>
            {l.quantity > 1 ? `${l.quantity}× ` : ""}
            {l.name}
          </Column>
          <Column align="right" style={{ ...s.p, margin: 0 }}>
            {money(l.totalCents)}
          </Column>
        </Row>
      ))}
      <Section style={{ borderTop: "1px dashed #cbbb98", marginTop: 10, paddingTop: 8 }}>
        {totals.map((t) => (
          <Row key={t.label}>
            <Column style={{ ...s.small, margin: 0, fontWeight: t.label === "Total" ? 700 : 400 }}>{t.label}</Column>
            <Column align="right" style={{ ...s.small, margin: 0, fontWeight: t.label === "Total" ? 700 : 400 }}>
              {t.cents < 0 ? `−${money(-t.cents)}` : money(t.cents)}
            </Column>
          </Row>
        ))}
      </Section>
      {shipping && <Text style={{ ...s.p, marginTop: 16 }}>Physical items ship within 2–4 business days. We&apos;ll email tracking when your package deploys.</Text>}
    </EmailLayout>
  );
}
