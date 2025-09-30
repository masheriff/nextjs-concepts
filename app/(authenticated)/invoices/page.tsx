"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/page-header";
import { useDebounce } from "@/hooks/use-debounce";
import { Invoice, invoiceColumns } from "@/components/invoices/columns";

export default function InvoicesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<Invoice[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = 10;
  const searchFromUrl = searchParams.get("search") || "";

  const [searchInput, setSearchInput] = useState(searchFromUrl);
  const debouncedSearch = useDebounce(searchInput, 500);

  useEffect(() => {
    setSearchInput(searchFromUrl);
  }, [searchFromUrl]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());

    if (debouncedSearch) {
      params.set("search", debouncedSearch);
    } else {
      params.delete("search");
    }

    if (debouncedSearch !== searchFromUrl) {
      router.push(`?${params.toString()}`);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    const fetchInvoices = async () => {
      setLoading(true);
      try {
        const page = parseInt(searchParams.get("page") || "1");
        const offset = (page - 1) * pageSize;
        const search = searchParams.get("search") || "";

        const response = await fetch(
          `/api/invoices?search=${encodeURIComponent(search)}&limit=${pageSize}&offset=${offset}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch invoices");
        }

        const result = await response.json();
        setData(result.data);
        setTotal(result.pagination.total);
      } catch (error) {
        console.error("Error fetching invoices:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [searchParams.toString()]);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);

    if (page !== 1 && value !== searchFromUrl) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", "1");
      router.replace(`?${params.toString()}`);
    }
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`?${params.toString()}`);
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <>
      <PageHeader
        title="Invoices"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Invoices" },
        ]}
      />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <DataTable
          columns={invoiceColumns}
          data={data}
          searchValue={searchInput}
          onSearchChange={handleSearchChange}
          currentPage={page}
          totalPages={totalPages}
          totalItems={total}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          loading={loading}
          addButtonLabel="Add Invoice"
          addButtonHref="/invoices/add"
        />
      </div>
    </>
  );
}