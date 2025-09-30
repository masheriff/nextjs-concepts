"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";

interface Customer {
  id: number;
  name: string;
  email: string;
}

interface CustomerSearchProps {
  onSelect: (customer: Customer) => void;
  selectedCustomerId?: number;
  selectedCustomerName?: string;
  disabled?: boolean;
  placeholder?: string;
}

export function CustomerSearch({
  onSelect,
  selectedCustomerId,
  selectedCustomerName,
  disabled = false,
  placeholder = "Search customers...",
}: CustomerSearchProps) {
  const [searchInput, setSearchInput] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debouncedSearch = useDebounce(searchInput, 300);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Fetch and display the selected customer on initial load
  useEffect(() => {
    const fetchSelectedCustomer = async () => {
      // If we have selectedCustomerName, use it directly
      if (selectedCustomerName) {
        setSearchInput(selectedCustomerName);
        return;
      }

      // Otherwise, fetch the customer details if we have an ID
      if (selectedCustomerId) {
        try {
          const response = await fetch(`/api/customers/${selectedCustomerId}`);
          
          if (!response.ok) {
            console.error("Failed to fetch selected customer");
            return;
          }

          const customer = await response.json();
          setSearchInput(customer.name);
        } catch (error) {
          console.error("Error fetching selected customer:", error);
        }
      }
    };

    fetchSelectedCustomer();
  }, [selectedCustomerId, selectedCustomerName]);

  // Search customers when debounced search changes
  useEffect(() => {
    const searchCustomers = async () => {
      if (!debouncedSearch.trim()) {
        setCustomers([]);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(
          `/api/customers?search=${encodeURIComponent(debouncedSearch)}&limit=10`
        );

        if (!response.ok) {
          throw new Error("Failed to search customers");
        }

        const result = await response.json();
        setCustomers(result.data || []);
        setShowDropdown(true);
      } catch (error) {
        console.error("Error searching customers:", error);
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    };

    searchCustomers();
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

  const handleSelect = (customer: Customer) => {
    onSelect(customer);
    setSearchInput(customer.name);
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
            ) : customers.length > 0 ? (
              customers.map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => handleSelect(customer)}
                  className={cn(
                    "flex w-full flex-col items-start rounded-sm px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground",
                    selectedCustomerId === customer.id && "bg-accent"
                  )}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="font-medium">{customer.name}</span>
                    {selectedCustomerId === customer.id && (
                      <Check className="h-4 w-4" />
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {customer.email}
                  </span>
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                {debouncedSearch.trim()
                  ? "No customers found"
                  : "Start typing to search"}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}