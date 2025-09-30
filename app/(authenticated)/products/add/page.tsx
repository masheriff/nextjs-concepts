"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { z } from "zod";
import { productSchema } from "@/schema/product";
import { ProductForm } from "@/components/products/product-form";

type ProductFormValues = z.infer<typeof productSchema>;

export default function AddProductPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (data: ProductFormValues) => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/products", {
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
        } else {
          toast.error(result.error || "Failed to create product");
        }
        return;
      }

      // Success
      toast.success("Product created successfully!", {
        description: `${result.name} has been added to your product list.`,
      });

      // Redirect to products list after a short delay
      setTimeout(() => {
        router.push("/products");
      }, 1500);
    } catch (error) {
      console.error("Error creating product:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Add Product"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Products", href: "/products" },
          { label: "Add" },
        ]}
      />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="mx-auto w-full max-w-2xl">
          <div className="rounded-lg border bg-card p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold">Product Information</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Fill in the details below to add a new product to your system.
              </p>
            </div>
            <ProductForm onSubmit={handleSubmit} isLoading={isLoading} />
          </div>
        </div>
      </div>
    </>
  );
}