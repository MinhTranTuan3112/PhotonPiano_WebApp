import { zodResolver } from '@hookform/resolvers/zod';
import { FetcherWithComponents, Form, useRouteLoaderData } from '@remix-run/react';
import { useRemixForm } from 'remix-hook-form';
import { z } from 'zod';
import { useConfirmationDialog } from '~/hooks/use-confirmation-dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Controller } from 'react-hook-form';
import GenericCombobox from '../ui/generic-combobox';
import { Survey } from '~/lib/types/survey/survey';
import { loader } from '~/root';
import { fetchSurveys } from '~/lib/services/survey';
import { PaginationMetaData } from '~/lib/types/pagination-meta-data';

export const surveyConfigSchema = z.object({
    instrumentName: z.string().nonempty({ message: 'Tên nhạc cụ không được để trống' }),
    instrumentFrequencyInResponse: z.coerce.number().min(1, { message: 'Tần suất xuất hiện của tên nhạc cụ phải lớn hơn 0' }),
    entranceSurveyId: z.string({ message: 'Vui lòng chọn bài khảo sát đầu vào' }).nonempty({ message: 'Vui lòng chọn bài khảo sát đầu vào' }),
    maxQuestionsPerSuvrey: z.coerce.number().min(1, { message: 'Số lượng câu hỏi tối đa phải lớn hơn 0' }),
    minQuestionsPerSurvey: z.coerce.number().min(1, { message: 'Số lượng câu hỏi tối thiểu phải lớn hơn 0' }),
});

export type SurveyConfigFormData = z.infer<typeof surveyConfigSchema>;

type Props = {
    fetcher: FetcherWithComponents<any>;
    isSubmitting: boolean;
    idToken: string;
} & Partial<SurveyConfigFormData>;

export default function SurveyConfigForm({ fetcher, isSubmitting, idToken, ...defaultData }: Props) {

    const { handleSubmit,
        formState: { errors },
        control,
        register
    } = useRemixForm<SurveyConfigFormData & { module: string }>({
        mode: 'onSubmit',
        resolver: zodResolver(surveyConfigSchema.extend({
            module: z.string()
        })),
        defaultValues: {
            module: 'survey',
            ...defaultData
        },
        submitConfig: {
            action: '/admin/settings',
            method: "POST"
        },
        fetcher
    });

    const { open: handleOpenConfirmDialog, dialog: confirmDialog } = useConfirmationDialog({
        title: 'Lưu cấu hình',
        description: 'Bạn có chắc chắn muốn lưu cấu hình này không?',
        onConfirm: handleSubmit,
    });

    return (
        <>
            <h2 className="text-base font-bold">Cấu hình thi khảo sát</h2>
            <p className='text-sm text-muted-foreground'>Quản lý cấu hình hệ thống liên quan đến khảo sát</p>

            <Form method='POST' className='my-4 flex flex-col gap-5'>

                <div className="flex flex-row">
                    <Label className='w-[25%] flex items-center'>Tên nhạc cụ:</Label>
                    <Input {...register('instrumentName')}
                        placeholder='Nhập tên nhạc cụ...'
                        className='max-w-[70%]' />
                </div>
                {errors.instrumentName && <p className='text-red-500 text-sm'>{errors.instrumentName.message}</p>}

                <div className="flex flex-row">
                    <Label className='w-[25%] flex items-center'>Số lần xuất hiện tên nhạc cụ trong 1 câu trả lời/lựa chọn:</Label>
                    <Input {...register('instrumentFrequencyInResponse')}
                        type='number'
                        placeholder='Nhập số lần xuất hiện tên nhạc cụ trong 1 câu trả lời/lựa chọn...'
                        className='max-w-[50%]' />
                </div>
                {errors.instrumentName && <p className='text-red-500 text-sm'>{errors.instrumentName.message}</p>}

                <div className="flex flex-row">
                    <Label className='w-[20%] flex items-center'>Bài khảo sát đầu vào:</Label>
                    <Controller
                        name='entranceSurveyId'
                        control={control}
                        render={({ field: { onChange, onBlur, value, ref } }) => (
                            <GenericCombobox<Survey>
                                idToken={idToken}
                                queryKey='surveys'
                                fetcher={async (query) => {
                                    const response = await fetchSurveys(query);

                                    const headers = response.headers;

                                    const metadata: PaginationMetaData = {
                                        page: parseInt(headers['x-page'] || '1'),
                                        pageSize: parseInt(headers['x-page-size'] || '10'),
                                        totalPages: parseInt(headers['x-total-pages'] || '1'),
                                        totalCount: parseInt(headers['x-total-count'] || '0'),
                                    };

                                    return {
                                        data: response.data,
                                        metadata
                                    };
                                }}
                                mapItem={(item) => ({
                                    label: item?.name,
                                    value: item?.id
                                })}
                                placeholder='Chọn bài khảo sát đầu vào...'
                                emptyText='Không tìm bài khảo sát nào.'
                                errorText='Lỗi khi tải danh sách khảo sát.'
                                value={value}
                                onChange={onChange}
                                maxItemsDisplay={10}
                                className='max-w-[70%]'
                            />
                        )}
                    />
                </div>
                {errors.entranceSurveyId && <p className='text-red-500 text-sm'>{errors.entranceSurveyId.message}</p>}

                <div className="flex flex-row">
                    <Label className='w-[25%] flex items-center'>Số câu hỏi tối thiểu trong 1 bài khảo sát:</Label>
                    <Input {...register('minQuestionsPerSurvey')}
                        placeholder='Nhập số lượng câu hỏi tối thiểu trong 1 bài khảo sát...'
                        type='number'
                        className='max-w-[20%]' />
                </div>
                {errors.minQuestionsPerSurvey && <p className='text-red-500 text-sm'>{errors.minQuestionsPerSurvey.message}</p>}

                <div className="flex flex-row">
                    <Label className='w-[25%]'>Số câu hỏi tối đa trong 1 bài khảo sát:</Label>
                    <Input {...register('maxQuestionsPerSuvrey')}
                        placeholder='Nhập số lượng câu hỏi tối đa trong 1 bài khảo sát...'
                        type='number'
                        className='max-w-[20%]' />
                </div>
                {errors.maxQuestionsPerSuvrey && <p className='text-red-500 text-sm'>{errors.maxQuestionsPerSuvrey.message}</p>}


                <div className="my-2">
                    <Button type='button' isLoading={isSubmitting} disabled={isSubmitting}
                        onClick={handleOpenConfirmDialog}>
                        {isSubmitting ? 'Đang lưu...' : 'Lưu'}
                    </Button>
                </div>

            </Form>

            {confirmDialog}
        </>
    );

};