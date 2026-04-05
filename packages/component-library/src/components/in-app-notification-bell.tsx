"use client";

import * as React from "react";
import { Bell } from "lucide-react";
import { cn } from "../lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { Button } from "./button";
import { ScrollArea } from "./scroll-area";

export type InAppNotificationRow = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  status: "READ" | "UNREAD";
  /** Raw persisted type (e.g. LOW_STOCK, SECURITY) */
  type?: string;
  /** User-facing category (PLAN-20 / PLAN-17 / PLAN-24) */
  sourceLabel?: string;
};

export type InAppNotificationBellProps = {
  unreadCount: number;
  items: InAppNotificationRow[];
  loading?: boolean;
  onOpen?: () => void;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  emptyLabel?: string;
  titleLabel?: string;
  align?: "start" | "end";
  className?: string;
};

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export function InAppNotificationBell({
  unreadCount,
  items,
  loading = false,
  onOpen,
  onMarkRead,
  onMarkAllRead,
  emptyLabel = "No hay notificaciones",
  titleLabel = "Notificaciones",
  align = "end",
  className,
}: InAppNotificationBellProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) onOpen?.();
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={cn("relative shrink-0", className)}
          aria-label={`Notificaciones${unreadCount > 0 ? `, ${unreadCount} sin leer` : ""}`}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-0.5 text-[10px] font-bold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-80 p-0"
        align={align}
        sideOffset={8}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-3 py-2">
          <DropdownMenuLabel className="p-0 text-sm font-semibold text-slate-900">
            {titleLabel}
          </DropdownMenuLabel>
          {unreadCount > 0 ? (
            <button
              type="button"
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
              onClick={() => onMarkAllRead()}
            >
              Marcar todas leídas
            </button>
          ) : null}
        </div>
        <ScrollArea className="max-h-72">
          {loading ? (
            <p className="px-3 py-6 text-center text-sm text-slate-500">Cargando…</p>
          ) : items.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-slate-500">{emptyLabel}</p>
          ) : (
            <ul className="py-1">
              {items.map((n) => (
                <li key={n.id}>
                  <DropdownMenuItem
                    className={cn(
                      "cursor-pointer flex flex-col items-start gap-0.5 rounded-none px-3 py-2",
                      n.status === "UNREAD" && "bg-indigo-50/80"
                    )}
                    onClick={() => onMarkRead(n.id)}
                  >
                    <span className="text-xs font-medium text-slate-900 line-clamp-2">
                      {n.title}
                    </span>
                    <span className="text-xs text-slate-600 line-clamp-3">{n.message}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      {formatTime(n.createdAt)}
                      {n.sourceLabel || n.type ? ` · ${n.sourceLabel ?? n.type}` : ""}
                    </span>
                  </DropdownMenuItem>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
