import { AlertCircle, Banknote, Calendar, Clock, CreditCard, DollarSign } from 'lucide-react';
import { Badge } from '~/components/ui/badge';
import { Card, CardContent, CardHeader } from '~/components/ui/card';
import { AccountDetail } from '~/lib/types/account/account'
import { PaymentStatus, Tuition } from '~/lib/types/tuition/tuition';
import { formatRFC3339ToDisplayableDate } from '~/lib/utils/datetime';
import { formatPrice } from '~/lib/utils/price';

type Props = {
    student: AccountDetail;
}

export default function TuitionSection({ student }: Props) {

    const tuitions = student.studentClasses.flatMap(sc => sc.tutions);

    return (
        <section className='space-y-4'>
            <div className="flex items-center gap-2 text-lg font-bold text-neutral-800">
                <Banknote className="size-5 text-theme" />
                <h3 className='font-bold'>Tuition</h3>
            </div>

            {tuitions.length === 0 ? <Card className="bg-neutral-50 border border-dashed">
                <CardContent className="flex flex-col items-center justify-center p-6 text-neutral-500">
                    <Banknote className="h-12 w-12 mb-2 opacity-20" />
                    <p>No tuitions found.</p>
                </CardContent>
            </Card> : tuitions.map((tuition, index) => (
                <TuitionCard key={index} tuition={tuition} />
            ))}

        </section>
    )
}

type TuitionCardProps = {
    tuition: Tuition;
}

export function TuitionCard({ tuition }: TuitionCardProps) {


    const getDaysUntilDeadline = () => {

        const deadline = new Date(tuition.deadline);
        const today = new Date();
        const diffTime = deadline.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const getStatusColor = () => {
        if (tuition.isPassed) return "text-red-500 bg-red-50 border-red-200";
        if (tuition.paymentStatus === PaymentStatus.Successed) return "text-emerald-500 bg-emerald-50 border-emerald-200";
        return "text-amber-500 bg-amber-50 border-amber-200";
    };

    const getStatusText = () => {
        if (tuition.isPassed) return "Overdue";
        if (tuition.paymentStatus === PaymentStatus.Successed) return "Paid";
        return "Pending";
    };

    const daysUntilDeadline = getDaysUntilDeadline();

    return (
        <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg border-t-4 border-t-theme">
            <CardHeader className="">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">{tuition.className}</h3>
                    <Badge
                        variant="outline"
                        className={`${getStatusColor()} border px-3 py-1 uppercase`}
                    >
                        {getStatusText()}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <div className="flex items-center text-neutral-600">
                            <Calendar className="h-4 w-4 mr-2 text-theme" />
                            <span className="text-sm font-medium">Start Date</span>
                        </div>
                        <p className="text-neutral-900">{formatRFC3339ToDisplayableDate(tuition.startDate, false, false)}</p>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center text-neutral-600">
                            <Calendar className="h-4 w-4 mr-2 text-theme" />
                            <span className="text-sm font-medium">End Date</span>
                        </div>
                        <p className="text-neutral-900">{formatRFC3339ToDisplayableDate(tuition.endDate, false, false)}</p>
                    </div>
                </div>

                <div className="pt-2 space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 border border-neutral-100">
                        <div className="flex items-center">
                            <DollarSign className="h-5 w-5 mr-2 text-theme" />
                            <span className="font-medium">Tuition Amount</span>
                        </div>
                        <span className="text-lg font-semibold text-theme">
                            {formatPrice(tuition.amount)} đ
                        </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 border border-neutral-100">
                        <div className="flex items-center">
                            <CreditCard className="h-5 w-5 mr-2 text-theme" />
                            <span className="font-medium">Additional Fee</span>
                        </div>
                        <span className="text-lg font-semibold text-neutral-600">
                            {formatPrice(tuition.fee)} đ
                        </span>
                    </div>
                </div>

                <div className="pt-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center text-neutral-600">
                            <Clock className="h-4 w-4 mr-2 text-theme" />
                            <span className="font-bold">Payment Deadline</span>
                        </div>
                        <p className="text-destructive font-bold">{formatRFC3339ToDisplayableDate(tuition.deadline, false)}</p>
                    </div>

                    {!tuition.isPassed && tuition.paymentStatus !== PaymentStatus.Successed && daysUntilDeadline <= 7 && (
                        <div className="mt-3 flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-2 rounded-lg text-destructive">
                            <AlertCircle className="h-4 w-4" />
                            <span>Payment due in {daysUntilDeadline} days</span>
                        </div>
                    )}
                </div>

                {/* Piano key decorative element */}
                <div className="pt-4 flex h-2">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div
                            key={i}
                            className={`h-full ${i % 2 === 0 ? 'bg-black w-3' : 'bg-white border-r border-neutral-200 w-2'}`}
                        />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}