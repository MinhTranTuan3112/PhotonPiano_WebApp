import { LoaderFunctionArgs, redirect } from '@remix-run/node'
import { Link, useLoaderData } from '@remix-run/react';
import { buttonVariants } from '~/components/ui/button';
import { CircleArrowLeft } from 'lucide-react';
import { Card, CardContent } from '~/components/ui/card';
import { motion } from 'motion/react';

type Props = {}

export async function loader({ request, params }: LoaderFunctionArgs) {
    if (!params.result) {
        return redirect('/');
    }

    const result = params.result as string;

    return { result };
}

export default function PaymentResultPage({ }: Props) {

    const { result } = useLoaderData<typeof loader>();

    return (
        <div className='flex flex-col items-center py-20'>

            {/* <h1 className="">
                {result === 'success' ? (
                    <CircleCheck className="text-green-500 h-40 w-40" />
                ) : (
                    <CircleX className="text-red-500 h-40 w-40" />
                )}
            </h1>

            <div className="font-bold text-4xl">
                {result === 'success' ? 'Thanh toán thành công' : 'Thanh toán thất bại'}
            </div>

            <Link to='/' className={`${buttonVariants({
                variant: 'theme'
            })} uppercase my-3`}>Về trang chủ</Link> */}
            <PaymentResultContent success={result === 'success'} />
        </div>
    );
};

const draw = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: (i: number) => ({
        pathLength: 1,
        opacity: 1,
        transition: {
            pathLength: {
                delay: i * 0.2,
                type: "spring",
                duration: 1.5,
                bounce: 0.2,
                ease: "easeInOut",
            },
            opacity: { delay: i * 0.2, duration: 0.2 },
        },
    }),
}
function Checkmark({ size = 100, strokeWidth = 2, color = "currentColor", className = "" }) {
    return (
        <motion.svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            initial="hidden"
            animate="visible"
            className={className}
        >
            <motion.circle
                cx="50"
                cy="50"
                r="40"
                stroke={color}
                variants={draw}
                custom={0}
                style={{
                    strokeWidth,
                    strokeLinecap: "round",
                    fill: "transparent",
                }}
            />
            <motion.path
                d="M30 50L45 65L70 35"
                stroke={color}
                variants={draw}
                custom={1}
                style={{
                    strokeWidth,
                    strokeLinecap: "round",
                    strokeLinejoin: "round",
                    fill: "transparent",
                }}
            />
        </motion.svg>
    )
}

function XMark({ size = 100, strokeWidth = 2, color = "currentColor", className = "" }) {
    return (
        <motion.svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            initial="hidden"
            animate="visible"
            className={className}
        >
            <motion.circle
                cx="50"
                cy="50"
                r="40"
                stroke={color}
                variants={draw}
                custom={0}
                style={{
                    strokeWidth,
                    strokeLinecap: "round",
                    fill: "transparent",
                }}
            />
            <motion.path
                d="M35 35L65 65"
                stroke={color}
                variants={draw}
                custom={1}
                style={{
                    strokeWidth,
                    strokeLinecap: "round",
                    strokeLinejoin: "round",
                    fill: "transparent",
                }}
            />
            <motion.path
                d="M65 35L35 65"
                stroke={color}
                variants={draw}
                custom={1.2}
                style={{
                    strokeWidth,
                    strokeLinecap: "round",
                    strokeLinejoin: "round",
                    fill: "transparent",
                }}
            />
        </motion.svg>
    )
}

function PaymentResultContent({ success = true }: {
    success?: boolean
}) {
    const statusColor = success ? "rgb(16 185 129)" : "rgb(239 68 68)"
    const statusMessage = success ? "Payment success" : "Payment failed"
    const blurColor = success ? "bg-emerald-500/10 dark:bg-emerald-500/20" : "bg-red-500/10 dark:bg-red-500/20"

    return (
        <div className='flex flex-col gap-4 justify-center'>
            <motion.div
                className="flex justify-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                    duration: 0.4,
                    ease: [0.4, 0, 0.2, 1],
                    scale: {
                        type: "spring",
                        damping: 15,
                        stiffness: 200,
                    },
                }}
            >
                <div className="relative">
                    <motion.div
                        className={`absolute inset-0 blur-xl ${blurColor} rounded-full`}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                            delay: 0.2,
                            duration: 0.8,
                            ease: "easeOut",
                        }}
                    />
                    {success ? (
                        <Checkmark
                            size={80}
                            strokeWidth={4}
                            color={statusColor}
                            className="relative z-10 dark:drop-shadow-[0_0_10px_rgba(0,0,0,0.1)]"
                        />
                    ) : (
                        <XMark
                            size={80}
                            strokeWidth={4}
                            color={statusColor}
                            className="relative z-10 dark:drop-shadow-[0_0_10px_rgba(0,0,0,0.1)]"
                        />
                    )}
                </div>
            </motion.div>
            <motion.div
                className="space-y-2 text-center w-full"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                    delay: 0.2,
                    duration: 0.6,
                    ease: [0.4, 0, 0.2, 1],
                }}
            >
                <motion.h1
                    className="text-3xl tracking-tighter font-semibold uppercase"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1, duration: 0.4 }}
                >
                    {statusMessage}
                </motion.h1>
            </motion.div>

            <div className="w-full">
                <Link className={`${buttonVariants({ variant: "outline" })} flex flex-row gap-1 items-center w-full`} to={'/'}>
                    <CircleArrowLeft />Back to Home
                </Link>
            </div>
        </div>
    )
}

