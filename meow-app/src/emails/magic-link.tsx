import { Section, Text } from "@react-email/components";
import { EmailButton, EmailLayout, emailStyles as s } from "./layout";

export function MagicLinkEmail({ url }: { url: string }) {
  return (
    <EmailLayout preview="Your sign-in link (valid for 24 hours)" fileNo="AUTH">
      <Text style={s.h1}>Clearance granted</Text>
      <Text style={s.p}>Tap the button below to sign in. This link works once and expires in 24 hours.</Text>
      <Section style={{ margin: "20px 0" }}>
        <EmailButton href={url}>Sign in</EmailButton>
      </Section>
      <Text style={s.small}>If you didn&apos;t request this, you can safely ignore this email. Nobody gets in without the link.</Text>
    </EmailLayout>
  );
}
