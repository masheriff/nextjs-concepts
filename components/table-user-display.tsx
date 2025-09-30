import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface TableUserDisplayProps {
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  } | null;
}

export function TableUserDisplay({ user }: TableUserDisplayProps) {
  if (!user) {
    return <span className="text-muted-foreground">—</span>;
  }

  const displayName = user.name || user.email;
  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email[0].toUpperCase();

  return (
    <div className="flex items-center gap-3">
      <Avatar className="h-7 w-7">
        <AvatarImage src={user.image || undefined} alt={displayName} />
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col">
        <span className="text-[10px] font-medium leading-none">
          {user.name || "—"}
        </span>
        <span className="text-[7px] text-muted-foreground mt-1">
          {user.email}
        </span>
      </div>
    </div>
  );
}