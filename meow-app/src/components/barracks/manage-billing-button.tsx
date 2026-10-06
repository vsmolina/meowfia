import { CreditCard } from "lucide-react";
import { openBillingPortalAction } from "@/actions/billing";
import { Button } from "@/components/ui/button";

export function ManageBillingButton({ label = "Manage billing" }: { label?: string }) {
  return (
    <form action={openBillingPortalAction}>
      <Button type="submit" variant="kraft">
        <CreditCard /> {label}
      </Button>
    </form>
  );
}
