"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { SortOption, StatusFilter } from "@/lib/dashboard-post-utils";

const FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "draft", label: "Draft" },
  { id: "ready", label: "Ready" },
  { id: "posted", label: "Posted" },
  { id: "failed", label: "Failed" },
];

const SORTS: { id: SortOption; label: string }[] = [
  { id: "newest", label: "Newest first" },
  { id: "oldest", label: "Oldest first" },
  { id: "status", label: "Status" },
];

interface DashboardToolbarProps {
  statusFilter: StatusFilter;
  onStatusFilterChange: (f: StatusFilter) => void;
  search: string;
  onSearchChange: (v: string) => void;
  sort: SortOption;
  onSortChange: (s: SortOption) => void;
  counts: Record<StatusFilter, number>;
}

export function DashboardToolbar(props: DashboardToolbarProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input type="search" placeholder="Search customer, salesperson, vehicle…" value={props.search} onChange={(e) => props.onSearchChange(e.target.value)} className="pl-9" />
        </div>
        <Select value={props.sort} onValueChange={(v) => props.onSortChange(v as SortOption)}>
          <SelectTrigger className="w-full sm:w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>{SORTS.map((o) => <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="flex flex-wrap gap-2">
        {FILTERS.map(({ id, label }) => (
          <button key={id} type="button" onClick={() => props.onStatusFilterChange(id)} className={cn("inline-flex h-8 items-center gap-2 rounded-full border px-3 text-sm font-medium transition", props.statusFilter === id ? "border-amber-500/50 bg-amber-500/15 text-amber-100" : "border-border/60 text-muted-foreground hover:text-foreground")}>
            {label}<span className="rounded-full bg-muted/50 px-1.5 text-[10px] tabular-nums">{props.counts[id]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
