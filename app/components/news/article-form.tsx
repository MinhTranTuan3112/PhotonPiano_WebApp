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
    title: z.string().nonempty({ message: 'Tiêu đề không được để trống' }),
    content: z.string().nonempty({ message: 'Nội dung không được để trống' }),
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
        title: 'Xác nhận',
        description: `Bạn có chắc chắn muốn ${isEdit ? 'cập nhật' : 'tạo'} bài viết này không?`,
        onConfirm: handleSubmit,
        confirmText: isEdit ? 'Cập nhật' : 'Tạo',
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
                    <Label className='font-bold text-base' htmlFor='title'>Tiêu đề <span className='text-red-600'>*</span></Label>
                    <Input {...register('title')} id='title' type='text' placeholder='Nhập tiêu đề bài viết...' />
                    {errors.title && <p className='text-red-500 text-sm'>{errors.title.message}</p>}
                </div>

                <div className="">
                    <Label className='font-bold text-base'>Nội dung <span className='text-red-600'>*</span></Label>

                    <Controller
                        control={control}
                        name='content'
                        render={({ field: { value, onChange } }) => (
                            <RichTextEditor value={value} onChange={onChange} placeholder='Nhập nội dung bài viết...' />
                        )}
                    />

                    {errors.content && <p className='text-red-500 text-sm'>{errors.content.message}</p>}
                </div>

                <div className="flex flex-col gap-3">
                    <Label className='font-bold text-base'>Ảnh thumbnail</Label>

                    <Button type='button' variant={'outline'} Icon={Upload} iconPlacement='left'
                        className='max-w-[20%]' onClick={handleOpenImageDialog}>
                        Upload ảnh thumbnail
                    </Button>

                    {errors.thumbnail && <p className='text-red-500 text-sm'>{errors.thumbnail.message}</p>}
                </div>

                <div className="">

                    <Button type='button' variant={!isPublished ? 'default' : 'destructive'}
                        onClick={() => setFormValue('isPublished', !isPublished)}>
                        {!isPublished ? 'Xuất bản' : 'Hủy xuất bản'}
                    </Button>

                </div>

                <div className="my-2">
                    <Button type='button' onClick={handleOpenConfirmDialog} className='w-full' disabled={isSubmitting}
                        isLoading={isSubmitting}>
                        {isEdit ? 'Lưu' : 'Tạo bài viết'}
                    </Button>
                </div>

            </Form>

            {confirmDialog}
            {imageDialog}
        </>
    )
}