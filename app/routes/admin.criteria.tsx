import { Await, Form, useFetcher, useLoaderData } from '@remix-run/react'
import { Suspense, useEffect } from 'react'
import { Skeleton } from '~/components/ui/skeleton'
import { ActionFunctionArgs, LoaderFunctionArgs, redirect } from '@remix-run/node'
import { Role } from '~/lib/types/account/account'
import { getErrorDetailsInfo, isRedirectError } from '~/lib/utils/error'
import { requireAuth } from '~/lib/utils/auth'
import { fetchAllMinimalCriterias, fetchCreateCriteria, fetchCriterias, fetchDeleteCriteria, fetchUpdateCriteria } from '~/lib/services/criteria'
import { Criteria, CriteriaFor } from '~/lib/types/criteria/criteria'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { formEntryToNumber, formEntryToString } from '~/lib/utils/form'
import { Button } from '~/components/ui/button'
import { Delete, PlusCircle, X } from 'lucide-react'
import { Input } from '~/components/ui/input'
import { useRemixForm } from 'remix-hook-form'
import { ActionResult } from '~/lib/types/action-result'
type Props = {}

const addCriteriaSchema = z
    .object({
        description: z.string().optional(), // Optional URL for existing avatar
        name: z
            .string({ message: "Tên không được để trống." }),
        weight: z
            .number({ message: "Trọng số không được để trống." })
            .min(1, { message: "Tối thiểu 1." })
            .max(100, { message: "Tối đa 100." }),
    });

type AddCriteriaSchema = z.infer<typeof addCriteriaSchema>;

const resolver = zodResolver(addCriteriaSchema);

export async function loader({ request }: LoaderFunctionArgs) {

    try {

        const { idToken, role } = await requireAuth(request);

        if (role !== Role.Administrator) {
            return redirect('/');
        }

        const promise = fetchCriterias({ idToken, pageSize: 100 }).then((response) => {
            const criteria = response.data as Criteria[];
            return { criteria };
        });

        return {
            promise,
            role
        }

    } catch (error) {
        console.error({ error });

        if (isRedirectError(error)) {
            throw error;
        }

        const { message, status } = getErrorDetailsInfo(error);

        throw new Response(message, { status });

    }
}


export async function action({ request }: ActionFunctionArgs) {

    const formData = await request.formData();
    const action = formEntryToString(formData.get("action"));
    // const { data, errors, receivedValues: defaultValues } =
    //     await getValidatedFormData<ServerAddSlotSchema>(request, zodResolver(serverAddSlotSchema));

    // console.log(data?.action)

    if (!action) {
        return {
            success: false,
            error: "Invalid action",
            status: 405
        }
    }


    if (action === "ADD") {
        const name = formEntryToString(formData.get("date"));
        const description = formEntryToString(formData.get("room"));
        const weight = formEntryToNumber(formData.get("shift"));
        const criteriaFor = formEntryToNumber(formData.get("criteriaFor"));
        const token = formEntryToString(formData.get("idToken"));

        if (!token) {
            return {
                success: false,
                error: 'Unauthorized.',
                status: 401
            }
        }

        if (!name || !description || !weight || !criteriaFor) {
            return {
                success: false,
                error: 'Data is missing!',
                status: 400
            }
        }
        const body = {
            name,
            weight,
            description,
            criteriaFor,
            idToken: token
        }
        await fetchCreateCriteria(body);

        return {
            success: true
        }
    } else if (action === "EDIT") {
        const criteriaFor = formEntryToNumber(formData.get("criteriaFor"));
        const updateString = formData.get("updateCriteria")
        const token = formEntryToString(formData.get("idToken"));

        if (!criteriaFor || !updateString) {
            return {
                success: false,
                error: 'Dữ liệu bị gửi thiếu',
                status: 400
            }
        }
        if (!token) {
            return {
                success: false,
                error: 'Unauthorized.',
                status: 401
            }
        }
        const updateCriteria = JSON.parse(updateString.toString()) as {
            id: string
            name?: string,
            weight?: number,
            description?: string,
        }[]; // Convert back to an object


        const body = {
            updateCriteria,
            criteriaFor,
            idToken: token
        }
        await fetchUpdateCriteria(body);

        return {
            success: true
        }
    } else if (action === "DELETE") {
        const id = formEntryToString(formData.get("criteriaId"));
        const token = formEntryToString(formData.get("idToken"));

        if (!id) {
            return {
                success: false,
                error: 'Không xác định tiêu chí.',
                status: 400
            }
        }
        if (!token) {
            return {
                success: false,
                error: 'Unauthorized.',
                status: 401
            }
        }

        await fetchDeleteCriteria({ id, idToken: token });

        return {
            success: true
        }
    }
    else {
        return {
            success: false,
            error: "Action not found",
            status: 405
        }
    }

}

