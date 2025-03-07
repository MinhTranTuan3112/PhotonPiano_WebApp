import {
    ColumnDef,
    ColumnFiltersState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    Row,
    SortingState,
    TableOptions,
    useReactTable,
    VisibilityState,
} from "@tanstack/react-table"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "./table"
import { Button } from "./button"
import React, { useEffect, useState } from "react"
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "./dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select"
import { ChevronLeft, ChevronRight, Settings2, Trash2 } from 'lucide-react'
import { useSearchParams } from "@remix-run/react"

type DataTableProps<TData, TValue> = {
    columns: ColumnDef<TData, TValue>[]
    data: TData[],
    onRowSelectionChange?: (selectedRows: Row<TData>[]) => void;
    emptyContent?: React.ReactNode;
    extraHeaderContent?: React.ReactNode;
    enableColumnDisplayOptions?: boolean;
    defaultPageSize?: number;
    pageSizeOptions?: number[];
    manualPagination?: boolean;
    onPaginationChange?: (page: number) => void;
    onPageSizeChange?: (pageSize: number) => void;
    totalPages?: number;
    totalCount?: number;
    pageParamName? : string;
    sizeParamName? : string;
}

export function DataTable<TData, TValue>({
    columns,
    data,
    onRowSelectionChange,
    extraHeaderContent,
    emptyContent = "Không có kết quả.",
    enableColumnDisplayOptions = true,
    defaultPageSize = 5,
    pageSizeOptions = [5, 10, 20, 30, 40, 50],
    manualPagination = false,
    onPaginationChange,
    onPageSizeChange,
    totalPages = 1,
    totalCount = 0,
    pageParamName = 'page',
    sizeParamName = 'size',
}: DataTableProps<TData, TValue>) {

    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = useState({})
    const [searchParams, setSearchParams] = useSearchParams();
    const page = Number(searchParams.get(pageParamName)) || 1;
    const pageSize = Number(searchParams.get(sizeParamName)) || defaultPageSize;

    const table = useReactTable({
        data,
        columns,
        manualPagination,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        initialState: {
            pagination: {
                pageSize: defaultPageSize,
                pageIndex: page - 1
            },
        },
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
            // pagination: manualPagination === true ? {
            //     pageIndex: page - 1,
            //     pageSize,
            // } : {
            //     pageSize: defaultPageSize,
            //     pageIndex: 0
            // }
        },
        enableRowSelection: true,
    });

    const handlePageChange = (newPageIndex: number) => {
        // setPagination((prev) => ({ ...prev, pageIndex: newPageIndex }));
        console.log(newPageIndex)
        if (onPaginationChange) {
            onPaginationChange(newPageIndex);
        }
    };

    useEffect(() => {
        if (onRowSelectionChange) {
            onRowSelectionChange(table.getFilteredSelectedRowModel().rows);
        }
    }, [rowSelection])
    
    return (
        <>
            <div className="flex flex-col items-end gap-5 py-4">
                {extraHeaderContent}
                {enableColumnDisplayOptions && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline"
                                Icon={Settings2} iconPlacement="left">
                                Cột hiển thị
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {table
                                .getAllColumns()
                                .filter(
                                    (column) => column.getCanHide()
                                )
                                .map((column) => {
                                    return (
                                        <DropdownMenuCheckboxItem
                                            key={column.id}
                                            className="capitalize"
                                            checked={column.getIsVisible()}
                                            onCheckedChange={(value) =>
                                                column.toggleVisibility(!!value)
                                            }
                                        >
                                            {column.id}
                                        </DropdownMenuCheckboxItem>
                                    )
                                })}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
            <div className="rounded-md border">
                <Table className="w-full">
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    {emptyContent}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

            </div>

            <div className="flex flex-row gap-3">

                <div className="flex-1 text-sm text-muted-foreground my-3">
                    {table.getFilteredSelectedRowModel().rows.length} trên{" "}
                    {table.getState().pagination.pageSize} dòng đã chọn.
                    <br />
                    <strong>&#40;Tổng cộng: {totalCount}&#41;</strong>
                </div>

                <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium">Số dòng tối đa</p>
                    <Select
                        value={`${table.getState().pagination.pageSize}`}
                        onValueChange={(newPageSize) => {
                            if (manualPagination === false) {
                                table.setPageSize(Number(newPageSize))
                            } else {
                                onPageSizeChange?.(Number(newPageSize));
                            }
                        }}
                    >
                        <SelectTrigger className="h-8 w-[70px]">
                            <SelectValue placeholder={table.getState().pagination.pageSize} />
                        </SelectTrigger>
                        <SelectContent side="top">
                            {pageSizeOptions.map((size) => (
                                <SelectItem key={size} value={`${size}`}>
                                    {size}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center justify-end space-x-2 py-4">
                    <Button
                        variant="outline"
                        size="icon"
                        className="rounded-full"
                        onClick={manualPagination ? () => handlePageChange(page - 1) : () => table.previousPage()}
                        disabled={manualPagination ? (page <= 1) : !table.getCanPreviousPage()}
                    >
                        <ChevronLeft />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="rounded-full"
                        onClick={manualPagination ? () => handlePageChange(page + 1) : () => table.nextPage()}
                        disabled={manualPagination ? (page === totalPages) : !table.getCanNextPage()}
                    >
                        <ChevronRight />
                    </Button>
                </div>
            </div>

        </>
    )
}