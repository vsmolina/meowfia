import { Section, Text } from "@react-email/components";
import { siteConfig } from "@/config/site";
import { EmailButton, EmailLayout, emailStyles as s } from "./layout";

/**
 * Welcome series. Step 0 is sent immediately (with the free starter template
 * if they came from the lead magnet). Steps 1 and 2 go out on day 2 and day 5 via cron.
 */
export const WELCOME_SERIES = [
  { step: 0, delayDays: 0 },
  { step: 1, delayDays: 2 },
  { step: 2, delayDays: 5 },
] as const;

export function WelcomeEmail({
  step,
  name,
  downloadUrl,
  templateName,
  siteUrl,
  unsubscribeUrl,
}: {
  step: number;
  name?: string | null;
  downloadUrl?: string;
  templateName?: string;
  siteUrl: string;
  unsubscribeUrl: string;
}) {
  const hi = name ? `Welcome to the unit, ${name}.` : "Welcome to the unit, recruit.";

  if (step === 1) {
    return (
      <EmailLayout preview="Field tips: the 3 things every cardboard build gets wrong" unsubscribeUrl={unsubscribeUrl} fileNo="002">
        <Text style={s.h1}>Field Manual, Chapter 1</Text>
        <Text style={s.p}>Three things that make the difference between a cat-approved vehicle and a box your cat ignores:</Text>
        <Text style={s.p}>
          <b>1. Double-wall cardboard for the floor.</b> Cats test structural integrity by sitting like a loaf. Respect the loaf.
          <br />
          <b>2. Low-temp glue only.</b> No staples, ever. Our Cat Safety page lists approved adhesives.
          <br />
          <b>3. Make the entrance bigger than you think.</b> Dramatic entries are part of the job.
        </Text>
        <Section style={{ margin: "20px 0" }}>
          <EmailButton href={`${siteUrl}/guides`}>Open the Field Manual</EmailButton>
        </Section>
      </EmailLayout>
    );
  }

  if (step === 2) {
    return (
      <EmailLayout preview="Your cat has been selected for promotion" unsubscribeUrl={unsubscribeUrl} fileNo="003">
        <Text style={s.h1}>Ready for a real vehicle?</Text>
        <Text style={s.p}>
          Once the starter build is done, the Fleet is waiting: tanks, fighter planes, and battleships sized for Kittens through full Chonks.
          Bundles save up to 30%.
        </Text>
        <Text style={s.p}>Built something? Post it to the Recruits gallery to earn rank badges for your cat.</Text>
        <Section style={{ margin: "20px 0" }}>
          <EmailButton href={`${siteUrl}/fleet`}>Browse the Fleet</EmailButton>
        </Section>
        <Text style={s.small}>
          P.S. Members of {siteConfig.membership.name} get a members-only template every month and vote on what I build next.
        </Text>
      </EmailLayout>
    );
  }

  return (
    <EmailLayout preview={downloadUrl ? "Your free starter template is inside 📦" : "You're on the list. Welcome aboard."} unsubscribeUrl={unsubscribeUrl} fileNo="001">
      <Text style={s.h1}>{hi}</Text>
      <Text style={s.p}>
        You&apos;re now on the briefing list for {siteConfig.name}. You&apos;ll hear first about new templates, drops, and the occasional cat
        dressed as a fighter pilot.
      </Text>
      {downloadUrl && (
        <>
          <Text style={s.h2}>Your free starter template</Text>
          <Text style={s.p}>
            Here&apos;s <b>{templateName ?? "your starter template"}</b>, in both US Letter and A4. It&apos;s also saved in your account forever
            once you sign in with this email.
          </Text>
          <Section style={{ margin: "20px 0" }}>
            <EmailButton href={downloadUrl}>Download the template</EmailButton>
          </Section>
          <Text style={s.small}>This link expires in 7 days. You can always get a fresh one from your account&apos;s Downloads page.</Text>
        </>
      )}
      <Text style={s.p}>Over and out,<br />{siteConfig.creator.firstName}</Text>
    </EmailLayout>
  );
}
