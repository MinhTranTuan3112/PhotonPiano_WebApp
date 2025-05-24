import { Await, Form, useAsyncValue, useFetcher, useLoaderData } from "@remix-run/react"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { User, Mail, Phone, Upload, Lock, Settings, Shield, Save, Camera } from "lucide-react"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { getValidatedFormData, useRemixForm } from "remix-hook-form"
import { Suspense, useEffect } from "react"
import { Skeleton } from "~/components/ui/skeleton"
import { type ActionFunctionArgs, type LoaderFunctionArgs, redirect } from "@remix-run/node"
import { type Account, Role } from "~/lib/types/account/account"
import { toast } from "sonner"
import { Label } from "~/components/ui/label"
import { Separator } from "~/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar"
import { useImagesDialog } from "~/hooks/use-images-dialog"
import { useConfirmationDialog } from "~/hooks/use-confirmation-dialog"
import { getErrorDetailsInfo, isRedirectError } from "~/lib/utils/error"
import { requireAuth } from "~/lib/utils/auth"
import { fetchCurrentAccountInfo } from "~/lib/services/auth"
import { fetchUpdateAccountInfo } from "~/lib/services/account"
import { useAuth } from "~/lib/contexts/auth-context"
import ForgotPasswordDialog from "~/components/auth/forgot-password-dialog"
import { toastWarning } from "~/lib/utils/toast-utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Alert, AlertDescription } from "~/components/ui/alert"

const accountInfoSchema = z.object({
    avatarUrl: z.string().optional(),
    email: z.string({ message: "Email is required." }).email({ message: "Invalid email format." }),
    fullName: z.string({ message: "Full name is required." }).min(1, { message: "Full name is required." }),
    userName: z.string({ message: "Username is required." }).min(1, { message: "Username is required." }),
    phone: z.string({ message: "Phone number is required." }).min(10, { message: "Invalid phone number." }),
})

type ProfileFormData = z.infer<typeof accountInfoSchema>

const resolver = zodResolver(accountInfoSchema)

