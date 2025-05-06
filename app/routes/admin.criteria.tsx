import { Await, Form, useFetcher, useLoaderData, useSearchParams } from '@remix-run/react'
import { Suspense, useEffect, useState } from 'react'
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
import { CheckIcon, Delete, Edit2Icon, PenBox, PlusCircle, X, XIcon } from 'lucide-react'
import { Input } from '~/components/ui/input'
import { useRemixForm } from 'remix-hook-form'
import { ActionResult } from '~/lib/types/action-result'
import { useConfirmationDialog } from '~/hooks/use-confirmation-dialog'
import useLoadingDialog from '~/hooks/use-loading-dialog'
type Props = {}

const addCriteriaSchema = z
    .object({
        description: z.string().optional(), // Optional URL for existing avatar
        name: z
            .string({ message: "Name can not be empty." }),
        weight: z.coerce.number({ message: "Weight can not be empty" })
            .min(1, { message: "Minimum 1." })
            .max(100, { message: "Maximum 100." }),
        action: z.string(),
        idToken: z.string(),
        criteriaFor: z.coerce.number(),
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
            role,
            idToken
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

    try {
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
            const name = formEntryToString(formData.get("name"));
            const description = formEntryToString(formData.get("description"));
            const weight = formEntryToNumber(formData.get("weight"));
            const criteriaFor = formEntryToNumber(formData.get("criteriaFor"));
            const token = formEntryToString(formData.get("idToken"));

            if (!token) {
                return {
                    success: false,
                    error: 'Unauthorized.',
                    status: 401
                }
            }

            if (!name || !weight || criteriaFor === null || criteriaFor === undefined) {
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

            if (criteriaFor === null || criteriaFor === undefined || !updateString) {
                return {
                    success: false,
                    error: 'Invalid data',
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
            console.log(updateString.toString())
            const updateCriteria = JSON.parse("[" + updateString.toString() + "]") as {
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
                    error: 'Criteria not found.',
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
    } catch (err) {
        var error = getErrorDetailsInfo(err)
        return {
            success: false,
            error: error.message,
            status: error.status
        }
    }

}

export default function AdminCriteria({ }: Props) {

    const { promise, idToken } = useLoaderData<typeof loader>();
    const [isEdit, setIsEdit] = useState(false)
    const [criteriaFor, setCriteriaFor] = useState(0)
    const [selectedCriteria, setSelectedCriteria] = useState<string>()
    const [criteriaUpdater, setCriteriaUpdater] = useState<{
        id: string
        name?: string,
        weight?: number,
        description?: string,
    }[]>([])
    const [searchParams, setSearchParams] = useSearchParams();

    const fetcher = useFetcher<ActionResult>();

    const {
        handleSubmit: handleAddSubmit,
        formState: { errors },
        register,
        control
    } = useRemixForm<AddCriteriaSchema>({
        mode: "onSubmit",
        resolver,
        defaultValues: {
            action: "ADD",
            idToken: idToken
        },
        fetcher
    });

    const { open: handleOpenAddModal, dialog: confirmAddDialog } = useConfirmationDialog({
        title: 'Add new criterion?',
        description: 'Other weight will be automatically adjusted!',
        onConfirm: () => {
            handleAddSubmit();
        }
    })
    const { loadingDialog: loadingAddDialog } = useLoadingDialog({
        fetcher,
        action: () => {
            setSearchParams([...searchParams])
        }
    })

    const { open: handleOpenDeleteModal, dialog: confirmDeleteDialog } = useConfirmationDialog({
        title: 'Delete Criterion?',
        description: 'Other criteria weight will be adjusted according!',
        onConfirm: () => {
            handleDelete();
        }
    })
    const { open: handleOpenEditModal, dialog: confirmEditModal } = useConfirmationDialog({
        title: 'Edit Criteria?',
        description: 'Are you sure about this action?',
        onConfirm: () => {
            handleEdit();
        }
    })

    const handleEdit = () => {
        fetcher.submit({
            action: "EDIT",
            criteriaFor: criteriaFor,
            updateCriteria: criteriaUpdater.map(cu => JSON.stringify(cu)),
            idToken: idToken
        }, {
            method: 'POST'
        })
    }

    const handleDelete = () => {
        fetcher.submit({
            action: "DELETE",
            criteriaId: selectedCriteria ?? "",
            idToken: idToken
        }, {
            method: 'POST'
        })
    }

    return (
        <article className='px-10'>
            <div className="flex items-center gap-3 mb-4">
                <PenBox className="h-8 w-8 text-sky-600" />
                <div>
                    <h3 className="text-2xl font-bold text-sky-800">Manage Criteria</h3>
                    <p className="text-sm text-sky-600">Manage Criteria to evaluate learners for each entrance test and each class</p>
                </div>
            </div>
            <Suspense fallback={<LoadingSkeleton />}>
                <Await resolve={promise}>
                    {({ criteria }) => {

                        useEffect(() => {
                            if (isEdit) {
                                setCriteriaUpdater(criteria.map(c => ({
                                    id: c.id,
                                    name: c.name,
                                    weight: c.weight,
                                    description: c.description,
                                })));
                            }
                        }, [isEdit]);
                        return (
                            <Form onSubmit={handleOpenAddModal}>
                                <input type="hidden" {...register("criteriaFor", { value: criteriaFor })} />
                                <div className='flex gap-2 justify-end my-4'>
                                    {
                                        isEdit ? (
                                            <>
                                                <Button type='button' onClick={handleOpenEditModal} className='bg-green-500 hover:bg-green-300'>
                                                    <CheckIcon className='mr-4' /> Save Changes
                                                </Button>
                                                <Button type='button' className='bg-red-400 hover:bg-red-200' onClick={() => setIsEdit(false)}>
                                                    <XIcon className='mr-4' /> Discard
                                                </Button>
                                            </>
                                        ) : (
                                            <Button type='button' variant={'theme'} onClick={() => setIsEdit(true)}><Edit2Icon className='mr-4' /> Chỉnh sửa</Button>
                                        )
                                    }
                                </div>
                                <Tabs defaultValue='entrance-tests'>
                                    <TabsList className="w-full grid grid-cols-2">
                                        <TabsTrigger value="entrance-tests" onClick={() => setCriteriaFor(0)}>
                                            Entrance Test
                                        </TabsTrigger>
                                        <TabsTrigger value="classes" onClick={() => setCriteriaFor(1)}>
                                            Class
                                        </TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="entrance-tests" >
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="bg-sky-100">
                                                    <th className="font-bold text-left p-3  w-1/6">Name</th>
                                                    <th className="font-bold text-center p-3">Description</th>
                                                    <th className="font-bold text-right p-3  w-1/6">Weight (%)</th>
                                                    <th className="font-bold text-center p-3  w-1/6"></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {
                                                    criteria.filter(c => c.for === CriteriaFor.EntranceTest).map(c => {
                                                        const updater = criteriaUpdater.find(u => u.id === c.id) ?? c;

                                                        return !isEdit ? (
                                                            <tr key={c.id} className="hover:bg-gray-50 border-b">
                                                                <td className="text-left p-3">{c.name}</td>
                                                                <td className="text-center p-3">{c.description}</td>
                                                                <td className="text-right p-3">{c.weight}</td>
                                                                <td className="text-center p-3">
                                                                    <Button type='button' variant={'destructive'} onClick={() => {
                                                                        setSelectedCriteria(c.id)
                                                                        handleOpenDeleteModal()
                                                                    }}><X /></Button>
                                                                </td>
                                                            </tr>
                                                        ) : (
                                                            <tr key={c.id} className="hover:bg-gray-50 border-b">
                                                                <td className="text-center p-3">
                                                                    <Input
                                                                        value={updater.name || ''}
                                                                        onChange={(e) => {
                                                                            setCriteriaUpdater(prev =>
                                                                                prev.map(item => item.id === c.id
                                                                                    ? { ...item, name: e.target.value }
                                                                                    : item
                                                                                )
                                                                            );
                                                                        }}
                                                                    />
                                                                </td>
                                                                <td className="text-center p-3">
                                                                    <Input
                                                                        value={updater.description || ''}
                                                                        onChange={(e) => {
                                                                            setCriteriaUpdater(prev =>
                                                                                prev.map(item => item.id === c.id
                                                                                    ? { ...item, description: e.target.value }
                                                                                    : item
                                                                                )
                                                                            );
                                                                        }}
                                                                    />
                                                                </td>
                                                                <td className="text-center p-3">
                                                                    <Input
                                                                        type="number"
                                                                        value={updater.weight?.toString() || ''}
                                                                        onChange={(e) => {
                                                                            setCriteriaUpdater(prev =>
                                                                                prev.map(item => item.id === c.id
                                                                                    ? { ...item, weight: parseFloat(e.target.value) || 0 }
                                                                                    : item
                                                                                )
                                                                            );
                                                                        }}
                                                                    />
                                                                </td>
                                                                <td className="text-center p-3">
                                                                    <Button type='button' variant={'destructive'} onClick={() => {
                                                                        setSelectedCriteria(c.id)
                                                                        handleOpenDeleteModal()
                                                                    }}><X /></Button>
                                                                </td>
                                                            </tr>
                                                        )
                                                    })
                                                }
                                                <tr>
                                                    <td>
                                                        <div className='flex flex-col items-center'>
                                                            <Input {...register('name')} name="name" placeholder='Name...'></Input>

                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className='flex flex-col items-center'>
                                                            <Input {...register('description')} name="description" placeholder='Description...'></Input>


                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className='flex flex-col items-center'>
                                                            <Input {...register('weight')}
                                                                type='number'
                                                                name="weight"
                                                                placeholder='Weight...'></Input>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className='flex justify-center'>
                                                            <Button type='submit' name='action' variant={'theme'} value="ADD"><PlusCircle /></Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>{errors.name && errors.name.message && <span className='text-red-500'>{errors.name.message}</span>}</td>
                                                    <td>{errors.description && errors.description.message && <span className='text-red-500'>{errors.description.message}</span>}</td>
                                                    <td>{errors.weight && errors.weight.message && <span className='text-red-500'>{errors.weight.message}</span>}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </TabsContent>
                                    <TabsContent value="classes">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="bg-sky-100">
                                                    <th className="font-bold text-left p-3 w-1/6">Name</th>
                                                    <th className="font-bold text-center p-3">Description</th>
                                                    <th className="font-bold text-right p-3  w-1/6">Weight (%)</th>
                                                    <th></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {
                                                    criteria.filter(c => c.for === CriteriaFor.Class).map(c => {
                                                        const updater = criteriaUpdater.find(u => u.id === c.id) ?? c;

                                                        return !isEdit ? (
                                                            <tr key={c.id} className="hover:bg-gray-50 border-b">
                                                                <td className="text-left p-3">{c.name}</td>
                                                                <td className="text-center p-3">{c.description}</td>
                                                                <td className="text-right p-3">{c.weight}</td>
                                                                <td className="text-center p-3">
                                                                    <Button type='button' variant={'destructive'} onClick={() => {
                                                                        setSelectedCriteria(c.id)
                                                                        handleOpenDeleteModal()
                                                                    }}><X /></Button>
                                                                </td>
                                                            </tr>
                                                        ) : (
                                                            <tr key={c.id} className="hover:bg-gray-50 border-b">
                                                                <td className="text-center p-3">
                                                                    <Input
                                                                        value={updater.name || ''}
                                                                        onChange={(e) => {
                                                                            setCriteriaUpdater(prev =>
                                                                                prev.map(item => item.id === c.id
                                                                                    ? { ...item, name: e.target.value }
                                                                                    : item
                                                                                )
                                                                            );
                                                                        }}
                                                                    />
                                                                </td>
                                                                <td className="text-center p-3">
                                                                    <Input
                                                                        value={updater.description || ''}
                                                                        onChange={(e) => {
                                                                            setCriteriaUpdater(prev =>
                                                                                prev.map(item => item.id === c.id
                                                                                    ? { ...item, description: e.target.value }
                                                                                    : item
                                                                                )
                                                                            );
                                                                        }}
                                                                    />
                                                                </td>
                                                                <td className="text-center p-3">
                                                                    <Input
                                                                        type="number"
                                                                        value={updater.weight?.toString() || ''}
                                                                        onChange={(e) => {
                                                                            setCriteriaUpdater(prev =>
                                                                                prev.map(item => item.id === c.id
                                                                                    ? { ...item, weight: parseFloat(e.target.value) || 0 }
                                                                                    : item
                                                                                )
                                                                            );
                                                                        }}
                                                                    />
                                                                </td>
                                                                <td className="text-center p-3">
                                                                    <Button type='button' variant={'destructive'} onClick={() => {
                                                                        setSelectedCriteria(c.id)
                                                                        handleOpenDeleteModal()
                                                                    }}><X /></Button>
                                                                </td>
                                                            </tr>
                                                        )
                                                    })
                                                }
                                                <tr>
                                                    <td>
                                                        <div className='flex flex-col items-center'>
                                                            <Input {...register('name')} name="name" placeholder='Name...'></Input>

                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className='flex flex-col items-center'>
                                                            <Input {...register('description')} name="description" placeholder='Description...'></Input>


                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className='flex flex-col items-center'>
                                                            <Input {...register('weight')}
                                                                type='number'
                                                                name="weight"
                                                                placeholder='Weight...'></Input>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className='flex justify-center'>
                                                            <Button type='submit' name='action' value="ADD" variant={'theme'} ><PlusCircle /></Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>{errors.name && errors.name.message && <span className='text-red-500'>{errors.name.message}</span>}</td>
                                                    <td>{errors.description && errors.description.message && <span className='text-red-500'>{errors.description.message}</span>}</td>
                                                    <td>{errors.weight && errors.weight.message && <span className='text-red-500'>{errors.weight.message}</span>}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </TabsContent>
                                </Tabs>
                            </Form>
                        )
                    }}
                </Await>
            </Suspense >
            {loadingAddDialog}
            {confirmAddDialog}
            {confirmDeleteDialog}
            {confirmEditModal}
        </article >
    )
}

function LoadingSkeleton() {
    return <div className="flex justify-center items-center my-4">
        <Skeleton className="w-full h-[500px] rounded-md" />
    </div>
}