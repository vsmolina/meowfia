import { Img, Section, Text } from "@react-email/components";
import { EmailButton, EmailLayout, emailStyles as s } from "./layout";

export function DropAnnouncementEmail({ name, tagline, imageUrl, url, early, unsubscribeUrl }: { name: string; tagline: string; imageUrl: string; url: string; early?: boolean; unsubscribeUrl?: string }) {
  return (
    <EmailLayout preview={early ? `Members: ${name} is open to you early` : `${name} just deployed`} unsubscribeUrl={unsubscribeUrl} fileNo="DROP">
      <Text style={s.mono}>{early ? "Members-only early access" : "New drop · now available"}</Text>
      <Text style={s.h1}>{name}</Text>
      <Img src={imageUrl} alt={name} width="512" style={{ maxWidth: "100%", border: "2px solid #1f2113", borderRadius: 6 }} />
      <Text style={{ ...s.p, marginTop: 16 }}>{tagline}</Text>
      {early && <Text style={s.p}>You&apos;ve got a head start before everyone else. Thank you for being a member!</Text>}
      <Section style={{ margin: "20px 0" }}>
        <EmailButton href={url}>{early ? "Get early access" : "Deploy it now"}</EmailButton>
      </Section>
    </EmailLayout>
  );
}
