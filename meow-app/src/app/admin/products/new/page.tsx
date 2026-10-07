import { AdminPage } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/product-form";

export const metadata = { title: "New product" };

export default function NewProduct() {
  return (
    <AdminPage title="New product">
      <ProductForm />
    </AdminPage>
  );
}
