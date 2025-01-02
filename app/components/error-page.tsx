import { ErrorResponse, Link } from '@remix-run/react'
import { ArrowRightCircle } from 'lucide-react';
import MainLayout from '~/routes/_main';
import { buttonVariants } from './ui/button';

type Props = {
    error: ErrorResponse
}

export default function ErrorPage({ error }: Props) {
    return (
        <MainLayout>
            <div className="flex flex-col justify-center items-center my-48">
                {/* Icon and Heading */}
                <div className="flex flex-col items-center">
                    <h1 className="text-7xl font-extrabold mt-4">
                        {error?.status || "Oops!"}
                    </h1>
                    <h2 className="text-5xl font-bold mt-2">{error?.statusText || "Error"}</h2>
                    <p className="text-xl font-medium text-gray-500 mt-2 text-center">
                        {error?.data || "Có vẻ như chúng ta đã chạm tới đường cùng."}
                    </p>
                </div>

                {/* Themed Divider */}
                <div className="w-3/4 h-1 bg-black rounded mt-6"></div>

                {/* Description Section */}
                <div className="mt-8 text-center">
                    <h3 className="text-2xl font-bold text-red-500">Oh no! Có lỗi đã xảy ra!</h3>
                    <p className="text-lg text-gray-400 mt-2">
                        {
                            error ? (
                                error.status === 404 ? (
                                    "Trang bạn đang tìm kiếm có thể đã bị xóa, đã đổi tên hoặc tạm thời không khả dụng."
                                ) : error.status === 400 ? (
                                    "Lỗi yêu cầu. Vui lòng thử lại sau."
                                ) : error.status === 500 ? (
                                    "Có lỗi xảy ra từ phía máy chủ. Vui lòng thử lại sau."
                                ) : (
                                    "Một lỗi không xác định đã xảy ra. Vui lòng liên hệ với bộ phận hỗ trợ."
                                )
                            ) : (
                                "Không có lỗi nào xảy ra. Bạn chủ động tìm đến nó!"
                            )
                        }
                    </p>
                </div>

                {/* Navigation Options */}
                <div className="mt-12 flex gap-6">
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
                        className="flex items-center gap-2 px-6 py-3 border font-bold rounded-lg "
                    >
                        Liên hệ hỗ trợ
                    </Link>
                </div>
            </div>
        </MainLayout>
    );
}