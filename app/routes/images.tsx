import { ActionFunctionArgs } from "@remix-run/node";
import { isAxiosError } from "axios";
import { getImageUrl, uploadImageFile } from "~/lib/services/images";
import { getErrorDetailsInfo, isRedirectError } from "~/lib/utils/error";

export async function action({ request }: ActionFunctionArgs) {

    try {

        const formData = await request.formData();

        const imageAction = formData.get('imageAction') as string;

        const imageFiles = formData.getAll('imageFiles') as File[];

        console.log('Server formdata:');
        console.log([...formData.entries()]);

        console.log({ imageFiles });

        if (!imageFiles || imageFiles.length === 0) {
            return {
                success: false,
                error: 'Không tìm thấy ảnh.'
            }
        }

        switch (imageAction) {
            case 'upload':

                const groupId = formData.get('groupId') as string;

                const uploadPromises = imageFiles.map(async (file) => {

                    const response = await uploadImageFile({
                        file,
                        name: file.name,
                        groupId,
                        size: file.size,
                    });

                    return response.data;
                });


                const uploadResults = await Promise.all(uploadPromises);

                const imageUrls = uploadResults.map((result) => {

                    const imageCID = result.data.cid;

                    return getImageUrl(imageCID);

                });

                console.log({ imageUrls });

                return {
                    success: true,
                    imageUrls
                }

            case 'delete':

                break;

            default:
                return {
                    success: false,
                    error: 'Invalid image action.'
                }
        }

        return {
            success: true
        }


    } catch (error) {

        console.error({ error });

        if (isRedirectError(error)) {
            throw error;
        }

        if (isAxiosError(error) && error.response?.status === 401) {
            return {
                success: false,
                error: 'Unauthorized.',
            }
        }

        const { message, status } = getErrorDetailsInfo(error);

        return {
            success: false,
            error: message,
        }
    }

}