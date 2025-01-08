import { zodResolver } from "@hookform/resolvers/zod";
import { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Await, useLoaderData } from "@remix-run/react";
import { Suspense, useState } from "react";
import { getValidatedFormData } from "remix-hook-form";
import { z } from "zod";
import EnrollDialog from "~/components/entrance-tests/enroll-dialog";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "~/components/ui/breadcrumb";
import { Button } from "~/components/ui/button";
import Image from "~/components/ui/image";
import { Skeleton } from "~/components/ui/skeleton";
import { Account } from "~/lib/types/account/account";
import { sampleEntranceTests } from "~/lib/types/entrance-test/entrance-test";
import { EntranceTestDetail } from "~/lib/types/entrance-test/entrance-test-detail";
import { ENTRANCE_TEST_STATUSES, SHIFT_TIME } from "~/lib/utils/constants";
import { getErrorDetailsInfo, isRedirectError } from "~/lib/utils/error";
import { enrollSchema } from "~/lib/utils/schemas";

type Props = {}

const getSampleEntranceTest = async (id: string): Promise<EntranceTestDetail> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
        ...sampleEntranceTests[2],
        students: [],
        instructor: {
            status : 0,
            username: "HungDepTrai",
            address: "TN, ĐN",
            email: "thanhhung16082003@gmail.com",
            phone: "0987654321",
            avatarUrl: "https://hips.hearstapps.com/hmg-prod/images/beethoven-600x600.jpg?crop=1xw:1.0xh;center,top&resize=640:*"
        },
        entranceTestResult : [],
    }
}

const getSampleAccount = async (): Promise<Account | undefined> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    //return undefined;
    return {
        address: "Thong Nhat, Dong Nai",
        email: "nguynan001@gmail.com",
        phone: "0987654321",
        username: "Ng Ân",
        status : 0,
        avatarUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Wolfgang-amadeus-mozart_1.jpg/1200px-Wolfgang-amadeus-mozart_1.jpg"
    }
}

type EnrollFormData = z.infer<typeof enrollSchema>;

const resolver = zodResolver(enrollSchema);

export async function action({ request }: ActionFunctionArgs) {

    const { errors, data, receivedValues: defaultValues } =
        await getValidatedFormData<EnrollFormData>(request, resolver);

    if (errors) {
        return { success: false, errors, defaultValues };
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
        success: true
    }
}

export async function loader({ request, params }: LoaderFunctionArgs) {

    try {

        const promise = getSampleEntranceTest(params.id!)
        const accountPromise = getSampleAccount()
        return { promise, accountPromise, id : params.id! };

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
    const [isOpenEnrollDialog, setIsOpenEnrollDialog] = useState(false)

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
                <div>
                    <Suspense fallback={<LoadingSkeleton />}>
                        <Await resolve={loaderData?.promise}>
                            {(entranceTest) => (
                                <div>
                                    <Breadcrumb className="px-10">
                                        <BreadcrumbList>
                                            <BreadcrumbItem>
                                                <BreadcrumbLink href="/entrance-tests">Thi xếp lớp đầu vào</BreadcrumbLink>
                                            </BreadcrumbItem>
                                            <BreadcrumbSeparator />
                                            <BreadcrumbItem>
                                                <BreadcrumbPage>
                                                    {entranceTest.name}
                                                </BreadcrumbPage>
                                            </BreadcrumbItem>
                                        </BreadcrumbList>
                                    </Breadcrumb>
                                    <h1 className="font-extrabold text-3xl text-center text-gray-800 px-10">
                                        Chi tiết ca thi
                                    </h1>
                                    <div className="relative">
                                        <div className="absolute inset-0 z-0 bg-cover bg-no-repeat opacity-5 bg-[url('/images/notes_flows.png')]">
                                        </div>
                                        <div className="flex justify-center text-xl mt-2">{entranceTest.name}</div>
                                        {
                                            entranceTest.registerStudents >= (entranceTest.roomCapacity ?? 20) && (
                                                <div className="flex justify-center text-xl text-red-500 font-bold mt-2">
                                                    (Ca thi này đã full)
                                                </div>
                                            )
                                        }
                                        <div className="mt-8 flex flex-col lg:flex-row gap-4 px-10 relative z-10">
                                            <div className="w-full lg:w-1/3 flex flex-col items-center">
                                                <div className="font-bold">Giảng viên phụ trách</div>
                                                {
                                                    entranceTest.instructor ? (
                                                        <>
                                                            <div className="w-48 mt-2">
                                                                <Image src={entranceTest.instructor?.avatarUrl ?? "/images/noavatar.png"}></Image>
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
                                                    <div>{entranceTest.shift} ({SHIFT_TIME[entranceTest.shift - 1]})</div>
                                                </div>
                                                <div className="flex flex-col items-center">
                                                    <div className="font-bold text-center">Số học viên tham dự</div>
                                                    <div>{entranceTest.registerStudents} / {entranceTest.roomCapacity ?? 20}</div>
                                                </div>
                                                <div className="flex flex-col items-center">
                                                    <div className="font-bold text-center">Ngày thi</div>
                                                    <div>{entranceTest.date}</div>
                                                </div>
                                                <div className="flex flex-col items-center col-span-2">
                                                    <div className="font-bold text-center">Trạng thái</div>
                                                    <div className={getStatusStyle(entranceTest.status)}>{ENTRANCE_TEST_STATUSES[entranceTest.status]}</div>
                                                </div>

                                            </div>
                                            <div className="w-1/3 hidden lg:block">
                                                <img className="relative z-10" src="/images/grand_piano_1.png"></img>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            )}
                        </Await>
                    </Suspense>
                </div>
                <div className="flex justify-center px-10">
                    <div className="w-3/4 h-1 bg-black rounded mt-8 "></div>
                </div>
                <div>
                    <h1 className="font-extrabold text-3xl text-center text-gray-800 px-10 mt-4">
                        Đăng ký tham gia cùng chúng tôi
                    </h1>
                    <div className="text-center mt-2">
                        Tham gia thi để đánh giá năng lực piano của bạn<br />
                        Chúng tôi sẽ sắp xếp cho bạn 1 lộ trình học phù hợp sau bài kiểm tra này
                    </div>
                    <Suspense fallback={<LoadingSkeleton />}>
                        <Await resolve={loaderData.accountPromise}>
                            {(account) => account ? (
                                <div className="flex justify-center mt-8">
                                    <Await resolve={loaderData?.promise}>
                                        {(entranceTest) => (
                                            <Button
                                                disabled={ entranceTest.registerStudents >= (entranceTest.roomCapacity ?? 20) || entranceTest.status !== 0}
                                                onClick={() => setIsOpenEnrollDialog(true)}
                                                className="text-xl" size={"lg"}>Đăng ký thi & bắt đầu học</Button>
                                        )}
                                    </Await>
                                    <EnrollDialog setIsOpen={setIsOpenEnrollDialog} isOpen={isOpenEnrollDialog} entranceTestId={loaderData.id} />
                                </div>
                            ) : (
                                <div className="flex flex-col items-center  mt-8">
                                    <div>Bạn cần đăng nhập đề tiếp tục</div>
                                    <Button className="mt-2 text-xl" size={"lg"}>Đăng nhập ngay</Button>
                                </div>
                            )}
                        </Await>
                    </Suspense>
                </div>

            </div>
        </div>
    );
}


function LoadingSkeleton() {
    return <div className="flex justify-center items-center my-4">
        <Skeleton className="w-[90%] h-[300px] rounded-md" />
    </div>
}