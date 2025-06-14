import { zodResolver } from "@hookform/resolvers/zod"
import { type ActionFunctionArgs, type LoaderFunctionArgs, redirect } from "@remix-run/node"
import { Await, Form, useAsyncValue, useFetcher, useLoaderData } from "@remix-run/react"
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, Piano, PianoIcon } from "lucide-react"
import type React from "react"
import { Suspense, useState } from "react"
import { Control, Controller } from "react-hook-form"
import { getValidatedFormData, useRemixForm } from "remix-hook-form"
import { z } from "zod"
import { Button } from "~/components/ui/button"
import { Checkbox } from "~/components/ui/checkbox"
import CheckboxGroup from "~/components/ui/checkbox-group"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { PasswordInput } from "~/components/ui/password-input"
import { Skeleton } from "~/components/ui/skeleton"
import StepperBar from "~/components/ui/stepper"
import { UncheckableRadioGroup } from "~/components/ui/uncheckable-radio-group"
import { fetchEntranceSurvey, fetchSendEntranceSurveyAnswers } from "~/lib/services/survey"
import { QuestionType } from "~/lib/types/survey-question/survey-question"
import type { SurveyDetails } from "~/lib/types/survey/survey"
import { getAuth } from "~/lib/utils/auth"
import { getErrorDetailsInfo, isRedirectError } from "~/lib/utils/error"
import { useEffect } from "react"
import { useConfirmationDialog } from "~/hooks/use-confirmation-dialog"
import type { AuthResponse } from "~/lib/types/auth-response"
import { getCurrentTimeInSeconds } from "~/lib/utils/datetime"
import { accountIdCookie, expirationCookie, idTokenCookie, refreshTokenCookie, roleCookie } from "~/lib/utils/cookie"
import { Gender, Level, Role } from "~/lib/types/account/account"
import { toastWarning } from "~/lib/utils/toast-utils"
import { useTermsDialog } from "~/components/home/terms-and-conditions"
import { Card, CardContent } from "~/components/ui/card"
import { Progress } from "~/components/ui/progress"
import RadioGroupCards from "~/components/ui/radio-group-card"
import { useQuery } from "@tanstack/react-query"
import { fetchLevels } from "~/lib/services/level"
import { Badge } from "~/components/ui/badge"

type Props = {}

type SurveyStepProps = {
    title: string
    questionId?: string
    isRequired: boolean
    content: React.ReactNode
}

const entranceSurveySchema = z
    .object({
        fullName: z.string({ message: "Full name is required." }).min(1, { message: "Full name is required." }),
        email: z.string({ message: "Invalid email" }).email({ message: "Email is required" }),
        password: z
            .string({ message: "Password is required" })
            .min(6, { message: "Password must have at least 6 characters." }),
        confirmPassword: z
            .string({ message: "Please confirm password" })
            .min(6, { message: "Password must have at least 6 characters." }),
        phone: z.string({ message: "Phone is required." }).min(10, { message: "Invalid phone number." }),
        isTermsAgreed: z.literal<boolean>(true, {
            errorMap: () => ({ message: "Please read and accept Photon Piano terms and conditions" }),
        }),
        surveyAnswers: z.array(
            z.object({
                questionId: z.string(),
                answers: z.array(z.string()),
                otherAnswer: z.string().optional(),
            }),
        ),
        gender: z.coerce.number(),
        selfEvaluatedLevelId: z.string().optional()
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Confirm password did not match",
        path: ["confirmPassword"],
    })

type EntranceSurveyFormData = z.infer<typeof entranceSurveySchema>

export async function loader({ request }: LoaderFunctionArgs) {
    try {
        const { idToken } = await getAuth(request)

        if (idToken) {
            return redirect("/")
        }

        const promise = fetchEntranceSurvey().then((response) => {
            const surveyPromise: Promise<SurveyDetails> = response.data
            return { surveyPromise }
        })

        return {
            promise,
        }
    } catch (error) {
        console.error({ error })

        if (isRedirectError(error)) {
            throw error
        }

        const { message, status } = getErrorDetailsInfo(error)
        throw new Response(message, { status })
    }
}

