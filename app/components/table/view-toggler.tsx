import { useState } from "react"
import { LayoutGrid, Table2 } from "lucide-react"
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group"
import { cn } from "~/lib/utils"

export type ViewType = "table" | "grid"

type Props = {
    defaultView?: ViewType;
    onViewChange?: (view: ViewType) => void;
    className?: string
}

export default function ViewToggle({ defaultView = "table", onViewChange, className }: Props) {

    const [activeView, setActiveView] = useState<ViewType>(defaultView);

    const handleViewChange = (value: string) => {
        if (value && (value === "table" || value === "grid")) {
            setActiveView(value as ViewType)
            onViewChange?.(value as ViewType)
        }
    }

    return (
        <ToggleGroup
            type="single"
            value={activeView}
            onValueChange={handleViewChange}
            className={cn("inline-flex h-10 items-center justify-center rounded-full bg-muted p-1", className)}
        >
            <ToggleGroupItem
                value="table"
                aria-label="Toggle table view"
                className="rounded-full data-[state=on]:bg-black data-[state=on]:text-white"
            >
                <Table2 className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Table</span>
                <span className="sr-only">Table view</span>
            </ToggleGroupItem>
            <ToggleGroupItem
                value="grid"
                aria-label="Toggle grid view"
                className="rounded-full data-[state=on]:bg-black data-[state=on]:text-white"
            >
                <LayoutGrid className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Card</span>
                <span className="sr-only">Card view</span>
            </ToggleGroupItem>
        </ToggleGroup>
    );
}
