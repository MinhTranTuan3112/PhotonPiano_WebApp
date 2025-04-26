import { zodResolver } from '@hookform/resolvers/zod';
import { ActionFunctionArgs, LoaderFunctionArgs, redirect } from '@remix-run/node';
import { Await, Form, useAsyncValue, useFetcher, useLoaderData } from '@remix-run/react';
import { ArrowLeft, ArrowRight, Piano } from 'lucide-react';
import React, { Suspense, useState } from 'react'
import { Controller } from 'react-hook-form';
import { getValidatedFormData, useRemixForm } from 'remix-hook-form';
import { z } from 'zod';
import { Button } from '~/components/ui/button';
import { Checkbox } from '~/components/ui/checkbox';
import CheckboxGroup from '~/components/ui/checkbox-group';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { PasswordInput } from '~/components/ui/password-input';
import { Skeleton } from '~/components/ui/skeleton';
import StepperBar from '~/components/ui/stepper';
import { UncheckableRadioGroup } from '~/components/ui/uncheckable-radio-group';
import { fetchEntranceSurvey, fetchSendEntranceSurveyAnswers } from '~/lib/services/survey';
import { QuestionType } from '~/lib/types/survey-question/survey-question';
import { SurveyDetails } from '~/lib/types/survey/survey';
import { getAuth } from '~/lib/utils/auth';
import { getErrorDetailsInfo, isRedirectError } from '~/lib/utils/error';
import { useEffect } from 'react';
import { useConfirmationDialog } from '~/hooks/use-confirmation-dialog';
import { AuthResponse } from '~/lib/types/auth-response';
import { getCurrentTimeInSeconds } from '~/lib/utils/datetime';
import { accountIdCookie, expirationCookie, idTokenCookie, refreshTokenCookie, roleCookie } from '~/lib/utils/cookie';
import { Role } from '~/lib/types/account/account';
import { toastWarning } from '~/lib/utils/toast-utils';
import { useTermsDialog } from '~/components/home/terms-and-conditions';


type Props = {}

type SurveyStepProps = {
    title: string;
    questionId?: string;
    isRequired: boolean;
    content: React.ReactNode;
};

const entranceSurveySchema = z.object({
    fullName: z.string({ message: 'Full name is required.' }).min(1, { message: 'Full name is required.' }),
    email: z.string({ message: 'Invalid email' }).email({ message: 'Email is required' }),
    password: z.string({ message: 'Password is required' }).min(6, { message: 'Password must have at least 6 characters.' }),
    confirmPassword: z.string({ message: 'Please confirm password' }).min(6, { message: 'Password must have at least 6 characters.' }),
    phone: z.string({ message: 'Phone is required.' }).min(10, { message: 'Invalid phone number.' }),
    // shortDescription: z.string({ message: 'Vui lòng giới thiệu về bản thân.' }).min(1, { message: 'Vui lòng giới thiệu về bản thân.' }),
    isTermsAgreed: z.literal<boolean>(true, { errorMap: () => ({ message: "Please read and accept Photon Piano terms and conditions", }), }),
    surveyAnswers: z.array(z.object({
        questionId: z.string(),
        answers: z.array(z.string()),
        otherAnswer: z.string().optional()
    }))
}).refine(data => data.password === data.confirmPassword, {
    message: 'Confirm password did not match',
    path: ['confirmPassword']
});

type EntranceSurveyFormData = z.infer<typeof entranceSurveySchema>;

export async function loader({ request }: LoaderFunctionArgs) {

    try {

        const { idToken } = await getAuth(request);

        if (idToken) {
            return redirect('/');
        }

        const promise = fetchEntranceSurvey().then((response) => {
            const surveyPromise: Promise<SurveyDetails> = response.data;

            return { surveyPromise };
        });

        return {
            promise
        }

    } catch (error) {
        console.error({ error });

        if (isRedirectError(error)) {
            throw error;
        }

        const { message, status } = getErrorDetailsInfo(error);

        throw new Response(message, { status });
    }
}

