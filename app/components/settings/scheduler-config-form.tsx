import { zodResolver } from "@hookform/resolvers/zod";
import { FetcherWithComponents, Form } from "@remix-run/react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Button } from "~/components/ui/button";

import { Input } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import { X } from "lucide-react";
import { Label } from "~/components/ui/label";
import { useConfirmationDialog } from "~/hooks/use-confirmation-dialog";
import { useRemixForm } from "remix-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { Slider } from "~/components/ui/slider";

export const schedulerConfigSchema = z.object({
    deadlineAttendance: z.coerce.number().min(1, { message: 'The attendance deadline must be greater than 0' }).max(24, { message: 'The attendance deadline cannot be greater than 24 hours' }),
    reasonCancelSlot: z.preprocess(
        (val) => {
            if (typeof val === 'string') {
                try {
                    return JSON.parse(val);
                } catch (e) {
                    return [val];
                }
            }
            return val;
        },
        z.array(z.string()).optional()
    ),
    reasonRefundTuition: z.preprocess(
        (val) => {
            if (typeof val === 'string') {
                try {
                    return JSON.parse(val);
                } catch (e) {
                    return [val];
                }
            }
            return val;
        },
        z.array(z.string()).optional()
    ),
    maxAbsenceRate: z.coerce.number().min(0, { message: 'The absence rate must be greater than or equal to 0' }).max(1, { message: 'The absence rate cannot be greater than 1' }),
    theoryPercentage: z.coerce.number().min(0, { message: 'The theory percentage must be greater than or equal to 0' }).max(100, { message: 'The theory percentage cannot be greater than 100%' }),
    practicePercentage: z.coerce.number().min(0, { message: 'The practice percentage must be greater than or equal to 0' }).max(100, { message: 'The practice percentage cannot be greater than 100%' })
});

export type SchedulerConfigFormData = z.infer<typeof schedulerConfigSchema>;

type Props = {
    fetcher: FetcherWithComponents<any>;
    isSubmitting: boolean;
    idToken: string;
} & Partial<SchedulerConfigFormData>;