export async function action({ request }: ActionFunctionArgs) {

    try {
        const { idToken } = await getAuth(request)

        if (idToken) {
            return redirect("/")
        }

        const {
            errors,
            data,
            receivedValues: defaultValues,
        } = await getValidatedFormData<EntranceSurveyFormData>(request, zodResolver(entranceSurveySchema))

        console.log({ lv: data?.selfEvaluatedLevelId });

        if (errors) {
            return { success: false, errors, defaultValues }
        }

        // return {
        //     success: true
        // }

        const response = await fetchSendEntranceSurveyAnswers({
            ...data,
            surveyAnswers: data.surveyAnswers.map((s) => ({
                surveyQuestionId: s.questionId,
                answers: s.answers.length > 0 ? s.answers : s.otherAnswer ? [s.otherAnswer] : [],
            })),
        })

        if (response.status === 200) {
            const { idToken, refreshToken, expiresIn, role, localId, requiresEntranceTestRegistering }: AuthResponse & {
                requiresEntranceTestRegistering: boolean
            } = await response.data;
            const expirationTime = getCurrentTimeInSeconds() + Number.parseInt(expiresIn)

            const headers = new Headers()
            headers.append("Set-Cookie", await idTokenCookie.serialize(idToken))
            headers.append("Set-Cookie", await refreshTokenCookie.serialize(refreshToken))
            headers.append("Set-Cookie", await expirationCookie.serialize(expirationTime.toString()))
            headers.append("Set-Cookie", await roleCookie.serialize(role))
            headers.append("Set-Cookie", await accountIdCookie.serialize(localId))

            return redirect(requiresEntranceTestRegistering ? "/?enroll-now=true" : "/", { headers });
        }

    } catch (error) {
        console.error({ error })

        if (isRedirectError(error)) {
            throw error
        }

        const { message, status } = getErrorDetailsInfo(error)

        return Response.json(
            {
                success: false,
                error: message,
            },
            {
                status: 400
            },
        )
    }
}

