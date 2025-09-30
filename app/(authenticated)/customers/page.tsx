"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DataTable } from "@/components/ui/data-table";
import { customerColumns, Customer } from "@/components/customers/columns";
import { PageHeader } from "@/components/page-header";
import { useDebounce } from "@/hooks/use-debounce";

export default function CustomersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Get current values from URL
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = 10;
  const searchFromUrl = searchParams.get("search") || "";

  // Local state for search input (for instant UI feedback while typing)
  const [searchInput, setSearchInput] = useState(searchFromUrl);

  // Debounced version of search input
  const debouncedSearch = useDebounce(searchInput, 500);

  // Sync search input with URL when URL changes (e.g., browser back/forward)
  useEffect(() => {
    setSearchInput(searchFromUrl);
  }, [searchFromUrl]);

  // Update URL when debounced search changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());

    if (debouncedSearch) {
      params.set("search", debouncedSearch);
    } else {
      params.delete("search");
    }

    // Only update if different from current URL
    if (debouncedSearch !== searchFromUrl) {
      router.push(`?${params.toString()}`);
    }
  }, [debouncedSearch]); // Only depend on debouncedSearch

  // Fetch data whenever URL params change
  // Fetch data whenever URL params change
useEffect(() => {
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const page = parseInt(searchParams.get("page") || "1");
      const offset = (page - 1) * pageSize;
      const search = searchParams.get("search") || "";

      const response = await fetch(
        `/api/customers?search=${encodeURIComponent(search)}&limit=${pageSize}&offset=${offset}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch customers");
      }

      const result = await response.json();
      setData(result.data);
      setTotal(result.pagination.total);
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  };

  fetchCustomers();
}, [searchParams.toString()]); // ✅ only track URL params


  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    
    // Reset to page 1 immediately when user starts typing
    // This prevents the page 2 issue
    if (page !== 1 && value !== searchFromUrl) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", "1");
      router.replace(`?${params.toString()}`); // Use replace to avoid adding to history
    }
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
      />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <DataTable
          columns={customerColumns}
          data={data}
          searchValue={searchInput}
          onSearchChange={handleSearchChange}
          currentPage={page}
          totalPages={totalPages}
          totalItems={total}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          loading={loading}
          addButtonLabel="Add Customer"
          addButtonHref="/customers/add"
        />
      </div>
    </>
  );
}