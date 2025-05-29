import { Card } from '../ui/card'
import { Info } from 'lucide-react'
import { ClassStatusBadge } from '../staffs/table/class-columns'
import { ClassStatus } from '~/lib/types/class/class'

type Props = {}

export default function ClassStatusAnnotation({ }: Props) {
    return (
        <Card className="bg-slate-50 border border-slate-200 p-4 my-6">
            <div className="flex items-start gap-2">
                <Info className="w-5 h-5 text-slate-600 mt-0.5 flex-shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800 mb-2">Class Status Information:</h3>
                    <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                            <ClassStatusBadge status={ClassStatus.NotStarted} />
                            <span className="text-slate-700">The class has not started</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <ClassStatusBadge status={ClassStatus.Ongoing} />
                            <span className="text-slate-700">The class is on going and have learners</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <ClassStatusBadge status={ClassStatus.Finished} />
                            <span className="text-slate-700">The class has already finished</span>
                        </li>
                    </ul>
                </div>
            </div>
        </Card>
    )
}