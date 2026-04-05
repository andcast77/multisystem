"use client";

import * as React from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "../lib/utils";

export type BreadcrumbNavItem = { label: string; href?: string };

export type AppBreadcrumbProps = {
  items: BreadcrumbNavItem[];
  Link: React.ComponentType<{
    to?: string;
    href?: string;
    className?: string;
    children: React.ReactNode;
  }>;
  className?: string;
};

export function AppBreadcrumb({ items, Link, className }: AppBreadcrumbProps) {
  if (!items.length) return null;

  return (
    <nav aria-label="Migas de pan" className={cn("mb-2", className)}>
      <ol className="flex flex-wrap items-center gap-1 text-sm text-slate-500">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`} className="flex items-center gap-1">
              {i > 0 ? (
                <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" aria-hidden />
              ) : null}
              {item.href && !isLast ? (
                <Link
                  to={item.href}
                  href={item.href}
                  className="hover:text-indigo-600 transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={cn(isLast && "text-slate-900 font-medium")}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
