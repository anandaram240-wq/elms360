"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface ColumnDef<T> {
  key: string;
  header: React.ReactNode;
  sortable?: boolean;
  cell?: (row: T, index: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

export interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  totalCount?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  sortKey?: string;
  sortDirection?: "asc" | "desc";
  onSort?: (key: string, direction: "asc" | "desc") => void;
  isLoading?: boolean;
  emptyMessage?: string;
  filterSlot?: React.ReactNode;
  enableRowSelection?: boolean;
  selectedRowKeys?: string[];
  onRowSelect?: (selectedKeys: string[]) => void;
  getRowId?: (row: T) => string;
}

export function DataTable<T>({
  columns,
  data,
  totalCount = 0,
  page = 1,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  sortKey,
  sortDirection,
  onSort,
  isLoading = false,
  emptyMessage = "No records found.",
  filterSlot,
  enableRowSelection = false,
  selectedRowKeys = [],
  onRowSelect,
  getRowId = (row: any) => row.id || JSON.stringify(row),
}: DataTableProps<T>) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const handleSelectAll = (checked: boolean) => {
    if (!onRowSelect) return;
    if (checked) {
      const allKeys = data.map((item) => getRowId(item));
      onRowSelect(allKeys);
    } else {
      onRowSelect([]);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (!onRowSelect) return;
    if (checked) {
      onRowSelect([...selectedRowKeys, id]);
    } else {
      onRowSelect(selectedRowKeys.filter((k) => k !== id));
    }
  };

  const isAllSelected =
    data.length > 0 && data.every((row) => selectedRowKeys.includes(getRowId(row)));
  const isPartiallySelected =
    data.some((row) => selectedRowKeys.includes(getRowId(row))) && !isAllSelected;

  const handleSortClick = (columnKey: string) => {
    if (!onSort) return;
    if (sortKey === columnKey) {
      onSort(columnKey, sortDirection === "asc" ? "desc" : "asc");
    } else {
      onSort(columnKey, "asc");
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter / Search Area Slot */}
      {filterSlot && <div className="flex items-center gap-4">{filterSlot}</div>}

      {/* Table Container */}
      <div className="rounded-md border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {enableRowSelection && (
                <TableHead className="w-12 px-4">
                  <Checkbox
                    checked={isAllSelected || isPartiallySelected}
                    onCheckedChange={(checked) => handleSelectAll(!!checked)}
                    aria-label="Select all rows"
                  />
                </TableHead>
              )}
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={cn("whitespace-nowrap font-semibold", column.headerClassName)}
                >
                  {column.sortable ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSortClick(column.key)}
                      className="-ml-3 h-8 data-[state=open]:bg-accent font-semibold text-xs"
                    >
                      <span>{column.header}</span>
                      {sortKey === column.key ? (
                        sortDirection === "asc" ? (
                          <ArrowUp className="ml-1.5 h-3.5 w-3.5" />
                        ) : (
                          <ArrowDown className="ml-1.5 h-3.5 w-3.5" />
                        )
                      ) : (
                        <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 opacity-50" />
                      )}
                    </Button>
                  ) : (
                    column.header
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Skeleton loading state
              Array.from({ length: pageSize > 5 ? 5 : pageSize }).map((_, rIdx) => (
                <TableRow key={`skeleton-${rIdx}`}>
                  {enableRowSelection && (
                    <TableCell className="px-4">
                      <Skeleton className="h-4 w-4 rounded" />
                    </TableCell>
                  )}
                  {columns.map((col, cIdx) => (
                    <TableCell key={`col-skel-${cIdx}`} className={col.className}>
                      <Skeleton className="h-4 w-full max-w-[120px]" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data.length === 0 ? (
              // Empty state
              <TableRow>
                <TableCell
                  colSpan={columns.length + (enableRowSelection ? 1 : 0)}
                  className="h-32 text-center text-muted-foreground"
                >
                  <p className="text-sm">{emptyMessage}</p>
                </TableCell>
              </TableRow>
            ) : (
              // Rows
              data.map((row, idx) => {
                const id = getRowId(row);
                const isSelected = selectedRowKeys.includes(id);

                return (
                  <TableRow
                    key={id}
                    data-state={isSelected ? "selected" : undefined}
                    className={cn(isSelected && "bg-muted/50")}
                  >
                    {enableRowSelection && (
                      <TableCell className="px-4">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleSelectRow(id, !!checked)}
                          aria-label={`Select row ${id}`}
                        />
                      </TableCell>
                    )}
                    {columns.map((col) => (
                      <TableCell key={col.key} className={col.className}>
                        {col.cell ? col.cell(row, idx) : (row as any)[col.key]}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          {enableRowSelection && selectedRowKeys.length > 0 && (
            <span className="text-xs font-medium text-foreground">
              {selectedRowKeys.length} of {totalCount || data.length} row(s) selected.
            </span>
          )}
          <span className="text-xs">
            Showing{" "}
            <span className="font-semibold text-foreground">
              {totalCount === 0 ? 0 : (page - 1) * pageSize + 1}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-foreground">
              {Math.min(page * pageSize, totalCount || data.length)}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-foreground">
              {totalCount || data.length}
            </span>{" "}
            entries
          </span>
        </div>

        <div className="flex items-center gap-6">
          {onPageSizeChange && (
            <div className="flex items-center gap-2">
              <span className="text-xs">Rows per page</span>
              <Select
                value={String(pageSize)}
                onValueChange={(val) => onPageSizeChange(Number(val))}
              >
                <SelectTrigger className="h-8 w-16 text-xs">
                  <SelectValue placeholder={String(pageSize)} />
                </SelectTrigger>
                <SelectContent>
                  {[5, 10, 20, 50, 100].map((size) => (
                    <SelectItem key={size} value={String(size)} className="text-xs">
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {onPageChange && (
            <div className="flex items-center space-x-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => onPageChange(1)}
                disabled={page <= 1 || isLoading}
                aria-label="First page"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1 || isLoading}
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs font-medium px-2">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages || isLoading}
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => onPageChange(totalPages)}
                disabled={page >= totalPages || isLoading}
                aria-label="Last page"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
