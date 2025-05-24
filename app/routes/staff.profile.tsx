import { Await, Form, useAsyncValue, useFetcher, useLoaderData } from '@remix-run/react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { SquareUserRound, Mail, Phone, Upload, Lock, User } from 'lucide-react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { getValidatedFormData, useRemixForm } from 'remix-hook-form'
import { Suspense, useEffect } from 'react'
import { Skeleton } from '~/components/ui/skeleton'
import { ActionFunctionArgs, LoaderFunctionArgs, redirect } from '@remix-run/node'
import { Account, Gender, Level, Role, StudentStatus } from '~/lib/types/account/account'
import { toast } from 'sonner'
import { Label } from '~/components/ui/label'
import { Separator } from '~/components/ui/separator'
import { Textarea } from '~/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { useImagesDialog } from '~/hooks/use-images-dialog'
import { LevelBadge, StatusBadge } from '~/components/staffs/table/student-columns'
import { Controller } from 'react-hook-form'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '~/components/ui/select'
import { DatePickerInput } from '~/components/ui/date-picker-input'
import { useConfirmationDialog } from '~/hooks/use-confirmation-dialog'
import { getErrorDetailsInfo, isRedirectError } from '~/lib/utils/error'
import { requireAuth } from '~/lib/utils/auth'
import { fetchCurrentAccountInfo } from '~/lib/services/auth'
import { fetchUpdateAccountInfo } from '~/lib/services/account'
import { useAuth } from '~/lib/contexts/auth-context'
import ForgotPasswordDialog from '~/components/auth/forgot-password-dialog'
import { toastWarning } from '~/lib/utils/toast-utils'
type Props = {}

const accountInfoSchema = z
    .object({
        avatarUrl: z.string().optional(),
        email: z
            .string({ message: "Email is required." })
            .email({ message: "Invalid email format." }),
        fullName: z
            .string({ message: "Full name is required." })
            .min(1, { message: "Full name is required." }),
        userName: z
            .string({ message: "Username is required." })
            .min(1, { message: "Username is required." }),
        phone: z
            .string({ message: "Phone number is required." })
            .min(10, { message: "Invalid phone number." }),
    });

type ProfileFormData = z.infer<typeof accountInfoSchema>;

const resolver = zodResolver(accountInfoSchema);

// async function getSampleProfileInfo() {

//     await new Promise((resolve) => setTimeout(resolve, 1000));

//     return {
//         userName: 'abc',
//         email: 'abc@gmail.com',
//         fullName: 'Nguyễn Văn A',
//         address: '123 abc',
//         phone: '0123456789',
//         shortDescription: '...',
//         level: Level.Beginner,
//         role: Role.Student,
//         studentStatus: StudentStatus.AttemptingEntranceTest,
//         gender: Gender.Male
//     } as Account;
// }

