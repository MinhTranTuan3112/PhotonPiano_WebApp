import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts"
import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"
import { useQuery } from "@tanstack/react-query"
import { fetchMonthlyRevenueStats } from "~/lib/services/statistics"
import { Stat } from "~/lib/types/statistics/stat"
import { Skeleton } from "~/components/ui/skeleton"

export default function RevenueChart({
    idToken
}: {
    idToken: string
}) {

    const { data, isLoading, isError } = useQuery({
        queryKey: ['revenue'],
        queryFn: async () => {
            const response = await fetchMonthlyRevenueStats({
                idToken,
                year: new Date().getFullYear()
            });

            return await response.data;
        },
        enabled: true,
        refetchOnWindowFocus: false
    })

    const stats = data ? data as Stat[] : [];

    const months = ["All", ...stats.map((item) => item.name)]

    const [selectedMonth, setSelectedMonth] = useState("All")

    const filteredData =
        selectedMonth === "All"
            ? stats
            : stats.filter((d) => d.name === selectedMonth)

    if (isLoading) {
        return <Skeleton className="h-full w-full" />
    }
    console.log(filteredData)
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-end space-x-2">
                <span className="text-sm text-muted-foreground">Filter by month:</span>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Select a month" />
                    </SelectTrigger>
                    <SelectContent>
                        {months.map((month) => (
                            <SelectItem key={month} value={month}>
                                {month}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={filteredData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                        dataKey="name"
                        stroke="#64748b"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        dataKey="value"
                        stroke="#64748b"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value} VND`}
                    />
                    <Tooltip />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#0369a1" // sky-800
                        fill="url(#colorTotal)"
                        strokeWidth={2}
                    />
                    <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0c4a6e" stopOpacity={0.4} /> {/* sky-900 */}
                            <stop offset="95%" stopColor="#0369a1" stopOpacity={0.05} /> {/* sky-800 */}
                        </linearGradient>
                    </defs>
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}
