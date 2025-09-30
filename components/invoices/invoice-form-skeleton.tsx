"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function InvoiceFormSkeleton() {
  return (
    <div className="space-y-6">
      {/* Customer Selection */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-full" />
      </div>

      {/* Status Selection */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-10 w-full" />
      </div>

      {/* Invoice Items */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-28" />
        </div>

        {/* Headers */}
        <div className="grid grid-cols-12 gap-3">
          <Skeleton className="col-span-5 h-4" />
          <Skeleton className="col-span-2 h-4" />
          <Skeleton className="col-span-2 h-4" />
          <Skeleton className="col-span-2 h-4" />
          <div className="col-span-1"></div>
        </div>

        {/* Items */}
        {[1, 2].map((i) => (
          <div key={i} className="grid grid-cols-12 gap-3">
            <Skeleton className="col-span-5 h-10" />
            <Skeleton className="col-span-2 h-10" />
            <Skeleton className="col-span-2 h-10" />
            <Skeleton className="col-span-2 h-10" />
            <Skeleton className="col-span-1 h-10" />
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="flex justify-end">
        <Skeleton className="h-20 w-64" />
      </div>

      {/* Submit Button */}
      <Skeleton className="h-10 w-full" />
    </div>
  );
}