"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { toZonedTime } from "date-fns-tz";
import { TableUserDisplay } from "../table-user-display";
import { formatIndianCurrency, formatRelativeTime } from "@/lib/utils";
import { StatusBadge } from "./status-badge";

export type Invoice = {
  id: number;
  customerId: number;
  customerName: string;
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
};

const statusColors = {
  pending:
    "bg-yellow-100 text-yellow-800 border-1 border-yellow-100 hover:bg-yellow-100",
  paid: "bg-green-100 text-green-800 border-1 border-green-100 hover:bg-green-100",
  cancelled: "bg-red-100 text-red-800 border-1 border-red-100 hover:bg-red-100",
};

const statusLabels = {
  pending: "Pending",
  paid: "Paid",
  cancelled: "Cancelled",
};

function ActionsCell({ invoice }: { invoice: Invoice }) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this invoice?")) {
      return;
    }

    try {
      const response = await fetch(`/api/invoices/${invoice.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "Failed to delete invoice");
        return;
      }

      toast.success("Invoice deleted successfully");
      router.refresh();
    } catch (error) {
      console.error("Error deleting invoice:", error);
      toast.error("An unexpected error occurred");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/invoices/${invoice.id}`} className="cursor-pointer">
            <Eye className="mr-2 h-4 w-4" />
            View
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            href={`/invoices/${invoice.id}/edit`}
            className="cursor-pointer"
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleDelete}
          className="text-destructive focus:text-destructive cursor-pointer"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const invoiceColumns: ColumnDef<Invoice>[] = [
  {
    accessorKey: "id",
    header: "Invoice #",
    cell: ({ row }) => {
      const id = row.getValue("id") as number;
      return <div className="font-medium">#{id}</div>;
    },
  },
  {
    accessorKey: "customerName",
    header: "Customer",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      return <StatusBadge status={row.getValue("status")} />;
    },
  },
  {
    accessorKey: "total",
    header: "Total",
    cell: ({ row }) => {
      return formatIndianCurrency(parseFloat(row.getValue("total")));
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => {
      return formatRelativeTime(new Date(row.original.createdAt));
    },
  },
  {
    accessorKey: "updatedAt",
    header: "Updated At",
    cell: ({ row }) => {
      return formatRelativeTime(new Date(row.original.updatedAt));
    },
  },
  {
    accessorKey: "createdBy",
    header: "Created By",
    cell: ({ row }) => <TableUserDisplay user={row.original.createdBy} />,
  },
  {
    accessorKey: "updatedBy",
    header: "Updated By",
    cell: ({ row }) => <TableUserDisplay user={row.original.updatedBy} />,
  },
  {
    id: "actions",
    cell: ({ row }) => <ActionsCell invoice={row.original} />,
  },
];
