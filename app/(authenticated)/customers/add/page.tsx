"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { CustomerForm } from "@/components/customer-form";
import { z } from "zod";
import { customerSchema } from "@/schema/customer";

type CustomerFormValues = z.infer<typeof customerSchema>;

export default function AddCustomerPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (data: CustomerFormValues) => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle validation errors
        if (response.status === 400 && result.details) {
          const errorMessages = result.details
            .map((issue: any) => issue.message)
            .join(", ");
          toast.error(`Validation Error: ${errorMessages}`);
        } else if (response.status === 409) {
          // Duplicate email error
          toast.error(result.error || "A customer with this email already exists");
        } else {
          toast.error(result.error || "Failed to create customer");
        }
        return;
      }

      // Success
      toast.success("Customer created successfully!", {
        description: `${result.name} has been added to your customer list.`,
      });

      // Redirect to customers list or dashboard after a short delay
      setTimeout(() => {
        router.push("/customers");
      }, 1500);
    } catch (error) {
      console.error("Error creating customer:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Add Customer"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Customers", href: "/customers" },
          { label: "Add" },
        ]}
      />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="mx-auto w-full max-w-2xl">
          <div className="rounded-lg border bg-card p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold">Customer Information</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Fill in the details below to add a new customer to your system.
              </p>
            </div>
            <CustomerForm onSubmit={handleSubmit} isLoading={isLoading} />
          </div>
        </div>
      </div>
    </>
  );
}