import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {Music, 
    ChevronUp} from 'lucide-react'

import {
    AttendanceStatusText,
    SlotDetail,
    SlotStatus,
    SlotStatusText
} from "~/lib/types/Scheduler/slot"
import { Role } from "~/lib/types/account/account"
import {Badge} from "~/components/ui/badge";
import { cn } from "~/lib/utils"

interface CompactSlotViewProps {
    slots: SlotDetail[]
    onSlotClick: (slotId: string) => void
    role: Role
}

export const CompactSlotView = ({ slots, onSlotClick, role }: CompactSlotViewProps) => {
    const [expanded, setExpanded] = useState(false)

    return (
        <div className="space-y-2">
            {/* Summary card - always visible */}
            <div
                className={cn(
                    "bg-white rounded-lg shadow-sm border border-blue-100 p-4",
                    !expanded && "cursor-pointer hover:bg-blue-50 transition-colors",
                )}
                onClick={() => !expanded && setExpanded(true)}
            >
                <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center text-indigo-800 font-medium">
                        <Music className="w-4 h-4 mr-2 text-indigo-600" />
                        <span className="text-indigo-900 font-bold">{slots.length} phòng học</span>
                    </div>
                    {/*<Badge className="bg-indigo-100 text-indigo-800 border-none">{slots.length} lớp</Badge>*/}
                </div>

                {/* Room list */}
                <div className="mt-2 space-y-1">
                    {slots.map((slot, idx) => (
                        <div key={idx} className="flex items-center text-sm">
                            <span className="w-2 h-2 rounded-full bg-indigo-500 mr-2"></span>
                            <span className="text-indigo-700">Phòng: {slot.room?.name}</span>
                        </div>
                    ))}
                </div>

                {/* Status badge */}
                <div className="mt-3">
                    <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                        Xem Thêm
                    </Badge>
                </div>
            </div>

            {/* Individual room cards - only visible when expanded */}
            <AnimatePresence>
                {expanded && (
                    <>
                        {slots.map((slot, idx) => (
                            <motion.div
                                key={slot.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2, delay: idx * 0.05 }}
                                className={cn(
                                    "rounded-lg shadow p-3 transition-all duration-200",
                                    slot.status === SlotStatus.Cancelled
                                        ? "bg-gray-100 text-gray-600 cursor-not-allowed"
                                        : slot.status === SlotStatus.Ongoing
                                            ? "bg-blue-50 border border-blue-200 hover:shadow-md cursor-pointer"
                                            : slot.status === SlotStatus.Finished
                                                ? "bg-green-50 border border-green-200 hover:shadow-md cursor-pointer"
                                                : "bg-white border border-blue-100 hover:shadow-md cursor-pointer",
                                )}
                                onClick={() => slot.status !== SlotStatus.Cancelled && onSlotClick(slot.id)}
                            >
                                <div
                                    className={cn(
                                        "text-lg font-bold flex items-center",
                                        slot.status === SlotStatus.Cancelled ? "text-muted-foreground" : "text-primary",
                                    )}
                                >
                                    <Music className="mr-1 w-4 h-4" />
                                    {slot.room?.name}
                                </div>
                                <div className="text-sm">{slot.class?.name}</div>
                                <Badge
                                    className="mt-2"
                                    variant={
                                        slot.status === SlotStatus.Cancelled
                                            ? "outline"
                                            : slot.status === SlotStatus.Finished
                                                ? "default"
                                                : slot.status === SlotStatus.Ongoing
                                                    ? "secondary"
                                                    : "outline"
                                    }
                                >
                                    {role === 1 && slot.attendanceStatus !== undefined
                                        ? AttendanceStatusText[slot.attendanceStatus]
                                        : SlotStatusText[slot.status]}
                                </Badge>
                            </motion.div>
                        ))}

                        {/* Collapse button */}
                        <button
                            onClick={() => setExpanded(false)}
                            className="w-full text-indigo-600 hover:text-indigo-800 bg-white border border-indigo-200 rounded-lg py-2 px-3 text-sm font-medium flex items-center justify-center"
                        >
                            <ChevronUp className="w-4 h-4 mr-1" />
                            Thu gọn
                        </button>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}


