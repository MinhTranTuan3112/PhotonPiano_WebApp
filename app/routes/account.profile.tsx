import { Await, Form, useAsyncValue, useFetcher, useLoaderData } from '@remix-run/react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { SquareUserRound, Mail, Phone, Upload, Lock, GraduationCap, User, BookOpen, Pencil, Calendar, MapPin, CircleHelp } from 'lucide-react'
import { z } from 'zod'
import { accountInfoSchema } from '~/lib/utils/schemas'
import { zodResolver } from '@hookform/resolvers/zod'
import { getValidatedFormData, useRemixForm } from 'remix-hook-form'
import React, { Suspense, useEffect } from 'react'
import { Skeleton } from '~/components/ui/skeleton'
import { ActionFunctionArgs, LoaderFunctionArgs, redirect } from '@remix-run/node'
import { Account, AccountDetail, Gender, Level, Role } from '~/lib/types/account/account'
import { toast } from 'sonner'
import { Label } from '~/components/ui/label'
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
import { toastWarning } from '~/lib/utils/toast-utils'
import { Textarea } from '~/components/ui/textarea'
import { useQuery } from '@tanstack/react-query'
import { fetchLevels } from '~/lib/services/level'
import { PianoLevelTimeline } from '~/components/learner/learner-details/piano-level-timeline'
import NoInformation from '~/components/common/no-information'
import { Separator } from '~/components/ui/separator'
import { Badge } from '~/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip'

type ProfileFormData = z.infer<typeof accountInfoSchema>;

