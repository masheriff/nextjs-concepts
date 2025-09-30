"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { InvoiceForm } from "@/components/invoices/invoice-form";
import { InvoiceFormSkeleton } from "@/components/invoices/invoice-form-skeleton";
import { InvoiceFormValues } from "@/schema/invoice";

interface InvoiceItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  price: string;
}

interface Invoice {
  id: number;
  customerId: number;
  status: "pending" | "paid" | "cancelled";
  items: InvoiceItem[];
}

export default function EditInvoicePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const response = await fetch(`/api/invoices/${id}`);

        if (!response.ok) {
          toast.error(
            response.status === 404
              ? "Invoice not found"
              : "Failed to fetch invoice"
          );
          router.push("/invoices");
          return;
        }

        const data = await response.json();
        setInvoice(data);
      } catch (error) {
        console.error("Error fetching invoice:", error);
        toast.error("Failed to load invoice data");
        router.push("/invoices");
      }
    };

    fetchInvoice();
  }, [id, router]);

  const handleSubmit = async (data: InvoiceFormValues) => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
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
          toast.error(result.error || "Failed to update invoice");
        }
        return;
      }

      toast.success("Invoice updated successfully!", {
        description: `Invoice #${result.id} has been updated.`,
      });

      setTimeout(() => router.push("/invoices"), 1500);
    } catch (error) {
      console.error("Error updating invoice:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Edit Invoice"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Invoices", href: "/invoices" },
          { label: `#${id}`, href: `/invoices/${id}` },
          { label: "Edit" },
        ]}
      />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="mx-auto w-full max-w-4xl">
          <div className="rounded-lg border bg-card p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold">Edit Invoice</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Update the invoice details below.
              </p>
            </div>
            {!invoice ? (
              <InvoiceFormSkeleton />
            ) : (
              <InvoiceForm
                onSubmit={handleSubmit}
                isLoading={isLoading}
                defaultValues={{
                  customerId: invoice.customerId,
                  status: invoice.status,
                  items: invoice.items.map((item) => ({
                    productId: item.productId,
                    productName: item.productName,
                    quantity: item.quantity,
                    price: item.price,
                  })),
                }}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}