export async function loader({ request }: LoaderFunctionArgs) {

    try {

        const { idToken, role } = await requireAuth(request);

        if (role !== Role.Staff) {
            return redirect('/');
        }

        const promise = fetchCurrentAccountInfo({ idToken }).then((response) => {
            const accountPromise: Promise<Account> = response.data;

            return { accountPromise };
        });

        return {
            promise,
            role
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

type ServerFormData = {
    dateOfBirth: string;
} & Omit<ProfileFormData, 'dateOfBirth'>;

export async function action({ request }: ActionFunctionArgs) {

    try {

        const { idToken, role } = await requireAuth(request);

        if (role !== Role.Staff) {
            return redirect('/');
        }

        const { errors, data, receivedValues: defaultValues } =
            await getValidatedFormData<ServerFormData>(request, resolver);

        if (errors) {
            return { success: false, errors, defaultValues };
        }

        // let uploadImageUrl: string | undefined = undefined;

        // if (data.avatar) {

        //     const uploadImageResponse = await uploadImageFile({
        //         file: data.avatar,
        //         name: data.avatar?.name,
        //         groupId: TEST_IMAGE_GROUP_ID,
        //         size: data.avatar?.size,
        //     });

        //     const imageData = await uploadImageResponse.data;

        //     const imageCID = imageData.cid;

        //     uploadImageUrl = getImageUrl(imageCID);
        // }

        const response = await fetchUpdateAccountInfo({ idToken, request: data });

        return {
            success: response.status === 204
        }

    } catch (error) {
        console.error({ error });

        if (isRedirectError(error)) {
            throw error;
        }

        const { message, status } = getErrorDetailsInfo(error);

        return {
            success: false,
            error: message,
            status
        }
    }

}

export default function StaffProfilePage({ }: Props) {
    const { promise } = useLoaderData<typeof loader>();

    return (
        <section className='px-10'>
            <div className="md:max-w-[60%]">
                <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-4">
                        <User className="h-8 w-8 text-sky-600" />
                        <div>
                            <h3 className="text-2xl font-bold text-sky-800">Personal Profile Information</h3>
                        </div>
                    </div>
                    <Separator />
                    <Suspense fallback={<LoadingSkeleton />}>
                        <Await resolve={promise}>
                            {({ accountPromise }) => (
                                <Await resolve={accountPromise}>
                                    <ProfileForm />
                                </Await>
                            )}
                        </Await>
                    </Suspense>
                </div>
            </div>
        </section>
    )
}

function ProfileForm() {
    const accountValue = useAsyncValue();
    const account = accountValue as Account;
    const fetcher = useFetcher<typeof action>();
    const { refetchAccountInfo } = useAuth();

    const {
        handleSubmit,
        formState: { errors },
        register,
        setValue,
        getValues,
        control
    } = useRemixForm<ProfileFormData>({
        mode: "onSubmit",
        resolver,
        defaultValues: {
            ...account,
        },
        fetcher
    });

    const isSubmitting = fetcher.state === 'submitting';

    const { open: handleOpenConfirmationDialog, dialog: confirmDialog } = useConfirmationDialog({
        title: 'Confirm Profile Update',
        description: 'Are you sure you want to update your personal profile information?',
        onConfirm: handleSubmit,
        confirmText: 'Update',
    });

    const { open: handleOpenImageDialog, isOpen, dialog: imagesDialog } = useImagesDialog({
        title: 'Add Image',
        description: 'Enter an image URL or upload an image from your device.',
        onConfirm: (imageUrls) => {
            console.log({ imageUrls });
            setValue('avatarUrl', imageUrls[0]);
        },
        requiresUpload: true,
        maxImages: 1
    });

    useEffect(() => {
        if (fetcher.data?.success === true) {
            toast.success('Profile updated successfully!', {
                position: 'top-center',
                duration: 1250
            });
            refetchAccountInfo();
            return;
        }

        if (fetcher.data?.success === false && fetcher.data.error) {
            toastWarning(`Update failed! ${fetcher.data.error}`, {
                position: 'top-center',
                duration: 1250
            });
            return;
        }

        return () => { }
    }, [fetcher.data]);

    return <>
        <Form onSubmit={handleOpenConfirmationDialog} method='POST' action='/staff/profile' navigate={false}
            className='flex flex-col gap-5'>

            <Avatar className='size-32 inline-block relative left-1/2 -translate-x-1/2'>
                <AvatarImage src={getValues().avatarUrl ? getValues().avatarUrl : "/images/noavatar.png"} alt={account.userName || account.fullName} />
                <AvatarFallback>
                    <Skeleton className='rounded-full size-32' />
                </AvatarFallback>
            </Avatar>

            <Button type='button' className='max-w-40 w-full mx-auto'
                Icon={Upload} iconPlacement='left' variant={'outline'}
                onClick={handleOpenImageDialog}>
                Upload Image
            </Button>

            {errors.avatarUrl && <p className='text-sm text-red-600'>{errors.avatarUrl.message}</p>}

            <div>
                <Label htmlFor='fullName'>Full Name</Label>
                <Input
                    {...register('fullName')}
                    name='fullName'
                    id='fullName'
                    type='text'
                    placeholder='Enter your full name...' />
                {errors.fullName && <p className='text-sm text-red-600'>{errors.fullName.message}</p>}
            </div>

            <div>
                <Label htmlFor='userName'>Username</Label>
                <Input
                    {...register('userName')}
                    startContent={<SquareUserRound />}
                    name='userName'
                    id='userName'
                    type='text'
                    placeholder='Enter your username...' />
                {errors.userName && <p className='text-sm text-red-600'>{errors.userName.message}</p>}
            </div>

            <div>
                <Label htmlFor='email'>Email</Label>
                <Input
                    {...register('email')}
                    startContent={<Mail />}
                    name='email'
                    type='text'
                    id='email'
                    placeholder='Enter your email...'
                    readOnly />
                {errors.email && <p className='text-sm text-red-600'>{errors.email.message}</p>}
            </div>

            <div>
                <Label htmlFor='phone'>Phone Number</Label>
                <Input
                    {...register('phone')}
                    startContent={<Phone />}
                    name='phone' type='text'
                    id='phone'
                    placeholder='Enter your phone number...' />
                {errors.phone && <p className='text-sm text-red-600'>{errors.phone.message}</p>}
            </div>

            <div className='flex gap-4 mt-4'>
                <Button type="submit" variant={'default'}
                    isLoading={isSubmitting}
                    disabled={isSubmitting}
                    className='md:max-w-[30%]'>
                    {isSubmitting ? 'Updating...' : 'Update Profile'}
                </Button>

                <ForgotPasswordDialog trigger={
                    <Button type='button' variant={'outline'} Icon={Lock} iconPlacement='left'>
                        Request Password Reset
                    </Button>
                } />
            </div>

        </Form>
        {imagesDialog}
        {confirmDialog}
    </>
}

function LoadingSkeleton() {
    return <div className="flex flex-col space-y-3">
        <Skeleton className="h-52 rounded-xl" />
        <div className="space-y-2">
            <Skeleton className="h-7" />
            <Skeleton className="h-7" />
            <Skeleton className="h-7" />
            <Skeleton className="h-7" />
        </div>
    </div>
}

// function AcademicInfoSection() {
//     const accountValue = useAsyncValue();

//     const account = accountValue as Account;

//     return <section className="flex flex-col gap-3 my-3">
//         <div className="">
//             <Label>Level piano hiện tại: </Label><LevelBadge level={account.level} />
//         </div>
//         <div className="">
//             <Label>Tình trạng học tập: </Label><StatusBadge status={account.studentStatus || 0} />
//         </div>
//     </section>
// }