import { zodResolver } from '@hookform/resolvers/zod';
import { FetcherWithComponents, Form } from '@remix-run/react';
import { useRemixForm } from 'remix-hook-form';
import { z } from 'zod';
import { useConfirmationDialog } from '~/hooks/use-confirmation-dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Controller } from 'react-hook-form';
import GenericCombobox from '../ui/generic-combobox';
import { Survey } from '~/lib/types/survey/survey';
import { fetchSurveys } from '~/lib/services/survey';
import { PaginationMetaData } from '~/lib/types/pagination-meta-data';

export const surveyConfigSchema = z.object({
    instrumentName: z.string().nonempty({ message: 'Instrument name is required' }),
    instrumentFrequencyInResponse: z.coerce.number().min(0, { message: 'Instrument name frequency must >= 0' }),
    entranceSurveyId: z.string({ message: 'Please choose an entrance survey' }).nonempty({ message: 'Please choose an entrance survey' }),
    maxQuestionsPerSurvey: z.coerce.number().min(1, { message: 'Max number of questions must > 0' }),
    minQuestionsPerSurvey: z.coerce.number().min(1, { message: 'Min number of questions must > 0' }),
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
        title: 'Confirm action',
        description: 'Save this config?',
        onConfirm: handleSubmit,
    });

    return (
        <>
            <h2 className="text-base font-bold">Survey config</h2>
            <p className='text-sm text-muted-foreground'>Manage system config related to survey</p>

            <Form method='POST' className='my-4 flex flex-col gap-5'>

                <div className="flex flex-row">
                    <Label className='w-[25%] flex items-center'>Instrument name:</Label>
                    <Input {...register('instrumentName')}
                        placeholder='Enter instrument name...'
                        className='max-w-[70%]' />
                </div>
                {errors.instrumentName && <p className='text-red-500 text-sm'>{errors.instrumentName.message}</p>}

                <div className="flex flex-row">
                    <Label className='w-[25%] flex items-center'>Instrument name frequency:</Label>
                    <Input {...register('instrumentFrequencyInResponse')}
                        type='number'
                        placeholder='Instrument name frequency...'
                        className='max-w-[50%]' />
                </div>
                {errors.instrumentFrequencyInResponse && <p className='text-red-500 text-sm'>{errors.instrumentFrequencyInResponse.message}</p>}

                <div className="flex flex-row">
                    <Label className='w-[20%] flex items-center'>Entrane survey:</Label>
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
                                placeholder='Choose entrance survey...'
                                emptyText='No surveys found.'
                                errorText='Error loading surveys.'
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
                    <Label className='w-[25%] flex items-center'>Min number of questions in survey:</Label>
                    <Input {...register('minQuestionsPerSurvey')}
                        placeholder='Enter min number of questions in survey...'
                        type='number'
                        className='max-w-[20%]' />
                </div>
                {errors.minQuestionsPerSurvey && <p className='text-red-500 text-sm'>{errors.minQuestionsPerSurvey.message}</p>}

                <div className="flex flex-row">
                    <Label className='w-[25%]'>Max number of questions in survey:</Label>
                    <Input {...register('maxQuestionsPerSurvey')}
                        placeholder='Enter max number of questions in survey:...'
                        type='number'
                        className='max-w-[20%]' />
                </div>
                {errors.maxQuestionsPerSurvey && <p className='text-red-500 text-sm'>{errors.maxQuestionsPerSurvey.message}</p>}


                <div className="my-2">
                    <Button type='button' isLoading={isSubmitting} disabled={isSubmitting}
                        onClick={handleOpenConfirmDialog}>
                        {isSubmitting ? 'Saving...' : 'Save'}
                    </Button>
                </div>

            </Form>

            {confirmDialog}
        </>
    );

};