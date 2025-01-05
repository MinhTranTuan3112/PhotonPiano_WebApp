import { LoaderFunctionArgs } from "@remix-run/node";
import { Await, useLoaderData } from "@remix-run/react";
import { Suspense } from "react";
import { Button } from "~/components/ui/button";
import Image from "~/components/ui/image";
import { sampleEntranceTests } from "~/lib/types/entrance-test/entrance-test";
import { EntranceTestDetail } from "~/lib/types/entrance-test/entrance-test-detail";
import { getErrorDetailsInfo, isRedirectError } from "~/lib/utils/error";

type Props = {}

const getSampleEntranceTest = async (id: string): Promise<EntranceTestDetail> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
        ...sampleEntranceTests[0],
        students: [],
        instructor: {
            username: "HungDepTrai",
            address: "TN, ĐN",
            email: "thanhhung16082003@gmail.com",
            phone: "0987654321",
            avatarUrl: "https://hips.hearstapps.com/hmg-prod/images/beethoven-600x600.jpg?crop=1xw:1.0xh;center,top&resize=640:*"
        }
    }
}

export async function loader({ request, params }: LoaderFunctionArgs) {

    try {

        const promise = getSampleEntranceTest(params.id!)

        return { promise };

    } catch (error) {

        console.error({ error });

        if (isRedirectError(error)) {
            throw error;
        }

        const { message, status } = getErrorDetailsInfo(error);

        throw new Response(message, { status });
    }
}

export default function EntranceTestDetailPage({ }: Props) {
    const shiftTime = ["7:00 - 8:30", "8:45 - 10:15", "10:30 - 12:00", "12:30 - 14:00", "14:15 - 15:45", "16:00 - 17:30", "18:00 - 19:30", "19:45 - 21:45"];
    const entranceTestStatus = ["Sắp bắt đầu", "Đang diễn ra", "Đã kết thúc", "Vô hiệu hóa"];

    const getStatusStyle = (status: number) => {
        switch (status) {
            case 0: return "text-green-500 font-semibold";
            case 1: return "text-blue-500 font-semibold";
            case 2: return "text-gray-400 font-semibold";
            case 3: return "text-gray-400 font-semibold";
            default: return "text-black font-semibold";
        }
    };

    const loaderData = useLoaderData<typeof loader>();

    return (
        <div className="bg-gradient-to-br from-gray-100 via-slate-200 to-gray-300 px-6 md:px-12 lg:px-20 py-10">
            <div className="rounded-xl bg-white py-10 shadow-lg">
                <h1 className="font-extrabold text-3xl text-center text-gray-800 px-10">
                    Chi tiết ca thi
                </h1>
                <Suspense fallback={<div>loading..</div>}>
                    <Await resolve={loaderData?.promise}>
                        {(entranceTest) => (
                            <div className="relative">
                                <div className="absolute inset-0 z-0 bg-cover bg-no-repeat opacity-5 bg-[url('/images/notes_flows.png')]">
                                </div>
                                <div className="flex justify-center text-xl mt-2 px-10">{entranceTest.name}</div>
                                <div className="mt-8 flex flex-col lg:flex-row gap-4 px-10">
                                    <div className="w-full lg:w-1/3 flex flex-col items-center">
                                        <div className="font-bold">Giảng viên phụ trách</div>
                                        {
                                            entranceTest.instructor ? (
                                                <>
                                                    <div className="w-48 mt-2">
                                                        <Image className="relative z-10" src={entranceTest.instructor?.avatarUrl ?? "/images/noavatar.png"}></Image>
                                                    </div>
                                                    <Button className="mt-2 text-xl font-bold" variant={"link"}>
                                                        {entranceTest.instructor.username}
                                                    </Button>
                                                    <div className="mt-2">
                                                        <div><span className="font-bold">Email : </span> {entranceTest.instructor?.email}</div>
                                                        <div><span className="font-bold">SĐT : </span> {entranceTest.instructor?.phone}</div>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="italic">Chưa có giảng viên</div>
                                            )
                                        }

                                    </div>
                                    <div className="w-full lg:w-1/3 grid grid-cols-2 gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className="font-bold text-center">Địa điểm</div>
                                            <div>{entranceTest.roomName}</div>
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <div className="font-bold text-center">Ca thi</div>
                                            <div>{entranceTest.shift} ({shiftTime[entranceTest.shift - 1]})</div>
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <div className="font-bold text-center">Số học viên tham dự</div>
                                            <div>{entranceTest.registerStudents} / {entranceTest.roomCapacity ?? 20}</div>
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <div className="font-bold text-center">Ngày thi</div>
                                            <div>{entranceTest.date}</div>
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <div className="font-bold text-center">Trạng thái</div>
                                            <div className={getStatusStyle(entranceTest.status)}>{entranceTestStatus[entranceTest.status]}</div>
                                        </div>

                                    </div>
                                    <div className="w-1/3 hidden lg:block">
                                        <img className="relative z-10" src="/images/grand_piano_1.png"></img>
                                    </div>
                                </div>
                                
                            </div>
                        )}
                    </Await>
                </Suspense>
                <div className="flex justify-center px-10">
                    <div className="w-3/4 h-1 bg-black rounded mt-8 "></div>
                </div>

            </div>
        </div>
    );
}
