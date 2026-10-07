import { Section, Text } from "@react-email/components";
import { EmailButton, EmailLayout, emailStyles as s } from "./layout";

export function GiftCardEmail({ code, amountCents, fromName, recipientName, message, shopUrl }: { code: string; amountCents: number; fromName: string; recipientName?: string | null; message?: string | null; shopUrl: string }) {
  return (
    <EmailLayout preview={`${fromName} sent you a $${(amountCents / 100).toFixed(0)} supply voucher`} fileNo="GIFT">
      <Text style={s.h1}>Incoming supply drop{recipientName ? `, ${recipientName}` : ""}!</Text>
      <Text style={s.p}>
        {fromName} sent you a <b>${(amountCents / 100).toFixed(2)}</b> gift card for cardboard war machines, pre-cut kits, and merch.
      </Text>
      {message && <Text style={{ ...s.p, fontStyle: "italic", borderLeft: "3px solid #4b5320", paddingLeft: 12 }}>&ldquo;{message}&rdquo;</Text>}
      <Section style={{ background: "#efe6d2", border: "2px dashed #1f2113", padding: "16px", textAlign: "center", margin: "16px 0" }}>
        <Text style={s.mono}>Voucher code</Text>
        <Text style={{ fontFamily: "'Courier New', monospace", fontSize: 26, fontWeight: 700, letterSpacing: 3, margin: 0 }}>{code}</Text>
      </Section>
      <EmailButton href={shopUrl}>Start shopping</EmailButton>
      <Text style={s.small}>Enter the code in your cart. Gift cards never expire, and any remaining balance stays on the code.</Text>
    </EmailLayout>
  );
}
