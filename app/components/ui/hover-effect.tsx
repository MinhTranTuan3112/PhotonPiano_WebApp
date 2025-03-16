import { Link } from "@remix-run/react"
import React from "react"
import { cn } from "~/lib/utils"
import { AnimatePresence, motion } from "motion/react"
import { Card, CardDescription, CardTitle } from "./card"

export const HoverEffect = ({
    items,
    className,
}: {
    items: {
        title: string
        description: string
        link: string
    }[]
    className?: string
}) => {
    const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
    return (
        <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 py-10", className)}>
            {items.map((item, index) => (
                <Link to={item?.link}
                    key={item?.link} className="relative group block p-2 h-full w-full" onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}>
                    <AnimatePresence>
                        {hoveredIndex === index && (
                            <motion.span
                                className="absolute inset-0 h-full w-full bg-neutral-200 dark:bg-slate-800/[0.8] block  rounded-3xl"
                                layoutId="hoverBackground"
                                initial={{ opacity: 0 }}
                                animate={{
                                    opacity: 1,
                                    transition: { duration: 0.15 },
                                }}
                                exit={{
                                    opacity: 0,
                                    transition: { duration: 0.15, delay: 0.2 },
                                }}
                            />
                        )}
                    </AnimatePresence>
                    <Card>
                        <CardTitle>{item.title}</CardTitle>
                        <CardDescription>{item.description}</CardDescription>
                    </Card>
                </Link>
            ))}
        </div>
    );
}