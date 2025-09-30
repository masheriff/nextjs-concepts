"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { z } from "zod";
import { productSchema } from "@/schema/product";
import { ProductForm } from "@/components/products/product-form";
import { ProductFormSkeleton } from "@/components/products/product-form-skeleton";

type ProductFormValues = z.infer<typeof productSchema>;

interface Product extends ProductFormValues {
  id: number;
}

export default function EditProductPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`/api/products/${id}`);

        if (!response.ok) {
          toast.error(
            response.status === 404 
              ? "Product not found" 
              : "Failed to fetch product"
          );
          router.push("/products");
          return;
        }

        const data = await response.json();
        setProduct(data);
      } catch (error) {
        console.error("Error fetching product:", error);
        toast.error("Failed to load product data");
        router.push("/products");
      }
    };

    fetchProduct();
  }, [id, router]);

  const handleSubmit = async (data: ProductFormValues) => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/products/${id}`, {
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
          toast.error(result.error || "Failed to update product");
        }
        return;
      }

      toast.success("Product updated successfully!", {
        description: `${result.name}'s information has been updated.`,
      });

      setTimeout(() => router.push("/products"), 1500);
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Edit Product"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Products", href: "/products" },
          { label: "Edit" },
        ]}
      />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="mx-auto w-full max-w-2xl">
          <div className="rounded-lg border bg-card p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold">
                Edit Product Information
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                Update the product details below.
              </p>
            </div>
            {product ? (
              <ProductForm
                onSubmit={handleSubmit}
                isLoading={isLoading}
                defaultValues={{
                  name: product.name,
                  description: product.description,
                  price: product.price,
                }}
              />
            ) : (
              <ProductFormSkeleton />
            )}
          </div>
        </div>
      </div>
    </>
  );
}