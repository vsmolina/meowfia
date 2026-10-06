import { requireAdmin } from "@/lib/auth-helpers";
import { FileTag } from "@/components/brand/stamp";

// The full dashboard is built in Phase 6.
export default async function AdminHome() {
  const admin = await requireAdmin();
  return (
    <div>
      <FileTag>Command center</FileTag>
      <h1 className="font-stencil text-4xl text-olive-dark">Admin HQ</h1>
      <p className="mt-2 text-muted-foreground">Welcome, {admin.name ?? admin.email}.</p>
    </div>
  );
}
