import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { setSubscriptionAction } from "@/actions/unsubscribe";
import { Stamp } from "@/components/brand/stamp";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Email preferences", robots: { index: false } };

export default async function UnsubscribePage({ params }: PageProps<"/unsubscribe/[token]">) {
  const { token } = await params;
  const sub = await db.subscriber.findUnique({ where: { unsubscribeToken: token } });
  if (!sub) {
    return <p className="mx-auto max-w-md px-4 py-20 text-center">This link isn&apos;t valid anymore. You can reply to any email and we&apos;ll remove you manually.</p>;
  }
  const subscribed = sub.status === "SUBSCRIBED";
  async function act(formData: FormData) {
    "use server";
    await setSubscriptionAction(formData);
    revalidatePath(`/unsubscribe/${token}`);
  }
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <Stamp size="lg" color={subscribed ? "olive" : "red"}>{subscribed ? "Subscribed" : "Unsubscribed"}</Stamp>
      <h1 className="mt-6 font-stencil text-3xl text-olive-dark">{subscribed ? "Leave the briefing list?" : "You've been discharged"}</h1>
      <p className="mt-3 text-muted-foreground">
        {subscribed ? `We'll stop sending newsletters and drop alerts to ${sub.email}. Receipts and sign-in emails will still arrive.` : `${sub.email} won't get marketing emails anymore. Changed your mind?`}
      </p>
      <form action={act} className="mt-6">
        <input type="hidden" name="token" value={token} />
        <input type="hidden" name="op" value={subscribed ? "unsubscribe" : "resubscribe"} />
        <Button type="submit" variant={subscribed ? "stamp" : "default"} size="lg">
          {subscribed ? "Unsubscribe" : "Re-enlist (resubscribe)"}
        </Button>
      </form>
    </div>
  );
}
