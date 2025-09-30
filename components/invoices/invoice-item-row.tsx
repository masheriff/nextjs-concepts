"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductSearch } from "@/components/products/product-search";
import { InvoiceItem } from "@/schema/invoice";

interface InvoiceItemRowProps {
  item: InvoiceItem;
  index: number;
  onUpdate: (index: number, field: keyof InvoiceItem, value: any) => void;
  onRemove: (index: number) => void;
  disabled?: boolean;
}

export function InvoiceItemRow({
  item,
  index,
  onUpdate,
  onRemove,
  disabled = false,
}: InvoiceItemRowProps) {
  const handleProductSelect = (product: { id: number; name: string; price: string }) => {
    onUpdate(index, "productId", product.id);
    onUpdate(index, "productName", product.name);
    onUpdate(index, "price", product.price);
  };

  const subtotal = (
    parseFloat(item.price || "0") * (item.quantity || 0)
  ).toFixed(2);

  return (
    <div className="grid grid-cols-12 gap-3 items-start">
      {/* Product Search - 5 columns */}
      <div className="col-span-5">
        <ProductSearch
          onSelect={handleProductSelect}
          selectedProductId={item.productId}
          disabled={disabled}
          placeholder="Search and select product..."
        />
      </div>

      {/* Quantity - 2 columns */}
      <div className="col-span-2">
        <Input
          type="number"
          min="1"
          value={item.quantity || ""}
          onChange={(e) =>
            onUpdate(index, "quantity", parseInt(e.target.value) || 1)
          }
          disabled={disabled}
          placeholder="Qty"
        />
      </div>

      {/* Price - 2 columns */}
      <div className="col-span-2">
        <Input
          type="text"
          value={item.price || ""}
          onChange={(e) => onUpdate(index, "price", e.target.value)}
          disabled={disabled}
          placeholder="0.00"
        />
      </div>

      {/* Subtotal - 2 columns */}
      <div className="col-span-2">
        <Input value={`$${subtotal}`} disabled className="bg-muted" />
      </div>

      {/* Remove Button - 1 column */}
      <div className="col-span-1 flex justify-center">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onRemove(index)}
          disabled={disabled}
          className="text-destructive hover:text-destructive"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}