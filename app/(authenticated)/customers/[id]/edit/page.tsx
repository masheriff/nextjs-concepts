"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { CustomerForm } from "@/components/customer-form";
import { CustomerFormSkeleton } from "@/components/customer-form-skeleton";
import { z } from "zod";
import { customerSchema } from "@/schema/customer";

type CustomerFormValues = z.infer<typeof customerSchema>;

interface Customer extends CustomerFormValues {
  id: number;
}

export default function EditCustomerPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const response = await fetch(`/api/customers/${id}`);

        if (!response.ok) {
          toast.error(
            response.status === 404 
              ? "Customer not found" 
              : "Failed to fetch customer"
          );
          router.push("/customers");
          return;
        }

        const data = await response.json();
        setCustomer(data);
      } catch (error) {
        console.error("Error fetching customer:", error);
        toast.error("Failed to load customer data");
        router.push("/customers");
      }
    };

    fetchCustomer();
  }, [params.id, router]);

  const handleSubmit = async (data: CustomerFormValues) => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/customers/${params.id}`, {
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
          toast.error(result.error || "Failed to update customer");
        }
        return;
      }

      toast.success("Customer updated successfully!", {
        description: `${result.name}'s information has been updated.`,
      });

      setTimeout(() => router.push("/customers"), 1500);
    } catch (error) {
      console.error("Error updating customer:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Edit Customer"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Customers", href: "/customers" },
          { label: "Edit" },
        ]}
      />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="mx-auto w-full max-w-2xl">
          <div className="rounded-lg border bg-card p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold">Customer Information</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Update the customer details below.
              </p>
            </div>
            
            {!customer ? (
              <CustomerFormSkeleton />
            ) : (
              <CustomerForm
                initialData={{
                  name: customer.name,
                  email: customer.email,
                  phone: customer.phone,
                }}
                onSubmit={handleSubmit}
                isLoading={isLoading}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}