export default function AdminCriteria({ }: Props) {

    const { promise } = useLoaderData<typeof loader>();

    const fetcher = useFetcher<ActionResult>();

    const {
        handleSubmit,
        formState: { errors },
        register,
        control
    } = useRemixForm<AddCriteriaSchema>({
        mode: "onSubmit",
        resolver,
        defaultValues: {

        },
        fetcher
    });

    return (
        <article className='px-10'>
            <h1 className="text-xl font-extrabold">Quản lý tiêu chí đánh giá</h1>
            <p className='text-muted-foreground'>Quản lý các tiêu chí về thi đầu vào và tiêu chí đánh giá trong lớp</p>
            <Suspense fallback={<LoadingSkeleton />}>
                <Await resolve={promise}>
                    {({ criteria }) => (
                        <div>
                            <Tabs defaultValue='entrance-tests'>
                                <TabsList className="w-full grid grid-cols-2">
                                    <TabsTrigger value="entrance-tests">
                                        Thi đầu vào
                                    </TabsTrigger>
                                    <TabsTrigger value="classes">
                                        Lớp học
                                    </TabsTrigger>
                                </TabsList>
                                <TabsContent value="entrance-tests">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-gray-100">
                                                <th className="font-bold text-center p-3  w-1/6">Tên</th>
                                                <th className="font-bold text-center p-3">Mô tả</th>
                                                <th className="font-bold text-center p-3  w-1/6">Trọng số (%)</th>
                                                <th className="font-bold text-center p-3  w-1/6"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {
                                                criteria.filter(c => c.for == CriteriaFor.EntranceTest).map(c => (
                                                    <tr key={c.id} className="hover:bg-gray-50 border-b">
                                                        <td className="text-center p-3">{c.name}</td>
                                                        <td className="text-center p-3">{c.description}</td>
                                                        <td className="text-center p-3">{c.weight}</td>
                                                        <td className="text-center p-3">
                                                            <Button variant={'destructive'}><X /></Button>
                                                        </td>
                                                    </tr>
                                                ))
                                            }
                                            <tr>
                                                <td>
                                                    <div className='flex justify-center'>
                                                        <Input {...register('name')} placeholder='Tên'></Input>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className='flex justify-center'>
                                                        <Input {...register('description')} placeholder='Mô tả'></Input>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className='flex justify-center'>
                                                        <Input {...register('weight')}
                                                            type='number'
                                                            placeholder='Trọng số'></Input>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className='flex justify-center'>
                                                        <Button><PlusCircle /></Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </TabsContent>

                                <TabsContent value="classes">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-gray-100">
                                                <th className="font-bold text-center p-3 w-1/6">Tên</th>
                                                <th className="font-bold text-center p-3">Mô tả</th>
                                                <th className="font-bold text-center p-3  w-1/6">Trọng số (%)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {
                                                criteria.filter(c => c.for == CriteriaFor.Class).map(c => (
                                                    <tr key={c.id} className="hover:bg-gray-50">
                                                        <td className="text-center p-3">{c.name}</td>
                                                        <td className="text-center p-3">{c.description}</td>
                                                        <td className="text-center p-3">{c.weight}</td>
                                                    </tr>
                                                ))
                                            }
                                        </tbody>
                                    </table>
                                </TabsContent>

                            </Tabs>
                        </div>
                    )}
                </Await>
            </Suspense>
        </article>
    )
}

function LoadingSkeleton() {
    return <div className="flex justify-center items-center my-4">
        <Skeleton className="w-full h-[500px] rounded-md" />
    </div>
}