export default function SchedulerConfigForm({ fetcher, isSubmitting, idToken, ...defaultData }: Props) {
    const [newReason, setNewReason] = useState("");
    const [reasons, setReasons] = useState<string[]>(defaultData.reasonCancelSlot || []);
    const [newRefundReason, setNewRefundReason] = useState("");
    const [refundReasons, setRefundReasons] = useState<string[]>(defaultData.reasonRefundTuition || []);
    const [theoryPercentage, setTheoryPercentage] = useState(defaultData.theoryPercentage || 50);

    const {
        handleSubmit,
        formState: { errors },
        control,
        register,
        setValue
    } = useRemixForm<SchedulerConfigFormData & { module: string }>({
        mode: 'onSubmit',
        resolver: zodResolver(schedulerConfigSchema.extend({
            module: z.string()
        })),
        defaultValues: {
            module: 'scheduler',
            ...defaultData,
            reasonCancelSlot: reasons,
            reasonRefundTuition: refundReasons,
            maxAbsenceRate: defaultData.maxAbsenceRate || 0.3,
            theoryPercentage: defaultData.theoryPercentage || 50,
            practicePercentage: defaultData.practicePercentage || 50
        },
        submitConfig: {
            action: '/admin/settings',
            method: "POST"
        },
        fetcher
    });

    useEffect(() => {
        setValue('reasonCancelSlot', reasons);
        setValue('reasonRefundTuition', refundReasons);
    }, [reasons, refundReasons, setValue]);

    const setFormValue = (field: string, value: any) => {
        setValue(field as any, value);
    };

    const handleAddReason = () => {
        if (newReason.trim() && !reasons.includes(newReason.trim())) {
            setReasons([...reasons, newReason.trim()]);
            setNewReason("");
        }
    };

    const handleRemoveReason = (index: number) => {
        const updatedReasons = [...reasons];
        updatedReasons.splice(index, 1);
        setReasons(updatedReasons);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddReason();
        }
    };

    const handleAddRefundReason = () => {
        if (newRefundReason.trim() && !refundReasons.includes(newRefundReason.trim())) {
            setRefundReasons([...refundReasons, newRefundReason.trim()]);
            setNewRefundReason("");
        }
    };

    const handleRemoveRefundReason = (index: number) => {
        const updatedRefundReasons = [...refundReasons];
        updatedRefundReasons.splice(index, 1);
        setRefundReasons(updatedRefundReasons);
    };

    const handleRefundKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddRefundReason();
        }
    };

    const { open: handleOpenConfirmDialog, dialog: confirmDialog } = useConfirmationDialog({
        title: 'Save configuration',
        description: 'Are you sure you want to save this configuration?',
        onConfirm: handleSubmit,
    });

    return (
        <>
            <h2 className="text-xl font-bold">Schedule Configuration</h2>
            <p className='text-sm text-muted-foreground mb-6'>Manage system settings related to scheduling and class sessions</p>

            <Form method='POST' className='space-y-6'>
                <Card>
                    <CardHeader className="bg-slate-50">
                        <CardTitle className="text-base font-medium">Attendance Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>Attendance Recording Deadline (hours)</Label>
                                <Input
                                    {...register('deadlineAttendance')}
                                    placeholder='Enter hours...'
                                    type='number'
                                    min='1'
                                    max='24'
                                />
                                <p className='text-xs text-muted-foreground'>
                                    Time window after class when attendance can still be recorded
                                </p>
                                {errors.deadlineAttendance &&
                                    <p className='text-red-500 text-sm'>{errors.deadlineAttendance.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label>Maximum Absence Rate</Label>
                                <Input
                                    {...register('maxAbsenceRate')}
                                    placeholder='Enter rate...'
                                    type='number'
                                    step='0.01'
                                    min='0'
                                    max='1'
                                />
                                <p className='text-xs text-muted-foreground'>
                                    Value between 0 and 1 (e.g., 0.3 means 30% maximum absences allowed)
                                </p>
                                {errors.maxAbsenceRate &&
                                    <p className='text-red-500 text-sm'>{errors.maxAbsenceRate.message}</p>}
                            </div>
                        </div>


                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="bg-slate-50">
                        <CardTitle className="text-base font-medium">Slot Cancellation Reasons</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div className="flex flex-wrap gap-2 mb-4 min-h-10">
                            {reasons.length > 0 ? (
                                reasons.map((reason, index) => (
                                    <Badge key={index} variant="secondary" className="text-sm py-1 px-3">
                                        {reason}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveReason(index)}
                                            className="ml-2 text-gray-500 hover:text-gray-700"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground">No reasons added yet</p>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <Input
                                value={newReason}
                                onChange={e => setNewReason(e.target.value)}
                                placeholder="Add new reason"
                                onKeyDown={handleKeyPress}
                                className="flex-1"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleAddReason}
                            >
                                Add
                            </Button>
                        </div>
                        <p className='text-xs text-muted-foreground'>
                            Common reasons for class cancellations (e.g., "Teacher illness", "Technical issues")
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="bg-slate-50">
                        <CardTitle className="text-base font-medium">Refund Tuition Reasons</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div className="flex flex-wrap gap-2 mb-4 min-h-10">
                            {refundReasons.length > 0 ? (
                                refundReasons.map((reason, index) => (
                                    <Badge key={index} variant="secondary" className="text-sm py-1 px-3">
                                        {reason}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveRefundReason(index)}
                                            className="ml-2 text-gray-500 hover:text-gray-700"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground">No reasons added yet</p>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <Input
                                value={newRefundReason}
                                onChange={e => setNewRefundReason(e.target.value)}
                                placeholder="Add new reason"
                                onKeyDown={handleRefundKeyPress}
                                className="flex-1"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleAddRefundReason}
                            >
                                Add
                            </Button>
                        </div>
                        <p className='text-xs text-muted-foreground'>
                            Common reasons for tuition refunds (e.g., "Student withdrawal", "Course cancellation")
                        </p>
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button
                        type='button'
                        isLoading={isSubmitting}
                        disabled={isSubmitting}
                        onClick={handleOpenConfirmDialog}
                        className="min-w-32"
                        variant={'theme'}
                    >
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </Form>

            {confirmDialog}
        </>
    );
}
