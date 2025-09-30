"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Loader2 } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableUserDisplay } from "@/components/table-user-display";

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
  customerName: string;
  customerEmail: string;
  status: "pending" | "paid" | "cancelled";
  total: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  } | null;
  updatedBy: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  } | null;
  items: InvoiceItem[];
}

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
  paid: "bg-green-100 text-green-800 hover:bg-green-100",
  cancelled: "bg-red-100 text-red-800 hover:bg-red-100",
};

const statusLabels = {
  pending: "Pending",
  paid: "Paid",
  cancelled: "Cancelled",
};

export default function ViewInvoicePage() {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
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
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [id, router]);

  if (loading) {
    return (
      <>
        <PageHeader
          title="Loading..."
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Invoices", href: "/invoices" },
            { label: "View" },
          ]}
        />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="mx-auto w-full max-w-4xl space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </>
    );
  }

  if (!invoice) {
    return null;
  }

  return (
    <>
      <PageHeader
        title={`Invoice #${invoice.id}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Invoices", href: "/invoices" },
          { label: `#${invoice.id}` },
        ]}
      />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="mx-auto w-full max-w-4xl">
          <div className="rounded-lg border bg-card p-6 space-y-6">
            {/* Header with Edit Button */}
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Invoice Details</h2>
              <Button asChild>
                <Link href={`/invoices/${invoice.id}/edit`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Invoice
                </Link>
              </Button>
            </div>

            {/* Invoice Info */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Customer</p>
                <p className="font-medium">{invoice.customerName}</p>
                <p className="text-sm text-muted-foreground">
                  {invoice.customerEmail}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge
                  variant="outline"
                  className={statusColors[invoice.status]}
                >
                  {statusLabels[invoice.status]}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium">
                  {format(new Date(invoice.createdAt), "MMM dd, yyyy")}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="font-medium">
                  {format(new Date(invoice.updatedAt), "MMM dd, yyyy")}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created By</p>
                <TableUserDisplay user={invoice.createdBy} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Updated By</p>
               <TableUserDisplay user={invoice.updatedBy} />
              </div>
            </div>

            {/* Invoice Items */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Items</h3>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-bold">Product</TableHead>
                      <TableHead className="font-bold">Quantity</TableHead>
                      <TableHead className="font-bold">Price</TableHead>
                      <TableHead className="font-bold">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.items.map((item) => {
                      const subtotal = (
                        parseFloat(item.price) * item.quantity
                      ).toFixed(2);
                      return (
                        <TableRow key={item.id}>
                          <TableCell>{item.productName}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>
                            {new Intl.NumberFormat("en-IN", {
                              style: "currency",
                              currency: "INR",
                            }).format(parseFloat(item.price))}
                          </TableCell>
                          <TableCell>${subtotal}</TableCell>
                        </TableRow>
                      );
                    })}
                    <TableRow>
                      <TableCell colSpan={2}></TableCell>
                      <TableCell>Total</TableCell>
                      <TableCell className="font-bold">
                        {new Intl.NumberFormat("en-IN", {
                          style: "currency",
                          currency: "INR",
                        }).format(parseFloat(invoice.total))}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
