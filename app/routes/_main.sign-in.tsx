import { useEffect } from 'react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Separator } from '~/components/ui/separator'
import { Form, Link, useActionData, useLoaderData } from '@remix-run/react'
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from 'zod'
import { useRemixForm, getValidatedFormData } from "remix-hook-form";
import { Mail, Music, BookOpen, Headphones, MusicIcon, Users } from 'lucide-react'
import { PasswordInput } from '~/components/ui/password-input'
import { fetchSignIn } from '~/lib/services/auth'
import { getCurrentTimeInSeconds } from '~/lib/utils/datetime'
import { accountIdCookie, expirationCookie, idTokenCookie, refreshTokenCookie, roleCookie } from '~/lib/utils/cookie'
import { isAxiosError } from 'axios'
import { getErrorDetailsInfo, isRedirectError } from '~/lib/utils/error'
import { AuthResponse } from '~/lib/types/auth-response'
import { signInSchema } from '~/lib/utils/schemas'
import ForgotPasswordDialog from '~/components/auth/forgot-password-dialog'
import pianoBackgroundImg from '../lib/assets/images/piano_background.jpg';
import { Role } from '~/lib/types/account/account'
import { toastWarning } from '~/lib/utils/toast-utils'
import { ActionFunctionArgs, LoaderFunctionArgs, redirect } from '@remix-run/node'

type Props = {}

type SignInFormData = z.infer<typeof signInSchema>;

const resolver = zodResolver(signInSchema);

