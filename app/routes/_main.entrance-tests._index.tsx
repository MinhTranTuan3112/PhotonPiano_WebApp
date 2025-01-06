import { useNavigate } from '@remix-run/react';
import { SortDescIcon } from 'lucide-react';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '~/components/ui/pagination';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { sampleEntranceTests } from '~/lib/types/entrance-test/entrance-test'
import { ENTRANCE_TEST_STATUSES, SHIFT_TIME } from '~/lib/utils/constants';

type Props = {}

const sortItems = [
    { value: 'registerNumber', label: 'Số lượng đăng ký' },
    { value: 'time', label: 'Thứ tự thời gian' },
];

const getStatusStyle = (status: number) => {
    switch (status) {
        case 0: return "text-green-500 font-semibold";
        case 1: return "text-blue-500 font-semibold";
        case 2: return "text-gray-400 font-semibold";
        case 3: return "text-gray-400 font-semibold";
        default: return "text-black font-semibold";
    }
};

export default function EntranceTests({ }: Props) {


    const navigate = useNavigate()

    return (
        <div className="bg-gradient-to-br from-gray-100 via-slate-200 to-gray-300 px-6 md:px-12 lg:px-20 py-10">
            <div className="rounded-xl bg-white p-10 shadow-lg">
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
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious href="/entrance-tests" />
                            </PaginationItem>
                            <PaginationItem>
                                <PaginationLink href="/entrance-tests">1</PaginationLink>
                            </PaginationItem>
                            <PaginationItem>
                                <PaginationLink href="/entrance-tests" isActive>
                                    2
                                </PaginationLink>
                            </PaginationItem>
                            <PaginationItem>
                                <PaginationLink href="/entrance-tests">3</PaginationLink>
                            </PaginationItem>
                            <PaginationItem>
                                <PaginationEllipsis />
                            </PaginationItem>
                            <PaginationItem>
                                <PaginationNext href="/entrance-tests" />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            </div>
        </div>
    );
}
