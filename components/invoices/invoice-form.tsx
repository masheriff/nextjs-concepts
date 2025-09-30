"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InvoiceItemRow } from "./invoice-item-row";
import { invoiceFormSchema, InvoiceFormValues, InvoiceItem } from "@/schema/invoice";

interface Customer {
  id: number;
  name: string;
  email: string;
}

interface InvoiceFormProps {
  onSubmit: (data: InvoiceFormValues) => Promise<void>;
  isLoading?: boolean;
  defaultValues?: Partial<InvoiceFormValues>;
}

export function InvoiceForm({
  onSubmit,
  isLoading = false,
  defaultValues,
}: InvoiceFormProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      customerId: defaultValues?.customerId || undefined,
      status: defaultValues?.status || "pending",
      items: defaultValues?.items || [
        { productId: 0, productName: "", quantity: 1, price: "0.00" },
      ],
    },
  });

  const { fields, append, remove } = form.watch("items") as any;

  // Fetch customers
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch("/api/customers?limit=1000");
        if (!response.ok) throw new Error("Failed to fetch customers");
        const result = await response.json();
        setCustomers(result.data || []);
      } catch (error) {
        console.error("Error fetching customers:", error);
      } finally {
        setLoadingCustomers(false);
      }
    };

    fetchCustomers();
  }, []);

  const addItem = () => {
    const currentItems = form.getValues("items") || [];
    form.setValue("items", [
      ...currentItems,
      { productId: 0, productName: "", quantity: 1, price: "0.00" },
    ]);
  };

  const removeItem = (index: number) => {
    const currentItems = form.getValues("items") || [];
    if (currentItems.length > 1) {
      form.setValue(
        "items",
        currentItems.filter((_, i) => i !== index)
      );
    }
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const currentItems = form.getValues("items") || [];
    const updatedItems = [...currentItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    form.setValue("items", updatedItems);
  };

  const calculateTotal = () => {
    const items = form.watch("items") || [];
    return items
      .reduce((sum, item) => {
        const price = parseFloat(item.price || "0");
        const quantity = item.quantity || 0;
        return sum + price * quantity;
      }, 0)
      .toFixed(2);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Customer Selection */}
        <FormField
          control={form.control}
          name="customerId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Customer</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(parseInt(value))}
                value={field.value?.toString()}
                disabled={isLoading || loadingCustomers}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {loadingCustomers ? (
                    <div className="px-2 py-1 text-sm text-muted-foreground">
                      Loading customers...
                    </div>
                  ) : customers.length > 0 ? (
                    customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id.toString()}>
                        {customer.name} ({customer.email})
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-1 text-sm text-muted-foreground">
                      No customers found
                    </div>
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Status Selection */}
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={isLoading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Invoice Items */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <FormLabel>Invoice Items</FormLabel>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addItem}
              disabled={isLoading}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </div>

          {/* Column Headers */}
          <div className="grid grid-cols-12 gap-3 text-sm font-medium text-muted-foreground">
            <div className="col-span-5">Product</div>
            <div className="col-span-2">Quantity</div>
            <div className="col-span-2">Price</div>
            <div className="col-span-2">Subtotal</div>
            <div className="col-span-1"></div>
          </div>

          {/* Items */}
          <div className="space-y-3">
            {(form.watch("items") || []).map((item, index) => (
              <InvoiceItemRow
                key={index}
                item={item}
                index={index}
                onUpdate={updateItem}
                onRemove={removeItem}
                disabled={isLoading}
              />
            ))}
          </div>

          {form.formState.errors.items && (
            <p className="text-sm font-medium text-destructive">
              {form.formState.errors.items.message}
            </p>
          )}
        </div>

        {/* Total */}
        <div className="flex justify-end">
          <div className="w-64 space-y-2 rounded-lg border p-4">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Total:</span>
              <span className="font-bold text-lg">${calculateTotal()}</span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading} className="flex-1">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Invoice"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}