export async function action({ request }: ActionFunctionArgs) {

    try {

        const { errors, data, receivedValues: defaultValues } =
            await getValidatedFormData<SignInFormData>(request, resolver);

        if (errors) {
            // The keys "errors" and "defaultValues" are picked up automatically by useRemixForm
            return { success: false, errors, defaultValues };
        }

        const { email, password } = data;

        const response = await fetchSignIn(email, password);

        if (response.status === 200) {

            const { idToken, refreshToken, expiresIn, role, localId }: AuthResponse = response.data;

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
                    return redirect('/', { headers });
            }
        }


    } catch (error) {

        console.error(error);

        if (isRedirectError(error)) {
            throw error;
        }

        if (isAxiosError(error) && error.response?.status === 401) {
            return Response.json({
                success: false,
                error: 'Wrong email or password',
            }, {
                status: 401
            })
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

export async function loader({ request }: LoaderFunctionArgs) {

    const { protocol, host } = new URL(request.url);

    const baseUrl = `${protocol}//${host}`;

    return Response.json({ baseUrl }, {
        status: 200
    });
}

export default function SignInPage() {
    const {
        handleSubmit: submitSignInForm,
        formState: { errors, isSubmitting },
        register,
    } = useRemixForm<SignInFormData>({
        mode: "onSubmit",
        resolver
    });

    const { baseUrl } = useLoaderData<typeof loader>();
    const actionData = useActionData<typeof action>();

    useEffect(() => {
        if (actionData?.success === false && actionData?.error) {
            toastWarning(actionData?.error, {
                position: 'top-center',
                duration: 5000
            });
        }
    }, [actionData]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-theme/5 to-theme/10">
            <div className="container mx-auto min-h-screen md:grid md:grid-cols-2 md:gap-8 items-center py-12 px-4 max-md:flex max-md:flex-col">
                {/* Left side - Form */}
                <div className="w-full max-w-md mx-auto space-y-8">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-theme">
                            <Music className="h-8 w-8" />
                            <h1 className="text-4xl font-bold tracking-tight">
                                Welcome Back
                            </h1>
                        </div>
                        <p className="text-lg text-muted-foreground">
                            Continue your musical journey with PhotonPiano
                        </p>
                    </div>

                    <Form onSubmit={submitSignInForm} method="POST" className="space-y-6">
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="email">Email</Label>
                                <Input 
                                    {...register("email")} 
                                    type="email" 
                                    id="email"
                                    className="mt-1.5"
                                    placeholder="Enter your email"
                                    endContent={<Mail className="text-theme" />}
                                />
                                {errors.email && (
                                    <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="password">Password</Label>
                                <PasswordInput
                                    {...register("password")}
                                    id="password"
                                    className="mt-1.5"
                                    placeholder="Enter your password"
                                />
                                {errors.password && (
                                    <p className="mt-1 text-sm text-destructive">{errors.password.message}</p>
                                )}
                            </div>
                        </div>

                        <Button 
                            type="submit"
                            variant={'theme'}
                            className="w-full uppercase"
                            disabled={isSubmitting}
                            isLoading={isSubmitting}
                        >
                            {isSubmitting ? (
                                "Signing in..."
                            ) : (
                                <>
                                    Sign In
                                </>
                            )}
                        </Button>
                    </Form>

                    <div className="space-y-4">
                        <div className="text-center">
                            <ForgotPasswordDialog />
                        </div>

                        <Separator className="my-4" />

                        <div className="space-y-4">
                            <Button 
                                variant="outline" 
                                className="w-full border-theme/20 hover:bg-theme/5"
                                onClick={() => window.location.href = baseUrl}
                                disabled={isSubmitting}
                            >
                                <img
                                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                                    alt="Google"
                                    className="w-5 h-5 mr-2"
                                />
                                Continue with Google
                            </Button>

                            <div className="text-center text-sm">
                                <span className="text-muted-foreground">
                                    Don't have an account?{" "}
                                </span>
                                <Link 
                                    to="/entrance-survey"
                                    className="text-theme hover:text-theme/90 font-medium"
                                    aria-disabled={isSubmitting}
                                >
                                    Register now
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right side - Enhanced Content */}
                <div className="relative h-full min-h-[600px] rounded-2xl overflow-hidden md:block">
                    <div className="absolute inset-0 bg-gradient-to-br from-theme to-theme/80">
                        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm">
                            {/* Piano keys decoration */}
                            <div className="absolute bottom-0 left-0 right-0 flex">
                                {Array.from({ length: 14 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={`h-32 flex-1 border-r border-white/20 ${
                                            i % 2 === 0 ? "bg-white/10" : "bg-transparent"
                                        }`}
                                    />
                                ))}
                            </div>
                        </div>
                        
                        {/* Content */}
                        <div className="relative p-8 text-white h-full flex flex-col justify-between">
                            <div className="space-y-6">
                                <h2 className="text-3xl font-bold">
                                    Start Your Piano Journey
                                </h2>
                                <p className="text-white/90 text-lg">
                                    Join our community of passionate musicians and begin your musical adventure today.
                                </p>
                                
                                {/* Features */}
                                <div className="grid gap-4 mt-8">
                                    <div className="flex items-center gap-3 bg-white/10 p-4 rounded-lg backdrop-blur-sm">
                                        <MusicIcon className="h-8 w-8 text-white/90" />
                                        <div>
                                            <h3 className="font-semibold">Professional Instruction</h3>
                                            <p className="text-white/80 text-sm">Learn from experienced piano teachers</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-3 bg-white/10 p-4 rounded-lg backdrop-blur-sm">
                                        <Headphones className="h-8 w-8 text-white/90" />
                                        <div>
                                            <h3 className="font-semibold">Personalized Learning</h3>
                                            <p className="text-white/80 text-sm">Tailored lessons for your skill level</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-3 bg-white/10 p-4 rounded-lg backdrop-blur-sm">
                                        <Users className="h-8 w-8 text-white/90" />
                                        <div>
                                            <h3 className="font-semibold">Supportive Community</h3>
                                            <p className="text-white/80 text-sm">Connect with fellow piano enthusiasts</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Testimonial */}
                            <div className="bg-white/10 p-6 rounded-lg backdrop-blur-sm mt-8">
                                <p className="italic text-white/90">
                                    "PhotonPiano has transformed my musical journey. The structured learning approach and supportive community made all the difference."
                                </p>
                                <div className="mt-4 flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                                        <BookOpen className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="font-semibold">Tran Thanh Hung</p>
                                        <p className="text-sm text-white/80">Piano Learner</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}