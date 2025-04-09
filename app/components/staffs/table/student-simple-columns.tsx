import { useState } from "react";
import { ColumnDef, Row, Table } from "@tanstack/react-table";
import { Checkbox } from "~/components/ui/checkbox";
import { Mail, Music2 } from 'lucide-react';
import { Account, Level } from "~/lib/types/account/account";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";

const getLevelStyle = (level?: number) => {
    switch (level) {
        case 0: return "text-[#92D808] font-semibold";
        case 1: return "text-[#FBDE00] font-semibold";
        case 2: return "text-[#FBA000] font-semibold";
        case 3: return "text-[#fc4e03] font-semibold";
        case 4: return "text-[#ff0000] font-semibold";
        default: return "text-black font-semibold";
    }
};

function LevelBadge({ level }: { level?: Level }) {
    return <Badge variant={'outline'} className={`uppercase`}>
        {level ? `${level.name.split('(')[0]}` : 'Chưa xếp'}
    </Badge>;
}

export function useSelection(maxSelectionLimit?: number) {
    const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);

    const toggleRowSelection = (row: Row<Account>, isSelected: boolean) => {
        setSelectedRowIds((prev) => {
            if (isSelected) {
                // Prevent selection if the limit is reached
                if (maxSelectionLimit && prev.length >= maxSelectionLimit) {
                    //alert(`Bạn chỉ có thể chọn tối đa ${maxSelectionLimit} dòng.`);
                    return prev;
                }
                return [...prev, row.original.accountFirebaseId]; // Add new selection
            } else {
                return prev.filter(id => id !== row.original.accountFirebaseId); // Remove selection
            }
        });
    };

    const clearSelection = () => {
        setSelectedRowIds([]); // Clears all selected rows
    };

    return { selectedRowIds, toggleRowSelection, clearSelection };
}

export function getStudentSimpleColumns({ selectedRowIds, toggleRowSelection }: {
    selectedRowIds: string[];
    toggleRowSelection: (row: Row<Account>, isSelected: boolean) => void;
}): ColumnDef<Account>[] {
    return [
        {
            id: "select",
            cell: ({ row }) => (
                <Checkbox
                    variant={'theme'}
                    checked={selectedRowIds.includes(row.original.accountFirebaseId)}
                    onCheckedChange={(value) => toggleRowSelection(row, !!value)}
                    aria-label="Chọn dòng"
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: 'Tên',
            header: 'Tên học viên',
            cell: ({ row }) => <div>{row.original.fullName || row.original.userName}</div>
        },
        {
            accessorKey: 'Email',
            header: () => <div className="flex flex-row gap-1 items-center"><Mail /> Email</div>,
            cell: ({ row }) => <div>{row.original.email}</div>
        },
        {
            accessorKey: 'Level',
            header: () => <div className="flex flex-row gap-1 items-center"><Music2 /> Level</div>,
            cell: ({ row }) => <LevelBadge level={row.original.level} />
        },
        {
            accessorKey: 'Hành động',
            header: () => <div className="flex flex-row gap-1 items-center"></div>,
            cell: ({ row }) => <Button onClick={() =>   window.open(`/staff/students/${row.original.accountFirebaseId}`, '_blank')}>Xem</Button>
        }
    ];
}