export async function loader({ request }: LoaderFunctionArgs) {
    try {
        const { idToken, role } = await requireAuth(request)

        if (role !== Role.Staff) {
            return redirect("/")
        }

        const promise = fetchCurrentAccountInfo({ idToken }).then((response) => {
            const accountPromise: Promise<Account> = response.data
            return { accountPromise }
        })

        return {
            promise,
            role,
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

type ServerFormData = {
    dateOfBirth: string
} & Omit<ProfileFormData, "dateOfBirth">

export async function action({ request }: ActionFunctionArgs) {
    try {
        const { idToken, role } = await requireAuth(request)

        if (role !== Role.Staff) {
            return redirect("/")
        }

        const {
            errors,
            data,
            receivedValues: defaultValues,
        } = await getValidatedFormData<ServerFormData>(request, resolver)

        if (errors) {
            return { success: false, errors, defaultValues }
        }

        const response = await fetchUpdateAccountInfo({ idToken, request: data })

        return {
            success: response.status === 204,
        }
    } catch (error) {
        console.error({ error })

        if (isRedirectError(error)) {
            throw error
        }

        const { message, status } = getErrorDetailsInfo(error)

        return {
            success: false,
            error: message,
            status,
        }
    }
}

export default function StaffProfilePage() {
    const { promise } = useLoaderData<typeof loader>()

    return (
        <div className="container mx-auto py-8 px-4 max-w-6xl">
            <div className="space-y-8">
                {/* Header Section */}
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                        <User className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
                        <p className="text-muted-foreground">Manage your personal information and account settings</p>
                    </div>
                </div>

                <Separator />

                {/* Main Content */}
                <div className="grid gap-8 lg:grid-cols-3">
                    {/* Profile Form */}
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Settings className="h-5 w-5" />
                                    Personal Information
                                </CardTitle>
                                <CardDescription>Update your personal details and contact information</CardDescription>
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
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <Suspense fallback={<SidebarSkeleton />}>
                            <Await resolve={promise}>
                                {({ accountPromise }) => (
                                    <Await resolve={accountPromise}>
                                        <ProfileSidebar />
                                    </Await>
                                )}
                            </Await>
                        </Suspense>
                    </div>
                </div>
            </div>
        </div>
    )
}

function ProfileForm() {
    const accountValue = useAsyncValue()
    const account = accountValue as Account
    const fetcher = useFetcher<typeof action>()
    const { refetchAccountInfo } = useAuth()

    const {
        handleSubmit,
        formState: { errors, isDirty },
        register,
        setValue,
        getValues,
    } = useRemixForm<ProfileFormData>({
        mode: "onSubmit",
        resolver,
        defaultValues: {
            ...account,
        },
        fetcher,
    })

    const isSubmitting = fetcher.state === "submitting"

    const { open: handleOpenConfirmationDialog, dialog: confirmDialog } = useConfirmationDialog({
        title: "Confirm Profile Update",
        description: "Are you sure you want to update your personal profile information?",
        onConfirm: handleSubmit,
        confirmText: "Update Profile",
    })

    const { open: handleOpenImageDialog, dialog: imagesDialog } = useImagesDialog({
        title: "Update Profile Picture",
        description: "Choose a new profile picture from your device or enter an image URL.",
        onConfirm: (imageUrls) => {
            setValue("avatarUrl", imageUrls[0], { shouldDirty: true })
            toast.success("Profile picture updated!")
        },
        requiresUpload: true,
        maxImages: 1,
    })

    useEffect(() => {
        if (fetcher.data?.success === true) {
            toast.success("Profile updated successfully!", {
                description: "Your changes have been saved.",
                position: "top-center",
                duration: 3000,
            })
            refetchAccountInfo()
            return
        }

        if (fetcher.data?.success === false && fetcher.data.error) {
            toastWarning(`Update failed! ${fetcher.data.error}`, {
                position: "top-center",
                duration: 3000,
            })
            return
        }
    }, [fetcher.data, refetchAccountInfo])

    return (
        <div className="space-y-8">
            {/* Avatar Section */}
            <div className="flex flex-col items-center space-y-4">
                <div className="relative group">
                    <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
                        <AvatarImage
                            src={getValues().avatarUrl || "/images/noavatar.png"}
                            alt={account.userName || account.fullName}
                        />
                        <AvatarFallback className="text-2xl">
                            {account.fullName
                                ?.split(" ")
                                .map((n) => n[0])
                                .join("") || "U"}
                        </AvatarFallback>
                    </Avatar>
                    <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="absolute -bottom-2 -right-2 rounded-full h-10 w-10 p-0 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={handleOpenImageDialog}
                    >
                        <Camera className="h-4 w-4" />
                    </Button>
                </div>
                <div className="text-center">
                    <h3 className="text-lg font-semibold">{account.fullName}</h3>
                    <p className="text-sm text-muted-foreground">@{account.userName}</p>
                </div>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleOpenImageDialog}
                    className="flex items-center gap-2"
                >
                    <Upload className="h-4 w-4" />
                    Change Picture
                </Button>
            </div>

            <Separator />

            {/* Form */}
            <Form onSubmit={handleOpenConfirmationDialog} method="POST" navigate={false}>
                <div className="space-y-6">
                    {isDirty && (
                        <Alert>
                            <Settings className="h-4 w-4" />
                            <AlertDescription>You have unsaved changes. Make sure to save your updates.</AlertDescription>
                        </Alert>
                    )}

                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Full Name</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input {...register("fullName")} id="fullName" className="pl-10" placeholder="Enter your full name" />
                            </div>
                            {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="userName">Username</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input {...register("userName")} id="userName" className="pl-10" placeholder="Enter your username" />
                            </div>
                            {errors.userName && <p className="text-sm text-destructive">{errors.userName.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    {...register("email")}
                                    id="email"
                                    type="email"
                                    className="pl-10 bg-muted"
                                    placeholder="Enter your email"
                                    readOnly
                                />
                            </div>
                            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                            <p className="text-xs text-muted-foreground">Email cannot be changed. Contact admin if needed.</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input {...register("phone")} id="phone" className="pl-10" placeholder="Enter your phone number" />
                            </div>
                            {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 pt-6">
                        <Button type="submit" disabled={!isDirty || isSubmitting} className="flex-1 sm:flex-none">
                            {isSubmitting ? (
                                <>
                                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                                    Updating...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Changes
                                </>
                            )}
                        </Button>

                        <ForgotPasswordDialog
                            trigger={
                                <Button type="button" variant="outline" className="flex-1 sm:flex-none">
                                    <Lock className="mr-2 h-4 w-4" />
                                    Reset Password
                                </Button>
                            }
                        />
                    </div>
                </div>
            </Form>

            {imagesDialog}
            {confirmDialog}
        </div>
    )
}

function ProfileSidebar() {
    const accountValue = useAsyncValue()
    const account = accountValue as Account

    return (
        <>
            {/* Account Status */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Shield className="h-5 w-5" />
                        Account Status
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Role</span>
                        <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                            Staff
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Status</span>
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
                            Active
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Email</span>
                        <span className="text-sm text-muted-foreground truncate max-w-32" title={account.email}>
                            {account.email}
                        </span>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Security & Privacy</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="text-sm space-y-3">
                        <div>
                            <p className="font-medium mb-2">Account Security</p>
                            <ul className="space-y-1 text-muted-foreground text-xs">
                                <li>• Password last changed: Recently</li>
                                <li>• Two-factor authentication: Disabled</li>
                                <li>• Login sessions: 1 active</li>
                            </ul>
                        </div>
                        <Separator />
                        <div>
                            <p className="font-medium mb-2">Privacy Settings</p>
                            <ul className="space-y-1 text-muted-foreground text-xs">
                                <li>• Profile visibility: Staff only</li>
                                <li>• Contact preferences: Email</li>
                                <li>• Data sharing: Minimal</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Help & Support */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Need Help?</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-sm space-y-2">
                        <p className="text-muted-foreground">
                            Having trouble with your profile? Contact our support team for assistance.
                        </p>
                        <Button variant="outline" size="sm" className="w-full">
                            Contact Support
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </>
    )
}

function LoadingSkeleton() {
    return (
        <div className="space-y-8">
            {/* Avatar Section */}
            <div className="flex flex-col items-center space-y-4">
                <Skeleton className="h-32 w-32 rounded-full" />
                <div className="text-center space-y-2">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-9 w-32" />
            </div>

            <Separator />

            {/* Form Fields */}
            <div className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="space-y-2">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    ))}
                </div>
                <div className="flex gap-4 pt-6">
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-32" />
                </div>
            </div>
        </div>
    )
}

function SidebarSkeleton() {
    return (
        <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                    <CardHeader>
                        <Skeleton className="h-6 w-32" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {Array.from({ length: 3 }).map((_, j) => (
                                <div key={j} className="flex justify-between">
                                    <Skeleton className="h-4 w-16" />
                                    <Skeleton className="h-4 w-20" />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
