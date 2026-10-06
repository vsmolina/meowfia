import { Body, Button, Container, Head, Hr, Html, Link, Preview, Section, Text } from "@react-email/components";
import { siteConfig } from "@/config/site";

const c = siteConfig.colors;

export const emailStyles = {
  h1: { fontFamily: "Impact, 'Arial Black', sans-serif", fontSize: "28px", letterSpacing: "1px", color: c.oliveDark, margin: "0 0 12px", textTransform: "uppercase" as const },
  h2: { fontFamily: "Impact, 'Arial Black', sans-serif", fontSize: "20px", color: c.oliveDark, margin: "24px 0 8px", textTransform: "uppercase" as const },
  p: { fontSize: "16px", lineHeight: "26px", color: c.ink, margin: "0 0 14px" },
  small: { fontSize: "13px", lineHeight: "20px", color: "#5a5638" },
  mono: { fontFamily: "'Courier New', monospace", fontSize: "12px", letterSpacing: "2px", color: "#5a5638", textTransform: "uppercase" as const },
};

export function EmailButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Button
      href={href}
      style={{
        background: c.olive,
        color: c.sand,
        padding: "14px 22px",
        borderRadius: "6px",
        fontWeight: 700,
        fontSize: "15px",
        letterSpacing: "1px",
        textTransform: "uppercase",
        border: `2px solid ${c.ink}`,
        boxShadow: `3px 3px 0 ${c.ink}`,
      }}
    >
      {children}
    </Button>
  );
}

export function EmailLayout({
  preview,
  children,
  unsubscribeUrl,
  fileNo,
}: {
  preview: string;
  children: React.ReactNode;
  unsubscribeUrl?: string;
  fileNo?: string;
}) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ background: c.sand, fontFamily: "Helvetica, Arial, sans-serif", margin: 0, padding: "24px 0" }}>
        <Container style={{ maxWidth: "560px", margin: "0 auto", background: "#f8f2e4", border: `2px solid ${c.ink}`, borderRadius: "8px", overflow: "hidden" }}>
          <Section style={{ background: c.olive, padding: "18px 24px" }}>
            <Text style={{ margin: 0, color: c.sand, fontFamily: "Impact, 'Arial Black', sans-serif", fontSize: "22px", letterSpacing: "2px" }}>
              {siteConfig.name.toUpperCase()}
            </Text>
            <Text style={{ margin: 0, color: "#e7d27c", fontFamily: "'Courier New', monospace", fontSize: "11px", letterSpacing: "3px" }}>
              {fileNo ? `FILE NO. ${fileNo} · ` : ""}MISSION BRIEFING
            </Text>
          </Section>
          <Section style={{ padding: "28px 24px 8px" }}>{children}</Section>
          <Hr style={{ borderColor: "#cbbb98", margin: "16px 24px" }} />
          <Section style={{ padding: "0 24px 24px" }}>
            <Text style={emailStyles.small}>
              Sent with love (and packing tape) by {siteConfig.creator.firstName} &amp; the crew ·{" "}
              <Link href={siteConfig.social.tiktok} style={{ color: c.olive }}>
                @{siteConfig.social.tiktokHandle}
              </Link>
            </Text>
            {unsubscribeUrl && (
              <Text style={emailStyles.small}>
                Don&apos;t want these briefings?{" "}
                <Link href={unsubscribeUrl} style={{ color: c.olive }}>
                  Unsubscribe
                </Link>
                .
              </Text>
            )}
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
