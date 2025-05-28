import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { Badge } from "./badge"
import { cn } from "~/lib/utils"

interface BadgeWithPopupProps {
    skills: string[]
    visibleCount: number
    className?: string
    badgeClassName?: string
    popupClassName?: string
    themeColor?: string
}

export default function BadgeWithPopup({
    skills,
    visibleCount,
    className,
    badgeClassName,
    popupClassName,
    themeColor = "#21c44d",
}: BadgeWithPopupProps) {
    const [isPopupVisible, setIsPopupVisible] = useState(false)
    const [portalElement, setPortalElement] = useState<HTMLElement | null>(null)
    const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 })
    const badgeRef = useRef<HTMLDivElement>(null)

    const visibleSkills = skills.slice(0, visibleCount)
    const hiddenSkills = skills.slice(visibleCount)

    // Create portal container when component mounts
    useEffect(() => {
        if (typeof document !== "undefined") {
            // Check if portal container already exists
            let element = document.getElementById("badge-popup-portal")
            if (!element) {
                element = document.createElement("div")
                element.id = "badge-popup-portal"
                document.body.appendChild(element)
            }
            setPortalElement(element)
        }

        // Clean up portal container when component unmounts
        return () => {
            if (portalElement && document.body.contains(portalElement)) {
                document.body.removeChild(portalElement)
            }
        }
    }, [])

    // Function to update popup position
    const updatePopupPosition = () => {
        if (badgeRef.current && isPopupVisible) {
            const rect = badgeRef.current.getBoundingClientRect()
            setPopupPosition({
                top: rect.bottom + window.scrollY,
                left: rect.left + window.scrollX,
            })
        }
    }

    // Update popup position when badge position changes or visibility changes
    useEffect(() => {
        updatePopupPosition()
    }, [isPopupVisible])

    // Add scroll event listener to update position when scrolling
    useEffect(() => {
        if (isPopupVisible) {
            window.addEventListener("scroll", updatePopupPosition)
            window.addEventListener("resize", updatePopupPosition)
        }

        return () => {
            window.removeEventListener("scroll", updatePopupPosition)
            window.removeEventListener("resize", updatePopupPosition)
        }
    }, [isPopupVisible])

    return (
        <div className={cn("flex flex-wrap gap-3", className)}>
            {visibleSkills.map((skill, index) => (
                <Badge
                    key={index}
                    className={cn(
                        "text-sm py-1.5 px-3 bg-white/30 backdrop-blur-sm text-white border-0 hover:bg-white/40",
                        badgeClassName,
                    )}
                >
                    {skill}
                </Badge>
            ))}

            {hiddenSkills.length > 0 && (
                <div ref={badgeRef} className="inline-block">
                    <Badge
                        className={cn(
                            "text-sm py-1.5 px-3 bg-white/30 backdrop-blur-sm text-white border-0 hover:bg-white/40 cursor-pointer",
                            badgeClassName,
                        )}
                        onClick={() => setIsPopupVisible(!isPopupVisible)}
                        onMouseEnter={() => setIsPopupVisible(true)}
                        onMouseLeave={() => {
                            // Small delay to allow moving to popup
                            setTimeout(() => {
                                if (!document.querySelector("#badge-popup:hover")) {
                                    setIsPopupVisible(false)
                                }
                            }, 100)
                        }}
                    >
                        +{hiddenSkills.length} more
                    </Badge>

                    {isPopupVisible &&
                        portalElement &&
                        createPortal(
                            <div
                                id="badge-popup"
                                className={cn(
                                    "fixed p-3 bg-white/90 backdrop-blur-md rounded-lg shadow-lg z-[9999]",
                                    "animate-in fade-in duration-200",
                                    popupClassName,
                                )}
                                style={{
                                    top: `${popupPosition.top}px`,
                                    left: `${popupPosition.left}px`,
                                    maxHeight: "300px",
                                    width: "250px",
                                    overflowY: "auto",
                                }}
                                onMouseEnter={() => setIsPopupVisible(true)}
                                onMouseLeave={() => setIsPopupVisible(false)}
                            >
                                <div className="flex flex-wrap gap-2">
                                    {hiddenSkills.map((skill, index) => (
                                        <Badge key={index} variant={'outline'} className="text-sm py-1 px-2 bg-white/50 text-gray-800 border border-gray-200">
                                            {skill}
                                        </Badge>
                                    ))}
                                </div>
                            </div>,
                            portalElement,
                        )}
                </div>
            )}
        </div>
    )
}
