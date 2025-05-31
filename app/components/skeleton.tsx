import { Card, CardContent, CardHeader } from "./ui/card"
import { Skeleton } from "./ui/skeleton"

export function HeroSkeleton() {
    return (
        <div className="relative h-[400px] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-gray-300 to-gray-400 animate-pulse"></div>
            <div className="relative container mx-auto h-full flex items-center z-10 px-4">
                <div className="flex items-center justify-between w-full">
                    <div className="max-w-3xl flex-1">
                        <Skeleton className="h-6 w-32 mb-4 bg-white/20" />
                        <Skeleton className="h-12 w-96 mb-4 bg-white/20" />
                        <Skeleton className="h-6 w-full max-w-2xl mb-6 bg-white/20" />
                        <div className="flex gap-2 mb-16">
                            <Skeleton className="h-6 w-20 bg-white/20" />
                            <Skeleton className="h-6 w-24 bg-white/20" />
                            <Skeleton className="h-6 w-16 bg-white/20" />
                            <Skeleton className="h-6 w-28 bg-white/20" />
                        </div>
                    </div>
                    <div className="hidden lg:block flex-1">
                        <Skeleton className="h-48 w-80 ml-auto bg-white/20" />
                    </div>
                </div>
            </div>
        </div>
    )
}

export function StatsCardsSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12 mb-12">
            {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="border-0 shadow-xl">
                    <CardHeader className="pb-2">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <Skeleton className="h-6 w-32" />
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-4 w-16" />
                        </div>
                        <div className="flex justify-between items-center">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-6 w-20" />
                        </div>
                        <Skeleton className="h-3 w-full" />
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

export function SkillsSkeleton() {
    return (
        <div className="mb-16">
            <div className="flex items-center gap-2 mb-6">
                <Skeleton className="h-10 w-1 rounded-full" />
                <Skeleton className="h-6 w-6" />
                <Skeleton className="h-8 w-48" />
            </div>
            <Card className="overflow-hidden border-0 shadow-lg">
                <div className="h-1 bg-gray-200 animate-pulse"></div>
                <CardContent className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="flex gap-3 p-3">
                                <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                                <Skeleton className="h-6 w-full mt-1.5" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export function ClassesTableSkeleton() {
    return (
        <div className="mb-16">
            <div className="flex items-center gap-2 mb-6">
                <Skeleton className="h-10 w-1 rounded-full" />
                <Skeleton className="h-6 w-6" />
                <Skeleton className="h-8 w-48" />
            </div>
            <Card className="border-0 shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 border-b">
                                <th className="text-left py-4 px-6">
                                    <Skeleton className="h-4 w-20" />
                                </th>
                                <th className="text-left py-4 px-6">
                                    <Skeleton className="h-4 w-16" />
                                </th>
                                <th className="text-left py-4 px-6">
                                    <Skeleton className="h-4 w-20" />
                                </th>
                                <th className="text-left py-4 px-6">
                                    <Skeleton className="h-4 w-16" />
                                </th>
                                <th className="text-left py-4 px-6">
                                    <Skeleton className="h-4 w-20" />
                                </th>
                                <th className="text-left py-4 px-6">
                                    <Skeleton className="h-4 w-20" />
                                </th>
                                <th className="text-left py-4 px-6">
                                    <Skeleton className="h-4 w-12" />
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <tr key={i}>
                                    <td className="py-4 px-6">
                                        <Skeleton className="h-4 w-32 mb-1" />
                                        <Skeleton className="h-3 w-20" />
                                    </td>
                                    <td className="py-4 px-6">
                                        <Skeleton className="h-4 w-12 mb-1" />
                                        <Skeleton className="h-1.5 w-24" />
                                    </td>
                                    <td className="py-4 px-6">
                                        <Skeleton className="h-4 w-20" />
                                    </td>
                                    <td className="py-4 px-6">
                                        <Skeleton className="h-4 w-20" />
                                    </td>
                                    <td className="py-4 px-6">
                                        <Skeleton className="h-4 w-16" />
                                    </td>
                                    <td className="py-4 px-6">
                                        <Skeleton className="h-6 w-20 rounded-lg" />
                                    </td>
                                    <td className="py-4 px-6">
                                        <Skeleton className="h-8 w-20 rounded" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    )
}

export function RequirementsSkeleton() {
    return (
        <div className="mb-16">
            <div className="flex items-center gap-2 mb-6">
                <Skeleton className="h-10 w-1 rounded-full" />
                <Skeleton className="h-6 w-6" />
                <Skeleton className="h-8 w-48" />
            </div>
            <Card className="border-0 shadow-lg overflow-hidden">
                <div className="h-1 bg-gray-200 animate-pulse"></div>
                <CardContent className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
                                <div className="flex items-center gap-3 mb-3">
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <Skeleton className="h-6 w-24" />
                                </div>
                                <Skeleton className="h-8 w-12 mb-2" />
                                <Skeleton className="h-4 w-full" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export function CTASkeleton() {
    return (
        <div className="relative overflow-hidden rounded-2xl mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-gray-300 to-gray-400 animate-pulse"></div>
            <div className="relative z-10 p-12 text-center">
                <Skeleton className="h-8 w-96 mx-auto mb-4 bg-white/20" />
                <Skeleton className="h-6 w-full max-w-2xl mx-auto mb-8 bg-white/20" />
                <Skeleton className="h-12 w-32 mx-auto bg-white/20" />
            </div>
        </div>
    )
}

export function LevelDetailsSkeleton() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <HeroSkeleton />
            <div className="container mx-auto py-12 px-4 max-w-7xl">
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-6">
                        <Skeleton className="h-10 w-1 rounded-full" />
                        <Skeleton className="h-6 w-6" />
                        <Skeleton className="h-8 w-48" />
                    </div>
                </div>
                <StatsCardsSkeleton />
                <SkillsSkeleton />
                <ClassesTableSkeleton />
                <RequirementsSkeleton />
                <CTASkeleton />
            </div>
        </div>
    )
}
