import { zodResolver } from "@hookform/resolvers/zod"
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node"
import {
    Await,
    isRouteErrorResponse,
    Link,
    redirect,
    useFetcher,
    useLoaderData,
    useLocation,
    useRouteError,
} from "@remix-run/react"
import { RotateCcw, Settings, AlertTriangle, CheckCircle2 } from "lucide-react"
import { Suspense } from "react"
import { getValidatedFormData } from "remix-hook-form"
import { z } from "zod"
import ClassesConfigForm, {
    type ClassSettingsFormData,
    classSettingsSchema,
} from "~/components/settings/classes-config-form"
import EntranceTestConfigForm, {
    type EntranceTestSettingsFormData,
    entranceTestSettingsSchema,
} from "~/components/settings/entrance-test-form"
import { buttonVariants } from "~/components/ui/button"
import { Skeleton } from "~/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import {
    fetchSystemConfigs,
    fetchUpdateClassSystemConfig,
    fetchUpdateEntranceTestSystemConfig,
    fetchUpdateRefundTuitionSystemConfig,
    fetchUpdateSchedulerSystemConfig,
    fetchUpdateSurveySystemConfig,
    fetchUpdateTuitionSystemConfig,
} from "~/lib/services/system-config"
import type { SystemConfig } from "~/lib/types/config/system-config"
import { requireAuth } from "~/lib/utils/auth"
import {
    ALLOW_ENTRANCE_TEST_REGISTERING,
    ALLOW_SKIPPING_LEVEL,
    ATTENDANCE_DEADLINE,
    DEADLINE_CHANGING_CLASS,
    ENTRANCE_SURVEY,
    INSTRUMENT_FREQUENCY_IN_RESPONSE,
    INSTRUMENT_NAME,
    MAX_ABSENCE_RATE,
    MAX_QUESTIONS_PER_SURVEY,
    MAX_STUDENTS,
    MAX_STUDENTS_IN_TEST,
    MIN_QUESTIONS_PER_SURVEY,
    MIN_STUDENTS,
    MIN_STUDENTS_IN_TEST,
    PAYMENT_DEADLINE_DAYS,
    PAYMENT_REMINDER_DAY,
    REASON_CANCEL_SLOT,
    REFUND_REASON,
    TAX_RATE_2025,
    TEST_FEE,
    TRIAL_SESSION_COUNT,
} from "~/lib/utils/config-name"
import { getErrorDetailsInfo } from "~/lib/utils/error"
import { useEffect } from "react"
import { toast } from "sonner"
import SurveyConfigForm, {
    type SurveyConfigFormData,
    surveyConfigSchema,
} from "~/components/settings/survey-config-form"
import { Role } from "~/lib/types/account/account"
import TuitionConfigForm, {
    type TuitionConfigFormData,
    tuitionConfigSchema,
} from "~/components/settings/tuition-config-form"
import SchedulerConfigForm, {
    type SchedulerConfigFormData,
    schedulerConfigSchema,
} from "~/components/settings/scheduler-config-form"
import { toastWarning } from "~/lib/utils/toast-utils"
import { fetchLevels } from "~/lib/services/level"
import LevelGpaConfigForm from "~/components/settings/levels-config-form"

type Props = {}

export async function loader({ params, request }: LoaderFunctionArgs) {
    try {
        const { idToken, role } = await requireAuth(request)

        if (role !== Role.Administrator) {
            return redirect("/")
        }

        const { searchParams } = new URL(request.url)

        const promise = fetchSystemConfigs({ idToken }).then((res) => {
            return res.data as SystemConfig[]
        })

        const levelsPromise = fetchLevels().then((res) => {
            return res.data || []
        })
        return {
            promise,
            idToken,
            levelsPromise,
        }
    } catch (error) {
        console.error({ error })
        const { message, status } = getErrorDetailsInfo(error)
        throw new Response(message, { status })
    }
}

const settingsSchema = z
    .object({
        module: z.string(),
    })
    .merge(entranceTestSettingsSchema.partial())
    .merge(classSettingsSchema.partial())
    .merge(surveyConfigSchema.partial())
    .merge(tuitionConfigSchema.partial())
    .merge(schedulerConfigSchema.partial())