const resolver = zodResolver(accountInfoSchema);

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

    const { promise } = useLoaderData<typeof loader>();

    return (
        <section className="container mx-auto py-8 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center mb-6">
                    <GraduationCap className="h-8 w-8 mr-3 text-primary" />
                    <h1 className="text-3xl font-bold">Profile</h1>
                </div>

                <Tabs defaultValue="personal" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-8 p-0 h-auto bg-background gap-1">
                        <TabsTrigger value="personal" className="text-base py-2 data-[state=active]:bg-theme data-[state=active]:text-theme-foreground">
                            <User className="mr-2 h-4 w-4" /> Basic personal information
                        </TabsTrigger>
                        <TabsTrigger value="academic" className="text-base py-2 data-[state=active]:bg-theme data-[state=active]:text-theme-foreground">
                            <BookOpen className="mr-2 h-4 w-4" /> Academic information
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="personal">
                        <Card className='border-l-4 border-l-theme'>
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center">
                                    <User className="mr-2 h-5 w-5" /> Basic personal information
                                </CardTitle>
                                <CardDescription>
                                    This is important personal information that <strong>Photon Piano</strong> uses to contact you.
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
                        <Card className='border-t-4 border-t-theme'>
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center">
                                    <BookOpen className="mr-2 h-5 w-5" /> Academic information
                                </CardTitle>
                                <CardDescription>
                                    This is the information related to your piano learning at <strong>Photon Piano</strong>.
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

    const { refetchAccountInfo } = useAuth()

    const fetcher = useFetcher<typeof action>();

    const accountValue = useAsyncValue();
    const account = accountValue as Account;

    const isSubmitting = fetcher.state === "submitting";

    useEffect(() => {

        if (fetcher.data?.success === true) {
            toast.success('Update successfully!');
            refetchAccountInfo();
            return;
        }

        if (fetcher.data?.success === false) {
            toastWarning(`Update failed!`, {
                description: `${fetcher.data.error || ""}`,
                position: "top-center",
                duration: 1250,
            });
            return;
        }

        return () => {

        }

    }, [fetcher.data]);


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
        fetcher,
        defaultValues: {
            ...account,
            dateOfBirth: account.dateOfBirth ? new Date(account.dateOfBirth || "") : new Date(),
        },
    })

    const { open: handleOpenConfirmationDialog, dialog: confirmDialog } = useConfirmationDialog({
        title: "Confrm action",
        description: "Update profile?",
        onConfirm: handleSubmit,
        confirmText: "Update",
    })

    const { open: handleOpenImageDialog, dialog: imagesDialog } = useImagesDialog({
        title: "Add profile image",
        description: "Import image from url or upload from your device.",
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
                            Upload avatar
                        </Button>
                        {errors.avatarUrl && <p className="text-sm text-destructive">{errors.avatarUrl.message}</p>}
                    </div>

                    <div className="flex-1 grid gap-6 w-full">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="fullName" className="font-medium">
                                    Full name
                                </Label>
                                <Input
                                    {...register("fullName")}
                                    name="fullName"
                                    id="fullName"
                                    type="text"
                                    placeholder="Enter fullname..."
                                    className="bg-background"
                                />
                                {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="userName" className="font-medium">
                                    Username
                                </Label>
                                <div className="relative">
                                    <SquareUserRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        {...register("userName")}
                                        name="userName"
                                        id="userName"
                                        type="text"
                                        placeholder="Enter username..."
                                        className="pl-10 bg-background"
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    This is your public username.
                                </p>
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
                                    <strong>Photon Piano</strong> will use this email to contact you.
                                </p>
                                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone" className="font-medium">
                                    Phone
                                </Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        {...register("phone")}
                                        name="phone"
                                        id="phone"
                                        type="tel"
                                        placeholder="Enter phone number..."
                                        className="pl-10 bg-background"
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    This phone number will be used to contact you when necessary.
                                </p>
                                {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="dateOfBirth" className="font-medium">
                                    Date of birth
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
                                                placeholder="Select date of birth"
                                            />
                                        )}
                                    />
                                </div>
                                {errors.dateOfBirth && <p className="text-sm text-destructive">{errors.dateOfBirth.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="gender" className="font-medium">
                                    Gender
                                </Label>
                                <Controller
                                    control={control}
                                    name="gender"
                                    render={({ field: { onChange, value } }) => (
                                        <Select value={value?.toString()} onValueChange={onChange}>
                                            <SelectTrigger className="bg-background">
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
                                {errors.gender && <p className="text-sm text-destructive">{errors.gender.message}</p>}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="address" className="font-medium">
                                Address
                            </Label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    {...register("address")}
                                    name="address"
                                    id="address"
                                    type="text"
                                    placeholder="Enter address..."
                                    className="pl-10 bg-background"
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                This address will be used to send important documents if necessary.
                            </p>
                            {errors.address && <p className="text-sm text-destructive">{errors.address.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="shortDescription" className="font-medium">
                                Short description
                            </Label>
                            <Textarea
                                {...register("shortDescription")}
                                name="shortDescription"
                                id="shortDescription"
                                placeholder="Enter short description..."
                                className="min-h-[100px] bg-background"
                            />
                            <p className="text-xs text-muted-foreground">.
                                Short description about yourself to help others understand you better.
                            </p>
                            {errors.shortDescription && <p className="text-sm text-destructive">{errors.shortDescription.message}</p>}
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-4 justify-end pt-4 border-t">
                    <ForgotPasswordDialog
                        trigger={
                            <Button type="button" variant="outline" size="lg">
                                <Lock className="mr-2 h-4 w-4" />
                                Change password
                            </Button>
                        }
                    />
                    <Button type="submit" size="lg" disabled={isSubmitting} variant={'theme'}>
                        {isSubmitting ? (
                            <>
                                <span className="animate-spin mr-2">⏳</span> Saving...
                            </>
                        ) : (
                            <>
                                Save
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
    const account = accountValue as AccountDetail;
    const [isLoading, setIsLoading] = React.useState(false)
    const [continueLearning, setContinueLearning] = React.useState(account.wantToContinue || false)
    const fetcher = useFetcher()

    const handleUpdateLearningStatus = async (status: boolean) => {
        try {
            fetcher.submit(
                { continueLearning: status.toString() },
                { method: "POST", action: "/endpoint/account/update-learning-status" },
            )

            toast.success("Learning status updated successfully!", {
                position: "top-center",
                duration: 1250,
            })
        } catch (error) {
            console.error("Failed to update learning status:", error)
            toastWarning("Failed to update learning status", {
                position: "top-center",
                duration: 1250,
            })
        }
    }

    const { data, isLoading: isLoadingLevels, isError } = useQuery({
        queryKey: ['levels'],
        queryFn: async () => {
            const response = await fetchLevels();

            return await response.data;
        },
        enabled: true,
        refetchOnWindowFocus: false
    });

    const levels = data ? data as Level[] : [];

    return (
        <div className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
                <Card className="bg-muted/40 border-l-4 border-l-theme">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center">
                            <GraduationCap className="mr-2 text-theme" /> Piano Level
                        </CardTitle>
                    </CardHeader>
                    <CardContent className='flex flex-col gap-3 my-3'>
                        <div className="flex items-center justify-between">
                            <span className="text-base font-bold">Current</span>
                            <LevelBadge level={account.level} />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <span className="text-base font-bold">Self-evaluated</span>
                            {account.selfEvaluatedLevelId ? <LevelBadge level={account.selfEvaluatedLevel} /> : <NoInformation />}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-muted/40 border-l-4 border-l-theme">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center">
                            <BookOpen className="mr-2 text-theme" /> Academic status
                        </CardTitle>
                    </CardHeader>
                    <CardContent className='flex flex-col gap-3 my-3'>
                        <div className="flex items-center justify-between">
                            <span className="text-base font-bold">Status</span>
                            <StatusBadge status={account.studentStatus || 0} />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <span className="text-base font-bold flex flex-row gap-1 items-center">
                                Requires entrance test participation
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <CircleHelp className='cursor-pointer size-4 text-gray-400' />
                                        </TooltipTrigger>
                                        <TooltipContent className='font-normal'>
                                            If your self-evaluated piano level requires entrance test participation,
                                            <br />
                                            it means that you have not yet confirmed your level through a piano entrance evaluation test.
                                            <br />
                                            To continue learning at Photon Piano, <strong>you will need to take part in an entrance test</strong> to confirm your level.
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </span>
                            <Badge
                                className={`
                                ${account.selfEvaluatedLevel?.requiresEntranceTest ? 'text-red-600' : 'text-green-600'}
                                 uppercase ${account.selfEvaluatedLevel?.requiresEntranceTest ? 'bg-red-500/20' : 'bg-green-500/20'}`}>
                                {account.selfEvaluatedLevel?.requiresEntranceTest ? 'Required' : 'Not Required'}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className='border-l-4 border-l-theme'>
                <CardHeader>
                    <CardTitle className="text-lg">Continue learning</CardTitle>
                    <CardDescription>
                        Click "Yes" to continue learning at Photon Piano in the next semester.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h4 className="font-medium">Continuing Learning</h4>
                            <p className="text-sm text-muted-foreground">
                                {continueLearning
                                    ? "You have registered to continue learning in the next semester."
                                    : "You haven't registered to continue learning in the next semester."}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-sm ml-2 font-bold">{account.wantToContinue ? "Yes" : "No"}</span>
                            <Switch
                                id="continueLearning"
                                checked={account.wantToContinue || false}
                                onCheckedChange={(checked) => handleUpdateLearningStatus(checked)}
                                className='data-[state=checked]:bg-theme'
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {isLoadingLevels ? <Skeleton className='w-full h-full' /> :
                <PianoLevelTimeline levels={levels} currentLevelId={account.levelId} />}

        </div>
    )
}