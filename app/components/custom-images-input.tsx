import React, { useCallback, useRef } from 'react'
import { cn } from '~/lib/utils';
import { Images, Link2, X } from 'lucide-react';
import { Separator } from './ui/separator';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { useDropzone } from 'react-dropzone-esm';
import { toast } from 'sonner';
import { formatFileSize } from '~/lib/utils/file';
import { ImageFile } from '~/hooks/use-images-dialog';

type Props = {
    imageFiles: ImageFile[];
    setImageFiles: React.Dispatch<React.SetStateAction<ImageFile[]>>;
    isUploading: boolean;
    imageUrls: string[];
    setImageUrls: React.Dispatch<React.SetStateAction<string[]>>;
    maxImages?: number;
};

export default function CustomImagesInput({ imageFiles, setImageFiles, maxImages = 1, imageUrls, setImageUrls, isUploading }: Props) {

    const inputRef = useRef<HTMLInputElement>(null);


    const onDrop = async (acceptedFiles: File[]) => {

        const totalImages = imageFiles.length + acceptedFiles.length;

        if (totalImages > maxImages) {
            toast.warning(`Bạn chỉ có thể upload tối đa ${maxImages} ảnh.`);
            return;
        }


        const newFiles = acceptedFiles.map((file) => {

            const url = URL.createObjectURL(file);

            return {
                id: crypto.randomUUID(),
                url,
                name: file.name,
                displaySize: formatFileSize(file.size),
            } as ImageFile;

        })

        setImageFiles((prev) => {
            return [...prev, ...newFiles];
        });

        setImageUrls((prev) => [...prev, ...newFiles.map((file) => file.url)]);
    }


    const handleSaveImage = useCallback(async () => {

        const url = inputRef.current?.value;

        if (!url) {
            return;
        }

        if (imageFiles.length >= maxImages) {
            toast.warning(`Bạn chỉ có thể upload tối đa ${maxImages} ảnh.`);
            return;
        }

        try {

            const response = await fetch(url, {
                mode: 'no-cors'
            });
            const blob = await response.blob();
            const filename = url.split('/').pop() || 'image';

            const size = formatFileSize(blob.size);

            // const newFile = {
            //     id: crypto.randomUUID(),
            //     url,
            //     name: filename,
            //     displaySize: size,
            // } as ImageFile;

            // setImageFiles((prev) => [...prev, newFile]);
            setImageUrls((prev) => [...prev, url]);
            inputRef.current.value = '';

        } catch (error) {
            console.error('Error fetching image:', error);
            toast.warning('Không thể tải ảnh từ đường link đã nhập.');
        }

    }, [imageFiles, maxImages, setImageUrls]);

    const handleDelete = useCallback((id: string) => {

        setImageFiles(prev => prev.filter(file => file.id !== id))
        setImageUrls(prev => prev.filter((_, index) =>
            imageFiles.findIndex(file => file.id === id) !== index
        ));

    }, [imageFiles, setImageUrls])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: true,
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.gif']
        },
        maxFiles: maxImages - imageFiles.length,
        disabled: isUploading
    })

    return (
        <section className='flex flex-col gap-3'>
            <div
                {...getRootProps()}
                className={cn(
                    "border-2 rounded-md p-6 text-center cursor-pointer hover:border-primary/30 hover:bg-opacity-75",
                    isDragActive ? "border-primary/30 bg-opacity-75" : "border-muted-foreground"
                )}
            >
                <input {...getInputProps()} name='imageFiles' />
                <p className='flex flex-col justify-center items-center'>
                    <Images className="h-6 w-6 mb-2" />
                    Upload hoặc kéo ảnh vào đây...
                </p>
            </div>

            {imageFiles.length > 0 && (
                <div className="space-y-2">
                    {imageFiles.map((file) => (
                        <ImagePreview
                            isUploading={isUploading}
                            key={file.id}
                            src={file.url}
                            filename={file.name}
                            size={file.displaySize}
                            onDelete={() => handleDelete(file.id)}
                        />
                    ))}
                </div>
            )}

            {imageUrls.length > 0 && (
                <div className="space-y-2">
                    {imageUrls.filter(i => !i.startsWith('blob')).map((image) => (
                        <ImagePreview
                            isUploading={isUploading}
                            key={image}
                            src={image}
                            filename={image}
                            size={'(...)'}
                            onDelete={() => {
                                setImageUrls((prev) => prev.filter((url) => url !== image));
                            }}
                        />
                    ))}
                </div>
            )}

            <Separator asChild className="my-6 bg-transparent">
                <div className="py-3 flex items-center text-xs text-black uppercase before:flex-[1_1_0%] before:border-t before:border-black before:me-6 after:flex-[1_1_0%] after:border-t after:border-black after:ms-6 dark:before:border-white dark:after:border-white">
                    Hoặc
                </div>
            </Separator>

            <div className="flex flex-row gap-3 items-center">
                <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <Link2 className="h-4 w-4 text-gray-500" />
                    </div>
                    <Input
                        ref={inputRef}
                        type='url'
                        name='image'
                        placeholder='Nhập đường link ảnh...'
                        className="pl-9"
                        disabled={isUploading}
                    />
                </div>
                <Button type='button' onClick={handleSaveImage} disabled={isUploading}>
                    Lưu
                </Button>
            </div>
        </section>
    )
}

type ImagePreviewProps = {
    isUploading: boolean
    src: string
    filename: string
    size: string
    onDelete: () => void
}

function ImagePreview({ isUploading, src, filename, size, onDelete }: ImagePreviewProps) {

    return (
        <div className="flex items-center gap-3 w-full bg-white rounded-lg p-2 shadow-md">

            <div className="relative h-14 w-14 rounded-md flex items-center">
                <img
                    src={src}
                    alt={filename}
                    className="object-cover rounded-md"
                />
            </div>

            <div className="relative group flex-1 min-w-0 max-w-xs">
                <p className="text-sm font-medium text-gray-900 truncate group-hover:whitespace-normal group-hover:overflow-visible group-hover:bg-white group-hover:absolute group-hover:p-1 group-hover:rounded-md group-hover:shadow-lg">
                    {filename}
                </p>
                <p className="text-sm text-gray-500">{size}</p>
            </div>

            <Button
                disabled={isUploading}
                variant="ghost"
                size="icon"
                onClick={onDelete}
                className="shrink-0"
            >
                <X className="h-4 w-4" />
            </Button>
        </div>
    )
}