type SettingsFormData = {
    module: "entrance-tests" | "classes" | "survey" | "tuition" | "scheduler"
} & Partial<
    EntranceTestSettingsFormData &
    ClassSettingsFormData &
    SurveyConfigFormData &
    TuitionConfigFormData &
    SchedulerConfigFormData
>

export async function action({ request }: ActionFunctionArgs) {
    try {
        const { idToken, role } = await requireAuth(request)

        if (role !== Role.Administrator) {
            return redirect("/")
        }

        const {
            errors,
            data,
            receivedValues: defaultValues,
        } = await getValidatedFormData<SettingsFormData>(request, zodResolver(settingsSchema))

        console.log({ data })

        if (errors) {
            console.log({ errors })
            return { success: false, errors, defaultValues }
        }

        switch (data?.module) {
            case "survey":
                await fetchUpdateSurveySystemConfig({ idToken, ...data })
                break

            case "entrance-tests":
                await fetchUpdateEntranceTestSystemConfig({ idToken, ...data })
                break

            case "tuition":
                await fetchUpdateTuitionSystemConfig({ idToken, ...data })
                break

            case "scheduler":
                await fetchUpdateSchedulerSystemConfig({ idToken, ...data })
                await fetchUpdateRefundTuitionSystemConfig({ idToken, reasonRefundTuition: data.reasonRefundTuition })
                break

            case "classes":
                await fetchUpdateClassSystemConfig({ idToken, ...data })
                break

            default:
                break
        }

        return {
            success: true,
        }
    } catch (error) {
        console.error({ error })
        const { message, status } = getErrorDetailsInfo(error)
        return {
            success: false,
            error: message,
            status,
        }
    }
}

