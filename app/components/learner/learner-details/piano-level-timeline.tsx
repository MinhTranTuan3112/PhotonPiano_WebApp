import { Check, Piano } from "lucide-react"
import { Badge } from "~/components/ui/badge"
import { Level } from "~/lib/types/account/account"
import { cn } from "~/lib/utils"

type Props = {
    levels: Level[]
    currentLevelId: string | undefined;
    className?: string
}

export function PianoLevelTimeline({ levels, currentLevelId, className }: Props) {
    const currentLevelIndex = currentLevelId ? levels.findIndex((level) => level.id === currentLevelId) : 0;

    return (
        <div className={cn("w-full p-6 rounded-xl bg-background border border-border shadow-sm border-l-4 border-l-theme", className)}>
            <h3 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
                <Piano className="h-5 w-5 text-theme" />
                <span>Piano Learning Timeline</span>
            </h3>

            <div className="relative overflow-x-auto pb-4">
                <div className="relative min-w-max">
                    <div className="flex flex-row gap-4 pt-4">
                        {levels.map((level, index) => {
                            const isCompleted = index < currentLevelIndex
                            const isCurrent = index === currentLevelIndex
                            const isUpcoming = index > currentLevelIndex
                            const isLast = index === levels.length - 1

                            return (
                                <div key={level.id} className="relative flex flex-col items-center min-w-[160px]">
                                    <div className="flex items-center w-full">
                                        <div
                                            className={cn(
                                                "flex items-center justify-center w-10 h-10 rounded-full border-2 z-10",
                                                isCompleted
                                                    ? "bg-theme border-theme text-theme-foreground"
                                                    : isCurrent
                                                        ? "bg-background border-theme ring-2 ring-theme/20 animate-pulse"
                                                        : "bg-background border-muted"
                                            )}

                                        >
                                            {isCompleted ? (
                                                <Check className="h-5 w-5 animate" />
                                            ) : isCurrent ? (
                                                <Piano className="h-5 w-5 text-theme" />
                                            ) : (
                                                <span className="text-muted-foreground text-sm">{index + 1}</span>
                                            )}
                                        </div>

                                        {!isLast && (
                                            <div className={cn(
                                                "h-0.5 flex-1",
                                                isCompleted ? "bg-theme" : "bg-border"
                                            )} />
                                        )}
                                    </div>

                                    <div
                                        className={cn(
                                            "mt-4 p-4 rounded-lg transition-all w-full h-[100px] flex items-center justify-center",
                                            isCompleted
                                                ? "border border-theme/10 text-theme"
                                                : isCurrent
                                                    ? "bg-background border-2 shadow-md animate-pulse"
                                                    : "bg-background border border-border"
                                        )}
                                        style={{
                                            borderTopWidth: '5px',
                                            borderTopColor: level.themeColor
                                        }}
                                    >
                                        <div className="flex flex-col items-center text-center gap-4">
                                            <h4
                                                className={cn(
                                                    "font-medium text-sm",
                                                )}
                                                style={{
                                                    color: level.themeColor,
                                                    fontWeight: isCompleted ? 'bold' : 'normal',
                                                }}
                                            >
                                                {level.name}
                                            </h4>

                                            {isCompleted && (
                                                <Badge variant={'outline'} className="text-green-500 uppercase">
                                                    Completed
                                                </Badge>
                                            )}

                                            {isCurrent && (
                                                <Badge variant={'outline'} className="text-theme uppercase">
                                                    Current
                                                </Badge>
                                            )}

                                            {isUpcoming &&
                                                <Badge variant={'outline'} className="text-muted-foreground uppercase">
                                                    Upcoming
                                                </Badge>
                                            }
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}