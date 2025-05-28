import { Info } from "lucide-react";
import { Card } from "../ui/card";


export default function SlotStatusAnnotation() {
    return (
        <Card className="bg-slate-50 border border-slate-200 p-4 my-6">
            <div className="flex items-start gap-2">
                <Info className="w-5 h-5 text-slate-600 mt-0.5 flex-shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800 mb-2">Slot Status Information:</h3>
                    <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                            <span className="px-2 py-1 rounded text-white bg-gray-500 font-medium text-xs">Not Started</span>
                            <span className="text-slate-700">The lesson has not begun yet and is scheduled for the future</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="px-2 py-1 rounded text-white bg-yellow-500 font-medium text-xs">Ongoing</span>
                            <span className="text-slate-700">The lesson is currently in progress</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="px-2 py-1 rounded text-white bg-green-500 font-medium text-xs">Finished</span>
                            <span className="text-slate-700">The lesson has been completed successfully</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="px-2 py-1 rounded text-white bg-red-500 font-medium text-xs">Cancelled</span>
                            <span className="text-slate-700">The lesson has been cancelled and will not take place</span>
                        </li>
                    </ul>
                </div>
            </div>
        </Card>
    )
}