export default function AdminSettingsPage({ }: Props) {
    const { promise, idToken, levelsPromise } = useLoaderData<typeof loader>()
    const fetcher = useFetcher<typeof action>()
    const isSubmitting = fetcher.state === "submitting"

    useEffect(() => {
        if (fetcher.data?.success === true) {
            toast.success("Update config successfully")
            return
        }

        if (fetcher.data?.success === false) {
            toastWarning("Fail to update: " + fetcher.data.error)
            return
        }
    }, [fetcher.data])

    return (
        <div className="container mx-auto py-8 px-4 max-w-6xl">
            <Card className="border-none shadow-sm">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-t-lg pb-6">
                    <div className="flex items-center gap-2 mb-2">
                        <Settings className="text-theme" />
                        <CardTitle className="text-2xl font-bold">System Configuration</CardTitle>
                    </div>
                    <CardDescription className="text-slate-600 dark:text-slate-400">
                        Manage configuration variables to operate the center
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    <Suspense fallback={<LoadingSkeleton />}>
                        <Await resolve={promise}>
                            {(configs) => (
                                <Tabs defaultValue="entrance-tests" className="w-full">
                                    <div className="bg-slate-50 dark:bg-slate-900 p-1 rounded-lg mb-6">
                                        <TabsList className="w-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-1 p-0 h-auto bg-background">
                                            <TabsTrigger value="entrance-tests" className="text-xs md:text-sm py-2 data-[state=active]:bg-theme data-[state=active]:text-theme-foreground">
                                                Entrance Test
                                            </TabsTrigger>
                                            <TabsTrigger value="classes" className="text-xs md:text-sm py-2 data-[state=active]:bg-theme data-[state=active]:text-theme-foreground">
                                                Class
                                            </TabsTrigger>
                                            <TabsTrigger value="survey" className="text-xs md:text-sm py-2 data-[state=active]:bg-theme data-[state=active]:text-theme-foreground">
                                                Survey
                                            </TabsTrigger>
                                            <TabsTrigger value="tuition" className="text-xs md:text-sm py-2 data-[state=active]:bg-theme data-[state=active]:text-theme-foreground">
                                                Tuition Fee
                                            </TabsTrigger>
                                            <TabsTrigger value="scheduler" className="text-xs md:text-sm py-2 data-[state=active]:bg-theme data-[state=active]:text-theme-foreground">
                                                Scheduling
                                            </TabsTrigger>
                                            <TabsTrigger value="levels" className="text-xs md:text-sm py-2 data-[state=active]:bg-theme data-[state=active]:text-theme-foreground">
                                                Level GPA
                                            </TabsTrigger>
                                        </TabsList>
                                    </div>

                                    <div className="bg-white dark:bg-slate-950 rounded-lg p-4 md:p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                                        {isSubmitting && (
                                            <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-900 rounded-md flex items-center gap-2 text-sm animate-pulse">
                                                <div className="h-4 w-4 rounded-full border-2 border-slate-300 border-t-slate-600 animate-spin"></div>
                                                <span>Saving changes...</span>
                                            </div>
                                        )}

                                        {fetcher.data?.success === true && (
                                            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-md flex items-center gap-2 text-sm">
                                                <CheckCircle2 className="h-4 w-4" />
                                                <span>Configuration updated successfully</span>
                                            </div>
                                        )}

                                        {fetcher.data?.success === false && (
                                            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md flex items-center gap-2 text-sm">
                                                <AlertTriangle className="h-4 w-4" />
                                                <span>Failed to update: {fetcher.data.error}</span>
                                            </div>
                                        )}

                                        <TabsContent value="entrance-tests" className="mt-0">
                                            <EntranceTestConfigForm
                                                fetcher={fetcher}
                                                isSubmitting={isSubmitting}
                                                testFee={
                                                    Number.parseInt(configs.find((c) => c.configName === TEST_FEE)?.configValue || "100000") || 0
                                                }
                                                minStudentsPerEntranceTest={Number.parseInt(
                                                    configs.find((c) => c.configName === MIN_STUDENTS_IN_TEST)?.configValue || "1",
                                                )}
                                                maxStudentsPerEntranceTest={Number.parseInt(
                                                    configs.find((c) => c.configName === MAX_STUDENTS_IN_TEST)?.configValue || "1",
                                                )}
                                                allowEntranceTestRegistering={
                                                    configs.find((c) => c.configName === ALLOW_ENTRANCE_TEST_REGISTERING)?.configValue ===
                                                    "true" || true
                                                }
                                            />
                                        </TabsContent>
                                        <TabsContent value="classes" className="mt-0">
                                            <ClassesConfigForm
                                                fetcher={fetcher}
                                                isSubmitting={isSubmitting}
                                                minimumClassSize={Number.parseInt(
                                                    configs.find((c) => c.configName === MIN_STUDENTS)?.configValue || "1",
                                                )}
                                                maximumClassSize={Number.parseInt(
                                                    configs.find((c) => c.configName === MAX_STUDENTS)?.configValue || "10",
                                                )}
                                                allowSkippingLevel={
                                                    configs.find((c) => c.configName === ALLOW_SKIPPING_LEVEL)?.configValue === "true"
                                                }
                                                deadlineChangingClass={Number.parseInt(
                                                    configs.find((c) => c.configName === DEADLINE_CHANGING_CLASS)?.configValue || "1",
                                                )}
                                            />
                                        </TabsContent>
                                        <TabsContent value="survey" className="mt-0">
                                            <SurveyConfigForm
                                                fetcher={fetcher}
                                                isSubmitting={isSubmitting}
                                                idToken={idToken}
                                                minQuestionsPerSurvey={Number.parseInt(
                                                    configs.find((c) => c.configName === MIN_QUESTIONS_PER_SURVEY)?.configValue || "1",
                                                )}
                                                maxQuestionsPerSurvey={Number.parseInt(
                                                    configs.find((c) => c.configName === MAX_QUESTIONS_PER_SURVEY)?.configValue || "10",
                                                )}
                                                instrumentName={configs.find((c) => c.configName === INSTRUMENT_NAME)?.configValue || "Piano"}
                                                entranceSurveyId={
                                                    configs.find((c) => c.configName === ENTRANCE_SURVEY)?.configValue || undefined
                                                }
                                                instrumentFrequencyInResponse={Number.parseInt(
                                                    configs.find((c) => c.configName === INSTRUMENT_FREQUENCY_IN_RESPONSE)?.configValue || "1",
                                                )}
                                            />
                                        </TabsContent>
                                        <TabsContent value="tuition" className="mt-0">
                                            <TuitionConfigForm
                                                fetcher={fetcher}
                                                isSubmitting={isSubmitting}
                                                idToken={idToken}
                                                taxRate2025={Number.parseFloat(
                                                    configs.find((c) => c.configName === TAX_RATE_2025)?.configValue || "0.05",
                                                )}
                                                paymentDeadlineDays={Number.parseInt(
                                                    configs.find((c) => c.configName === PAYMENT_DEADLINE_DAYS)?.configValue || "4",
                                                )}
                                                paymentReminderDay={Number.parseInt(
                                                    configs.find((c) => c.configName === PAYMENT_REMINDER_DAY)?.configValue || "25",
                                                )}
                                                trialSessionCount={Number.parseInt(
                                                    configs.find((c) => c.configName === TRIAL_SESSION_COUNT)?.configValue || "2",
                                                )}
                                            />
                                        </TabsContent>
                                        <TabsContent value="scheduler" className="mt-0">
                                            <SchedulerConfigForm
                                                fetcher={fetcher}
                                                isSubmitting={isSubmitting}
                                                idToken={idToken}
                                                deadlineAttendance={Number.parseInt(
                                                    configs.find((c) => c.configName === ATTENDANCE_DEADLINE)?.configValue || "1",
                                                )}
                                                reasonCancelSlot={JSON.parse(
                                                    configs.find((c) => c.configName === REASON_CANCEL_SLOT)?.configValue || "[]",
                                                )}
                                                maxAbsenceRate={Number.parseFloat(
                                                    configs.find((c) => c.configName === MAX_ABSENCE_RATE)?.configValue || "0.3",
                                                )}
                                                reasonRefundTuition={JSON.parse(
                                                    configs.find((c) => c.configName === REFUND_REASON)?.configValue || "[]",
                                                )}
                                            />
                                        </TabsContent>
                                        <TabsContent value="levels" className="mt-0">
                                            <Suspense
                                                fallback={
                                                    <div className="flex justify-center items-center my-4">
                                                        <Skeleton className="w-full h-[400px] rounded-md" />
                                                    </div>
                                                }
                                            >
                                                <Await resolve={levelsPromise}>
                                                    {(levels) => (
                                                        <LevelGpaConfigForm
                                                            fetcher={fetcher}
                                                            isSubmitting={isSubmitting}
                                                            levels={levels}
                                                            idToken={idToken}
                                                        />
                                                    )}
                                                </Await>
                                            </Suspense>
                                        </TabsContent>
                                    </div>
                                </Tabs>
                            )}
                        </Await>
                    </Suspense>
                </CardContent>
            </Card>
        </div>
    )
}

