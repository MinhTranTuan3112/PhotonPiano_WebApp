import { useEffect, useState } from "react"
import { Badge } from "~/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog"
import type { Level } from "~/lib/types/account/account"
import type { Class, Class as ClassType } from "~/lib/types/class/class"
import { CLASS_STATUS } from "~/lib/utils/constants"
import { Clock, User, Calendar, TriangleAlert, Loader2 } from "lucide-react"
import { useFetcher, useNavigate } from "@remix-run/react"
import { useConfirmationDialog } from "~/hooks/use-confirmation-dialog"
import useLoadingDialog from "~/hooks/use-loading-dialog"
import { ActionResult } from "~/lib/types/action-result"
import { toast } from "sonner"
import { toastWarning } from "~/lib/utils/toast-utils"
import { useQuery } from "@tanstack/react-query"
import { fetchMergableClasses } from "~/lib/services/class"
import { Button } from "~/components/ui/button"


type Props = {
    // classes: ClassType[] // Changed to array for multiple classes
    isOpen: boolean
    setIsOpen: (isOpen: boolean) => void,
    scheduleDescription?: string,
    classId: string;
    idToken: string;
}

function ClassStatusBadge({
    status,
}: {
    status: number
}) {
    return (
        <Badge variant={"outline"} className={`${getStatusStyle(status)} uppercase`}>
            {CLASS_STATUS[status]}
        </Badge>
    )
}

function LevelBadge({
    level,
}: {
    level: Level
}) {
    return (
        <Badge
            variant={"outline"}
            className={`uppercase`}
            style={{
                backgroundColor: `${level.themeColor}33`, // 20% opacity
                color: level.themeColor,
            }}
        >
            {level.name.split("(")[0]}
        </Badge>
    )
}

const getStatusStyle = (status: number) => {
    switch (status) {
        case 0:
            return "text-gray-500 font-semibold"
        case 1:
            return "text-green-500 font-semibold"
        case 2:
            return "text-blue-400 font-semibold"
        case 3:
            return "text-red-400 font-semibold"
        default:
            return "text-black font-semibold"
    }
}

function ClassCard({
    classItem,
    isSelected,
    onSelect,
}: {
    classItem: ClassType
    isSelected: boolean
    onSelect: () => void
}) {
    return (
        <Card className={`w-full hover:shadow-md transition-all ${isSelected ? "border-primary border-2" : ""}`}>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <CardTitle className="text-lg font-semibold">{classItem.name}</CardTitle>
                    <div className="flex gap-2">
                        <LevelBadge level={classItem.level} />
                        <ClassStatusBadge status={classItem.status} />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                {classItem.instructor && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span>{classItem.instructor.userName || "Instructor"}</span>
                    </div>
                )}

                {classItem.startTime && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{classItem.startTime}</span>
                    </div>
                )}

                {classItem.scheduleDescription && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{classItem.scheduleDescription}</span>
                    </div>
                )}

                <div className="pt-2">
                    <button
                        onClick={onSelect}
                        className={`px-4 py-2 rounded-md w-full transition-colors ${isSelected ? "bg-theme text-theme-foreground" : "bg-secondary hover:bg-secondary/80"
                            }`}
                    >
                        {isSelected ? "Selected" : "Select"}
                    </button>
                </div>
            </CardContent>
        </Card>
    )
}

function isSubsetOrEqual(str1: string, str2: string): boolean {
    const set1 = new Set(str1.split(";").map(s => s.trim()));
    const set2 = new Set(str2.split(";").map(s => s.trim()));

    const isSubset = (a: Set<string>, b: Set<string>): boolean => {
        for (const item of a) {
            if (!b.has(item)) return false;
        }
        return true;
    };

    return isSubset(set1, set2) || isSubset(set2, set1);
}

function ScheduleWarning({ scheduleDecription, selectedClass }: { scheduleDecription?: string, selectedClass: Class | null }) {
    return (
        !isSubsetOrEqual(scheduleDecription || "", selectedClass?.scheduleDescription || "") && (
            <div className="my-2 p-4 rounded-lg bg-yellow-200 text-yellow-600 border-l-4 border-yellow-600 ">
                <div className="flex gap-2 items-center">
                    <TriangleAlert />
                    <div>Different schedule warning!</div>
                </div>
                <div className="text-sm">
                    <div>- Old Class : {scheduleDecription}</div>
                    <div>- New Class : {selectedClass?.scheduleDescription}</div>
                </div>
            </div>
        )
    )
}

export default function MergeClassDialog({ isOpen, setIsOpen, scheduleDescription, classId, idToken }: Props) {

    const fetcher = useFetcher<ActionResult>();

    const { data, isLoading, isError } = useQuery({
        queryKey: ['mergeable-classes', classId],
        queryFn: async () => {
            const response = await fetchMergableClasses({ classId, idToken });

            return await response.data;
        },
        enabled: !!classId && isOpen,
        refetchOnWindowFocus: false
    });

    const classes = data ? data as ClassType[] : [];

    const [selectedClass, setSelectedClass] = useState<Class | null>(null)

    const handleSelect = (selectedClass: Class) => {
        setSelectedClass(selectedClass)
        handleOpenModal()
    }


    const { open: handleOpenModal, dialog: confirmDialog } = useConfirmationDialog({
        title: 'Confirm Merging',
        description: 'Are you sure you want to merge into this class? This class will also be deleted!',
        confirmText: 'Merge',
        confirmButtonClassname: 'bg-theme',
        onConfirm: () => {
            const formData = new FormData();
            formData.append("action", "MERGE");
            formData.append("sourceClassId", classId);
            formData.append("destClassId", selectedClass?.id || "");

            fetcher.submit(formData, {
                method: "POST",
                action: "/endpoint/classes"
            })
            setIsOpen(false)
        },
        content: <ScheduleWarning scheduleDecription={scheduleDescription} selectedClass={selectedClass} />
    });

    const navigate = useNavigate()

    useEffect(() => {

        if (fetcher.data?.success === true) {
            toast.success("Merged successfully");
            navigate(`/staff/classes`)
            return;
        }

        if (fetcher.data?.success === false) {
            toastWarning(fetcher.data.error, {
                position: 'top-center',
                duration: 5000
            });
            return;
        }

        return () => {

        }
    }, [fetcher.data]);
    return isLoading ? <Loader2 className='animate-spin' />: (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="min-w-[700px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Mergable Classes</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                    {classes.length > 0 ? (
                        classes.map((classItem, index) => (
                            <ClassCard
                                key={index}
                                classItem={classItem}
                                isSelected={selectedClass?.id === classItem.id}
                                onSelect={() => handleSelect(classItem)}
                            />
                        ))
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">No classes available for merging</div>
                    )}
                </div>
                {confirmDialog}
            </DialogContent>
        </Dialog>
    )
}
