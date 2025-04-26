import { zodResolver } from '@hookform/resolvers/zod';
import { FetcherWithComponents, Form } from '@remix-run/react'
import { useRemixForm } from 'remix-hook-form';
import { z } from 'zod'
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Controller } from 'react-hook-form';
import RichTextEditor from '../text-editor';
import { Button } from '../ui/button';
import { Upload } from 'lucide-react';
import { useConfirmationDialog } from '~/hooks/use-confirmation-dialog';
import { useImagesDialog } from '~/hooks/use-images-dialog';

export const articleSchema = z.object({
    id: z.string().optional(),
    slug: z.string().optional(),
    title: z.string().nonempty({ message: 'Title is required' }),
    content: z.string().nonempty({ message: 'Content is required' }),
    isPublished: z.boolean().default(false),
    thumbnail: z.string().optional(),
});

export type ArticleFormData = z.infer<typeof articleSchema>;

type Props = {
    isEdit?: boolean;
    fetcher: FetcherWithComponents<any>;
    isSubmitting: boolean;
} & Partial<ArticleFormData>

export default function ArticleForm({ isEdit = false, fetcher, isSubmitting, ...defaultData }: Props) {

    console.log({ ...defaultData });

    const {
        handleSubmit,
        formState: { errors },
        setValue: setFormValue,
        control,
        register,
        watch
    } = useRemixForm<ArticleFormData>({
        mode: 'onSubmit',
        resolver: zodResolver(articleSchema),
        fetcher,
        defaultValues: {
            ...defaultData,
            isPublished: defaultData.isPublished || false,
            thumbnail: defaultData.thumbnail || undefined,
        },
        submitConfig: {
            action: !isEdit ? '/staff/articles/create' : `/staff/articles/${defaultData.slug}`,
            method: "POST"
        }
    });

    const isPublished = watch('isPublished');

    const { open: handleOpenConfirmDialog, dialog: confirmDialog } = useConfirmationDialog({
        title: 'Confirm action',
        description: `${isEdit ? 'Update' : 'Create'} this article?`,
        onConfirm: handleSubmit,
        confirmText: isEdit ? 'Save' : 'Create',
    });

    const { open: handleOpenImageDialog, dialog: imageDialog } = useImagesDialog({
        onConfirm: (imageUrls) => {
            console.log({ imageUrls });
        },
        requiresUpload: true,
        maxImages: 1
    });

    return (
        <>
            <Form method='POST' className='flex flex-col gap-7'>

                <div className="">
                    <Label className='font-bold text-base' htmlFor='title'>Title <span className='text-red-600'>*</span></Label>
                    <Input {...register('title')} id='title' type='text' placeholder='Enter title...' />
                    {errors.title && <p className='text-red-500 text-sm'>{errors.title.message}</p>}
                </div>

                <div className="">
                    <Label className='font-bold text-base'>Content <span className='text-red-600'>*</span></Label>

                    <Controller
                        control={control}
                        name='content'
                        render={({ field: { value, onChange } }) => (
                            <RichTextEditor value={value} onChange={onChange} placeholder='Enter content...' />
                        )}
                    />

                    {errors.content && <p className='text-red-500 text-sm'>{errors.content.message}</p>}
                </div>

                <div className="flex flex-col gap-3">
                    <Label className='font-bold text-base'>Thumbnail</Label>

                    <Button type='button' variant={'outline'} Icon={Upload} iconPlacement='left'
                        className='max-w-[20%]' onClick={handleOpenImageDialog}>
                        Upload thumbnail
                    </Button>

                    {errors.thumbnail && <p className='text-red-500 text-sm'>{errors.thumbnail.message}</p>}
                </div>

                <div className="">

                    <Button type='button' variant={!isPublished ? 'default' : 'destructive'}
                        onClick={() => setFormValue('isPublished', !isPublished)}>
                        {!isPublished ? 'Publish' : 'Unpublish'}
                    </Button>

                </div>

                <div className="my-2">
                    <Button type='button' onClick={handleOpenConfirmDialog} className='w-full' disabled={isSubmitting}
                        isLoading={isSubmitting}>
                        {isEdit ? 'Save' : 'Create'}
                    </Button>
                </div>

            </Form>

            {confirmDialog}
            {imageDialog}
        </>
    )
}