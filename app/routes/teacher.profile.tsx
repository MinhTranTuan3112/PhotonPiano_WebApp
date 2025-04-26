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
                        <h3 className="text-lg font-bold">Thông tin hồ sơ cá nhân</h3>
                        <p className="text-sm text-muted-foreground">
                            Đây là những thông tin cá nhân quan trọng của bạn
                            mà <strong>Photon Piano</strong> sử dụng để liên lạc với bạn.
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
        title: 'Xác nhận cập nhật thông tin',
        description: 'Bạn có chắc chắn muốn cập nhật thông tin cá nhân của mình không?',
        onConfirm: handleSubmit,
        confirmText: 'Cập nhật',
    });

    const { open: handleOpenImageDialog, isOpen, dialog: imagesDialog } = useImagesDialog({
        title: 'Thêm ảnh',
        description: 'Nhập ảnh từ url hoặc chọn ảnh từ thiết bị của bạn.',
        onConfirm: (imageUrls) => {
            console.log({ imageUrls });
            setValue('avatarUrl', imageUrls[0]);
        },
        requiresUpload: true,
        maxImages: 1
    });

    useEffect(() => {

        if (fetcher.data?.success === true) {
            toast.success('Lưu thông tin thành công!', {
                position: 'top-center',
                duration: 1250
            });
            refetchAccountInfo();
            return;
        }

        if (fetcher.data?.success === false && fetcher.data.error) {
            toast.warning(`Lưu thất bại! ${fetcher.data.error}`, {
                position: 'top-center',
                duration: 1250
            });
            return;
        }


        return () => {

        }

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
                Upload ảnh
            </Button>

            {errors.avatarUrl && <p className='text-sm text-red-600'>{errors.avatarUrl.message}</p>}

            <div>

                <Label htmlFor='fullName'>Họ và tên</Label>
                <Input
                    {...register('fullName')}
                    name='fullName'
                    id='fullName'
                    type='text'
                    placeholder='Nhập họ và tên...' />
                {errors.fullName && <p className='text-sm text-red-600'>{errors.fullName.message}</p>}

            </div>

            <div>
                <Label htmlFor='userName'>Tên người dùng</Label>
                <Input
                    {...register('userName')}
                    startContent={<SquareUserRound />}
                    name='userName'
                    id='userName'
                    type='text'
                    placeholder='Nhập tên người dùng...' />
                <p className="text-sm text-muted-foreground mt-2">Đây là tên người dùng được hiển thị công khai của bạn.
                    Bạn có thể dùng họ và tên hoặc biệt danh của mình.
                </p>
                {errors.userName && <p className='text-sm text-red-600'>{errors.userName.message}</p>}
            </div>

            <div className="">
                <Label htmlFor='email'>Email</Label>
                <Input
                    {...register('email')}
                    startContent={<Mail />} name='email' type='text'
                    id='email'
                    placeholder='Nhập email...'
                    readOnly />
                <p className="text-sm text-muted-foreground mt-2">
                    <strong>Photon Piano</strong> sẽ sử dụng email này để liên lạc với bạn về vấn đề hỗ trợ đăng ký học ở trung tâm, lịch thi đầu vào
                    lịch học trung tâm và các thông báo khác.
                </p>
                {errors.email && <p className='text-sm text-red-600'>{errors.email.message}</p>}
            </div>

            <div className="">
                <Label htmlFor='phone'>Số điện thoại</Label>
                <Input
                    {...register('phone')}
                    startContent={<Phone />}
                    name='phone' type='text'
                    id='phone'
                    placeholder='Nhập số điện thoại..' />
                <p className="text-sm text-muted-foreground mt-2">
                    Số điện thoại này sẽ được sử dụng để liên lạc với bạn trong trường hợp cần thiết.
                </p>
                {errors.phone && <p className='text-sm text-red-600'>{errors.phone.message}</p>}
            </div>

            <div className="flex flex-col gap-2">
                <Label>Ngày sinh</Label>
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
                            placeholder='Chọn ngày sinh'
                        />
                    )}
                />
                {errors.dateOfBirth && <p className='text-sm text-red-600'>{errors.dateOfBirth.message}</p>}
            </div>

            <div className="">
                <Label htmlFor='address'>Địa chỉ</Label>
                <Input
                    {...register('address')}
                    startContent={<MapPinHouse />}
                    name='address'
                    type='text'
                    id='address'
                    placeholder='Nhập địa chỉ...' />
                <p className="text-sm text-muted-foreground mt-2">
                    Địa chỉ này sẽ được sử dụng để gửi hồ sơ, tài liệu quan trọng nếu cần thiết.
                </p>
                {errors.address && <p className='text-sm text-red-600'>{errors.address.message}</p>}
            </div>

            <div className="">
                <Label>Giới tính</Label>
                <Controller
                    control={control}
                    name='gender'
                    render={({ field: { onChange, onBlur, value, ref } }) => (
                        <Select value={value?.toString()} onValueChange={onChange}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Chọn giới tính" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectLabel>Giới tính</SelectLabel>
                                    <SelectItem value={Gender.Male.toString()}>Nam</SelectItem>
                                    <SelectItem value={Gender.Female.toString()}>Nữ</SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    )}
                />
                {errors.gender && <p className='text-sm text-red-600'>{errors.gender.message}</p>}
            </div>

            <div className="">
                <Label htmlFor='shortDescription'>Mô tả ngắn về bản thân</Label>
                <Textarea
                    {...register('shortDescription')}
                    name='shortDescription'
                    id='shortDescription'
                    placeholder='Nhập mô tả ngắn về bản thân...' />
                <p className="text-sm text-muted-foreground mt-2">
                    Mô tả ngắn về bản thân giúp người khác hiểu rõ bạn hơn.
                </p>
                {errors.shortDescription && <p className='text-sm text-red-600'>{errors.shortDescription.message}</p>}
            </div>

            <div className='flex gap-4  mt-4'>

                <Button type="submit" variant={'default'}
                    isLoading={isSubmitting}
                    disabled={isSubmitting}
                    className='md:max-w-[30%]'>
                    {isSubmitting ? 'Đang cập nhật' : 'Cập nhật thông tin'}
                </Button>
                <ForgotPasswordDialog trigger={
                    <Button type='button' variant={'outline'} Icon={Lock} iconPlacement='left'>
                        Yêu cầu đặt lại mật khẩu
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