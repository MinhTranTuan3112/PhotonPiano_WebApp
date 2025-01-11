import { LoaderFunctionArgs } from '@remix-run/node'
import { Await, useLoaderData, useNavigate } from '@remix-run/react'
import { CalendarIcon, Check, ChevronsUpDown, Plus } from 'lucide-react'
import { format } from 'node_modules/date-fns/format'
import { Suspense, useEffect, useState } from 'react'
import { columns } from '~/components/entrance-tests/table/columns'
import { Button } from '~/components/ui/button'
import { Calendar } from '~/components/ui/calendar'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '~/components/ui/command'
import { DataTable } from '~/components/ui/data-table'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Skeleton } from '~/components/ui/skeleton'
import { Account } from '~/lib/types/account/account'
import { sampleEntranceTests } from '~/lib/types/entrance-test/entrance-test'
import { EntranceTestDetail } from '~/lib/types/entrance-test/entrance-test-detail'
import { Room, sampleRooms } from '~/lib/types/room/room'
import { cn } from '~/lib/utils'
import { SHIFT_TIME } from '~/lib/utils/constants'

type Props = {}

const getSampleEntranceTest = async (id: string): Promise<EntranceTestDetail> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
        ...sampleEntranceTests[2],
        students: [],
        instructor: {
            status: 0,
            username: "HungDepTrai",
            address: "TN, ĐN",
            email: "thanhhung16082003@gmail.com",
            phone: "0987654321",
            avatarUrl: "https://hips.hearstapps.com/hmg-prod/images/beethoven-600x600.jpg?crop=1xw:1.0xh;center,top&resize=640:*"
        },
        room: sampleRooms[1]
    }
}

async function getSampleRooms() {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return sampleRooms;
}

const getSampleInstructors = async (): Promise<Account[]> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return [
        {
            status: 0,
            username: "HungDepTrai",
            address: "TN, ĐN",
            email: "thanhhung16082003@gmail.com",
            phone: "0987654321",
            avatarUrl: "https://hips.hearstapps.com/hmg-prod/images/beethoven-600x600.jpg?crop=1xw:1.0xh;center,top&resize=640:*"
        },
        {
            address: "Thong Nhat, Dong Nai",
            email: "nguynan001@gmail.com",
            phone: "0987654321",
            username: "Ng Ân",
            status: 0,
            avatarUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Wolfgang-amadeus-mozart_1.jpg/1200px-Wolfgang-amadeus-mozart_1.jpg"
        }

    ];
}
export async function loader({ params }: LoaderFunctionArgs) {

    const promise = getSampleEntranceTest(params.id!);
    const roomPromise = getSampleRooms();
    const instructorPromise = getSampleInstructors();

    return {
        promise, roomPromise, instructorPromise
    }
}

