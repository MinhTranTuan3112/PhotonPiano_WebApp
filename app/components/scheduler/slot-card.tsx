import { motion } from "framer-motion"
import { Music } from "lucide-react"
import { Badge } from "~/components/ui/badge"
import { cn } from "~/lib/utils"
import { SlotStatus, SlotStatusText } from "~/lib/types/Scheduler/slot"

interface SlotCardProps {
    slot: {
        id: string
        status: SlotStatus
        room?: { name: string }
        class?: { name: string }
        slotNote?: string | null  // Change from string | undefined to string | null to match SlotDetail
    }
    onClick: () => void
}

export function SlotCard({ slot, onClick }: SlotCardProps) {
    return (
        <motion.div
            className={cn(
                "rounded-lg shadow p-2 text-sm transition-all duration-200",
                slot.status === SlotStatus.Cancelled
                    ? "bg-gray-100 text-gray-600 cursor-not-allowed"
                    : slot.status === SlotStatus.Ongoing
                        ? "bg-blue-50 border border-blue-200 hover:shadow-md cursor-pointer"
                        : slot.status === SlotStatus.Finished
                            ? "bg-green-50 border border-green-200 hover:shadow-md cursor-pointer"
                            : "bg-white border border-blue-100 hover:shadow-md cursor-pointer",
            )}
            onClick={onClick}
            whileHover={slot.status !== SlotStatus.Cancelled ? { scale: 1.02 } : {}}
            whileTap={slot.status !== SlotStatus.Cancelled ? { scale: 0.98 } : {}}
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
            <div className="mt-2 flex flex-wrap gap-2">
                <Badge
                    className="text-xs"
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
                    {SlotStatusText[slot.status]}
                </Badge>
            </div>
            {slot.status === SlotStatus.Cancelled && slot.slotNote && (
                <div className="text-xs mt-2 text-muted-foreground italic">Cancel Reason: {slot.slotNote}</div>
            )}
        </motion.div>
    )
}
