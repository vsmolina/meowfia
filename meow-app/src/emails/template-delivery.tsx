import { Section, Text } from "@react-email/components";
import { EmailButton, EmailLayout, emailStyles as s } from "./layout";

/** Sent when someone claims a free template */
export function TemplateDeliveryEmail({ templateName, downloadUrl, accountUrl }: { templateName: string; downloadUrl: string; accountUrl: string }) {
  return (
    <EmailLayout preview={`${templateName} is ready to download`} fileNo="DLV">
      <Text style={s.h1}>Requisition approved</Text>
      <Text style={s.p}>
        <b>{templateName}</b> is ready. Grab it in US Letter or A4. Print at 100% scale and check the 1-inch square on page 1 before cutting.
      </Text>
      <Section style={{ margin: "20px 0" }}>
        <EmailButton href={downloadUrl}>Download template</EmailButton>
      </Section>
      <Text style={s.small}>
        This link expires in 7 days. Your templates are always in your account: sign in with this email at {accountUrl}.
      </Text>
    </EmailLayout>
  );
}
