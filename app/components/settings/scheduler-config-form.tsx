// This would be in a new file like scheduler-config-form.tsx in your components/settings folder

import { zodResolver } from "@hookform/resolvers/zod";
import { FetcherWithComponents } from "@remix-run/react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Separator } from "~/components/ui/separator";
import { Loader2 } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { X } from "lucide-react";

// Sửa phần khai báo schema để xử lý chuyển đổi chuỗi thành mảng
export const schedulerConfigSchema = z.object({
    module: z.literal('scheduler'),
    deadlineAttendance: z.number().min(1).max(24).optional(),
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
});

export type SchedulerConfigFormData = z.infer<typeof schedulerConfigSchema>;

type Props = {
    fetcher: FetcherWithComponents<any>;
    isSubmitting: boolean;
    idToken: string;
    deadlineAttendance?: number;
    reasonCancelSlot?: string[];
}

export default function SchedulerConfigForm({ fetcher, isSubmitting, idToken, deadlineAttendance = 1, reasonCancelSlot = [] }: Props) {
    const [newReason, setNewReason] = useState("");
    const [reasons, setReasons] = useState<string[]>(reasonCancelSlot || []);

    const form = useForm<SchedulerConfigFormData>({
        resolver: zodResolver(schedulerConfigSchema),
        defaultValues: {
            module: 'scheduler',
            deadlineAttendance,
            reasonCancelSlot: reasons,
        }
    });

    useEffect(() => {
        form.setValue('reasonCancelSlot', reasons);
    }, [reasons]);

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

    // Tùy chỉnh phần submit để xử lý dữ liệu
    const onSubmit = (data: SchedulerConfigFormData) => {
        // Tạo FormData đặc biệt để xử lý mảng
        const formData = new FormData();

        // Thêm các trường bình thường
        formData.append('module', data.module);
        if (data.deadlineAttendance !== undefined) {
            formData.append('deadlineAttendance', data.deadlineAttendance.toString());
        }

        // Thêm mảng reasonCancelSlot dưới dạng chuỗi JSON
        if (data.reasonCancelSlot && data.reasonCancelSlot.length > 0) {
            formData.append('reasonCancelSlot', JSON.stringify(data.reasonCancelSlot));
        } else {
            formData.append('reasonCancelSlot', '[]');
        }

        // Gửi dữ liệu
        fetcher.submit(formData, { method: 'post' });
    };

    return (
        <Card>
            <CardContent className="pt-6">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <input type="hidden" name="module" value="scheduler" />

                        <div className="space-y-6">
                            <FormField
                                control={form.control}
                                name="deadlineAttendance"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Deadline for Attendance (hours)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                {...field}
                                                onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                                min={1}
                                                max={24}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Set the number of hours after a slot when attendance can still be registered (1-24 hours)
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div>
                                <FormLabel>Reasons for Cancelling Slots</FormLabel>
                                <div className="flex flex-wrap gap-2 mt-2 mb-4">
                                    {reasons.map((reason, index) => (
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
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <Input
                                        value={newReason}
                                        onChange={e => setNewReason(e.target.value)}
                                        placeholder="Add new reason"
                                        onKeyDown={handleKeyPress}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleAddReason}
                                    >
                                        Add
                                    </Button>
                                </div>
                                <FormDescription className="mt-2">
                                    Add common reasons for cancelling class slots
                                </FormDescription>
                            </div>

                            <Separator className="my-4" />

                            <div className="flex justify-end">
                                <Button disabled={isSubmitting} type="submit">
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Changes
                                </Button>
                            </div>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
