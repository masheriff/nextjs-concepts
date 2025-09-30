"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { InvoiceForm } from "@/components/invoices/invoice-form";
import { InvoiceFormValues } from "@/schema/invoice";

export default function AddInvoicePage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (data: InvoiceFormValues) => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 400 && result.details) {
          const errorMessages = result.details
            .map((issue: any) => issue.message)
            .join(", ");
          toast.error(`Validation Error: ${errorMessages}`);
        } else {
          toast.error(result.error || "Failed to create invoice");
        }
        return;
      }

      toast.success("Invoice created successfully!", {
        description: `Invoice #${result.id} has been created.`,
      });

      setTimeout(() => {
        router.push("/invoices");
      }, 1500);
    } catch (error) {
      console.error("Error creating invoice:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Add Invoice"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Invoices", href: "/invoices" },
          { label: "Add" },
        ]}
      />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="mx-auto w-full max-w-4xl">
          <div className="rounded-lg border bg-card p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold">Invoice Information</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Fill in the details below to create a new invoice.
              </p>
            </div>
            <InvoiceForm onSubmit={handleSubmit} isLoading={isLoading} />
          </div>
        </div>
      </div>
    </>
  );
}