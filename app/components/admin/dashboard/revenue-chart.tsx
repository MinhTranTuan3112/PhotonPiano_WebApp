import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    TooltipProps,
    XAxis,
    YAxis,
} from "recharts"
import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"
import { useQuery } from "@tanstack/react-query"
import { fetchMonthlyRevenueStats } from "~/lib/services/statistics"
import { Stat } from "~/lib/types/statistics/stat"
import { Skeleton } from "~/components/ui/skeleton"
import { formatPrice } from "~/lib/utils/price"

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-background border border-border rounded-lg shadow-lg p-3">
                <p className="text-sm font-medium text-foreground">{`Month: ${label}`}</p>
                <p className="text-sm text-muted-foreground">
                    <span className="inline-block w-3 h-3 bg-sky-800 rounded-full mr-2"></span>
                    {`${formatPrice(payload[0].value as number)} đ`}
                </p>
            </div>
        )
    }
    return null
}

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

            <ResponsiveContainer width="100%" height={500}>
                <AreaChart data={filteredData} className="px-2">
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
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => formatPrice(value as number) + " đ"}
                    />
                    <Tooltip content={<CustomTooltip />} />
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
