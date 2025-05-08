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
            <div className="flex flex-col justify-center items-center my-24 p-8 bg-gray-200 text-black rounded-lg shadow-lg relative">
                {/* Background Images */}
                <img src="/images/notes_flows.png" alt="Musical Notes" className="absolute top-0 left-0 opacity-10 w-full" />
                <img src="/images/grand_piano_1.png" alt="Grand Piano" className="absolute bottom-0 right-0 opacity-20 w-1/3" />
                
                {/* Icon and Heading */}
                <div className="flex flex-col items-center relative z-10">
                    <h1 className="text-8xl font-extrabold font-serif">{error?.status || "Oops!"}</h1>
                    <h2 className="text-5xl font-bold mt-2 font-mono">{error?.statusText || "Error"}</h2>
                    <p className="text-xl font-medium text-gray-800 mt-2 text-center max-w-lg">
                        {error?.data || "Network error!"}
                    </p>
                </div>

                {/* Themed Divider */}
                <div className="w-3/4 h-1 bg-white rounded mt-6"></div>

                {/* Description Section */}
                <div className="mt-8 text-center relative z-10">
                    <h3 className="text-2xl font-bold text-yellow-400">🎵 Oh no! An error occurred! 🎶</h3>
                    <p className="text-lg text-gray-900 mt-2">
                        {error ? (
                            error.status === 404 ? (
                                "The page you are looking for might have been removed, had its name changed, or is temporarily unavailable."
                            ) : error.status === 400 ? (
                                "Bad request. Please try again later."
                            ) : error.status === 500 ? (
                                "A server error occurred. Please try again later."
                            ) : (
                                "An unknown error has occurred. Please contact support."
                            )
                        ) : (
                            "No error occurred. You sought this page on purpose!"
                        )}
                    </p>
                </div>

                {/* Navigation Options */}
                <div className="mt-12 flex gap-6 relative z-10 items-center">
                    <Link
                        to="/"
                        className={`flex items-center gap-2 px-6 py-3 font-bold rounded-lg shadow-lg ${buttonVariants({
                            variant: 'theme'
                        })}`}
                    >
                        <ArrowRightCircle className="text-white text-xl" />
                        Back to Home
                    </Link>
                    <Link
                        to="/contact"
                        className="flex items-center gap-2 px-6 py-3 border border-black font-bold rounded-lg text-black hover:bg-white hover:text-black transition"
                    >
                        Contact Support
                    </Link>
                </div>
            </div>
        </MainLayout>
    );
}
