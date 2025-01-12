import { Await, Form } from '@remix-run/react'
import React, { Dispatch, SetStateAction, Suspense } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog'
import { EntranceTest } from '~/lib/types/entrance-test/entrance-test'
import { Skeleton } from '../ui/skeleton'
import ExamCard from './exam-card'
import Paginator from '../paginator'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { FilterIcon, Mail, SortDescIcon } from 'lucide-react'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { SHIFT_TIME } from '~/lib/utils/constants'
import { Button } from '../ui/button'
import { Separator } from '../ui/separator'

type Props = {
    isOpen: boolean,
    setIsOpen: Dispatch<SetStateAction<boolean>>,
    entranceTestPromise: Promise<EntranceTest[]>
}

const sortItems = [
    { value: 'registerNumber', label: 'Số lượng đăng ký' },
    { value: 'time', label: 'Thứ tự thời gian' },
];
export default function ExamSwitchingDialog({ isOpen, setIsOpen, entranceTestPromise }: Props) {
    return (
        <Form method='POST'>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className=' max-w-2xl'>
                    <DialogHeader>
                        <DialogTitle>Đổi ca thi</DialogTitle>
                        <DialogDescription>
                            Vui lòng chọn những ca thi có sẵn dưới đây để tiến hành đổi.
                        </DialogDescription>
                        <div className='flex place-content-between gap-4'>
                            <div className='w-full'>
                                <Input type="email" name='email' id="email" placeholder="Nhập tên hoặc email GV"/>
                            </div>
                            <div>
                                <Select>
                                    <SelectTrigger className='w-64'>
                                        <SelectValue placeholder="Ca thi" />
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
                        </div>
                        <div className='flex place-content-between gap-4'>
                            <div className='w-full'>
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
                            <Button><FilterIcon className='mr-4'/> Lọc</Button>
                        </div>
                        <Separator/>
                        <Suspense fallback={<LoadingSkeleton />}>
                            <Await resolve={entranceTestPromise}>
                                {(entranceTests) => (
                                    <div className='my-4'>
                                        <div className='flex flex-col gap-6 overflow-y-auto max-h-96 rounded-lg bg-slate-200 p-4'>
                                            {
                                                entranceTests.map(entranceTest => entranceTest.status === 0 && (
                                                    <ExamCard key={entranceTest.id} entranceTest={entranceTest} />
                                                ))
                                            }
                                        </div>
                                        <Separator />
                                        <Paginator page={1} totalPage={10} />
                                    </div>
                                )}
                            </Await>
                        </Suspense>
                    </DialogHeader>
                </DialogContent>
            </Dialog>
        </Form>
    )
}

function LoadingSkeleton() {
    return <div className="flex flex-col justify-center items-center  my-4 gap-6">
        <Skeleton className="h-[40px] w-full rounded-md" />
        <Skeleton className="h-[40px] w-full rounded-md" />
        <Skeleton className="h-[40px] w-full rounded-md" />
        <Skeleton className="h-[40px] w-full rounded-md" />
        <Skeleton className="h-[40px] w-full rounded-md" />
    </div>
}