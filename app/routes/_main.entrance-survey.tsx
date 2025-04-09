
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
import { Textarea } from '~/components/ui/textarea';
import { UncheckableRadioGroup } from '~/components/ui/uncheckable-radio-group';
import { fetchEntranceSurvey, fetchSendEntranceSurveyAnswers } from '~/lib/services/survey';
import { QuestionType } from '~/lib/types/survey-question/survey-question';
import { SurveyDetails } from '~/lib/types/survey/survey';
import { getAuth } from '~/lib/utils/auth';
import { getErrorDetailsInfo, isRedirectError } from '~/lib/utils/error';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { useConfirmationDialog } from '~/hooks/use-confirmation-dialog';
import { fetchSignIn } from '~/lib/services/auth';
import { isAxiosError } from 'axios';
import { AuthResponse } from '~/lib/types/auth-response';
import { getCurrentTimeInSeconds } from '~/lib/utils/datetime';
import { accountIdCookie, expirationCookie, idTokenCookie, refreshTokenCookie, roleCookie } from '~/lib/utils/cookie';
import { Role } from '~/lib/types/account/account';

type Props = {}

type SurveyStepProps = {
    title: string;
    questionId?: string;
    isRequired: boolean;
    content: React.ReactNode;
};

const entranceSurveySchema = z.object({
    fullName: z.string({ message: 'Vui lòng nhập họ và tên của bạn.' }).min(1, { message: 'Vui lòng nhập họ và tên của bạn.' }),
    email: z.string({ message: 'Email không được để trống' }).email({ message: 'Email không hợp lệ' }),
    password: z.string({ message: 'Mật khẩu không được để trống' }).min(6, { message: 'Mật khẩu phải chứa ít nhất 6 ký tự' }),
    confirmPassword: z.string({ message: 'Xác nhận mật khẩu không được để trống' }).min(6, { message: 'Mật khẩu phải chứa ít nhất 6 ký tự' }),
    phone: z.string({ message: 'Số điện thoại không được để trống.' }).min(10, { message: 'Số điện thoại không hợp lệ.' }),
    // shortDescription: z.string({ message: 'Vui lòng giới thiệu về bản thân.' }).min(1, { message: 'Vui lòng giới thiệu về bản thân.' }),
    isTermsAgreed: z.literal<boolean>(true, { errorMap: () => ({ message: "Vui lòng đọc và chấp thuận với điều khoản, chính sách của Photon Piano", }), }),
    surveyAnswers: z.array(z.object({
        questionId: z.string(),
        answers: z.array(z.string()),
        otherAnswer: z.string().optional()
    }))
}).refine(data => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
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

        const sendEntranceSurveyResponse = await fetchSendEntranceSurveyAnswers({
            ...data, surveyAnswers: data.surveyAnswers.map(s => ({
                surveyQuestionId: s.questionId,
                answers: s.answers.length > 0 ? s.answers : s.otherAnswer ? [s.otherAnswer] : []
            }))
        });

        const signInResponse = await fetchSignIn(data.email, data.password);

        if (signInResponse.status === 200) {

            const { idToken, refreshToken, expiresIn, role, localId }: AuthResponse = await signInResponse.data;

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

        if (isAxiosError(error) && error.response?.status === 401) {
            return {
                success: false,
                error: 'Email hoặc mật khẩu không đúng',
            }
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
        title: 'Xác nhận gửi khảo sát và đăng ký tài khoản Photon Piano?',
        description: 'Bạn có chắc chắn muốn gửi khảo sát và đăng ký tài khoản không?',
        onConfirm: handleSubmit,
        confirmText: 'Gửi'
    });

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
                    <Input placeholder='Nhập câu trả lời...' type={question.type === QuestionType.OpenText ? 'text' : 'number'}
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
                    <Input placeholder='Câu trả lời khác...' className='rounded-xl' value={surveyAnswers.find(s => s.questionId === question.id)?.otherAnswer}
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
            title: 'Đăng ký tài khoản',
            content: <>
                <div className='mt-4 flex flex-col gap-4'>
                    <p className="text-sm text-muted-foreground">
                        Đây là những thông tin cá nhân quan trọng của bạn
                        mà <strong>Photon Piano</strong> sử dụng để liên lạc với bạn.
                    </p>
                    <div className='flex gap-4 items-center'>
                        <Label htmlFor="fullName" className="w-32">
                            Họ và tên
                        </Label>
                        <div className="w-full">
                            <Input id="fullName" {...register('fullName')} placeholder='Nhập họ và tên của bạn...' />
                            {errors.fullName && <p className='text-sm text-red-600'>{errors.fullName.message}</p>}
                        </div>
                    </div>
                    <div className='flex gap-4 items-center'>
                        <Label htmlFor="email" className="w-32">
                            Email
                        </Label>
                        <div className="w-full">
                            <Input id="email" {...register('email')} placeholder='Nhập email của bạn...' />
                            {errors.email && <p className='text-sm text-red-600'>{errors.email.message}</p>}
                        </div>
                    </div>
                    <div className='flex gap-4 items-center'>
                        <Label htmlFor="phone" className="w-32" >
                            SĐT
                        </Label>
                        <div className="w-full">
                            <Input id="phone" {...register('phone')} placeholder='Nhập số điện thoại của bạn...' />
                            {errors.phone && <p className='text-sm text-red-600'>{errors.phone.message}</p>}
                        </div>
                    </div>
                    <div className='flex gap-4 items-center'>
                        <Label htmlFor="password" className="w-32" >
                            Mật khẩu
                        </Label>
                        <div className="w-full">
                            <PasswordInput id="password" {...register('password')} placeholder='Nhập mật khẩu...' />
                            {errors.password && <p className='text-sm text-red-600'>{errors.password.message}</p>}
                        </div>
                    </div>
                    <div className='flex gap-4 items-center'>
                        <Label htmlFor="confirmPassword" className="w-32" >
                            Xác nhận mật khẩu
                        </Label>
                        <div className="w-full">
                            <PasswordInput id="confirmPassword" {...register('confirmPassword')} placeholder='Xác nhận mật khẩu...' />
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
                            <span className='text-sm'>Tôi đồng ý với các <a className='underline font-bold' href='/'>quy định</a>   của trung tâm Photon Piano</span>
                            {errors.isTermsAgreed && <p className='text-sm text-red-600'>{errors.isTermsAgreed.message}</p>}
                        </div>
                    </div>
                </div>
            </>
        }
    ];

    useEffect(() => {

        if (fetcher.data?.success === false && fetcher.data.error) {
            toast.error(fetcher.data.error);
            return;
        }

        return () => {

        }

    }, [fetcher.data]);

    return <>
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
        <Form method='POST' onSubmit={handleSubmit}>
            <div className="flex justify-between my-2">
                <div className="flex justify-start">
                    <Button variant={'outline'} type='button' onClick={() => setStepCnt((prev) => Math.max(prev - 1, 0))}
                        size={'icon'}
                        className='rounded-full'>
                        <ArrowLeft />
                    </Button>
                </div>
                <div className="flex justify-end ">
                    <Button variant={'outline'} type='button' onClick={() => setStepCnt(prev =>
                        prev < steps.length - 1 ? prev + 1 : prev
                    )}
                        size={'icon'} className='rounded-full'>
                        <ArrowRight />
                    </Button>
                </div>
            </div>
            {
                stepCnt === steps.length - 1 && (
                    <Button className='mt-4 w-full' type='button' Icon={Piano} isLoading={isSubmitting}
                        disabled={isSubmitting}
                        iconPlacement='left' onClick={handleOpenConfirmDialog}>Tham gia Photon Piano ngay
                    </Button>
                )
            }
        </Form>
        {confirmDialog}
    </>

}

function LoadingSkeleton() {
    return <div className="flex justify-center items-center my-4">
        <Skeleton className="w-full h-[500px] rounded-md" />
    </div>
}