export default function EntranceSurveyPage({ }: Props) {
    const { promise } = useLoaderData<typeof loader>()

    return (
        <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 py-8 px-2">
            <div className="max-w-4xl mx-auto">
                <header className="text-center mb-8">
                    <div className="flex items-center justify-center mb-4">
                        <Piano className="h-10 w-10 text-primary mr-2" />
                        <h1 className="text-3xl font-bold text-primary">Photon Piano Center</h1>
                    </div>
                    <p className="text-muted-foreground">
                        Welcome to our community! Please complete this entrance survey to help us understand your musical
                        background.
                    </p>
                </header>

                <Card className="shadow-lg border-t-4 border-t-theme">
                    <CardContent className="p-6 md:p-8">
                        <Suspense fallback={<LoadingSkeleton />}>
                            <Await resolve={promise}>
                                {({ surveyPromise }) => (
                                    <Await resolve={surveyPromise}>
                                        <EntranceSurveyForm />
                                    </Await>
                                )}
                            </Await>
                        </Suspense>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function EntranceSurveyForm() {
    const surveyValue = useAsyncValue()
    const survey = surveyValue as SurveyDetails
    const fetcher = useFetcher<typeof action>()
    const isSubmitting = fetcher.state === "submitting"
    const [stepCnt, setStepCnt] = useState(0)

    const {
        handleSubmit,
        formState: { errors },
        control,
        register,
        getValues: getFormValues,
        setValue: setFormValue,
        watch,
    } = useRemixForm<EntranceSurveyFormData>({
        mode: "onSubmit",
        resolver: zodResolver(entranceSurveySchema),
        fetcher,
        defaultValues: {
            surveyAnswers: survey.pianoSurveyQuestions.map(({ questionId }) => ({ questionId: questionId, answers: [] })),
            gender: Gender.Male
        },
    })

    const { open: handleOpenConfirmDialog, dialog: confirmDialog } = useConfirmationDialog({
        title: "Complete Registration",
        description: "Are you ready to join Photon Piano Center?",
        onConfirm: () => {
            console.log({ errors });

            handleSubmit();
        },
        confirmText: "Join Now",
    })

    const { termsDialog, openTermsDialog } = useTermsDialog({
        onAccept: () => {
            setFormValue("isTermsAgreed", true)
        },
    })

    const surveyAnswers = watch("surveyAnswers")

    const questionSteps = survey.pianoSurveyQuestions
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map(({ question, isRequired, orderIndex, questionId }) => {
            return {
                questionId,
                isRequired,
                title: question.questionContent,
                content: (
                    <div className="space-y-6">
                        <h3 className="text-xl font-semibold text-center mb-6 text-primary">
                            {question.questionContent}
                            {isRequired && <span className="ml-1 text-red-500">*</span>}
                        </h3>

                        {question.type === QuestionType.MultipleChoice && (
                            <Controller
                                name="surveyAnswers"
                                control={control}
                                render={({ field: { onChange, onBlur, value = [], ref } }) => (
                                    <div className="bg-white p-4 rounded-lg shadow-sm">
                                        <CheckboxGroup
                                            values={value.find((v) => v.questionId === question.id)?.answers || []}
                                            onChange={(values) => {
                                                setFormValue(
                                                    "surveyAnswers",
                                                    value.map((v) => {
                                                        if (v.questionId === question.id) {
                                                            return { ...v, answers: values }
                                                        }
                                                        return v
                                                    }),
                                                )
                                            }}
                                            options={question.options.map((option) => {
                                                return {
                                                    value: option,
                                                    label: option,
                                                }
                                            })}
                                        />
                                    </div>
                                )}
                            />
                        )}

                        {(question.type === QuestionType.SingleChoice || question.type === QuestionType.LikertScale) && (
                            <Controller
                                name="surveyAnswers"
                                control={control}
                                render={({ field: { onChange, onBlur, value, ref } }) => (
                                    <div className="bg-white p-4 rounded-lg shadow-sm">
                                        <UncheckableRadioGroup
                                            options={question.options.map((option) => {
                                                return {
                                                    value: option,
                                                    label: option,
                                                }
                                            })}
                                            value={value.find((v) => v.questionId === question.id)?.answers[0] || null}
                                            onChange={(newAnswer) => {
                                                setFormValue(
                                                    "surveyAnswers",
                                                    value.map((v) => {
                                                        if (v.questionId === question.id) {
                                                            return { ...v, answers: [newAnswer || ""] }
                                                        }
                                                        return v
                                                    }),
                                                )
                                            }}
                                        />
                                    </div>
                                )}
                            />
                        )}

                        {(question.type === QuestionType.OpenText || question.type === QuestionType.NumericInput) && (
                            <div className="bg-white p-4 rounded-lg shadow-sm">
                                <Input
                                    placeholder="Enter your answer..."
                                    type={question.type === QuestionType.OpenText ? "text" : "number"}
                                    className="focus:ring-2 focus:ring-primary/50"
                                    value={surveyAnswers.find((s) => s.questionId === question.id)?.answers[0]}
                                    onChange={(e) => {
                                        const newAnswer = e.target.value
                                        setFormValue(
                                            "surveyAnswers",
                                            surveyAnswers.map((s) => {
                                                if (s.questionId === question.id) {
                                                    return { ...s, answers: [newAnswer] }
                                                }
                                                return s
                                            }),
                                        )
                                    }}
                                />
                            </div>
                        )}

                        {question.allowOtherAnswer && (
                            <div className="mt-4 bg-white p-4 rounded-lg shadow-sm">
                                <Label className="text-sm font-medium mb-2 block">Other (please specify)</Label>
                                <Input
                                    placeholder="Other answer..."
                                    className="rounded-md focus:ring-2 focus:ring-primary/50"
                                    value={surveyAnswers.find((s) => s.questionId === question.id)?.otherAnswer}
                                    onChange={(e) => {
                                        const newAnswer = e.target.value
                                        setFormValue(
                                            "surveyAnswers",
                                            surveyAnswers.map((s) => {
                                                if (s.questionId === question.id) {
                                                    return { ...s, otherAnswer: newAnswer }
                                                }
                                                return s
                                            }),
                                        )
                                    }}
                                />
                            </div>
                        )}
                    </div>
                ),
            }
        })

    const steps: SurveyStepProps[] = [
        ...questionSteps,
        {
            isRequired: true,
            title: 'How do you evaluate your piano skills?',
            content: (
                <SelfEvaluateLevelSection control={control}
                    onChange={(value) => setFormValue('selfEvaluatedLevelId', value)}
                    value={watch('selfEvaluatedLevelId')} />
            )
        },
        {
            isRequired: true,
            title: "Create Account",
            content: (
                <>
                    <div className="space-y-6">
                        <div className="text-center mb-6">
                            <h3 className="text-xl font-semibold text-primary">Create Your Account</h3>
                            <p className="text-sm text-muted-foreground mt-2">
                                Please provide your personal information to complete registration with Photon Piano Center.
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-sm space-y-5">
                            <div className="grid gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="fullName" className="font-bold text-sm">
                                        Full Name <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="fullName"
                                        {...register("fullName")}
                                        placeholder="Enter your full name"
                                        className="focus:ring-2 focus:ring-primary/50"
                                    />
                                    {errors.fullName && <p className="text-sm text-red-500 mt-1">{errors.fullName.message}</p>}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="font-bold text-sm">
                                            Email <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="email"
                                            {...register("email")}
                                            placeholder="Enter your email address"
                                            className="focus:ring-2 focus:ring-primary/50"
                                        />
                                        {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="phone" className="font-bold text-sm">
                                            Phone <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="phone"
                                            {...register("phone")}
                                            placeholder="Enter your phone number"
                                            className="focus:ring-2 focus:ring-primary/50"
                                        />
                                        {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone.message}</p>}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="font-bold">Gender <span className="text-red-500">*</span></Label>
                                    <Controller
                                        control={control}
                                        name="gender"
                                        render={({ field: { onChange, onBlur, value, ref } }) => (
                                            <RadioGroupCards
                                                value={value.toString()}
                                                onValueChange={onChange}
                                                orientation="horizontal"
                                                options={[{
                                                    label: 'Male',
                                                    value: Gender.Male.toString(),
                                                }, {
                                                    label: 'Female',
                                                    value: Gender.Female.toString(),
                                                }]}
                                            />
                                        )}
                                    />
                                </div>

                                {/* <div className="space-y-4 flex flex-col gap-2">
                                    <Label className="font-bold flex flex-col gap-2">
                                        <div className="text-xl">How do you evaluate your piano skills?</div>
                                        <div className="text-muted-foreground">
                                            If you self evaluate your piano skills higher than the first level,
                                            <br />
                                            you will have to
                                            participate in an piano entrance evaluation test to determine your piano level.
                                        </div>
                                    </Label>
                                    <Controller
                                        control={control}
                                        name="selfEvaluatedLevelId"
                                        render={({ field: { onChange, onBlur, value, ref } }) => (
                                            <LevelRadioGroup
                                                value={value}
                                                onChange={onChange}
                                            />
                                        )}
                                    />

                                </div> */}
                                {errors.selfEvaluatedLevelId && <p className="text-sm text-red-500">{errors.selfEvaluatedLevelId.message}</p>}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="password" className="font-bold text-sm">
                                            Password <span className="text-red-500">*</span>
                                        </Label>
                                        <PasswordInput
                                            id="password"
                                            {...register("password")}
                                            placeholder="Create a password"
                                            className="focus:ring-2 focus:ring-primary/50"
                                        />
                                        {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="confirmPassword" className="font-bold text-sm">
                                            Confirm Password <span className="text-red-500">*</span>
                                        </Label>
                                        <PasswordInput
                                            id="confirmPassword"
                                            {...register("confirmPassword")}
                                            placeholder="Confirm your password"
                                            className="focus:ring-2 focus:ring-primary/50"
                                        />
                                        {errors.confirmPassword && (
                                            <p className="text-sm text-red-500 mt-1">{errors.confirmPassword.message}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-start gap-2 mt-6 p-3 bg-gray-50 rounded-md">
                                <Controller
                                    name="isTermsAgreed"
                                    control={control}
                                    render={({ field: { onChange, onBlur, value, ref } }) => (
                                        <Checkbox id="terms" checked={value} onCheckedChange={onChange} className="mt-1"
                                            variant={'theme'}
                                        />
                                    )}
                                />
                                <div>
                                    <Label htmlFor="terms" className="text-sm font-medium">
                                        I agree to the{" "}
                                        <Button
                                            className="font-bold p-0 h-auto text-primary"
                                            type="button"
                                            variant={"link"}
                                            onClick={openTermsDialog}
                                        >
                                            terms and conditions
                                        </Button>{" "}
                                        of Photon Piano Center
                                    </Label>
                                    {errors.isTermsAgreed && <p className="text-sm text-red-500 mt-1">{errors.isTermsAgreed.message}</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            ),
        },
    ]

    useEffect(() => {
        if (fetcher.data?.success === false && fetcher.data.error) {
            toastWarning(fetcher.data.error, {
                duration: 5000,
            })
            return
        }
    }, [fetcher.data])

    const progressPercentage = Math.round((stepCnt / (steps.length - 1)) * 100)

    const isNextDisabled =
        stepCnt < questionSteps.length
            ? (() => {
                const step = questionSteps[stepCnt];
                if (!step.isRequired) {
                    return false;
                }

                const answer = watch('surveyAnswers')?.find(
                    (a) => a.questionId === step.questionId
                );

                return !answer || !answer.answers || answer.answers.length === 0;
            })()
            : false;


    return (
        <>
            <div className="mb-8">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-muted-foreground">
                        Step {stepCnt + 1} of {steps.length}
                    </span>
                    <span className="text-sm font-medium text-primary">{progressPercentage}% Complete</span>
                </div>
                <Progress value={progressPercentage} className="h-2 " indicatorColor="bg-blue-500" />

                <div className="mt-4 hidden md:block">
                    <StepperBar steps={steps.map((s) => s.title)} currentStep={stepCnt} showIndicatorTitle={false} />
                </div>
            </div>

            <div className="min-h-[400px]">
                {steps.map((step, index) => (
                    <div
                        className={`transition-all duration-500 ease-in-out ${stepCnt === index
                            ? "opacity-100 translate-x-0"
                            : stepCnt > index
                                ? "opacity-0 -translate-x-full hidden"
                                : "opacity-0 translate-x-full hidden"
                            }`}
                        key={index}
                    >
                        {stepCnt === index && step.content}
                    </div>
                ))}
            </div>

            <Form method="POST" onSubmit={handleOpenConfirmDialog}>
                <div className="flex justify-between mt-8">
                    <Button
                        variant="outline"
                        type="button"
                        onClick={() => setStepCnt((prev) => Math.max(prev - 1, 0))}
                        disabled={stepCnt === 0}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" /> Previous
                    </Button>

                    {stepCnt < steps.length - 1 ? (
                        <Button
                            type="button"
                            onClick={() => setStepCnt((prev) => Math.min(prev + 1, steps.length - 1))}
                            className="flex items-center gap-2"
                            disabled={isSubmitting || isNextDisabled}
                            variant={'theme'}
                        >
                            Next <ArrowRight className="h-4 w-4" />
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            onClick={handleOpenConfirmDialog}
                            disabled={isSubmitting || isNextDisabled}
                            className="flex items-center gap-2"
                            variant={'theme'}
                            isLoading={isSubmitting}
                        >
                            {isSubmitting ? (
                                "Processing..."
                            ) : (
                                <>
                                    <CheckCircle2 className="h-4 w-4" /> Complete Registration
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </Form>
            {confirmDialog}
            {termsDialog}
        </>
    )
}

function LoadingSkeleton() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Skeleton className="h-8 w-3/4 mx-auto" />
                <Skeleton className="h-4 w-1/2 mx-auto" />
            </div>

            <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>

            <div className="flex justify-between">
                <Skeleton className="h-10 w-28" />
                <Skeleton className="h-10 w-28" />
            </div>
        </div>
    )
}


function SelfEvaluateLevelSection({
    value,
    onChange,
    control
}: {
    value: string | undefined;
    onChange: (value: string) => void;
    control: Control<EntranceSurveyFormData>;
}) {

    const { data, isLoading, isError } = useQuery({
        queryKey: ['levels'],
        queryFn: async () => {
            const response = await fetchLevels();

            return await response.data;
        },
        enabled: true,
        refetchOnWindowFocus: false
    });

    const levels = data ? data as Level[] : [];

    if (isLoading) {
        return <Skeleton className="h-full w-full" />
    }

    useEffect(() => {

        if (levels.length > 0) {
            onChange(value || levels[0].id);
            return;
        }

        return () => {

        }

    }, [levels]);

    return <div className="space-y-4 flex flex-col gap-2">
        <Label className="flex flex-col gap-2 justify-center items-center">
            <div className="text-xl font-bold flex flex-row gap-1 items-center"><PianoIcon className="size-5" /> How do you evaluate your piano skills?</div>
            <div className="leading-7">
                Please self-evaluate your piano skills to help us understand your current level. <br />
                Some piano levels <strong className="text-red-600 uppercase">requires piano entrance test participation &#40;including theoretical and practical test parts&#41;</strong>
                {' '}
                to confirm your piano skills and determine your suitable class arrangement. <br />

                These levels are marked with <Badge className="text-red-600 bg-red-500/20 uppercase" variant={'outline'}>Entrance Test Required</Badge> <br />
                Other levels which do not require entrance test participation are marked with {' '}
                <Badge variant={'outline'} className="text-green-600 bg-green-500/20 uppercase">Entrance Test Not Required</Badge>

                <br />
                You can click on the <Eye className="inline" /> &#40;eye icon&#41; next to each level to view more details information about the piano level.
            </div>
        </Label>
        <div className="flex justify-center">
            <Controller
                control={control}
                name="selfEvaluatedLevelId"
                render={({ field: { onChange, onBlur, value, ref } }) => (
                    <RadioGroupCards
                        options={levels.map((level) => {
                            return {
                                label: <div style={{
                                    color: level.themeColor || 'black',
                                }} className="flex flex-row justify-between">
                                    {level.name}
                                    {level.requiresEntranceTest ? <Badge className="text-red-600 bg-red-500/20 uppercase" variant={'outline'}>Entrance Test Required</Badge>
                                        : <Badge variant={'outline'} className="text-green-600 bg-green-500/20 uppercase">Entrance Test Not Required</Badge>}
                                </div>,
                                value: level.id,
                                description: level.description,
                                id: level.id,
                            }
                        })}
                        value={value}
                        onValueChange={onChange}
                        orientation="vertical"
                        hasDetailsButton={true}
                    />
                )}
            />
        </div>

    </div>
}