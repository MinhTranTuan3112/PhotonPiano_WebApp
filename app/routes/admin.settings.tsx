import { zodResolver } from '@hookform/resolvers/zod';
import { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { Await, isRouteErrorResponse, Link, redirect, useFetcher, useLoaderData, useLocation, useRouteError } from '@remix-run/react'
import { RotateCcw } from 'lucide-react';
import { Suspense } from 'react';
import { getValidatedFormData } from 'remix-hook-form';
import { z } from 'zod';
import ClassesConfigForm, { ClassSettingsFormData, classSettingsSchema } from '~/components/settings/classes-config-form';
import EntranceTestConfigForm, { EntranceTestSettingsFormData, entranceTestSettingsSchema } from '~/components/settings/entrance-test-form';
import { buttonVariants } from '~/components/ui/button';
import { Separator } from '~/components/ui/separator'
import { Skeleton } from '~/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import {
    fetchSystemConfigs,
    fetchUpdateClassSystemConfig,
    fetchUpdateEntranceTestSystemConfig,
    fetchUpdateRefundTuitionSystemConfig,
    fetchUpdateSchedulerSystemConfig,
    fetchUpdateSurveySystemConfig,
    fetchUpdateTuitionSystemConfig
} from '~/lib/services/system-config';
import { SystemConfig } from '~/lib/types/config/system-config';
import { requireAuth } from '~/lib/utils/auth';
import {
    ALLOW_ENTRANCE_TEST_REGISTERING,
    ALLOW_SKIPPING_LEVEL, ATTENDANCE_DEADLINE,
    DEADLINE_CHANGING_CLASS,
    ENTRANCE_SURVEY,
    INSTRUMENT_FREQUENCY_IN_RESPONSE,
    INSTRUMENT_NAME, MAX_ABSENCE_RATE,
    MAX_QUESTIONS_PER_SURVEY,
    MAX_STUDENTS,
    MAX_STUDENTS_IN_TEST,
    MIN_QUESTIONS_PER_SURVEY,
    MIN_STUDENTS,
    MIN_STUDENTS_IN_TEST, PAYMENT_DEADLINE_DAYS, PAYMENT_REMINDER_DAY, REASON_CANCEL_SLOT, REFUND_REASON,
    TAX_RATE_2025,
    TEST_FEE, TRIAL_SESSION_COUNT,
} from '~/lib/utils/config-name';
import { getErrorDetailsInfo } from '~/lib/utils/error';
import { useEffect } from 'react';
import { toast } from 'sonner';
import SurveyConfigForm, { SurveyConfigFormData, surveyConfigSchema } from '~/components/settings/survey-config-form';
import { Role } from '~/lib/types/account/account';
import TuitionConfigForm, {TuitionConfigFormData, tuitionConfigSchema} from '~/components/settings/tuition-config-form';
import SchedulerConfigForm, {SchedulerConfigFormData, schedulerConfigSchema} from "~/components/settings/scheduler-config-form";
import { toastWarning } from '~/lib/utils/toast-utils';

type Props = {}

export async function loader({ params, request }: LoaderFunctionArgs) {

    try {
        const { idToken, role } = await requireAuth(request);

        if (role !== Role.Administrator) {
            return redirect('/');
        }

        const { searchParams } = new URL(request.url);

        const promise = fetchSystemConfigs({ idToken }).then((res) => {
            return res.data as SystemConfig[]
        });


        return {
            promise, idToken
        }
    } catch (error) {

        console.error({ error });

        const { message, status } = getErrorDetailsInfo(error);

        throw new Response(message, { status });
    }

}

const settingsSchema = z.object({
    module: z.string()
}).merge(entranceTestSettingsSchema.partial())
    .merge(classSettingsSchema.partial())
    .merge(surveyConfigSchema.partial())
    .merge(tuitionConfigSchema.partial())
    .merge(schedulerConfigSchema.partial());


type SettingsFormData = {
    module: 'entrance-tests' | 'classes' | 'survey' | 'tuition' | 'scheduler'
} & Partial<EntranceTestSettingsFormData & ClassSettingsFormData & SurveyConfigFormData & TuitionConfigFormData & SchedulerConfigFormData>;

