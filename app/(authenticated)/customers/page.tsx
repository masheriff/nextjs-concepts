import { PageHeader } from "@/components/page-header";

export default function CustomersPage() {
  return (
    <>
      <PageHeader
        title="Customers"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Customers" }]}
      ></PageHeader>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        Customers Page
      </div>
    </>
  );
}
