import { Await, Form, useAsyncValue, useFetcher, useLoaderData } from '@remix-run/react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { SquareUserRound, Mail, Phone, MapPinHouse, Upload, Lock, GraduationCap, User, BookOpen, Pencil, Calendar, MapPin } from 'lucide-react'
import { z } from 'zod'
import { accountInfoSchema } from '~/lib/utils/schemas'
import { zodResolver } from '@hookform/resolvers/zod'
import { getValidatedFormData, useRemixForm } from 'remix-hook-form'
import React, { Suspense, useEffect } from 'react'
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
import { Switch } from '~/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
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

        if (role !== Role.Student) {
            return redirect('/sign-in');
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

        if (role !== Role.Student) {
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


export default function AccountProfilePage() {
    const { promise } = useLoaderData<typeof loader>()

    return (
        <section className="container mx-auto py-8 px-4">
            <div className="max-w-5xl mx-auto">
                <div className="flex items-center mb-6">
                    <GraduationCap className="h-8 w-8 mr-3 text-primary" />
                    <h1 className="text-3xl font-bold">Hồ sơ cá nhân</h1>
                </div>

                <Tabs defaultValue="personal" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-8">
                        <TabsTrigger value="personal" className="text-base">
                            <User className="mr-2 h-4 w-4" /> Thông tin cá nhân
                        </TabsTrigger>
                        <TabsTrigger value="academic" className="text-base">
                            <BookOpen className="mr-2 h-4 w-4" /> Thông tin đào tạo
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="personal">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center">
                                    <User className="mr-2 h-5 w-5" /> Thông tin cá nhân
                                </CardTitle>
                                <CardDescription>
                                    Đây là những thông tin cá nhân quan trọng của bạn mà <strong>Photon Piano</strong> sử dụng để liên lạc
                                    với bạn.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Suspense fallback={<LoadingSkeleton />}>
                                    <Await resolve={promise}>
                                        {({ accountPromise }) => (
                                            <Await resolve={accountPromise}>
                                                <ProfileForm />
                                            </Await>
                                        )}
                                    </Await>
                                </Suspense>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="academic">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center">
                                    <BookOpen className="mr-2 h-5 w-5" /> Thông tin đào tạo
                                </CardTitle>
                                <CardDescription>
                                    Đây là những thông tin liên quan đến việc học piano của bạn tại trung tâm{" "}
                                    <strong>Photon Piano</strong>.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Suspense fallback={<LoadingSkeleton />}>
                                    <Await resolve={promise}>
                                        {({ accountPromise }) => (
                                            <Await resolve={accountPromise}>
                                                <AcademicInfoSection />
                                            </Await>
                                        )}
                                    </Await>
                                </Suspense>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </section>
    )
}

function ProfileForm() {
    const accountValue = useAsyncValue()
    const account = accountValue as Account
    const { refetchAccountInfo } = useAuth()
    const [isSubmitting, setIsSubmitting] = React.useState(false)

    const {
        handleSubmit,
        formState: { errors },
        register,
        setValue,
        getValues,
        control,
    } = useRemixForm<ProfileFormData>({
        mode: "onSubmit",
        resolver,
        defaultValues: {
            ...account,
            dateOfBirth: account.dateOfBirth ? new Date(account.dateOfBirth || "") : new Date(),
        },
    })

    const { open: handleOpenConfirmationDialog, dialog: confirmDialog } = useConfirmationDialog({
        title: "Xác nhận cập nhật thông tin",
        description: "Bạn có chắc chắn muốn cập nhật thông tin cá nhân của mình không?",
        onConfirm: async () => {
            setIsSubmitting(true)
            try {
                const formData = new FormData()

                // Add all form values to formData
                const values = getValues()
                Object.entries(values).forEach(([key, value]) => {
                    if (key === "dateOfBirth" && value instanceof Date) {
                        formData.append(key, value.toISOString())
                    } else if (value !== undefined && value !== null) {
                        formData.append(key, String(value))
                    }
                })

                const response = await fetch("/account/profile", {
                    method: "POST",
                    body: formData,
                })

                const data = await response.json()

                if (data.success) {
                    toast.success("Lưu thông tin thành công!", {
                        position: "top-center",
                        duration: 1250,
                    })
                    refetchAccountInfo()
                } else {
                    toast.error(`Lưu thất bại! ${data.error || ""}`, {
                        position: "top-center",
                        duration: 1250,
                    })
                }
            } catch (error) {
                console.error(error)
                toast.error("Có lỗi xảy ra khi cập nhật thông tin", {
                    position: "top-center",
                    duration: 1250,
                })
            } finally {
                setIsSubmitting(false)
            }
        },
        confirmText: "Cập nhật",
    })

    const { open: handleOpenImageDialog, dialog: imagesDialog } = useImagesDialog({
        title: "Thêm ảnh",
        description: "Nhập ảnh từ url hoặc chọn ảnh từ thiết bị của bạn.",
        onConfirm: (imageUrls) => {
            setValue("avatarUrl", imageUrls[0])
        },
        requiresUpload: true,
        maxImages: 1,
    })

    return (
        <>
            <Form
                onSubmit={handleOpenConfirmationDialog}
                method="POST"
                action="/account/profile"
                navigate={false}
                className="space-y-8"
            >
                <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative group">
                            <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
                                <AvatarImage
                                    src={getValues().avatarUrl ? getValues().avatarUrl : "https://github.com/shadcn.png"}
                                    alt={account.userName || account.fullName}
                                    className="object-cover"
                                />
                                <AvatarFallback className="text-2xl">
                                    {account.fullName
                                        ? account.fullName
                                            .split(" ")
                                            .map((n) => n[0])
                                            .join("")
                                            .toUpperCase()
                                        : "PP"}
                                </AvatarFallback>
                            </Avatar>
                            <button
                                type="button"
                                onClick={handleOpenImageDialog}
                                className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 shadow-md hover:bg-primary/90 transition-colors"
                            >
                                <Pencil className="h-4 w-4" />
                                <span className="sr-only">Change avatar</span>
                            </button>
                        </div>
                        <Button type="button" className="w-full" variant="outline" size="sm" onClick={handleOpenImageDialog}>
                            <Upload className="mr-2 h-4 w-4" />
                            Upload ảnh
                        </Button>
                        {errors.avatarUrl && <p className="text-sm text-destructive">{errors.avatarUrl.message}</p>}
                    </div>

                    <div className="flex-1 grid gap-6 w-full">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="fullName" className="font-medium">
                                    Họ và tên
                                </Label>
                                <Input
                                    {...register("fullName")}
                                    name="fullName"
                                    id="fullName"
                                    type="text"
                                    placeholder="Nhập họ và tên..."
                                    className="bg-background"
                                />
                                {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="userName" className="font-medium">
                                    Tên người dùng
                                </Label>
                                <div className="relative">
                                    <SquareUserRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        {...register("userName")}
                                        name="userName"
                                        id="userName"
                                        type="text"
                                        placeholder="Nhập tên người dùng..."
                                        className="pl-10 bg-background"
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">Đây là tên người dùng được hiển thị công khai của bạn.</p>
                                {errors.userName && <p className="text-sm text-destructive">{errors.userName.message}</p>}
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="font-medium">
                                    Email
                                </Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        {...register("email")}
                                        name="email"
                                        id="email"
                                        type="email"
                                        placeholder="Nhập email..."
                                        className="pl-10 bg-muted"
                                        readOnly
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    <strong>Photon Piano</strong> sẽ sử dụng email này để liên lạc với bạn.
                                </p>
                                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone" className="font-medium">
                                    Số điện thoại
                                </Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        {...register("phone")}
                                        name="phone"
                                        id="phone"
                                        type="tel"
                                        placeholder="Nhập số điện thoại..."
                                        className="pl-10 bg-background"
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Số điện thoại này sẽ được sử dụng để liên lạc với bạn khi cần thiết.
                                </p>
                                {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="dateOfBirth" className="font-medium">
                                    Ngày sinh
                                </Label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                    <Controller
                                        control={control}
                                        name="dateOfBirth"
                                        render={({ field: { onChange, onBlur, value, ref } }) => (
                                            <DatePickerInput
                                                value={value}
                                                onChange={onChange}
                                                onBlur={onBlur}
                                                ref={ref}
                                                className="pl-10 bg-background w-full"
                                                placeholder="Chọn ngày sinh"
                                            />
                                        )}
                                    />
                                </div>
                                {errors.dateOfBirth && <p className="text-sm text-destructive">{errors.dateOfBirth.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="gender" className="font-medium">
                                    Giới tính
                                </Label>
                                <Controller
                                    control={control}
                                    name="gender"
                                    render={({ field: { onChange, value } }) => (
                                        <Select value={value?.toString()} onValueChange={onChange}>
                                            <SelectTrigger className="bg-background">
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
                                {errors.gender && <p className="text-sm text-destructive">{errors.gender.message}</p>}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="address" className="font-medium">
                                Địa chỉ
                            </Label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    {...register("address")}
                                    name="address"
                                    id="address"
                                    type="text"
                                    placeholder="Nhập địa chỉ..."
                                    className="pl-10 bg-background"
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Địa chỉ này sẽ được sử dụng để gửi hồ sơ, tài liệu quan trọng nếu cần thiết.
                            </p>
                            {errors.address && <p className="text-sm text-destructive">{errors.address.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="shortDescription" className="font-medium">
                                Mô tả ngắn về bản thân
                            </Label>
                            <Textarea
                                {...register("shortDescription")}
                                name="shortDescription"
                                id="shortDescription"
                                placeholder="Nhập mô tả ngắn về bản thân..."
                                className="min-h-[100px] bg-background"
                            />
                            <p className="text-xs text-muted-foreground">Mô tả ngắn về bản thân giúp người khác hiểu rõ bạn hơn.</p>
                            {errors.shortDescription && <p className="text-sm text-destructive">{errors.shortDescription.message}</p>}
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-4 justify-end pt-4 border-t">
                    <ForgotPasswordDialog
                        trigger={
                            <Button type="button" variant="outline" size="lg">
                                <Lock className="mr-2 h-4 w-4" />
                                Yêu cầu đặt lại mật khẩu
                            </Button>
                        }
                    />
                    <Button type="submit" size="lg" disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <span className="animate-spin mr-2">⏳</span> Đang cập nhật
                            </>
                        ) : (
                            <>
                                <Pencil className="mr-2 h-4 w-4" /> Cập nhật thông tin
                            </>
                        )}
                    </Button>
                </div>
            </Form>
            {imagesDialog}
            {confirmDialog}
        </>
    )
}


function LoadingSkeleton() {
    return (
        <div className="flex flex-col md:flex-row gap-8">
            <Skeleton className="h-32 w-32 rounded-full" />
            <div className="flex-1 space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                    <Skeleton className="h-10" />
                    <Skeleton className="h-10" />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                    <Skeleton className="h-10" />
                    <Skeleton className="h-10" />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                    <Skeleton className="h-10" />
                    <Skeleton className="h-10" />
                </div>
                <Skeleton className="h-10" />
                <Skeleton className="h-24" />
            </div>
        </div>
    )
}

function AcademicInfoSection() {
    const accountValue = useAsyncValue()
    const account = accountValue as Account
    const [isLoading, setIsLoading] = React.useState(false)
    const [continueLearning, setContinueLearning] = React.useState(account.wantToContinue || false)
    const fetcher = useFetcher()

    const handleUpdateLearningStatus = async (status: boolean) => {
        try {
            fetcher.submit(
                { continueLearning: status.toString() },
                { method: "POST", action: "/api/account/update-learning-status" },
            )

            toast.success("Learning status updated successfully!", {
                position: "top-center",
                duration: 1250,
            })
        } catch (error) {
            console.error("Failed to update learning status:", error)
            toast.error("Failed to update learning status", {
                position: "top-center",
                duration: 1250,
            })
        }
    }

    return (
        <div className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
                <Card className="bg-muted/40">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center">
                            <GraduationCap className="mr-2 h-4 w-4" /> Level Piano
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <span className="text-lg font-medium">Hiện tại</span>
                            <LevelBadge level={account.level} />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-muted/40">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center">
                            <BookOpen className="mr-2 h-4 w-4" /> Tình trạng học tập
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <span className="text-lg font-medium">Trạng thái</span>
                            <StatusBadge status={account.studentStatus || 0} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Tiếp tục học tập</CardTitle>
                    <CardDescription>Chọn "Yes" nếu bạn muốn tiếp tục học tập tại Photon Piano trong kỳ học tới.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h4 className="font-medium">Continuing Learning</h4>
                            <p className="text-sm text-muted-foreground">
                                {continueLearning
                                    ? "Bạn đã đăng ký tiếp tục học tập trong kỳ học tới."
                                    : "Bạn chưa đăng ký tiếp tục học tập trong kỳ học tới."}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-muted-foreground ml-2">{account.wantToContinue ? "Yes" : "No"}</span>
                            <Switch
                                id="continueLearning"
                                checked={account.wantToContinue || false}
                                onCheckedChange={(checked) => handleUpdateLearningStatus(checked)}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
