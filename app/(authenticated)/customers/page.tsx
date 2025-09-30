"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DataTable } from "@/components/ui/data-table";
import { customerColumns, Customer } from "@/components/customers/columns";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/page-header";

export default function CustomersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = 10;

  // Fetch customers data
  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      try {
        const offset = (page - 1) * pageSize;
        const response = await fetch(
          `/api/customers?search=${encodeURIComponent(
            search
          )}&limit=${pageSize}&offset=${offset}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch customers");
        }

        const result = await response.json();
        setData(result.data);
        setTotal(result.total);
      } catch (error) {
        console.error("Error fetching customers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, [search, page, pageSize]);

  // Handle search change
  const handleSearchChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set("search", value);
    } else {
      params.delete("search");
    }

    // Reset to page 1 when searching
    params.set("page", "1");

    router.push(`?${params.toString()}`);
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`?${params.toString()}`);
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <>
      <PageHeader
        title="Customers"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Customers" },
        ]}
      ></PageHeader>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <DataTable
          columns={customerColumns}
          data={data}
          searchValue={search}
          onSearchChange={handleSearchChange}
          currentPage={page}
          totalPages={totalPages}
          totalItems={total}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          loading={loading}
        />
      </div>
    </>
  );
}
