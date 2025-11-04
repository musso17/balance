"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/style";

interface BreadcrumbsProps {
  homeCrumb?: { href: string; label: string };
}

export function Breadcrumbs({ homeCrumb }: BreadcrumbsProps) {
  const pathname = usePathname();
  const safePath = pathname ?? "/";
  const pathSegments = safePath.split("/").filter((segment) => segment !== "");

  const crumbs = pathSegments.map((segment, index) => {
    const href = "/" + pathSegments.slice(0, index + 1).join("/");
    const label = segment.charAt(0).toUpperCase() + segment.slice(1);
    const isLast = index === pathSegments.length - 1;

    return {
      href,
      label,
      isLast,
    };
  });

  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground sm:gap-2 sm:text-sm">
        {homeCrumb && (
          <li className="flex items-center">
            <Link
              href={homeCrumb.href}
              className="font-medium transition hover:text-foreground"
            >
              {homeCrumb.label}
            </Link>
          </li>
        )}
        {crumbs.map((crumb) => (
          <li key={crumb.href} className="flex items-center">
            <ChevronRight className="mr-1 size-3 text-muted-foreground sm:mr-2 sm:size-4" />
            <Link
              href={crumb.href}
              className={cn(
                "font-medium transition",
                crumb.isLast ? "text-foreground" : "hover:text-foreground"
              )}
              aria-current={crumb.isLast ? "page" : undefined}
            >
              {crumb.label}
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}
