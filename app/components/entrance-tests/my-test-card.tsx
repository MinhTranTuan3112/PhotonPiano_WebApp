import { EntranceTest } from '~/lib/types/entrance-test/entrance-test'
import { Button } from '../ui/button'
import { ArrowRight } from 'lucide-react'
import { ENTRANCE_TEST_STATUSES, SHIFT_TIME } from '~/lib/utils/constants'
import { useNavigate } from '@remix-run/react'

type Props = {
    entranceTest: EntranceTest
}
const getStatusStyle = (status: number) => {
    switch (status) {
        case 0: return "text-green-500 font-bold";
        case 1: return "text-blue-500 font-bold";
        case 2: return "text-gray-600 font-bold";
        case 3: return "text-gray-400 font-bold";
        default: return "text-black font-bold";
    }
};
export default function MyTestCard({ entranceTest }: Props) {
    1
    const navigate = useNavigate()

    return (
        <div className={'rounded-lg shadow-md p-4 border-r-4 border-b-4 border-gray-200 transition-all relative '
            + (entranceTest.status === 0 ? 'hover:bg-gray-100' : 'bg-gray-200 hover:bg-gray-300 border-gray-400')
        }>
            <div className="absolute inset-0 z-0 bg-cover bg-no-repeat opacity-[3%] bg-[url('/images/keyboard.png')]">
            </div>
            <div className='flex gap-4 items-center relative z-10'>
                <div className='flex-grow'>
                    <div className='flex justify-between'>
                        <div className='font-bold text-xl'>{entranceTest.name}</div>
                        <div className={getStatusStyle(entranceTest.testStatus)}>{ENTRANCE_TEST_STATUSES[entranceTest.testStatus]}</div>
                    </div>
                    <div className='grid grid-cols-1 lg:grid-cols-2 gap-2 mt-4'>
                        <div>
                            <span className='font-bold'>Shift : </span>
                            <span>{entranceTest.shift + 1} ({SHIFT_TIME[entranceTest.shift]})</span>
                        </div>
                        <div>
                            <span className='font-bold'>Date : </span>
                            <span>{entranceTest.date}</span>
                        </div>
                        <div>
                            <span className='font-bold'>Location : </span>
                            <span>{entranceTest.roomName}</span>
                        </div>
                        <div>
                            <span className='font-bold'>Teacher : </span>
                            <span>{entranceTest.instructorName}</span>
                        </div>
                    </div>
                </div>
                <div>
                    <Button variant={'expandIcon'} onClick={() => navigate(`/account/my-exams/${entranceTest.id}`)}
                        Icon={ArrowRight} iconPlacement='right'>
                        View
                    </Button>
                </div>
            </div>
        </div>
    )
}