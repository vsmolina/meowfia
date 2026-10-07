import { Column, Row, Section, Text } from "@react-email/components";
import { EmailButton, EmailLayout, emailStyles as s } from "./layout";

export function AbandonedCartEmail({ items, recoverUrl, unsubscribeUrl }: { items: { name: string; priceCents: number }[]; recoverUrl: string; unsubscribeUrl?: string }) {
  return (
    <EmailLayout preview="Your supply crate is waiting at the depot" unsubscribeUrl={unsubscribeUrl} fileNo="AWOL">
      <Text style={s.h1}>Soldier, you left gear at the depot</Text>
      <Text style={s.p}>Your cart is saved and ready to deploy. Your cat is waiting (impatiently, from inside an empty box).</Text>
      <Section style={{ background: "#efe6d2", padding: "10px 16px", borderRadius: 6 }}>
        {items.map((i, k) => (
          <Row key={k}>
            <Column style={{ ...s.p, margin: "4px 0" }}>{i.name}</Column>
            <Column align="right" style={{ ...s.p, margin: "4px 0" }}>
              ${(i.priceCents / 100).toFixed(2)}
            </Column>
          </Row>
        ))}
      </Section>
      <Section style={{ margin: "20px 0" }}>
        <EmailButton href={recoverUrl}>Return to my cart</EmailButton>
      </Section>
      <Text style={s.small}>Questions about a template or kit? Just reply to this email.</Text>
    </EmailLayout>
  );
}
