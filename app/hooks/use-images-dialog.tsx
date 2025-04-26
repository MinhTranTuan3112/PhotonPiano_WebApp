import { Form, useFetcher } from '@remix-run/react';
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner';
import CustomImagesInput from '~/components/custom-images-input';
import { Button, buttonVariants } from '~/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '~/components/ui/dialog';
import { TEST_IMAGE_GROUP_ID } from '~/lib/utils/constants';
import { toastWarning } from '~/lib/utils/toast-utils';
import { action } from '~/routes/images';

type Props = {
    title?: string;
    description?: string;
    maxImages?: number;
    defaultOpen?: boolean;
    onConfirm: (imageUrlsResult: string[]) => void;
    onFilesUploaded?: (imageFiles: ImageFile[]) => void;
    onCancel?: () => void;
    cancelText?: string;
    confirmText?: string;
    cancelButtonClassname?: string;
    confirmButtonClassname?: string;
    requiresUpload?: boolean;
}

export type ImageFile = {
    id: string;
    url: string;
    displaySize: string;
} & File;

export function useImagesDialog({
    title = 'Upload image', description = 'Enter image url or select image from your device.',
    maxImages = 1, defaultOpen = false, onConfirm, onCancel,
    cancelText = 'Cancel', confirmText = 'Confirm',
    cancelButtonClassname, confirmButtonClassname,
    onFilesUploaded,
    requiresUpload = false }: Props) {

    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [imageFiles, setImageFiles] = useState<ImageFile[]>([]);

    const [isOpen, setIsOpen] = useState(defaultOpen);

    const fetcher = useFetcher<typeof action>();

    const isUploading = fetcher.state === 'submitting';

    const isDisabled = imageUrls.length === 0;

    const formRef = useRef<HTMLFormElement>(null);

    const open = useCallback(() => setIsOpen(true), []);

    const handleCancel = useCallback(() => {
        setIsOpen(false)
        onCancel?.();
        formRef.current?.reset();
    }, [onCancel]);

    const resetForm = useCallback(() => {

        setImageUrls([]);
        setImageFiles([]);

        setIsOpen(false);
        formRef.current?.reset();

        // Cleanup object URLs
        imageFiles.forEach(file => {
            if (file.url.startsWith('blob:')) {
                URL.revokeObjectURL(file.url);
            }
        });

    }, []);


    useEffect(() => {

        if (fetcher.data?.success === true) {
            toast.success('Upload success!', {
                duration: 1250
            });

            const uploadedImageUrls = fetcher.data.imageUrls;

            if (uploadedImageUrls && uploadedImageUrls.length > 0) {
                onConfirm([...imageUrls.filter((url) => !url.startsWith('blob:')), ...uploadedImageUrls]);
            }

            resetForm();


            return;
        }

        if (fetcher.data?.success === false) {
            toastWarning(`Upload failed. Please try again ${fetcher.data?.error}`, {
                duration: 5000
            });
            return;
        }

    }, [fetcher.data]);


    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {

        e.preventDefault();

        const currentTarget = e.currentTarget;

        const formData = new FormData(currentTarget);

        console.log({ imageFiles });

        if (imageFiles.length > 0 && requiresUpload) {
            fetcher.submit(formData, {
                method: 'POST',
                action: '/images',
                encType: 'multipart/form-data'
            });
            return;
        }

        onConfirm(imageUrls);
        onFilesUploaded?.(imageFiles);
        
        toast.success('Upload success!', {
            duration: 1250
        });


        resetForm();

    }

    const ImagesDialog = (
        <Dialog open={isOpen} onOpenChange={setIsOpen} >
            <DialogContent>
                <Form method="POST" ref={formRef} action='/images' encType="multipart/form-data"
                    onSubmit={handleSubmit}>
                    <input type="hidden" name='imageAction' value={'upload'} />
                    <input type="hidden" name='groupId' value={TEST_IMAGE_GROUP_ID} />
                    <DialogHeader className='mb-4'>
                        <DialogTitle>{title}</DialogTitle>
                        <DialogDescription>
                            {description} <br /> <strong>Maximum of {maxImages} images</strong>
                        </DialogDescription>
                    </DialogHeader>

                    <CustomImagesInput imageUrls={imageUrls} setImageUrls={setImageUrls} maxImages={maxImages}
                        isUploading={isUploading}
                        imageFiles={imageFiles}
                        setImageFiles={setImageFiles} />

                    <DialogFooter className="flex flex-row w-full justify-between mt-4">
                        <Button type="button" variant={'outline'} onClick={handleCancel}>{cancelText}</Button>
                        <Button type='submit'
                            className={
                                confirmButtonClassname ||
                                buttonVariants({ variant: 'theme' })
                            }
                            disabled={isDisabled || isUploading}
                            isLoading={isUploading}>{confirmText}
                        </Button>
                    </DialogFooter>
                </Form>
            </DialogContent>
        </Dialog>
    );

    return { open, isOpen, dialog: ImagesDialog };
}