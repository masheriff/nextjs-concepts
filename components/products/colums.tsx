"use client";

import { ColumnDef } from "@tanstack/react-table";
import { formatDistanceToNow } from "date-fns";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TableUserDisplay } from "@/components/table-user-display";
import { toZonedTime } from "date-fns-tz";

export type Product = {
  id: number;
  name: string;
  description: string | null;
  price: string;
  createdAt: string;
  updatedAt: string;
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

// Actions Cell Component
function ActionsCell({ product }: { product: Product }) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEdit = () => {
    router.push(`/products/${product.id}/edit`);
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);

      const response = await fetch(`/api/products/${product.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const result = await response.json();
        toast.error(result.error || "Failed to delete product");
        return;
      }

      // Close dialog
      setShowDeleteDialog(false);

      // Show success toast
      toast.success("Product deleted successfully", {
        description: `${product.name} has been removed from the database.`,
      });

      // Refresh the router cache and revalidate
      window.location.reload();
    } catch (error) {
      console.error("Error deleting product:", error);

      // Show error toast
      toast.error("Failed to delete product", {
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete{" "}
              <span className="font-semibold">{product.name}</span> from the
              database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export const productColumns: ColumnDef<Product>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => {
      const description = row.original.description;
      if (!description) return "—";
      return description.length > 50
        ? `${description.substring(0, 50)}...`
        : description;
    },
  },
  {
    accessorKey: "price",
    header: "Price",
    cell: ({ row }) => {
      const price = parseFloat(row.original.price);
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
      }).format(price);
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => {
      try {
        const utcDate = new Date(row.original.createdAt);
        const kolkataDate = toZonedTime(
          utcDate,
          process.env.TIMEZONE || "Asia/Kolkata"
        );
        return formatDistanceToNow(kolkataDate, { addSuffix: true });
      } catch {
        return "—";
      }
    },
  },
  {
    accessorKey: "updatedAt",
    header: "Updated At",
    cell: ({ row }) => {
      try {
        const utcDate = new Date(row.original.updatedAt);
        const kolkataDate = toZonedTime(
          utcDate,
          process.env.TIMEZONE || "Asia/Kolkata"
        );
        return formatDistanceToNow(kolkataDate, { addSuffix: true });
      } catch {
        return "—";
      }
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
    cell: ({ row }) => <ActionsCell product={row.original} />,
  },
];