export async function action({ request }: ActionFunctionArgs) {
    try {

        const { idToken, role } = await requireAuth(request);

        if (role !== Role.Administrator) {
            return redirect('/');
        }


        const { errors, data, receivedValues: defaultValues } =
            await getValidatedFormData<SettingsFormData>(request, zodResolver(settingsSchema));


        console.log({ data });

        if (errors) {
            console.log({ errors });
            return { success: false, errors, defaultValues };
        }

        switch (data?.module) {
            case 'survey':
                await fetchUpdateSurveySystemConfig({ idToken, ...data });
                break;

            case 'entrance-tests':
                await fetchUpdateEntranceTestSystemConfig({ idToken, ...data });
                break;

            case 'tuition':
                await fetchUpdateTuitionSystemConfig({ idToken, ...data });
                break;

            case 'scheduler':
                await fetchUpdateSchedulerSystemConfig({ idToken, ...data });
                await fetchUpdateRefundTuitionSystemConfig({ idToken, reasonRefundTuition: data.reasonRefundTuition });
                break;

            case 'classes':
                await fetchUpdateClassSystemConfig({ idToken, ...data });
                break;

            default:
                break;
        }


        return {
            success: true
        }

    } catch (error) {
        console.error({ error });

        const { message, status } = getErrorDetailsInfo(error);

        return {
            success: false,
            error: message,
            status
        }
    }
}


