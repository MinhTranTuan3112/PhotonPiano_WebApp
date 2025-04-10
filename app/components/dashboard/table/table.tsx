import React from "react"
import { ChevronDown } from "lucide-react"

interface Column {
    header: string
    accessor: string
    className?: string
    sortable?: boolean
}

interface TableProps<T> {
    columns: Column[]
    data: T[]
    keyExtractor: (item: T) => string | number
    renderRow: (item: T) => React.ReactNode
    onSort?: (accessor: string) => void
    sortColumn?: string
    sortDirection?: "asc" | "desc"
}

const Table = <T extends Record<string, any>>({
    columns,
    data,
    keyExtractor,
    renderRow,
    onSort,
    sortColumn,
    sortDirection,
}: TableProps<T>) => {
    return (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                        {columns.map((col) => (
                            <th key={col.accessor} className={`py-3 px-6 ${col.className || ""}`}>
                                <div className="flex items-center justify-between">
                                    {col.header}
                                    {col.sortable && (
                                        <button onClick={() => onSort && onSort(col.accessor)} className="ml-1 focus:outline-none">
                                            <ChevronDown
                                                className={`w-4 h-4 transition-transform ${sortColumn === col.accessor && sortDirection === "desc" ? "transform rotate-180" : ""
                                                    }`}
                                            />
                                        </button>
                                    )}
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((item) => (
                        <React.Fragment key={keyExtractor(item)}>{renderRow(item)}</React.Fragment>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export default Table

