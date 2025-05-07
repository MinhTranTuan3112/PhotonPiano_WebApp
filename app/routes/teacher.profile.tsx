import { Await, Form, useAsyncValue, useFetcher, useLoaderData } from '@remix-run/react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { SquareUserRound, Mail, Phone, MapPinHouse, Upload, Lock } from 'lucide-react'
import { z } from 'zod'
import { accountInfoSchema } from '~/lib/utils/schemas'
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

        if (role !== Role.Instructor) {
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

        if (role !== Role.Instructor) {
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

export default function AccountProfilePage({ }: Props) {

    const { promise } = useLoaderData<typeof loader>();

    return (
        <section className='px-10'>
            <div className="md:max-w-[60%]">
                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-bold">Personal Profile Information</h3>
                        <p className="text-sm text-muted-foreground">
                            This is your important personal information that <strong>Photon Piano</strong> uses to contact you.
                        </p>
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
            dateOfBirth: account.dateOfBirth ? new Date(account.dateOfBirth || '') : new Date()
        },
        fetcher
    });

    const isSubmitting = fetcher.state === 'submitting';

    const { open: handleOpenConfirmationDialog, dialog: confirmDialog } = useConfirmationDialog({
        title: 'Confirm Profile Update',
        description: 'Are you sure you want to update your personal information?',
        onConfirm: handleSubmit,
        confirmText: 'Update',
    });

    const { open: handleOpenImageDialog, isOpen, dialog: imagesDialog } = useImagesDialog({
        title: 'Add Image',
        description: 'Enter image URL or choose from your device.',
        onConfirm: (imageUrls) => {
            console.log({ imageUrls });
            setValue('avatarUrl', imageUrls[0]);
        },
        requiresUpload: true,
        maxImages: 1
    });

    useEffect(() => {
        if (fetcher.data?.success === true) {
            toast.success('Information updated successfully!', {
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

        return () => { };

    }, [fetcher.data]);

    return <>
        <Form onSubmit={handleOpenConfirmationDialog} method='POST' action='/teacher/profile' navigate={false}
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
                    placeholder='Enter full name...' />
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
                    placeholder='Enter username...' />
                <p className="text-sm text-muted-foreground mt-2">
                    This is your public username. You can use your real name or a nickname.
                </p>
                {errors.userName && <p className='text-sm text-red-600'>{errors.userName.message}</p>}
            </div>

            <div className="">
                <Label htmlFor='email'>Email</Label>
                <Input
                    {...register('email')}
                    startContent={<Mail />} name='email' type='text'
                    id='email'
                    placeholder='Enter email...'
                    readOnly />
                <p className="text-sm text-muted-foreground mt-2">
                    <strong>Photon Piano</strong> will use this email to contact you for support, entrance exams, class schedules, and other notifications.
                </p>
                {errors.email && <p className='text-sm text-red-600'>{errors.email.message}</p>}
            </div>

            <div className="">
                <Label htmlFor='phone'>Phone Number</Label>
                <Input
                    {...register('phone')}
                    startContent={<Phone />}
                    name='phone' type='text'
                    id='phone'
                    placeholder='Enter phone number...' />
                <p className="text-sm text-muted-foreground mt-2">
                    This number will be used to contact you if needed.
                </p>
                {errors.phone && <p className='text-sm text-red-600'>{errors.phone.message}</p>}
            </div>

            <div className="flex flex-col gap-2">
                <Label>Date of Birth</Label>
                <Controller
                    control={control}
                    name='dateOfBirth'
                    render={({ field: { onChange, onBlur, value, ref } }) => (
                        <DatePickerInput
                            value={value}
                            onChange={onChange}
                            onBlur={onBlur}
                            ref={ref}
                            className='w-full'
                            placeholder='Select date of birth'
                        />
                    )}
                />
                {errors.dateOfBirth && <p className='text-sm text-red-600'>{errors.dateOfBirth.message}</p>}
            </div>

            <div className="">
                <Label htmlFor='address'>Address</Label>
                <Input
                    {...register('address')}
                    startContent={<MapPinHouse />}
                    name='address'
                    type='text'
                    id='address'
                    placeholder='Enter address...' />
                <p className="text-sm text-muted-foreground mt-2">
                    This address will be used to send important documents if necessary.
                </p>
                {errors.address && <p className='text-sm text-red-600'>{errors.address.message}</p>}
            </div>

            <div className="">
                <Label>Gender</Label>
                <Controller
                    control={control}
                    name='gender'
                    render={({ field: { onChange, onBlur, value, ref } }) => (
                        <Select value={value?.toString()} onValueChange={onChange}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectLabel>Gender</SelectLabel>
                                    <SelectItem value={Gender.Male.toString()}>Male</SelectItem>
                                    <SelectItem value={Gender.Female.toString()}>Female</SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    )}
                />
                {errors.gender && <p className='text-sm text-red-600'>{errors.gender.message}</p>}
            </div>

            <div className="">
                <Label htmlFor='shortDescription'>Short Description About Yourself</Label>
                <Textarea
                    {...register('shortDescription')}
                    name='shortDescription'
                    id='shortDescription'
                    placeholder='Write a short description about yourself...' />
                <p className="text-sm text-muted-foreground mt-2">
                    This helps others understand you better.
                </p>
                {errors.shortDescription && <p className='text-sm text-red-600'>{errors.shortDescription.message}</p>}
            </div>

            <div className='flex gap-4 mt-4'>
                <Button type="submit" variant={'default'}
                    isLoading={isSubmitting}
                    disabled={isSubmitting}
                    className='md:max-w-[30%]'>
                    {isSubmitting ? 'Updating...' : 'Update Information'}
                </Button>

                <ForgotPasswordDialog trigger={
                    <Button type='button' variant={'outline'} Icon={Lock} iconPlacement='left'>
                        Request Password Reset
                    </Button>} />
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