export default function AdminSettingsPage({ }: Props) {

    const { promise, idToken } = useLoaderData<typeof loader>();

    const fetcher = useFetcher<typeof action>();

    const isSubmitting = fetcher.state === 'submitting';

    useEffect(() => {

        if (fetcher.data?.success === true) {
            toast.success('Update config successfully');
            return;
        }

        if (fetcher.data?.success === false) {
            toastWarning('Fail to update: ' + fetcher.data.error);
            return;
        }

        return () => {

        }

    }, [fetcher.data]);

    return (
        <article className='px-10'>
            <h1 className="text-xl font-extrabold">System Configuration</h1>
            <p className='text-muted-foreground'>Manage configuration varibles to operate the center</p>

            <Separator className="my-4" />

            <Suspense fallback={<LoadingSkeleton />}>
                <Await resolve={promise} >
                    {(configs) => (
                        <Tabs defaultValue='entrance-tests'>
                            <TabsList className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mt-4">
                                <TabsTrigger value="entrance-tests">
                                    Entrance Test
                                </TabsTrigger>
                                <TabsTrigger value="classes">
                                    Class
                                </TabsTrigger>
                                <TabsTrigger value="survey">
                                    Survey
                                </TabsTrigger>
                                <TabsTrigger value="tuition">
                                    Tuition Fee
                                </TabsTrigger>
                                <TabsTrigger value="scheduler">
                                    Scheduling
                                </TabsTrigger>
                            </TabsList>
                            <TabsContent value="entrance-tests">
                                <EntranceTestConfigForm
                                    fetcher={fetcher}
                                    isSubmitting={isSubmitting}
                                    testFee={parseInt(configs.find(c => c.configName === TEST_FEE)?.configValue || '100000') || 0}
                                    minStudentsPerEntranceTest={parseInt(configs.find(c => c.configName === MIN_STUDENTS_IN_TEST)?.configValue || '1')}
                                    maxStudentsPerEntranceTest={parseInt(configs.find(c => c.configName === MAX_STUDENTS_IN_TEST)?.configValue || '1')}
                                    allowEntranceTestRegistering={configs.find(c => c.configName === ALLOW_ENTRANCE_TEST_REGISTERING)?.configValue === "true" || true}
                                />
                            </TabsContent>
                            <TabsContent value="classes">
                                <ClassesConfigForm
                                    fetcher={fetcher}
                                    isSubmitting={isSubmitting}
                                    minimumClassSize={parseInt(configs.find(c => c.configName === MIN_STUDENTS)?.configValue || '1')}
                                    maximumClassSize={parseInt(configs.find(c => c.configName === MAX_STUDENTS)?.configValue || '10')}
                                    allowSkippingLevel={configs.find(c => c.configName === ALLOW_SKIPPING_LEVEL)?.configValue === "true"}
                                    deadlineChangingClass={parseInt(configs.find(c => c.configName === DEADLINE_CHANGING_CLASS)?.configValue || '1')}
                                />
                            </TabsContent>
                            <TabsContent value='survey'>
                                <SurveyConfigForm
                                    fetcher={fetcher}
                                    isSubmitting={isSubmitting}
                                    idToken={idToken}
                                    minQuestionsPerSurvey={parseInt(configs.find(c => c.configName === MIN_QUESTIONS_PER_SURVEY)?.configValue || '1')}
                                    maxQuestionsPerSurvey={parseInt(configs.find(c => c.configName === MAX_QUESTIONS_PER_SURVEY)?.configValue || '10')}
                                    instrumentName={configs.find(c => c.configName === INSTRUMENT_NAME)?.configValue || 'Piano'}
                                    entranceSurveyId={configs.find(c => c.configName === ENTRANCE_SURVEY)?.configValue || undefined}
                                    instrumentFrequencyInResponse={parseInt(configs.find(c => c.configName === INSTRUMENT_FREQUENCY_IN_RESPONSE)?.configValue || '0')}
                                />
                            </TabsContent>

                            <TabsContent value='tuition'>
                                <TuitionConfigForm
                                    fetcher={fetcher}
                                    isSubmitting={isSubmitting}
                                    idToken={idToken}
                                    taxRate2025={parseFloat(configs.find(c => c.configName === TAX_RATE_2025)?.configValue || '0.05')}
                                    paymentDeadlineDays={parseInt(configs.find(c => c.configName === PAYMENT_DEADLINE_DAYS)?.configValue || '4')}
                                    paymentReminderDay={parseInt(configs.find(c => c.configName === PAYMENT_REMINDER_DAY)?.configValue || '25')}
                                    trialSessionCount={parseInt(configs.find(c => c.configName === TRIAL_SESSION_COUNT)?.configValue || '2')}
                                />
                            </TabsContent>

                            <TabsContent value='scheduler'>
                                <SchedulerConfigForm
                                    fetcher={fetcher}
                                    isSubmitting={isSubmitting}
                                    idToken={idToken}
                                    deadlineAttendance={parseInt(configs.find(c => c.configName === ATTENDANCE_DEADLINE)?.configValue || '1')}
                                    reasonCancelSlot={JSON.parse(configs.find(c => c.configName === REASON_CANCEL_SLOT)?.configValue || '[]')}
                                    maxAbsenceRate={parseFloat(configs.find(c => c.configName === MAX_ABSENCE_RATE)?.configValue || '0.3')}
                                    reasonRefundTuition={JSON.parse(configs.find(c => c.configName === REFUND_REASON)?.configValue || '[]')}
                                />
                            </TabsContent>




                        </Tabs>
                    )}
                </Await>
            </Suspense>
            <Separator className="my-4" />
        </article>
    )
}

function LoadingSkeleton() {
    return <div className="flex justify-center items-center my-4">
        <Skeleton className="w-full h-[500px] rounded-md" />
    </div>
}

export function ErrorBoundary() {

    const error = useRouteError();

    const { pathname, search } = useLocation();

    return (
        <article className="px-10">
            <h1 className="text-xl font-extrabold">System Configuration</h1>
            <p className='text-muted-foreground'>Manage configuration varibles to operate the center</p>

            <Separator className="my-4" />

            <div className="flex flex-col gap-5 justify-center items-center">
                <h1 className='text-3xl font-bold'>{isRouteErrorResponse(error) && error.statusText ? error.statusText :
                    'Có lỗi đã xảy ra.'} </h1>
                <Link className={`${buttonVariants({ variant: "theme" })} font-bold uppercase 
                      flex flex-row gap-1`}
                    to={pathname ? `${pathname}${search}` : '/'}
                    replace={true}
                    reloadDocument={false}>
                    <RotateCcw /> Try again
                </Link>
            </div>

            <Separator className="my-4" />

        </article>
    );
}
