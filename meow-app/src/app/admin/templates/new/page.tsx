import { AdminPage } from "@/components/admin/ui";
import { TemplateForm } from "@/components/admin/template-form";

export const metadata = { title: "New template" };

export default function NewTemplate() {
  return (
    <AdminPage title="New template">
      <TemplateForm />
    </AdminPage>
  );
}
