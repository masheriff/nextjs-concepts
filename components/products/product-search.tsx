"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";

interface Product {
  id: number;
  name: string;
  price: string;
}

interface ProductSearchProps {
  onSelect: (product: Product) => void;
  selectedProductId?: number;
  disabled?: boolean;
  placeholder?: string;
}

export function ProductSearch({
  onSelect,
  selectedProductId,
  disabled = false,
  placeholder = "Search products...",
}: ProductSearchProps) {
  const [searchInput, setSearchInput] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debouncedSearch = useDebounce(searchInput, 300);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Search products when debounced search changes
  useEffect(() => {
    const searchProducts = async () => {
      if (!debouncedSearch.trim()) {
        setProducts([]);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(
          `/api/products?search=${encodeURIComponent(debouncedSearch)}&limit=10`
        );

        if (!response.ok) {
          throw new Error("Failed to search products");
        }

        const result = await response.json();
        setProducts(result.data || []);
        setShowDropdown(true);
      } catch (error) {
        console.error("Error searching products:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    searchProducts();
  }, [debouncedSearch]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (product: Product) => {
    onSelect(product);
    setSearchInput(product.name);
    setShowDropdown(false);
  };

  const handleInputChange = (value: string) => {
    setSearchInput(value);
    if (value.trim()) {
      setShowDropdown(true);
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchInput}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => searchInput.trim() && setShowDropdown(true)}
          placeholder={placeholder}
          disabled={disabled}
          className="pl-8"
        />
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
          <div className="max-h-60 overflow-y-auto p-1">
            {loading ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                Searching...
              </div>
            ) : products.length > 0 ? (
              products.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => handleSelect(product)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-sm px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground",
                    selectedProductId === product.id && "bg-accent"
                  )}
                >
                  <span>{product.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">
                      ${parseFloat(product.price).toFixed(2)}
                    </span>
                    {selectedProductId === product.id && (
                      <Check className="h-4 w-4" />
                    )}
                  </div>
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                {debouncedSearch.trim()
                  ? "No products found"
                  : "Start typing to search"}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}