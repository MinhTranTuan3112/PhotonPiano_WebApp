import { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node'
import { Link, useFetcher, useLoaderData } from '@remix-run/react'
import { ArrowRightCircle, CheckCircle, Loader2, XCircle } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { Button, buttonVariants } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { useConfirmationDialog } from '~/hooks/use-confirmation-dialog'
import useLoadingDialog from '~/hooks/use-loading-dialog'
import { fetchChangePassword } from '~/lib/services/auth'
import { ActionResult } from '~/lib/types/action-result'
import { getErrorDetailsInfo, isRedirectError } from '~/lib/utils/error'
import { formEntryToString } from '~/lib/utils/form'

type Props = {}

export enum ResultCode {
    Idle,
    Success,
    Error
}

export async function loader({ request }: LoaderFunctionArgs) {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get("token");
        const email = searchParams.get("email");
        if (!token || !email) {
            return {
                resultCode: ResultCode.Error,
                message: "Dữ liệu gửi qua bị thiếu"
            }
        }
        return {
            resultCode: ResultCode.Idle,
            message: "",
            token,
            email
        }
    } catch (error) {

        console.error({ error });

        if (isRedirectError(error)) {
            throw error;
        }

        const { message, status } = getErrorDetailsInfo(error);

        return {
            resultCode: ResultCode.Error,
            message: message + "\n Mã trạng thái: " + status
        }
    }
}

export async function action({ request }: ActionFunctionArgs) {
    try {
        const formData = await request.formData();
        const password = formEntryToString(formData.get("password"));
        const email = formEntryToString(formData.get("email"));
        const token = formEntryToString(formData.get("token"))

        if (!token) {
            return {
                success: false,
                error: 'Unauthorized.',
                status: 401
            }
        }

        if (!email || !password) {
            return {
                success: false,
                error: 'Invalid data.',
                status: 400
            }
        }

        const response = await fetchChangePassword({
            newPassword: password,
            resetPasswordToken: token,
            email: email
        });

        return {
            success: true
        }
    } catch (err) {
        const error = getErrorDetailsInfo(err)
        return {
            success: false,
            error: error.message,
            status: error.status
        }
    }

};

export default function ForgotPassword({ }: Props) {
    const { resultCode, message, token, email } = useLoaderData<typeof loader>()
    const [resultCodeState, setResultCodeState] = useState(resultCode)
    const [messageState, setMessageState] = useState(message)
    const [isLoading, setIsLoading] = useState(false)
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordMismatch, setPasswordMismatch] = useState(false);
    const fetcher = useFetcher<ActionResult>()

    const handleChangePassword = () => {
        fetcher.submit({
            password,
            token: token ?? "",
            email: email ?? ""
        }, {
            method: 'POST'
        })
    }

    const { open: handleOpenConfirmDialog, dialog: confirmDialog } = useConfirmationDialog({
        title: 'Xác nhận đổi mật khẩu',
        description: 'Bạn có chắc chắn muốn đổi mật khẩu không?',
        onConfirm: () => {
            handleChangePassword();
        }
    })

    useEffect(() => {
        if (fetcher.state === "submitting") {
            setIsLoading(true); // Open dialog on request start
        }
        if (fetcher.state === 'idle') {
            setIsLoading(false)
        }
    }, [fetcher.state])

    useEffect(() => {
        if (fetcher.data) {
            setMessageState(fetcher.data.error)
            setResultCodeState(fetcher.data.success ? ResultCode.Success : ResultCode.Error)
        }
    }, [fetcher.data])

    return (
        <div>
            <div className="flex flex-col justify-center items-center bg-gray-200 text-black rounded-lg shadow-lg relative h-screen">
                {/* Background Images */}
                <img src="/images/notes_flows.png" alt="Musical Notes" className="absolute top-0 left-0 opacity-10 w-full" />
                <img src="/images/grand_piano_1.png" alt="Grand Piano" className="absolute bottom-0 right-0 opacity-20 w-1/3" />

                <div className='rounded-lg shadow-lg bg-white/70 p-8 w-3/4'>
                    {
                        resultCodeState == ResultCode.Idle ? (
                            <div>
                                <div className='text-2xl font-extrabold text-center'>Photon Piano</div>
                                <div className='text-xl font-bold text-center'>Đặt lại mật khẩu</div>
                                {
                                    isLoading ? (
                                        <div className='mt-8 flex flex-col items-center'>
                                            <div className="text-center">
                                                <p className="font-bold text-xl">Vui lòng chờ...</p>
                                                <Loader2 size={100} className="animate-spin mx-auto mt-4" />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className='mt-8 flex flex-col items-center'>
                                            <div className="mt-8 flex flex-col items-center gap-4">
                                                <Input
                                                    placeholder="Nhập mật khẩu mới..."
                                                    className="w-64 text-center"
                                                    type="password"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                />
                                                <Input
                                                    placeholder="Xác nhận mật khẩu mới..."
                                                    className="w-64 text-center"
                                                    type="password"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                />
                                                {passwordMismatch && (
                                                    <p className="text-sm text-red-500">Mật khẩu xác nhận không khớp</p>
                                                )}
                                                <Button onClick={() => {
                                                    if (password !== confirmPassword) {
                                                        setPasswordMismatch(true);
                                                    } else {
                                                        setPasswordMismatch(false);
                                                        handleOpenConfirmDialog();
                                                    }
                                                }} className="mt-2">
                                                    Lưu mật khẩu
                                                </Button>
                                            </div>
                                        </div>
                                    )
                                }
                            </div>
                        ) : (
                            <ResultScreen code={resultCodeState} message={messageState} />
                        )
                    }
                </div>
            </div >
            {confirmDialog}
        </div >

    )
}

function ResultScreen({ code, message }: { code: ResultCode, message: string }) {
    return (
        <div>
            <div className='my-4 flex flex-col gap-2'>
                {code === ResultCode.Error ? (
                    <div className="text-center">
                        <p className="font-bold text-xl text-red-600">THẤT BẠI</p>
                        <XCircle size={100} className="text-red-600 mx-auto mt-4" />
                        <p>{message}</p>
                    </div>
                ) : (
                    <div className="text-center">
                        <p className="font-bold text-xl text-green-600">THÀNH CÔNG</p>
                        <CheckCircle size={100} className="text-green-600 mx-auto mt-4" />
                        <p>Giờ đây bạn có thể đăng nhập với mật khẩu mới!</p>
                    </div>
                )}
            </div>
            <div className="mt-12 flex gap-6 relative z-10 items-center justify-center" >
                <Link
                    to="/"
                    className={`flex items-center gap-2 px-6 py-3 font-bold rounded-lg shadow-lg ${buttonVariants({
                        variant: 'theme'
                    })}`}
                >
                    <ArrowRightCircle className="text-white text-xl" />
                    Quay về trang chủ
                </Link>
                <Link
                    to="/contact"
                    className="flex items-center gap-2 px-6 py-3 border border-black font-bold rounded-lg text-black hover:bg-white hover:text-black transition"
                >
                    Liên hệ hỗ trợ
                </Link>
            </div >
        </div>

    )
}