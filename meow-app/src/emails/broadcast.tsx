import { Img, Section, Text } from "@react-email/components";
import { EmailButton, EmailLayout, emailStyles as s } from "./layout";

/**
 * Broadcast body format (kept simple for the admin composer):
 *  - Blank lines separate paragraphs
 *  - A line "[button: Label](https://url)" becomes a button
 *  - A line "![alt](https://image-url)" becomes an image
 *  - "## Heading" becomes a heading
 */
export function BroadcastEmail({ subject, previewText, body, unsubscribeUrl }: { subject: string; previewText?: string | null; body: string; unsubscribeUrl: string }) {
  const blocks = body.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  return (
    <EmailLayout preview={previewText || subject} unsubscribeUrl={unsubscribeUrl}>
      <Text style={s.h1}>{subject}</Text>
      {blocks.map((b, i) => {
        const btn = b.match(/^\[button:\s*(.+?)\]\((https?:\/\/[^\s)]+)\)$/i);
        if (btn) return <Section key={i} style={{ margin: "18px 0" }}><EmailButton href={btn[2]}>{btn[1]}</EmailButton></Section>;
        const img = b.match(/^!\[(.*?)\]\((https?:\/\/[^\s)]+)\)$/);
        if (img) return <Img key={i} src={img[2]} alt={img[1]} width="512" style={{ maxWidth: "100%", borderRadius: 6, margin: "12px 0" }} />;
        if (b.startsWith("## ")) return <Text key={i} style={s.h2}>{b.slice(3)}</Text>;
        return <Text key={i} style={{ ...s.p, whiteSpace: "pre-line" }}>{b}</Text>;
      })}
    </EmailLayout>
  );
}
