import { Await, Form, useFetcher, useLoaderData } from '@remix-run/react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { SquareUserRound, Mail, Phone, MapPinHouse } from 'lucide-react'
import { z } from 'zod'
import { accountInfoSchema } from '~/lib/utils/schemas'
import { zodResolver } from '@hookform/resolvers/zod'
import { getValidatedFormData, useRemixForm } from 'remix-hook-form'
import { Suspense, useEffect } from 'react'
import { Skeleton } from '~/components/ui/skeleton'
import { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node'
import { Account } from '~/lib/types/account/account'
import { toast } from 'sonner'
import { Label } from '~/components/ui/label'
import { Separator } from '~/components/ui/separator'

type Props = {}

type ProfileFormData = z.infer<typeof accountInfoSchema>;

const resolver = zodResolver(accountInfoSchema);

async function getSampleProfileInfo() {

    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
        username: 'abc',
        email: 'abc@gmail.com',
        address: '123 abc',
        phone: '0123456789'
    } as Account;
}

export async function loader({ }: LoaderFunctionArgs) {
    return {
        profilePromise: getSampleProfileInfo()
    }
}

export async function action({ request }: ActionFunctionArgs) {

    const { errors, data, receivedValues: defaultValues } =
        await getValidatedFormData<ProfileFormData>(request, resolver);

    if (errors) {
        return { success: false, errors, defaultValues };
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
        success: true
    }
}

export default function AccountProfilePage({ }: Props) {

    const { profilePromise } = useLoaderData<typeof loader>();

    return (
        <section className='px-10'>
            <div className="md:max-w-[60%]">
                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-medium">Thông tin hồ sơ cá nhân</h3>
                        <p className="text-sm text-muted-foreground">
                            Đây là những thông tin cá nhân quan trọng của bạn
                            mà <strong>Photon Piano</strong> sử dụng để liên lạc với bạn.
                        </p>
                    </div>
                    <Separator />
                    <Suspense fallback={<ProfileFormSkeleton />}>
                        <Await resolve={profilePromise}>
                            {(account) => (
                                <ProfileForm account={account} />
                            )}
                        </Await>
                    </Suspense>
                </div>
            </div>
        </section>
    )
}

function ProfileForm({ account }: { account: Account }) {

    const fetcher = useFetcher<typeof action>();

    const {
        handleSubmit,
        formState: { errors },
        register,

    } = useRemixForm<ProfileFormData>({
        mode: "onSubmit",
        resolver,
        defaultValues: {
            username: account.username,
            email: account.email,
            phone: account.phone,
            address: account.address
        },
        fetcher
    });

    const isSubmitting = fetcher.state === 'submitting';

    useEffect(() => {

        if (fetcher.data?.success === false && fetcher.data?.errors) {
            toast.error('Lưu thất bại!', {
                position: 'top-center',
                duration: 1250
            });
            return;
        }

        if (fetcher.data?.success === true) {
            toast.success('Lưu thông tin thành công!', {
                position: 'top-center',
                duration: 1250
            });
            return;
        }

        return () => {

        }

    }, [fetcher.data]);

    return <Form onSubmit={handleSubmit} method='POST' action='/account/profile' navigate={false}
        className='flex flex-col gap-5'>

        <div>
            <Label htmlFor='username'>Tên người dùng</Label>
            <Input
                {...register('username')}
                startContent={<SquareUserRound />}
                name='username'
                id='username'
                type='text'
                placeholder='Nhập tên người dùng...' />
            <p className="text-sm text-muted-foreground mt-2">Đây là tên người dùng được hiển thị công khai của bạn.
                Bạn có thể dùng họ và tên hoặc biệt danh của mình.
            </p>
            {errors.username && <p className='text-sm text-red-600'>{errors.username.message}</p>}
        </div>
        <div className="">
            <Label htmlFor='email'>Email</Label>
            <Input
                {...register('email')}
                startContent={<Mail />} name='email' type='text'
                id='email'
                placeholder='Nhập email...' />
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


        <Button type="submit" variant={'default'}
            isLoading={isSubmitting}
            disabled={isSubmitting}
            className='md:max-w-[30%] mt-4'>
            {isSubmitting ? 'Đang cập nhật' : 'Cập nhật thông tin'}
        </Button>
    </Form>
}


function ProfileFormSkeleton() {
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