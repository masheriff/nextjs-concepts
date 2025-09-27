import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "./ui/breadcrumb";
import { Separator } from "./ui/separator";
import { SidebarTrigger } from "./ui/sidebar";

type BreadcrumbItemType = {
  label: string;
  href?: string;
};

export function PageHeader({
  title,
  breadcrumbs,
}: {
  title: string;
  breadcrumbs: BreadcrumbItemType[];
}) {
  return (
    <header className="flex h-auto shrink-0 flex-col justify-center">
      {/* Top Row - Sidebar + Breadcrumbs */}
      <div className="flex items-center gap-2 px-4 h-16">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((item, index) => (
              <BreadcrumbItem key={index} className={index < breadcrumbs.length - 1 ? "hidden md:block" : ""}>
                {item.href && index < breadcrumbs.length - 1 ? (
                  <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                )}
                {index < breadcrumbs.length - 1 && (
                  <BreadcrumbSeparator className="hidden md:block" />
                )}
              </BreadcrumbItem>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Title below Breadcrumbs */}
      <div className="px-4 pb-4">
        <h1 className="text-xl font-semibold">{title}</h1>
      </div>
    </header>
  );
}
