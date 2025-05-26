import { Clock } from "lucide-react";
import { AccountDetail } from "~/lib/types/account/account";
import { DAYS_OF_WEEK, SHIFT_TIME } from "~/lib/utils/constants";


type Props = {
    student: AccountDetail;
};

export default function FreeTimesSection({ student }: Props) {

    return <div className="space-y-4">
        <div className="flex items-center gap-2 text-lg font-medium text-neutral-800">
            <Clock className="h-5 w-5 text-theme" />
            <h3 className='font-bold'>Free Times</h3>
        </div>

        <div className="overflow-x-auto rounded-xl border border-neutral-200 shadow-sm">
            <table className="min-w-full bg-white text-sm">
                <thead>
                    <tr className="bg-neutral-900 text-white">
                        <th className="px-4 py-3 border-r border-neutral-700 text-left">Shift</th>
                        {DAYS_OF_WEEK.map((day, i) => (
                            <th key={i} className="px-4 py-3 text-center border-r border-neutral-700 last:border-r-0">
                                {day}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {Object.keys(SHIFT_TIME).map((shiftKey) => {
                        const shift = parseInt(shiftKey);
                        const isEvenRow = shift % 2 === 0;

                        return (
                            <tr
                                key={shift}
                                className={isEvenRow ? "bg-neutral-50" : "bg-white"}
                            >
                                <td className="px-4 py-3 border-r border-neutral-200 font-medium">
                                    <div className="flex items-center gap-2">
                                        <span className="inline-block h-3 w-3 rounded-full bg-theme"></span>
                                        {SHIFT_TIME[shift]}
                                    </div>
                                </td>

                                {Array.from({ length: 7 }).map((_, dayIndex) => {
                                    const hasSlot = student.freeSlots.some(
                                        slot => slot.dayOfWeek === dayIndex && slot.shift === shift
                                    );

                                    return (
                                        <td
                                            key={dayIndex}
                                            className="px-4 py-3 border-r border-neutral-200 last:border-r-0 text-center"
                                        >
                                            {hasSlot ? (
                                                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-theme text-white shadow-sm">
                                                    ✓
                                                </span>
                                            ) : (
                                                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-neutral-200 text-neutral-400">
                                                    –
                                                </span>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>

        <div className="flex justify-end">
            <div className="flex items-center gap-4 text-sm text-neutral-600">
                <div className="flex items-center gap-2">
                    <span className="inline-block h-3 w-3 rounded-full bg-theme"></span>
                    <span>Available</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="inline-block h-3 w-3 rounded-full bg-neutral-200"></span>
                    <span>Unavailable</span>
                </div>
            </div>
        </div>
    </div>
}