export async function action({ request }: ActionFunctionArgs) {
    try {

        const { idToken } = await getAuth(request);

        if (idToken) {
            return redirect('/');
        }

        const { errors, data, receivedValues: defaultValues } =
            await getValidatedFormData<EntranceSurveyFormData>(request, zodResolver(entranceSurveySchema));

        console.log({ data });

        console.log(data?.surveyAnswers);

        if (errors) {
            return { success: false, errors, defaultValues };
        }

        const response = await fetchSendEntranceSurveyAnswers({
            ...data, surveyAnswers: data.surveyAnswers.map(s => ({
                surveyQuestionId: s.questionId,
                answers: s.answers.length > 0 ? s.answers : s.otherAnswer ? [s.otherAnswer] : []
            }))
        });

        if (response.status === 200) {

            const { idToken, refreshToken, expiresIn, role, localId }: AuthResponse = await response.data;

            console.log({ idToken, refreshToken, expiresIn, role, localId });


            const expirationTime = getCurrentTimeInSeconds() + Number.parseInt(expiresIn);

            const headers = new Headers();

            headers.append("Set-Cookie", await idTokenCookie.serialize(idToken));
            headers.append("Set-Cookie", await refreshTokenCookie.serialize(refreshToken));
            headers.append("Set-Cookie", await expirationCookie.serialize(expirationTime.toString()));
            headers.append("Set-Cookie", await roleCookie.serialize(role));
            headers.append("Set-Cookie", await accountIdCookie.serialize(localId));
            switch (role) {
                case Role.Instructor:
                    return redirect('/teacher/scheduler', { headers });
                case Role.Staff:
                    return redirect('/staff/scheduler', { headers });
                case Role.Administrator:
                    return redirect('/admin/settings', { headers });
                default:
                    return redirect('/?enroll-now=true', { headers });
            }

        }

    } catch (error) {
        console.error({ error });

        if (isRedirectError(error)) {
            throw error;
        }

        const { message, status } = getErrorDetailsInfo(error);

        return Response.json({
            success: false,
            error: message,
        }, {
            status
        });
    }
}

export default function EntranceSurveyPage({ }: Props) {

    const { promise } = useLoaderData<typeof loader>();

    return (
        <article className='md:max-w-[60%] max-md:px-10 mx-auto my-4 shadow-lg p-4 rounded-md'>
            <Suspense fallback={<LoadingSkeleton />}>
                <Await resolve={promise}>
                    {({ surveyPromise }) => (
                        <Await resolve={surveyPromise}>
                            <EntranceSurveyForm />
                        </Await>
                    )}
                </Await>
            </Suspense>
        </article>
    );
};

