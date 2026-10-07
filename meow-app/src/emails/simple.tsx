import { Section, Text } from "@react-email/components";
import { EmailButton, EmailLayout, emailStyles as s } from "./layout";

/** Generic branded email for short notifications (tips, commissions, membership, admin alerts) */
export function SimpleEmail({
  preview,
  heading,
  paragraphs,
  cta,
  fileNo,
  unsubscribeUrl,
  details,
}: {
  preview: string;
  heading: string;
  paragraphs: string[];
  cta?: { label: string; href: string };
  fileNo?: string;
  unsubscribeUrl?: string;
  details?: [string, string][];
}) {
  return (
    <EmailLayout preview={preview} fileNo={fileNo} unsubscribeUrl={unsubscribeUrl}>
      <Text style={s.h1}>{heading}</Text>
      {paragraphs.map((p, i) => (
        <Text key={i} style={s.p}>
          {p}
        </Text>
      ))}
      {details && (
        <Section style={{ background: "#efe6d2", padding: "12px 16px", margin: "12px 0", borderRadius: 6 }}>
          {details.map(([k, v]) => (
            <Text key={k} style={{ ...s.small, margin: "2px 0" }}>
              <b>{k}:</b> {v}
            </Text>
          ))}
        </Section>
      )}
      {cta && (
        <Section style={{ margin: "20px 0" }}>
          <EmailButton href={cta.href}>{cta.label}</EmailButton>
        </Section>
      )}
    </EmailLayout>
  );
}
