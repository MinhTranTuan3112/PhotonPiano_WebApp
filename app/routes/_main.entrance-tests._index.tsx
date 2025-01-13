import { LoaderFunctionArgs } from '@remix-run/node';
import { Await, useLoaderData, useNavigate } from '@remix-run/react';
import { ArrowRightCircle, SortDescIcon } from 'lucide-react';
import { Suspense } from 'react';
import { Button } from '~/components/ui/button';
import PaginationBar from '~/components/ui/pagination-bar';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { Skeleton } from '~/components/ui/skeleton';
import { Account } from '~/lib/types/account/account';
import { sampleEntranceTests } from '~/lib/types/entrance-test/entrance-test'
import { ENTRANCE_TEST_STATUSES, SHIFT_TIME } from '~/lib/utils/constants';
import { getErrorDetailsInfo, isRedirectError } from '~/lib/utils/error';

type Props = {}

const sortItems = [
    { value: 'registerNumber', label: 'Số lượng đăng ký' },
    { value: 'time', label: 'Thứ tự thời gian' },
];
async function getSampleEntranceTests() {
    await new Promise(resolve => setTimeout(resolve, 1000));

    return sampleEntranceTests;
}

const getSampleAccount = async (): Promise<Account | undefined> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    //return undefined;
    return {
        address: "Thong Nhat, Dong Nai",
        email: "nguynan001@gmail.com",
        phone: "0987654321",
        username: "Ng Ân",
        status: 0,
        avatarUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Wolfgang-amadeus-mozart_1.jpg/1200px-Wolfgang-amadeus-mozart_1.jpg"
    }
}
const getStatusStyle = (status: number) => {
    switch (status) {
        case 0: return "text-green-500 font-semibold";
        case 1: return "text-blue-500 font-semibold";
        case 2: return "text-gray-400 font-semibold";
        case 3: return "text-gray-400 font-semibold";
        default: return "text-black font-semibold";
    }
};

export async function loader({ request, params }: LoaderFunctionArgs) {

    try {

        const promise = getSampleEntranceTests()
        const accountPromise = getSampleAccount()
        return { promise, accountPromise };

    } catch (error) {

        console.error({ error });

        if (isRedirectError(error)) {
            throw error;
        }

        const { message, status } = getErrorDetailsInfo(error);

        throw new Response(message, { status });
    }
}

export default function EntranceTests({ }: Props) {
    const loaderData = useLoaderData<typeof loader>();

    const navigate = useNavigate()

    return (
        <div className={`bg-gradient-to-br from-gray-100 via-slate-200 to-gray-300 px-6 md:px-12 lg:px-20 py-10 `}>
            <div className="rounded-xl bg-white p-10 shadow-lg">
                <Suspense fallback={<LoadingSkeleton />}>
                    <Await resolve={loaderData.accountPromise}>
                        {(account) => account?.status === 0 ? (
                            <>
                                <h1 className="font-extrabold text-3xl text-center text-gray-800">
                                    Đăng ký thi đầu vào
                                </h1>
                                <p className="mt-4 text-lg text-center text-gray-600">
                                    Các ca thi hiện đang mở
                                </p>
                                <div className='flex justify-end'>
                                    <Select>
                                        <SelectTrigger className='w-64'>
                                            <SortDescIcon />
                                            <SelectValue placeholder="Sắp xếp theo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                {
                                                    sortItems.map((item) => (
                                                        <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                                                    ))
                                                }
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {
                                        sampleEntranceTests.map((entranceTest) => (
                                            <div
                                                key={entranceTest.id}
                                                className="transform hover:scale-105 transition-all duration-300 cursor-pointer rounded-lg shadow-md bg-gradient-to-r from-gray-100 to-white"
                                                onClick={() => navigate(`/entrance-tests/${entranceTest.id}`)}
                                            >
                                                <div className="rounded-t-lg bg-gradient-to-r from-black to-gray-800 text-white font-bold p-4 text-center text-lg">
                                                    {entranceTest.name}
                                                </div>
                                                <div className="rounded-b-lg p-4">
                                                    <ul className="space-y-2 text-gray-700">
                                                        <li>
                                                            <span className="font-semibold">Địa điểm:</span> {entranceTest.roomName}
                                                        </li>
                                                        <li>
                                                            <span className="font-semibold">Ca thi:</span> {entranceTest.shift} ({SHIFT_TIME[entranceTest.shift - 1]})
                                                        </li>
                                                        <li>
                                                            <span className="font-semibold">Ngày thi:</span> {entranceTest.date}
                                                        </li>
                                                        <li>
                                                            <span className="font-semibold">Đã đăng ký:</span> {entranceTest.registerStudents} / {(entranceTest.roomCapacity ?? 20)}
                                                            {entranceTest.registerStudents >= (entranceTest.roomCapacity ?? 20) && (
                                                                <span className="ml-2 font-bold text-red-500">(Đã full)</span>
                                                            )}
                                                        </li>
                                                        <li>
                                                            <span className="font-semibold">GV chấm thi:</span> {entranceTest.instructorName}
                                                        </li>
                                                        <li>
                                                            <span className="font-semibold">Trạng thái:</span>
                                                            <span className={`ml-2 ${getStatusStyle(entranceTest.status)}`}>
                                                                {ENTRANCE_TEST_STATUSES[entranceTest.status]}
                                                            </span>
                                                        </li>
                                                    </ul>
                                                </div>
                                            </div>
                                        ))
                                    }
                                </div>
                                <div className='flex justify-center mt-4'>
                                    <PaginationBar currentPage={1} totalPages={10} />
                                </div>
                            </>
                        ) : (
                            <div className='flex flex-col items-center relative'>
                                <div className="absolute inset-0 z-0 bg-cover bg-no-repeat opacity-5 bg-[url('/images/notes_flows.png')]">
                                </div>
                                <h1 className="font-extrabold text-3xl text-center text-gray-800 relative z-10">
                                    Chúc mừng! Bạn đã đăng ký thi xếp lớp thành công
                                </h1>
                                <div className='mt-8 relative z-10'>
                                    Sau bài thi này, bạn sẽ được đánh giá đúng khả năng và được xếp vào lớp tương ứng cùng với lộ trình học phù hợp của mình
                                </div>
                                <div className='mt-8 text-sm italic relative z-10'>
                                    Thông tin chi tiết phía dưới đây
                                </div>
                                <Button className='mt-2 flex gap-4 relative z-10' size={'lg'} onClick={() => navigate('/account/my-exams')}>
                                    Xem lịch thi của tôi <ArrowRightCircle />
                                </Button>
                                <img className="my-2 w-64 relative z-10" src="/images/grand_piano_1.png"></img>
                                <div className='mt-8 italic relative z-10'>
                                    Hi vọng sớm gặp lại bạn ở PhotonPiano
                                </div>
                            </div>
                        )}
                    </Await>
                </Suspense>

            </div>
        </div>
    );
}
function LoadingSkeleton() {
    return (
        <div className="flex justify-center flex-col items-center my-4">
            <Skeleton className="w-[90%] h-[30px] rounded-md" />
            <Skeleton className="w-[90%] h-[30px] rounded-md mt-4" />
            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mt-4 w-full px-10'>
                {
                    Array.from({ length: 9 }).map((v, i) => (
                        <Skeleton key={i} className="w-full h-[120px] rounded-md" />
                    ))
                }
            </div>
        </div>
    )
}