function EntranceSurveyForm() {

    const surveyValue = useAsyncValue();

    const survey = surveyValue as SurveyDetails;

    const fetcher = useFetcher<typeof action>();

    const isSubmitting = fetcher.state === 'submitting';

    const [stepCnt, setStepCnt] = useState(0);

    const {
        handleSubmit,
        formState: { errors },
        control,
        register,
        getValues: getFormValues,
        setValue: setFormValue,
        watch
    } = useRemixForm<EntranceSurveyFormData>({
        mode: 'onSubmit',
        resolver: zodResolver(entranceSurveySchema),
        fetcher,
        defaultValues: {
            surveyAnswers: survey.pianoSurveyQuestions.map(({ questionId }) => ({ questionId: questionId, answers: [] }))
        }
    });

    const { open: handleOpenConfirmDialog, dialog: confirmDialog } = useConfirmationDialog({
        title: 'Confirm action?',
        description: 'Confirm with account registration?',
        onConfirm: handleSubmit,
        confirmText: 'Confirm'
    });

    const { termsDialog, openTermsDialog } = useTermsDialog({
        onAccept: () => {
            setFormValue('isTermsAgreed', true);
        }
    })

    const surveyAnswers = watch('surveyAnswers');

    const questionSteps = survey.pianoSurveyQuestions.sort(ps => ps.orderIndex).map(({ question, isRequired, orderIndex, questionId }) => {
        return {
            questionId,
            isRequired,
            title: question.questionContent,
            content: <div className="">
                <h3 className="text-2xl font-bold text-center my-5">{question.questionContent}
                    {isRequired && <span className='ml-1 text-red-600'>*</span>}
                </h3>

                {question.type === QuestionType.MultipleChoice && <Controller
                    name='surveyAnswers'
                    control={control}
                    render={({ field: { onChange, onBlur, value = [], ref } }) => (
                        <CheckboxGroup
                            values={value.find(v => v.questionId === question.id)?.answers || []}
                            onChange={(values) => {
                                setFormValue('surveyAnswers', value.map(v => {
                                    if (v.questionId === question.id) {
                                        return { ...v, answers: values }
                                    }
                                    return v;
                                }))
                            }}
                            options={question.options.map((option) => {
                                return {
                                    value: option,
                                    label: option
                                }
                            })}
                        />
                    )}
                />}

                {(question.type === QuestionType.SingleChoice || question.type === QuestionType.LikertScale) && <Controller
                    name='surveyAnswers'
                    control={control}
                    render={({ field: { onChange, onBlur, value, ref } }) => (
                        <UncheckableRadioGroup
                            options={question.options.map((option) => {
                                return {
                                    value: option,
                                    label: option
                                }
                            })}
                            value={value.find(v => v.questionId === question.id)?.answers[0] || null}
                            onChange={(newAnswer) => {
                                setFormValue('surveyAnswers', value.map(v => {
                                    if (v.questionId === question.id) {
                                        return { ...v, answers: [newAnswer || ''] }
                                    }
                                    return v;
                                }))
                            }}
                        />
                    )}
                />}

                {(question.type === QuestionType.OpenText || question.type === QuestionType.NumericInput) && <>
                    <Input placeholder='Enter answer...' type={question.type === QuestionType.OpenText ? 'text' : 'number'}
                        value={surveyAnswers.find(s => s.questionId === question.id)?.answers[0]}
                        onChange={(e) => {
                            const newAnswer = e.target.value;
                            setFormValue('surveyAnswers', surveyAnswers.map(s => {
                                if (s.questionId === question.id) {
                                    return { ...s, answers: [newAnswer] }
                                }
                                return s;
                            }))
                        }}
                    />
                </>}

                {question.allowOtherAnswer && <section className='my-3'>
                    <Input placeholder='Other answer...' className='rounded-xl' value={surveyAnswers.find(s => s.questionId === question.id)?.otherAnswer}
                        onChange={(e) => {
                            const newAnswer = e.target.value;
                            setFormValue('surveyAnswers', surveyAnswers.map(s => {
                                if (s.questionId === question.id) {
                                    return { ...s, otherAnswer: newAnswer }
                                }
                                return s;
                            }))
                        }} />
                </section>}

            </div>
        }
    });

    const steps: SurveyStepProps[] = [
        ...questionSteps,
        {
            isRequired: true,
            title: 'Account registration',
            content: <>
                <div className='mt-4 flex flex-col gap-4'>
                    <p className="text-sm text-muted-foreground">
                        Those are important personal information that <strong>Photon Piano</strong> uses to contact you.
                    </p>
                    <div className='flex gap-4 items-center'>
                        <Label htmlFor="fullName" className="w-40 font-bold">
                            Full name
                        </Label>
                        <div className="w-full">
                            <Input id="fullName" {...register('fullName')} placeholder='Enter your fullname...' />
                            {errors.fullName && <p className='text-sm text-red-600'>{errors.fullName.message}</p>}
                        </div>
                    </div>
                    <div className='flex gap-4 items-center'>
                        <Label htmlFor="email" className="w-40 font-bold">
                            Email
                        </Label>
                        <div className="w-full">
                            <Input id="email" {...register('email')} placeholder='Enter your email...' />
                            {errors.email && <p className='text-sm text-red-600'>{errors.email.message}</p>}
                        </div>
                    </div>
                    <div className='flex gap-4 items-center'>
                        <Label htmlFor="phone" className="w-40 font-bold" >
                            Phone
                        </Label>
                        <div className="w-full">
                            <Input id="phone" {...register('phone')} placeholder='Enter your phone number...' />
                            {errors.phone && <p className='text-sm text-red-600'>{errors.phone.message}</p>}
                        </div>
                    </div>
                    <div className='flex gap-4 items-center'>
                        <Label htmlFor="password" className="w-40 font-bold" >
                            Password
                        </Label>
                        <div className="w-full">
                            <PasswordInput id="password" {...register('password')} placeholder='Enter your password...' />
                            {errors.password && <p className='text-sm text-red-600'>{errors.password.message}</p>}
                        </div>
                    </div>
                    <div className='flex gap-4 items-center'>
                        <Label htmlFor="confirmPassword" className="w-40 font-bold" >
                            Confirm password
                        </Label>
                        <div className="w-full">
                            <PasswordInput id="confirmPassword" {...register('confirmPassword')} placeholder='Confirm password...' />
                            {errors.confirmPassword && <p className='text-sm text-red-600'>{errors.confirmPassword.message}</p>}
                        </div>
                    </div>
                    {/* <div className='flex gap-4 items-start'>
                        <Label htmlFor="shortDescription" className="w-32">
                            Mô tả trình độ
                        </Label>
                        <div className="w-full">
                            <Textarea id="shortDescription" {...register('shortDescription')} placeholder='Mô tả ngắn về trình độ piano hiện tại của bạn...'
                                rows={3} />
                            {errors.shortDescription && <p className='text-sm text-red-600'>{errors.shortDescription.message}</p>}
                        </div>
                    </div> */}
                    <div className='flex gap-4 items-center'>
                        <Controller
                            name='isTermsAgreed'
                            control={control}
                            render={({ field: { onChange, onBlur, value, ref } }) => (
                                <Checkbox checked={value} onCheckedChange={onChange} />
                            )}
                        />
                        <div className="">
                            <span className='text-sm'>I agree to the<Button className='font-bold' type='button' variant={'link'}
                                onClick={openTermsDialog}>terms and conditions</Button>of Photon Piano center</span>
                            {errors.isTermsAgreed && <p className='text-sm text-red-600'>{errors.isTermsAgreed.message}</p>}
                        </div>
                    </div>
                </div>
            </>
        }
    ];

    useEffect(() => {

        if (fetcher.data?.success === false && fetcher.data.error) {
            toastWarning(fetcher.data.error, {
                duration: 5000
            });
            return;
        }

        return () => {

        }

    }, [fetcher.data]);

    return <>
        <div className="absolute inset-1 -z-[10000] bg-cover bg-no-repeat opacity-5 bg-[url('/images/notes_flows.png')]">
        </div>
        <div className="mb-3">
            <StepperBar steps={steps.map(s => s.title)} currentStep={stepCnt} showIndicatorTitle={true} />
        </div>
        {steps.map((step, index) => (
            <section className={`transition-opacity duration-300 ease-in-out ${stepCnt === index ? 'opacity-100' : 'opacity-0'}`} key={index}>
                {stepCnt === index && <>

                    {step.content}
                </>}
            </section>
        ))}
        <Form method='POST' onSubmit={handleOpenConfirmDialog}>
            <div className={`flex my-2 ${stepCnt === 0 ? 'justify-end' : stepCnt === steps.length - 1 ? 'justify-start' : 'justify-between'}`}>
                {stepCnt > 0 && <div className="flex">
                    <Button variant={'outline'} type='button' onClick={() => setStepCnt((prev) => Math.max(prev - 1, 0))}
                        size={'icon'}
                        className='rounded-full'>
                        <ArrowLeft />
                    </Button>
                </div>}

                {stepCnt < steps.length - 1 && <div className="flex">
                    <Button variant={'outline'} type='button' onClick={() => setStepCnt(prev =>
                        prev < steps.length - 1 ? prev + 1 : prev
                    )}
                        size={'icon'} className='rounded-full'>
                        <ArrowRight />
                    </Button>
                </div>}
            </div>
            {
                stepCnt === steps.length - 1 && (
                    <Button className='mt-4 w-full' type='button' Icon={Piano} isLoading={isSubmitting}
                        disabled={isSubmitting}
                        iconPlacement='left' onClick={handleOpenConfirmDialog}>
                        Join Photon Piano now
                    </Button>
                )
            }
        </Form>
        {confirmDialog}
        {termsDialog}
    </>

}

function LoadingSkeleton() {
    return <div className="flex justify-center items-center my-4">
        <Skeleton className="w-full h-[500px] rounded-md" />
    </div>
}
