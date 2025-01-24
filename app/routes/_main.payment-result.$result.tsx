import { LoaderFunctionArgs, redirect } from '@remix-run/node'
import { Link, useLoaderData } from '@remix-run/react';
import React from 'react'
import { buttonVariants } from '~/components/ui/button';
import { CircleCheck, CircleX } from 'lucide-react';

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

            <h1 className="">
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
            })} uppercase my-3`}>Về trang chủ</Link>
        </div>
    );
};