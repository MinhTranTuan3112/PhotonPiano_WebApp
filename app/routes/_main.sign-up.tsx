import { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import homeBackgroundImg from '../../app/lib/assets/images/background-home.png';
import { Form, Link, useActionData, useLoaderData } from '@remix-run/react';
import { Label } from '~/components/ui/label';
import { Input } from '~/components/ui/input';
import { ArrowRight, Loader2, Mail } from 'lucide-react';
import { PasswordInput } from '~/components/ui/password-input';
import { Button, buttonVariants } from '~/components/ui/button';
import { Separator } from '~/components/ui/separator';
// import { GOOGLE_CLIENT_ID } from '~/lib/utils/constants';
import { signUpSchema } from '~/lib/utils/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getValidatedFormData, useRemixForm } from 'remix-hook-form';
import { getErrorDetailsInfo } from '~/lib/utils/error';
import { useEffect } from 'react';
import { toast } from 'sonner';
import pianoBackgroundImg from '../lib/assets/images/piano_background.jpg';

type Props = {}

type SignUpFormData = z.infer<typeof signUpSchema>;

const resolver = zodResolver(signUpSchema);


export async function loader({ request }: LoaderFunctionArgs) {

    const { protocol, host } = new URL(request.url);

    const baseUrl = `${protocol}//${host}`;

    return { baseUrl };
}

export async function action({ request }: ActionFunctionArgs) {
    try {

        const { errors, data, receivedValues: defaultValues } =
            await getValidatedFormData<SignUpFormData>(request, resolver);

        if (errors) {
            // The keys "errors" and "defaultValues" are picked up automatically by useRemixForm
            return { success: false, errors, defaultValues };
        }

        const { email, password } = data;

        // const response = await fetchSignUp(email, password);

        // return {
        //     success: response.status === 201
        // }

        return {
            success: true
        }

    } catch (error) {

        console.error({ error });

        const { message, status } = getErrorDetailsInfo(error);

        console.log({ message, status });

        return Response.json({
            success: false,
            error: message,
        }, {
            status
        });
    }
}


export default function SignUpPage({ }: Props) {

    const {
        handleSubmit: submitSignUpForm,
        formState: { errors, isSubmitting },
        register,
    } = useRemixForm<SignUpFormData>({
        mode: "onSubmit",
        resolver
    });

    const { baseUrl } = useLoaderData<typeof loader>();

    const actionData = useActionData<typeof action>();

    useEffect(() => {

        if (actionData?.success === false && actionData?.error) {
            toast.error(actionData?.error, {
                position: 'top-center',
            });
            return;
        }

        if (actionData?.success === true) {
            toast.success('Đăng ký tài khoản thành công!', {
                position: 'top-center',
            });
            return;
        }

        return () => {

        }

    }, [actionData]);


    // const googleSignInUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${baseUrl}&response_type=code&scope=openid%20email`;

    return (
        <div className="overflow-hidden">
            <div className="container py-24 max-md:px-10 lg:py-10 lg:px-44">

                <div className="md:pe-8 md:w-1/2 xl:pe-0 xl:w-5/12">
                    <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl uppercase">
                        Đăng ký
                    </h1>
                    <p className="mt-3 text-xl text-black/80">
                        Tham gia <strong>Photon Piano</strong> ngay để đắm mình vào những giai điệu piano du dương
                    </p>

                    <Form onSubmit={submitSignUpForm} method='POST' className='mt-8' action='/sign-up'>
                        <div className="mb-4">
                            <Label htmlFor="email" className="sr-only">
                                Email
                            </Label>
                            <Input {...register("email")} type="email" name='email' id="email" placeholder="Nhập email"
                                endContent={<Mail />} />
                            {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
                        </div>

                        <div className="mb-4">
                            <Label htmlFor="password" className="sr-only">
                                Password
                            </Label>
                            <PasswordInput  {...register("password")} name='password' id="password" placeholder="Nhập mật khẩu" />
                            {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
                        </div>

                        <div className="">
                            <Label htmlFor="confirmPassword" className="sr-only">
                                Confirm password
                            </Label>
                            <PasswordInput  {...register("confirmPassword")} name='confirmPassword' id="confirmPassword" placeholder="Xác nhận mật khẩu" />
                            {errors.confirmPassword && <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>}
                        </div>

                        <div className="my-4 flex justify-center">
                            <Button className='uppercase w-full max-w-52' type='submit' variant={'expandIconTheme'}
                                Icon={ArrowRight}
                                iconPlacement='right'
                                disabled={isSubmitting}
                                isLoading={isSubmitting}>
                                {isSubmitting ? 'Đang đăng ký' : 'Đăng ký'}
                            </Button>
                        </div>
                    </Form>

                    <Separator asChild className="my-6 bg-transparent">
                        <div className="py-3 flex items-center text-xs text-black uppercase before:flex-[1_1_0%] before:border-t before:border-black before:me-6 after:flex-[1_1_0%] after:border-t after:border-black after:ms-6 dark:before:border-white dark:after:border-white">
                            Hoặc
                        </div>
                    </Separator>

                    <div className="mt-8 grid">
                        <Link className={`${buttonVariants({ variant: "gooeyLeft" })} uppercase`} to={'/'}>
                            <svg
                                className="w-4 h-auto mr-2"
                                width={46}
                                height={47}
                                viewBox="0 0 46 47"
                                fill="none"
                            >
                                <path
                                    d="M46 24.0287C46 22.09 45.8533 20.68 45.5013 19.2112H23.4694V27.9356H36.4069C36.1429 30.1094 34.7347 33.37 31.5957 35.5731L31.5663 35.8669L38.5191 41.2719L38.9885 41.3306C43.4477 37.2181 46 31.1669 46 24.0287Z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M23.4694 47C29.8061 47 35.1161 44.9144 39.0179 41.3012L31.625 35.5437C29.6301 36.9244 26.9898 37.8937 23.4987 37.8937C17.2793 37.8937 12.0281 33.7812 10.1505 28.1412L9.88649 28.1706L2.61097 33.7812L2.52296 34.0456C6.36608 41.7125 14.287 47 23.4694 47Z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M10.1212 28.1413C9.62245 26.6725 9.32908 25.1156 9.32908 23.5C9.32908 21.8844 9.62245 20.3275 10.0918 18.8588V18.5356L2.75765 12.8369L2.52296 12.9544C0.909439 16.1269 0 19.7106 0 23.5C0 27.2894 0.909439 30.8731 2.49362 34.0456L10.1212 28.1413Z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M23.4694 9.07688C27.8699 9.07688 30.8622 10.9863 32.5344 12.5725L39.1645 6.11C35.0867 2.32063 29.8061 0 23.4694 0C14.287 0 6.36607 5.2875 2.49362 12.9544L10.0918 18.8588C11.9987 13.1894 17.25 9.07688 23.4694 9.07688Z"
                                    fill="#EB4335"
                                />
                            </svg>
                            Đăng ký với Google
                        </Link>
                    </div>

                    <div className="mt-4 text-center">
                        Đã có tài khoản?
                        <Link className={`${buttonVariants({ variant: "linkHover2" })} uppercase`} to={'/sign-in'}>
                            Đăng nhập ngay
                        </Link>
                    </div>

                </div>
            </div>
            <img
                className="hidden md:block md:absolute md:top-0 md:start-1/2 md:end-0 h-full"
                src={pianoBackgroundImg}
                alt="image description"
            />
        </div>
    )
}