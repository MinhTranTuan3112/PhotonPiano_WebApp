import { zodResolver } from '@hookform/resolvers/zod';
import { Form, useFetcher } from '@remix-run/react';
import React, { useEffect } from 'react';
import { useState } from 'react'
import { Controller } from 'react-hook-form';
import { getValidatedFormData, useRemixForm } from 'remix-hook-form';
import { Button } from '~/components/ui/button';
import StepperBar from '~/components/ui/stepper';
import { UncheckableRadioGroup } from '~/components/ui/uncheckable-radio-group';
import { SurveyFormData, surveySchema } from '~/lib/utils/schemas';
import { ArrowLeft, ArrowRight, Piano } from 'lucide-react'
import { ActionFunctionArgs } from '@remix-run/node';
import { toast } from 'sonner';
import CheckboxGroup from '~/components/ui/checkbox-group';
import { Label } from '~/components/ui/label';
import { Input } from '~/components/ui/input';
import { Textarea } from '~/components/ui/textarea';
import { Checkbox } from '~/components/ui/checkbox';
import { PasswordInput } from '~/components/ui/password-input';
import { SignUpRequest } from '~/lib/types/account/account';
import { fetchSignUp } from '~/lib/services/auth';
import { getErrorDetailsInfo, isRedirectError } from '~/lib/utils/error';
import { isAxiosError } from 'axios';

type Props = {}

type SurveyStepProps = {
    title: string;
    content: React.ReactNode;
};

const learningMethodOptions = [
    {
        label: 'Hướng dẫn 1 - 1',
        value: '1'
    },
    {
        label: 'Học theo nhóm',
        value: '2'
    },
    {
        label: 'Sao cũng được',
        value: '3'
    },
]
const targetOptions = [
    {
        label: 'Học căn bản',
        value: '1'
    },
    {
        label: 'Đọc được sheet nhạc',
        value: '2'
    },
    {
        label: 'Chơi được những bản nhạc ưu thích',
        value: '3'
    },
    {
        label: 'Chơi những bản nhạc khó',
        value: '4'
    },
    {
        label: 'Chơi được cả 2 tay',
        value: '5'
    },
    {
        label: 'Tự đệm hát cho mình',
        value: '6'
    },
    {
        label: 'Chơi được nhiều thể loại nhạc',
        value: '7'
    },
    {
        label: 'Biểu diễn được cho người thân của mình vào những dịp đặc biệt',
        value: '8'
    }
]
const musicGenreOptions = [
    {
        label: 'Cổ điển',
        value: '1'
    },
    {
        label: 'Nhạc Pop',
        value: '2'
    },
    {
        label: 'Jazz & Blue',
        value: '3'
    },
    {
        label: 'Country & Folk',
        value: '4'
    },
    {
        label: 'Nhạc thiếu nhi',
        value: '5'
    },
    {
        label: 'Nhạc lãng mạn',
        value: '6'
    },
    {
        label: 'Nhạc thánh ca',
        value: '7'
    },
    {
        label: 'Nhạc chủ đề phim hoặc game',
        value: '8'
    },
    {
        label: 'Khác',
        value: '9'
    }
]
const levelOptions = [
    {
        label: 'Chưa từng chạm đến piano',
        value: '1'
    },
    {
        label: 'Từng chơi qua một chút',
        value: '2'
    },
    {
        label: 'Chơi qua một thời gian',
        value: '3'
    },
    {
        label: 'Chơi rất lâu rồi',
        value: '4'
    },
    {
        label: 'Chuyên nghiệp',
        value: '5'
    },
    {
        label: 'Đã từng biểu diễn trên sân khấu',
        value: '6'
    }

]

const resolver = zodResolver(surveySchema);

