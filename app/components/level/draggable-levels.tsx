import * as React from "react"
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core"
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { ChevronDown, GripVertical } from "lucide-react"
import { Card, CardContent } from "../ui/card"
import { cn } from "~/lib/utils"
import { Level } from "~/lib/types/account/account"
import { useNavigate } from "@remix-run/react"
import { Badge } from "../ui/badge"

type SortableLevelProps = {
    level: Level;
}

const SortableLevel = ({ level }: SortableLevelProps) => {

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: level.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    const navigate = useNavigate();

    const color = level.themeColor || "#000000";

    return (
        <div ref={setNodeRef} style={style} className={cn("relative mb-4 cursor-pointer", isDragging && "z-10")}
            onClick={() => navigate(`/admin/levels/${level.id}`)}>
            <Card className={cn("border", isDragging ? "ring-2 ring-primary shadow-lg" : `border-l-4 hover:-translate-y-1 hover:shadow-sm`)}
                style={{
                    borderLeftColor: level.themeColor
                }}>
                <CardContent className="p-4 flex items-center gap-3">
                    <div
                        {...attributes}
                        {...listeners}
                        className="cursor-grab touch-none flex items-center justify-center p-1 rounded-md hover:bg-muted"
                    >
                        <GripVertical className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                        <strong className="flex justify-between my-2">
                            <span style={{ color: level.themeColor }}>{level.name}</span> {level.requiresEntranceTest ? <Badge className="text-red-600 bg-red-500/20 uppercase" variant={'outline'}>Entrance Test Required</Badge>
                                : <Badge variant={'outline'} className="text-green-600 bg-green-500/20 uppercase">Entrance Test Not Required</Badge>}
                        </strong>
                        <p className="text-sm text-muted-foreground">{level.description}</p>
                    </div>

                    {/* <div className="">
                        <TooltipProvider>
                            <Tooltip delayDuration={300} >
                                <TooltipTrigger onClick={() => navigate(`/admin/levels/${level.id}`)}><Eye className="hover:text-black/70"/></TooltipTrigger>
                                <TooltipContent>
                                    <p>Xem chi tiết level</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div> */}

                </CardContent>
            </Card>
        </div>
    )
}

type DraggableLevelsProps = {
    levels: Level[];
    setLevels: React.Dispatch<React.SetStateAction<Level[]>>;
    onLevelsChange?: (levels: Level[]) => void;
}

export function DraggableLevels({ levels, setLevels, onLevelsChange }: DraggableLevelsProps) {

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    )

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event

        if (over && active.id !== over.id) {
            setLevels((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id)
                const newIndex = items.findIndex((item) => item.id === over.id)

                const newLevels = arrayMove(items, oldIndex, newIndex)
                onLevelsChange?.(newLevels)
                return newLevels
            })
        }
    }

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={levels.map((level) => level.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-1">
                    {levels.map((level, index) => (
                        <React.Fragment key={level.id}>
                            <SortableLevel level={level} />
                            {index !== levels.length - 1 && <div className="flex justify-center">
                                <ChevronDown className="animate-bounce" />
                            </div>}
                        </React.Fragment>
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    )
}

