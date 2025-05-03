import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
} from "recharts"
import { Skeleton } from "~/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs"
import { fetchLevelsStats } from "~/lib/services/statistics";
import { PieStat } from "~/lib/types/statistics/stat";

const data = [
    { name: "Beginner", value: 94, color: "#0c4a6e" },  // sky-900
    { name: "Pre-Intermediate", value: 28, color: "#0369a1" }, // sky-800
    { name: "Intermediate", value: 12, color: "#0284c7" }, // sky-700
    { name: "Advanced", value: 8, color: "#0ea5e9" },     // sky-500 (for contrast)
]

export default function LevelChart({
    idToken
}: {
    idToken: string
}) {

    const [currentTab, setCurrentTab] = useState<string>("classes");

    const { data, isLoading, isError } = useQuery({
        queryKey: ['levels-stats'],
        queryFn: async () => {
            const response = await fetchLevelsStats({
                idToken,
                filterBy: currentTab
            });

            return await response.data;
        },
        enabled: true,
        refetchOnWindowFocus: false
    });

    const stats = data ? data as PieStat[] : [];

    if (isLoading) {
        return <Skeleton className="h-full w-full" />
    }

    return (
        <>
            <div className="flex justify-end">
                <Tabs value={currentTab} className="">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="classes" onClick={() => setCurrentTab('classes')}>Classes</TabsTrigger>
                        <TabsTrigger value="learners" onClick={() => setCurrentTab('learners')}>Learners</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                        data={stats}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#0369a1"
                        dataKey="value"
                        label={({ name, percent }) =>
                            percent > 0.005 ? `${name} ${(percent * 100).toFixed(0)}%` : ""
                        }
                    >
                        {stats.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color || '#ffffff'} />
                        ))}
                    </Pie>

                    <Tooltip />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </>
    )
}
