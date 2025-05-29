import { Info } from "lucide-react";
import { Card } from "../ui/card";
import { TestStatusBadge } from "../entrance-tests/table/columns";
import { EntranceTestStatus } from "~/lib/types/entrance-test/entrance-test";

export default function TestStatusAnnotation() {
    return (
        <Card className="bg-slate-50 border border-slate-200 p-4 my-6">
            <div className="flex items-start gap-2">
                <Info className="w-5 h-5 text-slate-600 mt-0.5 flex-shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800 mb-2">Test Status Information:</h3>
                    <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                            <TestStatusBadge status={EntranceTestStatus.NotStarted} />
                            <span className="text-slate-700">The test has not begun yet</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <TestStatusBadge status={EntranceTestStatus.OnGoing} />
                            <span className="text-slate-700">The test is currently in progress</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <TestStatusBadge status={EntranceTestStatus.Ended} />
                            <span className="text-slate-700">The test has been ended</span>
                        </li>
                    </ul>
                </div>
            </div>
        </Card>
    )
}