import { ScrollArea } from "~/components/ui/scroll-area"
import type { BlankSlotModel, Shift } from "~/lib/types/Scheduler/slot"

type BlankSlotSelectorProps = {
    blankSlots: BlankSlotModel[]
    selectedBlankSlot: BlankSlotModel | null
    onSelectBlankSlot: (slot: BlankSlotModel) => void
    shiftTimesMap: Record<Shift, string>
}

export function BlankSlotSelector({
    blankSlots,
    selectedBlankSlot,
    onSelectBlankSlot,
    shiftTimesMap,
}: BlankSlotSelectorProps) {
    if (blankSlots.length === 0) {
        return (
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 text-amber-800">
                <p>There are no slots available this week. Lessons cannot be cancelled.</p>
            </div>
        )
    }

    return (
        <ScrollArea className="h-60 rounded-md border">
            <div className="space-y-2 p-2">
                {blankSlots.map((slot, index) => {
                    const slotDate = slot.date
                    return (
                        <div
                            key={index}
                            className={`p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition-colors ${selectedBlankSlot === slot ? "bg-indigo-50 border-indigo-300" : "border-slate-200"
                                }`}
                            onClick={() => onSelectBlankSlot(slot)}
                        >
                            <p className="text-slate-800">
                                <strong>Room:</strong> <span className="text-indigo-600">{slot.roomName || slot.roomId}</span>
                            </p>
                            <p className="text-slate-800">
                                <strong>Shift:</strong>{" "}
                                <span className="text-indigo-600">
                                    {shiftTimesMap[slot.shift]} - {slotDate}
                                </span>
                            </p>
                        </div>
                    )
                })}
            </div>
        </ScrollArea>
    )
}