export async function action({ request }: ActionFunctionArgs) {

    try {

        const { errors, data, receivedValues: defaultValues } =
            await getValidatedFormData<SurveyFormData>(request, resolver);

        if (errors) {
            return { success: false, errors, defaultValues };
        }

        console.log({ data });

        const signUpRequest = {
            ...data,
            desiredLevel: data.level,
            desiredTargets: data.targets,
            favoriteMusicGenres: data.favoriteGenres,
            preferredLearningMethods: data.learningMethods,
        } as SignUpRequest;

        const response = await fetchSignUp({ ...signUpRequest });

        return {
            success: response.status === 201
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

        return {
            success: false,
            error: message,
            status
        }
    }

}

export default function SurveyPage({ }: Props) {

    const [currentStepCount, setCurrentStepCount] = useState(0);

    const fetcher = useFetcher<typeof action>();

    const { handleSubmit, control,
        formState: { errors, isValid },
        register,
        getValues
    } = useRemixForm<SurveyFormData>({
        mode: 'onSubmit',
        resolver,
        fetcher,
        defaultValues: {
            favoriteGenres: [],
            isTermsAgreed: false
        }
    });

    const isSubmitting = fetcher.state === 'submitting';

    const steps: SurveyStepProps[] = [
        {
            title: 'Trình độ',
            content: <>
                <h1 className="md:text-3xl max-md:text-xl text-center">Bạn có kinh nghiệm chơi piano chưa nhỉ?</h1>
                <p className="text-muted-foreground max-md:text-sm text-center mb-4">Bạn có thể bắt đầu học piano ở Photon Piano từ con số 0</p>
                <Controller
                    name='level'
                    control={control}
                    render={({ field: { onChange, onBlur, value, ref } }) => (
                        <UncheckableRadioGroup
                            options={levelOptions}
                            value={value}
                            onChange={(e) => {
                                onChange(e);
                                setCurrentStepCount(1);
                            }}
                        />
                    )}
                />
                {errors.level && <p className="text-red-600 text-sm">{errors.level.message}</p>}
                {getValues().level && (
                    <div className="flex justify-end my-2">
                        <Button variant={'outline'} type='button' onClick={() => setCurrentStepCount(prev =>
                            prev < steps.length - 1 ? prev + 1 : prev
                        )}
                            size={'icon'} className='rounded-full'><ArrowRight /></Button>
                    </div>
                )}
            </>
        }, {
            title: 'Mục tiêu',
            content: <>
                <h1 className="md:text-3xl max-md:text-xl my-3 text-center">Bạn mong muốn đạt được gì sau khóa học piano?</h1>
                {/* <p className="text-muted-foreground">Bạn có thể bắt đầu học piano ở Photon Piano từ con số 0</p> */}
                <Controller
                    name='targets'
                    control={control}
                    render={({ field: { onChange, onBlur, value = [], ref } }) => (
                        <CheckboxGroup
                            values={value}
                            onChange={onChange}
                            options={targetOptions}
                        />
                    )}
                />
                {errors.targets && <p className="text-red-600 text-sm">{errors.targets.message}</p>}
                <div className="flex justify-between my-2">
                    <Button variant={'outline'} type='button' onClick={() => setCurrentStepCount((prev) => Math.max(prev - 1, 0))}
                        size={'icon'}
                        className='rounded-full'>
                        <ArrowLeft />
                    </Button>

                    <div className="flex justify-end">
                        <Button variant={'outline'} type='button' onClick={() => setCurrentStepCount(prev =>
                            prev < steps.length - 1 ? prev + 1 : prev
                        )}
                            size={'icon'} className='rounded-full'><ArrowRight /></Button>
                    </div>

                </div>
            </>
        }, {
            title: 'Thể loại nhạc',
            content: <>
                <h1 className="md:text-3xl max-md:text-xl my-2 text-center">Dòng nhạc yêu thích của bạn là gì?</h1>
                {/* <p className="text-muted-foreground">Bạn có thể bắt đầu học piano ở Photon Piano từ con số 0</p> */}
                <Controller
                    key={'favoriteGenresCheckboxes'}
                    name='favoriteGenres'
                    control={control}
                    render={({ field: { onChange, onBlur, value: values = [], ref } }) => (
                        <CheckboxGroup options={musicGenreOptions}
                            values={values}
                            onChange={(updatedValues) => {
                                onChange(updatedValues);
                            }} />
                    )}
                />

                {errors.favoriteGenres && <p className="text-red-600 text-sm">{errors.favoriteGenres.message}</p>}

                <div className="flex justify-between my-2">
                    <Button variant={'outline'} type='button' onClick={() => setCurrentStepCount((prev) => Math.max(prev - 1, 0))}
                        size={'icon'}
                        className='rounded-full'>
                        <ArrowLeft />
                    </Button>

                    <div className="flex justify-end ">
                        <Button variant={'outline'} type='button' onClick={() => setCurrentStepCount(prev =>
                            prev < steps.length - 1 ? prev + 1 : prev
                        )}
                            size={'icon'} className='rounded-full'><ArrowRight /></Button>
                    </div>

                </div>

            </>
        }, {
            title: 'Phương pháp học',
            content: <>
                <h1 className="md:text-3xl max-md:text-xl my-2 text-center">Bạn ưa thích học theo phương pháp nào?</h1>
                {/* <p className="text-muted-foreground">Bạn có thể bắt đầu học piano ở Photon Piano từ con số 0</p> */}
                <Controller
                    name='learningMethods'
                    control={control}
                    render={({ field: { onChange, onBlur, value = [], ref } }) => (
                        <CheckboxGroup options={learningMethodOptions}
                            values={value}
                            onChange={(updatedValues) => {
                                onChange(updatedValues);
                            }} />
                    )}
                />

                {errors.learningMethods && <p className="text-red-600 text-sm">{errors.learningMethods.message}</p>}

                <div className="flex justify-between my-2">
                    <div className="flex justify-start">
                        <Button variant={'outline'} type='button' onClick={() => setCurrentStepCount((prev) => Math.max(prev - 1, 0))}
                            size={'icon'}
                            className='rounded-full'>
                            <ArrowLeft />
                        </Button>
                    </div>
                    <div className="flex justify-end ">
                        <Button variant={'outline'} type='button' onClick={() => setCurrentStepCount(prev =>
                            prev < steps.length - 1 ? prev + 1 : prev
                        )}
                            size={'icon'} className='rounded-full'><ArrowRight /></Button>
                    </div>
                </div>
            </>
        }, {
            title: 'Đăng ký tài khoản',
            content: <>
                <div className='mt-4 flex flex-col gap-4'>
                    <p className="text-sm text-muted-foreground">
                        Đây là những thông tin cá nhân quan trọng của bạn
                        mà <strong>Photon Piano</strong> sử dụng để liên lạc với bạn.
                    </p>
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
                    <div className='flex gap-4 items-start'>
                        <Label htmlFor="shortDescription" className="w-32">
                            Mô tả trình độ
                        </Label>
                        <div className="w-full">
                            <Textarea id="shortDescription" {...register('shortDescription')} placeholder='Mô tả ngắn về trình độ piano hiện tại của bạn...'
                                rows={3} />
                            {errors.shortDescription && <p className='text-sm text-red-600'>{errors.shortDescription.message}</p>}
                        </div>
                    </div>
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

        if (fetcher.data?.success && fetcher.data.success === true) {
            toast.success('Đăng ký thành công! Cảm ơn bạn đã chọn Photon Piano!');
            return;
        }

        if (fetcher.data?.success === false) {
            toast.error(fetcher.data.error);
            return;
        }

        return () => {

        }

    }, [fetcher.data]);

    return (
        <article className='md:max-w-[60%] max-md:px-10 mx-auto my-4'>
            <div className="mb-3">
                <StepperBar steps={steps.map(s => s.title)} currentStep={currentStepCount} showIndicatorTitle={true} />
            </div>
            <Form method='POST' onSubmit={handleSubmit} navigate={false}>
                {steps.map((step, index) => (
                    <section className={`transition-opacity duration-300 ease-in-out ${currentStepCount === index ? 'opacity-100' : 'opacity-0'}`} key={index}>
                        {currentStepCount === index && step.content}
                    </section>
                ))}
                {
                    currentStepCount === steps.length - 1 && (
                        <Button className='mt-4 w-full' type='submit' Icon={Piano} isLoading={isSubmitting}
                            iconPlacement='left'>Tham gia Photon Piano ngay</Button>
                    )
                }
            </Form>
        </article>
    );
};
