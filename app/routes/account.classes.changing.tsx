import { zodResolver } from "@hookform/resolvers/zod"
import { type ActionFunctionArgs, type LoaderFunctionArgs, redirect } from "@remix-run/node"
import { Await, Form, useFetcher, useLoaderData, useLocation, useNavigate, useSearchParams } from "@remix-run/react"
import { ArrowLeftCircle, TriangleAlert, Calendar, User, Clock, Users, Shuffle, Search } from "lucide-react"
import { FormEventHandler, Suspense, useState } from "react"
import { useRemixForm } from "remix-hook-form"
import { number, z } from "zod"
import { Button } from "~/components/ui/button"
import { Badge } from "~/components/ui/badge"
import PaginationBar from "~/components/ui/pagination-bar"
import { Skeleton } from "~/components/ui/skeleton"
import { useConfirmationDialog } from "~/hooks/use-confirmation-dialog"
import useLoadingDialog from "~/hooks/use-loading-dialog"
import { fetchAccountDetail } from "~/lib/services/account"
import { fetchChangeAClass, fetchClasses } from "~/lib/services/class"
import { fetchSystemConfigByName, fetchSystemConfigServerTime } from "~/lib/services/system-config"
import { type AccountDetail, Role } from "~/lib/types/account/account"
import type { ActionResult } from "~/lib/types/action-result"
import type { Class } from "~/lib/types/class/class"
import type { SystemConfig } from "~/lib/types/config/system-config"
import type { PaginationMetaData } from "~/lib/types/pagination-meta-data"
import { requireAuth } from "~/lib/utils/auth"
import { DEADLINE_CHANGING_CLASS } from "~/lib/utils/config-name"
import { getErrorDetailsInfo } from "~/lib/utils/error"
import { formEntryToString } from "~/lib/utils/form"
import { currentTeacher } from "~/lib/test-data"
import { useAuth } from "~/lib/contexts/auth-context"
import { Input } from "~/components/ui/input"
import { trimQuotes } from "~/lib/utils/url"

export async function loader({ request }: LoaderFunctionArgs) {
    const { idToken, role, accountId } = await requireAuth(request)

    if (role !== Role.Student || !accountId) {
        return redirect("/")
    }

    const { searchParams } = new URL(request.url)

    const promise = fetchAccountDetail(accountId, idToken).then((response) => {
        const currentAccount = response.data as AccountDetail

        return currentAccount
    })

    const deadline = await fetchSystemConfigByName({ name: DEADLINE_CHANGING_CLASS, idToken }).then((res) => {
        return res.data as SystemConfig
    })

    const query = {
        page: Number.parseInt(searchParams.get("page") || "1"),
        pageSize: Number.parseInt(searchParams.get("size") || "10"),
        sortColumn: searchParams.get("column") || "CreatedAt",
        orderByDesc: searchParams.get("desc") === "true" ? false : true,
        keyword: trimQuotes(searchParams.get("keyword") || ""),
        statuses: [0],
        isPublic: true,
        idToken: idToken,
        forClassChanging: true
    }
    const classPromise = fetchClasses({ ...query }).then((response) => {
        const classes: Class[] = response.data
        const headers = response.headers

        const metadata: PaginationMetaData = {
            page: Number.parseInt(headers["x-page"] || "1"),
            pageSize: Number.parseInt(headers["x-page-size"] || "9"),
            totalPages: Number.parseInt(headers["x-total-pages"] || "1"),
            totalCount: Number.parseInt(headers["x-total-count"] || "0"),
        }

        return {
            classes,
            metadata,
        }
    })


    const serverTimeRes = await fetchSystemConfigServerTime({ idToken })
    const currentServerDateTime = serverTimeRes.data

    return {
        promise,
        classPromise,
        query,
        idToken,
        deadline,
        currentServerDateTime,
    }
}

export async function action({ request }: ActionFunctionArgs) {
    try {
        const formData = await request.formData()
        const studentId = formEntryToString(formData.get("studentId"))
        const oldClassId = formEntryToString(formData.get("oldClassId"))
        const newClassId = formEntryToString(formData.get("newClassId"))
        const { idToken: token } = await requireAuth(request)

        if (!token) {
            return {
                success: false,
                error: "Unauthorized.",
                status: 401,
            }
        }
        console.log(studentId, oldClassId, newClassId)
        if (!studentId || !oldClassId || !newClassId) {
            return {
                success: false,
                error: "Invalid Data.",
                status: 400,
            }
        }

        await fetchChangeAClass({
            newClassId: newClassId,
            oldClassId: oldClassId,
            studentId: studentId,
            idToken: token,
        })

        return {
            success: true,
        }
    } catch (err) {
        const error = getErrorDetailsInfo(err)
        return {
            success: false,
            error: error.message,
            status: error.status,
        }
    }
}

