import { StudentStatus } from '~/lib/types/account/account'
import { StatusBadge } from '../staffs/table/student-columns'
import { Card } from '../ui/card'
import { Info } from 'lucide-react'

type Props = {}

export default function LearnerStatusAnnotation({ }: Props) {
    return (
        <Card className="bg-slate-50 border border-slate-200 p-4 my-6">
            <div className="flex items-start gap-2">
                <Info className="w-5 h-5 text-slate-600 mt-0.5 flex-shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800 mb-2">Learner Status Information:</h3>
                    <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                            <StatusBadge status={StudentStatus.Unregistered} />
                            <span className="text-slate-700">Learner have not registered for entrance test</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <StatusBadge status={StudentStatus.WaitingForEntranceTestArrangement} />
                            <span className="text-slate-700">Learner has already paid entrance test fee and is waiting for entrance test arrangement</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <StatusBadge status={StudentStatus.AttemptingEntranceTest} />
                            <span className="text-slate-700">Learner has been arranged into entrance test and can participate in piano entrance test</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <StatusBadge status={StudentStatus.WaitingForClass} />
                            <span className="text-slate-700">Learner is waiting for class arrangement</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <StatusBadge status={StudentStatus.InClass} />
                            <span className="text-slate-700">Learner is learning in piano class</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <StatusBadge status={StudentStatus.DropOut} />
                            <span className="text-slate-700">Learner has already drop out</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <StatusBadge status={StudentStatus.Leave} />
                            <span className="text-slate-700">Learner has already left</span>
                        </li>
                    </ul>
                </div>
            </div>
        </Card>
    )
}