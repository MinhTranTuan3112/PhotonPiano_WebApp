
import { useNavigate } from '@remix-run/react';
import { BookOpenCheck, Calendar, Clock, MapPin, Users } from 'lucide-react';
import { TestStatusBadge } from '~/components/entrance-tests/table/columns';
import { Card, CardContent, CardHeader } from '~/components/ui/card';
import { AccountDetail } from '~/lib/types/account/account';
import { EntranceTest } from '~/lib/types/entrance-test/entrance-test';
import { SHIFT_TIME } from '~/lib/utils/constants';
import { formatRFC3339ToDisplayableDate } from '~/lib/utils/datetime';

type Props = {
    student: AccountDetail;
}

export default function EntranceTestsSection({ student }: Props) {

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 text-lg font-medium text-neutral-800">
                <BookOpenCheck className="h-5 w-5 text-theme" />
                <h3 className='font-bold'>Entrance Tests</h3>
            </div>

            {student.entranceTestStudents.length > 0 ? (
                <div className={`grid gap-4 `}>
                    {student.entranceTestStudents.map(({ entranceTest }) => (
                        <TestCard
                            key={entranceTest.id}
                            entranceTest={entranceTest}
                            type='current'
                        />
                    ))}
                </div>
            ) : (
                <Card className="bg-neutral-50 border border-dashed">
                    <CardContent className="flex flex-col items-center justify-center p-6 text-neutral-500">
                        <BookOpenCheck className="h-12 w-12 mb-2 opacity-20" />
                        <p>No entrance tests yet</p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

const getCardStyle = (type: 'current' | 'past') => {
    return type === 'current'
        ? "border-l-4 border-l-theme bg-gradient-to-r from-theme/20 to-white"
        : "bg-white hover:shadow-md transition-shadow";
};

export function TestCard({
    entranceTest, type = 'current'
}: {
    entranceTest: EntranceTest;
    type?: 'current' | 'past';
}) {

    const navigate = useNavigate();

    return <Card className={`overflow-hidden cursor-pointer ${getCardStyle(type)}`} onClick={() => navigate(`/staff/entrance-tests/${entranceTest.id}`)}>
        <CardHeader className="">
            <div className="flex items-center justify-between">
                <h4 className="text-md font-bold">{entranceTest.name}</h4>
                <TestStatusBadge status={entranceTest.testStatus} />
            </div>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
            <div className="flex items-center text-sm text-gray-700">
                <MapPin className="mr-2 h-4 w-4 text-theme" />
                <span className="font-medium">Room:</span>
                <span className="ml-2">{entranceTest.roomName}</span>
            </div>

            <div className="flex items-center text-sm text-gray-700">
                <Calendar className="mr-2 h-4 w-4 text-theme" />
                <span className="font-medium">Date:</span>
                <span className="ml-2">{formatRFC3339ToDisplayableDate(entranceTest.date, false)}</span>
            </div>

            <div className="flex items-center text-sm text-gray-700">
                <Clock className="mr-2 h-4 w-4 text-theme" />
                <span className="font-medium">Shift:</span>
                <span className="ml-2 line-clamp-1">{SHIFT_TIME[entranceTest.shift]}</span>
            </div>

            <div className="flex items-center text-sm text-gray-700">
                <Users className="mr-2 h-4 w-4 text-theme" />
                <span className="font-medium">Teacher:</span>
                <span className="ml-2">{entranceTest.instructorName}</span>
            </div>

        </CardContent>
    </Card>
}