export default function AccountClassChanging() {
    const { promise, deadline, currentServerDateTime, classPromise, query } = useLoaderData<typeof loader>()
    const [changeClassData, setChangeClassData] = useState<{
        newClassId?: string,
        oldClassId?: string,
        studentId?: string
    }>({})
    const navigate = useNavigate()
    const fetcher = useFetcher<ActionResult>()

    // const changeClassSchema = z.object({
    //     studentId: z.string(),
    //     oldClassId: z.string(),
    //     newClassId: z.string(),
    // })

    // type ChangeClassSchema = z.infer<typeof changeClassSchema>
    // const resolver = zodResolver(changeClassSchema)

    const { loadingDialog } = useLoadingDialog({
        fetcher,
        action: () => {
            navigate("/account/classes")
        },
    })

    const { open: handleOpenModal, dialog: confirmDialog } = useConfirmationDialog({
        title: "Confirm Changing New Class",
        description: "Are you sure want to change to this class?",
        onConfirm: () => {
            fetcher.submit(changeClassData, {
                method: "POST",
            })
        },
    })

    function prepareSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault(); // Prevent default form submission

        const form = event.currentTarget;
        const formData = new FormData(form);

        const studentId = formData.get("studentId") as string;
        const oldClassId = formData.get("oldClassId") as string;
        const newClassId = formData.get("newClassId") as string;
        setChangeClassData({ newClassId, oldClassId, studentId })
        handleOpenModal();
    }

    // const {
    //     handleSubmit,
    //     formState: { errors },
    //     register,
    //     control,
    // } = useRemixForm<ChangeClassSchema>({
    //     mode: "onSubmit",
    //     resolver,
    //     fetcher,
    // })
    const getDeadlineDate = (date: string, deadline: SystemConfig): Date => {
        const deadlineDate = new Date(date)
        deadlineDate.setDate(deadlineDate.getDate() - Number.parseInt(deadline.configValue))
        return deadlineDate

    }
    // Function to check if registration is still open
    const isRegistrationOpen = (deadline: SystemConfig, currentTime: string, currentClassStartDate: string, currentClass?: Class) => {
        if (currentClass) {
            if (currentClass.status === 1) {
                return true;
            } else if (currentClass.status === 2) {
                return false;
            }
        }

        if (!deadline || !deadline.configValue) return false

        const currentDate = new Date(currentTime)

        return currentDate < getDeadlineDate(currentClassStartDate, deadline)
    }

    // Status badge component
    const StatusBadge = ({ status }: { status: number }) => {
        let color = ""
        let text = ""

        switch (status) {
            case 0:
                color = "bg-gray-100 text-gray-800"
                text = "Not Started"
                break
            case 1:
                color = "bg-green-100 text-green-800"
                text = "On Going"
                break
            case 2:
                color = "bg-blue-100 text-blue-800"
                text = "Finished"
                break
            default:
                color = "bg-red-100 text-red-800"
                text = "Cancelled"
        }

        return <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>{text}</span>
    }

    // Empty state component
    const EmptyState = () => (
        <div className="text-center py-12 bg-sky-50 rounded-lg mt-8">
            <div className="mx-auto w-24 h-24 bg-sky-100 rounded-full flex items-center justify-center mb-4">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-12 w-12 text-sky-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                </svg>
            </div>
            <h3 className="text-xl font-medium text-sky-800">No Classes Available</h3>
            <p className="text-sky-600 mt-2">There are currently no piano classes available for registration.</p>
        </div>
    )

    // Class card component
    const ClassCard = ({ classItem, currentAccount, isOpen }: { classItem: Class; currentAccount: AccountDetail, isOpen: boolean }) => {
        const availableSlots = classItem.capacity - classItem.studentNumber
        const progressPercentage = (classItem.studentNumber / classItem.capacity) * 100
        const isCurrentClass = currentAccount.currentClass?.id === classItem.id

        return (
            <div className="bg-gradient-to-br from-sky-50 to-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-sky-100">
                <div className="flex flex-col md:flex-row justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-xl font-bold text-sky-900">{classItem.name}</h3>
                            <StatusBadge status={classItem.status} />
                            {isCurrentClass && <Badge className="bg-sky-200 text-sky-800">Current</Badge>}
                        </div>

                        <div className="space-y-2 text-sky-700">
                            <p className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                <span className="font-medium">Instructor:</span>
                                {classItem.instructorName || classItem.instructor?.fullName || "Not assigned"}
                            </p>

                            {classItem.scheduleDescription && (
                                <p className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    <span className="font-medium">Schedule:</span>
                                    {classItem.scheduleDescription}
                                </p>
                            )}

                            {classItem.startTime && (
                                <p className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    <span className="font-medium">Start Time:</span>
                                    {new Date(classItem.startTime).toLocaleDateString()}
                                </p>
                            )}

                            <div className="flex items-center gap-2">
                                <Badge className="bg-sky-600 hover:bg-sky-700">{classItem.level.name}</Badge>
                            </div>

                            <p className="flex items-center gap-2">
                                <span className="font-medium">Total slots:</span>
                                {classItem.requiredSlots} / {classItem.totalSlots}
                            </p>
                        </div>
                    </div>

                    <div className="mt-4 md:mt-0 md:ml-6 flex flex-col items-end justify-between">
                        <div className="text-right mb-4">
                            <p className="text-sm text-sky-600">
                                <Users className="h-4 w-4 inline mr-1" />
                                <span className="font-bold">{classItem.studentNumber}</span> / {classItem.capacity} students
                            </p>
                            <p className="text-sm text-sky-600">
                                <span className="font-bold text-lg">{availableSlots}</span> slots available
                            </p>
                        </div>



                        <Button
                            type="submit"
                            // onClick={() => handleClassSelection(classItem.id, currentAccount)}
                            className="bg-sky-500 hover:bg-sky-600 text-white"
                            disabled={availableSlots <= 0 || classItem.status !== 0 || isCurrentClass || !isOpen}
                        >
                            {isCurrentClass
                                ? "Current Class"
                                : availableSlots > 0 && classItem.status === 0
                                    ? "Change to this Class"
                                    : "Full"}
                        </Button>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="mt-4 w-full bg-sky-100 rounded-full h-2.5">
                    <div className="bg-sky-500 h-2.5 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
                </div>
            </div>
        )
    }

    // Filter component
    const ClassFilters = ({ defaultKeyword }: { defaultKeyword?: string }) => {

        const { pathname } = useLocation();

        const searchSchema = z.object({
            keyword: z.string().optional(),
        });

        type SearchFormData = z.infer<typeof searchSchema>;

        const {
            handleSubmit,
            formState: { errors, isSubmitting },
            control,
            register
        } = useRemixForm<SearchFormData>({
            mode: 'onSubmit',
            resolver: zodResolver(searchSchema)
        })

        return (
            <Form method='GET' action={pathname} onSubmit={handleSubmit}>
                <div className="bg-sky-50 p-4 rounded-lg mb-6 shadow-sm">
                    <div className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-sm font-medium text-sky-700 mb-1">Search</label>
                            <Input
                                {...register('keyword')}
                                defaultValue={defaultKeyword}
                                placeholder="Search by class name, schedule..."
                                className="w-full p-2 border border-sky-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                            />
                        </div>
                        <div className="flex items-end">
                            <Button variant={"theme"} type="submit" iconPlacement="left" Icon={Search}
                                isLoading={isSubmitting}
                                disabled={isSubmitting}>
                                Search
                            </Button>
                        </div>

                        {/* <div className="w-full sm:w-auto">
                        <label className="block text-sm font-medium text-sky-700 mb-1">Availability</label>
                        <select
                            className="w-full p-2 border border-sky-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                            onChange={(e) => onFilterChange({ availability: e.target.value })}
                        >
                            <option value="">All Classes</option>
                            <option value="available">Available Slots</option>
                            <option value="full">Full Classes</option>
                        </select>
                    </div> */}
                    </div>
                </div>
            </Form>

        )
    }

    const [searchParams, setSearchParams] = useSearchParams()

    return (
        <div>
            <Button
                className="m-4 bg-white text-sky-700 border border-sky-200 hover:bg-sky-50"
                onClick={() => navigate(-1)}
                iconPlacement="left"
                Icon={ArrowLeftCircle}
                variant={"outline"}
            >
                Go Back
            </Button>
            <div className="py-4 w-full mx-auto px-8">
                {/* Page Header */}
                <div className="flex items-center gap-3 mb-4">
                    <Shuffle className="h-8 w-8 text-sky-600" />
                    <div>
                        <h3 className="text-2xl font-bold text-sky-800">Changing Class</h3>
                        <p className="text-sm text-sky-600">Change to a piano class that best suits your schedule and learning goals!</p>
                    </div>
                </div>
                {/* Classes List */}
                <Suspense fallback={<div>Loading account details...</div>}>
                    <Await resolve={promise}>
                        {(data) => (
                            <Suspense fallback={<LoadingSkeleton />}>
                                <Await resolve={classPromise}>
                                    {(classesData) => {
                                        const registrationOpen = isRegistrationOpen(deadline, currentServerDateTime, data.currentClass?.startTime || "", data.currentClass)
                                        const deadlineDate = getDeadlineDate(data.currentClass?.startTime || "", deadline)
                                        return (
                                            <>
                                                {/* Deadline Notice */}
                                                {
                                                    data.currentClass && data.currentClass.status == 0 ? (
                                                        deadline && deadline.configValue && (
                                                            <div
                                                                className={`border-l-4 p-4 mb-6 rounded-r-lg ${registrationOpen ? "bg-sky-100 border-sky-500" : "bg-red-100 border-red-500"
                                                                    }`}
                                                            >
                                                                <div className="flex">
                                                                    <div className="flex-shrink-0">
                                                                        <TriangleAlert
                                                                            className={`h-5 w-5 ${registrationOpen ? "text-sky-500" : "text-red-500"}`}
                                                                        />
                                                                    </div>
                                                                    <div className="ml-3">
                                                                        <p className={`text-sm ${registrationOpen ? "text-sky-700" : "text-red-700"}`}>
                                                                            Registration deadline:{" "}
                                                                            <span className="font-medium">
                                                                                {deadlineDate.toLocaleDateString("en-US", {
                                                                                    year: "numeric",
                                                                                    month: "long",
                                                                                    day: "numeric",
                                                                                    hour: "2-digit",
                                                                                    minute: "2-digit",
                                                                                })}
                                                                            </span>
                                                                            {!registrationOpen && (
                                                                                <span className="block font-bold mt-1">Registration is now closed</span>
                                                                            )}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )
                                                    ) : data.currentClass && data.currentClass.status == 1 ? (
                                                        <div
                                                            className={`border-l-4 p-4 mb-6 rounded-r-lg bg-sky-100 border-sky-500`}
                                                        >
                                                            <div className="flex">
                                                                <div className="flex-shrink-0">
                                                                    <TriangleAlert
                                                                        className={`h-5 w-5 text-sky-500`}
                                                                    />
                                                                </div>
                                                                <div className="ml-3">
                                                                    <p className={`text-sm text-sky-700"`}>
                                                                        <span className="block font-bold mt-1">You can only change to class that have same amount of not started slots to your current class</span>
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                    ) : (
                                                        <div
                                                            className={`border-l-4 p-4 mb-6 rounded-r-lg bg-yellow-100 border-yellow-500`}
                                                        >
                                                            <div className="flex">
                                                                <div className="flex-shrink-0">
                                                                    <TriangleAlert
                                                                        className={`h-5 w-5 text-yellow-500`}
                                                                    />
                                                                </div>
                                                                <div className="ml-3">
                                                                    <p className={`text-sm text-yellow-700"`}>
                                                                        <span className="block font-bold mt-1">You can not change to any class right now!</span>
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                }

                                                {/* Filters */}
                                                <ClassFilters defaultKeyword={query.keyword} />

                                                {/* Class List */}
                                                {classesData.classes.length > 0 ? (
                                                    <div className="space-y-4 mt-8">
                                                        {classesData.classes.map((classItem) => (
                                                            <Form onSubmit={prepareSubmit} key={classItem.id}>
                                                                <input type="hidden" name="studentId" value={data.accountFirebaseId} />
                                                                <input type="hidden" name="oldClassId" value={data.currentClass?.id || ""} />
                                                                <input type="hidden" name="newClassId" value={classItem.id} />
                                                                <ClassCard
                                                                    classItem={classItem}
                                                                    currentAccount={data}
                                                                    isOpen={registrationOpen}
                                                                />
                                                            </Form>
                                                        ))}

                                                        {/* Pagination */}
                                                        <div className="mt-6">
                                                            <PaginationBar
                                                                currentPage={classesData.metadata.page}
                                                                totalPages={classesData.metadata.totalPages}
                                                            />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <EmptyState />
                                                )}
                                            </>
                                        )
                                    }}
                                </Await >
                            </Suspense>
                        )}
                    </Await>
                </Suspense>
            </div>
            {loadingDialog}
            {confirmDialog}
        </div >
    )
}

/* Skeleton Loading Component */
function LoadingSkeleton() {
    return (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
                <Skeleton key={index} className="h-[120px] w-full rounded-lg" />
            ))}
        </div>
    )
}