export default function StaffEntranceTestsPage({ }: Props) {

    const { promise, roomPromise, instructorPromise } = useLoaderData<typeof loader>();

    const [openRoomSearch, setOpenRoomSearch] = useState(false)
    const [selectedRoom, setSelectedRoom] = useState<Room>()
    const [openInstructorSearch, setOpenInstructorSearch] = useState(false)
    const [selectedInstructor, setSelectedInstructor] = useState<Account>()
    const [date, setDate] = useState<Date>()

    const navigate = useNavigate();

    useEffect(() => {
        promise.then((et) => {
            setSelectedRoom(et.room)
            setSelectedInstructor(et.instructor)
            setDate(new Date(et.date))
        }).catch((error) => {
            console.error("Error fetching rooms:", error);
        });
    }, [promise]);


    return (
        <article className='px-10'>
            <h1 className="text-xl font-extrabold">Chi tiết ca thi</h1>
            <p className='text-muted-foreground'>Thông tin chung</p>
            <Suspense fallback={<LoadingSkeleton />}>
                <Await resolve={promise}>
                    {(entranceTest) => (
                        <div className='mt-4'>
                            <div className='flex gap-2 items-center'>
                                <Label htmlFor="name" className="w-32">
                                    Tên bài thi
                                </Label>
                                <Input id="name" className="col-span-3" placeholder='Hãy nhập 1 tên nào đó...' defaultValue={entranceTest.name} />
                            </div>
                            <div className='mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4 w-full'>
                                <div className='flex gap-2 items-center'>
                                    <Label htmlFor="name" className="w-32">
                                        Ca thi
                                    </Label>
                                    <Select defaultValue={SHIFT_TIME[entranceTest.shift - 1]}>
                                        <SelectTrigger className='w-64'>
                                            <SelectValue placeholder="Chọn ca thi" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                {
                                                    SHIFT_TIME.map((item, index) => (
                                                        <SelectItem key={index} value={item}>Ca {index + 1} ({item})</SelectItem>
                                                    ))
                                                }
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className='flex gap-2 items-center'>
                                    <Label htmlFor="name" className="w-32">
                                        Ngày thi
                                    </Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-[240px] justify-start text-left font-normal",
                                                    !date && "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon className='mr-2' />
                                                {date ? format(date, "PPP") : <span>Chọn ngày thi</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={date}
                                                onSelect={setDate}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className=' flex gap-2 items-center'>
                                    <Label htmlFor="name" className="w-32">
                                        Phòng thi
                                    </Label>
                                    <Popover open={openRoomSearch} onOpenChange={setOpenRoomSearch}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className="w-3/4 justify-between"
                                            >
                                                {selectedRoom?.name ?? "Hãy chọn phòng..."}
                                                <ChevronsUpDown className="opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent>
                                            <Suspense fallback={<ComboboxSkeleton />}>
                                                <Await resolve={roomPromise}>
                                                    {(rooms) => (
                                                        <Command>
                                                            <CommandInput placeholder="Tìm phòng..." className="h-9" />
                                                            <CommandList>
                                                                <CommandEmpty>Không thấy phòng nào</CommandEmpty>
                                                                <CommandGroup>
                                                                    {rooms.map((room) => (
                                                                        <CommandItem
                                                                            key={room.id}
                                                                            value={room.name}
                                                                            onSelect={(currentValue) => {
                                                                                setSelectedRoom(selectedRoom?.name === currentValue ? undefined : rooms.find(r => r.name === currentValue))
                                                                                setOpenRoomSearch(false)
                                                                            }}
                                                                        >
                                                                            {room.name}
                                                                            <Check
                                                                                className={
                                                                                    "ml-auto " +
                                                                                    (selectedRoom?.name === room.name ? "opacity-100" : "opacity-0")
                                                                                }
                                                                            />
                                                                        </CommandItem>
                                                                    ))}
                                                                </CommandGroup>
                                                            </CommandList>
                                                        </Command>
                                                    )}
                                                </Await>
                                            </Suspense>

                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className='flex gap-2 items-center'>
                                    <Label htmlFor="name" className="w-32">
                                        Giảng viên coi thi
                                    </Label>
                                    <Popover open={openInstructorSearch} onOpenChange={setOpenInstructorSearch}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className="w-3/4 justify-between text-wrap"
                                            >
                                                {selectedInstructor ? `${selectedInstructor.username} (${selectedInstructor.email})` : "Hãy giảng viên coi thi..."}
                                                <ChevronsUpDown className="opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className='w-full'>
                                            <Suspense fallback={<ComboboxSkeleton />}>
                                                <Await resolve={instructorPromise}>
                                                    {(instructors) => (
                                                        <Command>
                                                            <CommandInput placeholder="Tìm giảng viên..." className="h-9" />
                                                            <CommandList>
                                                                <CommandEmpty>Không thấy giảng viên nào</CommandEmpty>
                                                                <CommandGroup>
                                                                    {instructors.map((instructor) => (
                                                                        <CommandItem
                                                                            key={instructor.email}
                                                                            value={instructor.email}
                                                                            onSelect={(currentValue) => {
                                                                                setSelectedInstructor(selectedInstructor?.email === currentValue ? undefined : instructors.find(i => i.email === currentValue))
                                                                                setOpenRoomSearch(false)
                                                                            }}
                                                                        >
                                                                            {instructor.username} ({instructor.email})
                                                                            <Check
                                                                                className={
                                                                                    "ml-auto " +
                                                                                    (selectedInstructor?.email === instructor.email ? "opacity-100" : "opacity-0")
                                                                                }
                                                                            />
                                                                        </CommandItem>
                                                                    ))}
                                                                </CommandGroup>
                                                            </CommandList>
                                                        </Command>
                                                    )}
                                                </Await>
                                            </Suspense>

                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                            <h1 className="text-xl font-extrabold mt-8">Danh sách học viên</h1>
                            <p className='text-muted-foreground'>Danh sách học viên tham gia thi vào ca thi này</p>
                        </div>
                    )}
                </Await>
            </Suspense>
        </article>
    )
}


function LoadingSkeleton() {
    return <div className="flex justify-center items-center my-4">
        <Skeleton className="w-full h-[500px] rounded-md" />
    </div>
}


function ComboboxSkeleton() {
    return <div className="flex flex-col gap-2 justify-center items-center my-4">
        <Skeleton className="w-full h-[100px] rounded-md" />
        <Skeleton className="w-full h-[100px] rounded-md" />
        <Skeleton className="w-full h-[100px] rounded-md" />
        <Skeleton className="w-full h-[100px] rounded-md" />
        <Skeleton className="w-full h-[100px] rounded-md" />
    </div>
}