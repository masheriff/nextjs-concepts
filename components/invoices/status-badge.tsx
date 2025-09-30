import { Badge } from "@/components/ui/badge";

type Status = "pending" | "paid" | "cancelled";

const statusConfig = {
  pending: {
    label: "Pending",
    className: "bg-yellow-100 text-yellow-800 border-1 border-yellow-100 hover:bg-yellow-100",
  },
  paid: {
    label: "Paid",
    className: "bg-green-100 text-green-800 border-1 border-green-100 hover:bg-green-100",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-red-100 text-red-800 border-1 border-red-100 hover:bg-red-100",
  },
};

export function StatusBadge({ status }: { status: Status }) {
  const config = statusConfig[status];
  
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}