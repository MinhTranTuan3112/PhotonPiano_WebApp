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
import { fetchSystemConfigs, fetchUpdateSurveySystemConfig } from '~/lib/services/system-config';
import { SystemConfig } from '~/lib/types/config/system-config';
import { requireAuth } from '~/lib/utils/auth';
import { ALLOW_SKIPPING_LEVEL, DEADLINE_CHANGING_CLASS, ENTRANCE_SURVEY, INSTRUMENT_FREQUENCY_IN_RESPONSE, INSTRUMENT_NAME, MAX_QUESTIONS_PER_SURVEY, MAX_STUDENTS, MAX_STUDENTS_IN_EXAM, MIN_QUESTIONS_PER_SURVEY, MIN_STUDENTS } from '~/lib/utils/config-name';
import { getErrorDetailsInfo } from '~/lib/utils/error';
import { useEffect } from 'react';
import { toast } from 'sonner';
import SurveyConfigForm, { SurveyConfigFormData, surveyConfigSchema } from '~/components/settings/survey-config-form';
import { Role } from '~/lib/types/account/account';

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
    .merge(surveyConfigSchema.partial());

type SettingsFormData = {
    module: 'entrance-tests' | 'classes' | 'survey';
} & Partial<EntranceTestSettingsFormData & ClassSettingsFormData & SurveyConfigFormData>;

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
            toast.success('Cập nhật cấu hình thành công');
            return;
        }

        if (fetcher.data?.success === false) {
            toast.error('Cập nhật cấu hình thất bại: ' + fetcher.data.error);
            return;
        }

        return () => {

        }

    }, [fetcher.data]);

    return (
        <article className='px-10'>
            <h1 className="text-xl font-extrabold">Cấu hình hệ thống</h1>
            <p className='text-muted-foreground'>Quản lý cấu hình hệ thống liên quan đến đào tạo,...</p>

            <Separator className="my-4" />

            <Suspense fallback={<LoadingSkeleton />}>
                <Await resolve={promise} >
                    {(configs) => (
                        <Tabs defaultValue='entrance-tests'>
                            <TabsList className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mt-4">
                                <TabsTrigger value="entrance-tests">
                                    Thi đầu vào
                                </TabsTrigger>
                                <TabsTrigger value="classes">
                                    Lớp học
                                </TabsTrigger>
                                <TabsTrigger value="survey">
                                    Khảo sát
                                </TabsTrigger>
                            </TabsList>
                            <TabsContent value="entrance-tests">
                                <EntranceTestConfigForm
                                    fetcher={fetcher}
                                    isSubmitting={isSubmitting}
                                    maxStudentsPerEntranceTest={parseInt(configs.find(c => c.configName === MAX_STUDENTS_IN_EXAM)?.configValue || '1')} />
                            </TabsContent>
                            <TabsContent value="classes">
                                <ClassesConfigForm
                                    fetcher={fetcher}
                                    isSubmitting={isSubmitting}
                                    minStudents={parseInt(configs.find(c => c.configName === MIN_STUDENTS)?.configValue || '1')}
                                    maxStudents={parseInt(configs.find(c => c.configName === MAX_STUDENTS)?.configValue || '10')}
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
            <h1 className="text-xl font-extrabold">Cấu hình hệ thống</h1>
            <p className='text-muted-foreground'>Quản lý cấu hình hệ thống liên quan đến đào tạo,...</p>

            <Separator className="my-4" />

            <div className="flex flex-col gap-5 justify-center items-center">
                <h1 className='text-3xl font-bold'>{isRouteErrorResponse(error) && error.statusText ? error.statusText :
                    'Có lỗi đã xảy ra.'} </h1>
                <Link className={`${buttonVariants({ variant: "theme" })} font-bold uppercase 
                      flex flex-row gap-1`}
                    to={pathname ? `${pathname}${search}` : '/'}
                    replace={true}
                    reloadDocument={false}>
                    <RotateCcw /> Thử lại
                </Link>
            </div>

            <Separator className="my-4" />

        </article>
    );
}