function LoadingSkeleton() {
    return (
        <div className="space-y-4">
            <div className="bg-slate-50 dark:bg-slate-900 p-1 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-1">
                    {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="h-9 rounded-md" />
                    ))}
                </div>
            </div>
            <Skeleton className="w-full h-[500px] rounded-md" />
        </div>
    )
}

export function ErrorBoundary() {
    const error = useRouteError()
    const { pathname, search } = useLocation()

    return (
        <div className="container mx-auto py-8 px-4 max-w-6xl">
            <Card className="border-none shadow-sm">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-t-lg">
                    <div className="flex items-center gap-2 mb-2">
                        <Settings className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                        <CardTitle className="text-2xl font-bold">System Configuration</CardTitle>
                    </div>
                    <CardDescription className="text-slate-600 dark:text-slate-400">
                        Manage configuration variables to operate the center
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="flex flex-col gap-5 justify-center items-center py-12 text-center">
                        <AlertTriangle className="h-12 w-12 text-amber-500" />
                        <h1 className="text-2xl font-bold">
                            {isRouteErrorResponse(error) && error.statusText ? error.statusText : "An error occurred."}
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 mb-4 max-w-md">
                            We couldn't load the system configuration. Please try again or contact support if the problem persists.
                        </p>
                        <Link
                            className={`${buttonVariants({ variant: "default" })} font-medium flex items-center gap-2`}
                            to={pathname ? `${pathname}${search}` : "/"}
                            replace={true}
                            reloadDocument={false}
                        >
                            <RotateCcw className="h-4 w-4" /> Try again
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
