import { zodResolver } from '@hookform/resolvers/zod';
import { ActionFunctionArgs, LoaderFunctionArgs, redirect } from '@remix-run/node';
import { Await, Form, useFetcher, useLoaderData, useNavigate } from '@remix-run/react';
import { addDays } from 'date-fns';
import { ArrowLeftCircle, TriangleAlert } from 'lucide-react';
import React, { Suspense, useState } from 'react';
import { useRemixForm } from 'remix-hook-form';
import { number, z } from 'zod';
import { Button } from '~/components/ui/button';
import PaginationBar from '~/components/ui/pagination-bar';
import { Skeleton } from '~/components/ui/skeleton';
import { useConfirmationDialog } from '~/hooks/use-confirmation-dialog';
import useLoadingDialog from '~/hooks/use-loading-dialog';
import { fetchAccountDetail } from '~/lib/services/account';
import { fetchCurrentAccountInfo } from '~/lib/services/auth';
import { fetchChangeAClass, fetchClasses } from '~/lib/services/class';
import { fetchSystemConfigByName } from '~/lib/services/system-config';
import { Account, AccountDetail, Role } from '~/lib/types/account/account';
import { ActionResult } from '~/lib/types/action-result';
import { Class } from '~/lib/types/class/class';
import { SystemConfig } from '~/lib/types/config/system-config';
import { PaginationMetaData } from '~/lib/types/pagination-meta-data';
import { requireAuth } from '~/lib/utils/auth';
import { DEADLINE_CHANGING_CLASS } from '~/lib/utils/config-name';
import { getErrorDetailsInfo } from '~/lib/utils/error';
import { formEntryToString } from '~/lib/utils/form';

export async function loader({ request }: LoaderFunctionArgs) {
    const { idToken, role, accountId } = await requireAuth(request);

    if (role !== Role.Student || !accountId) {
        return redirect('/');
    }

    const { searchParams } = new URL(request.url);

    const promise = fetchAccountDetail(accountId, idToken).then((response) => {
        const currentAccount = response.data as AccountDetail;

        const query = {
            page: Number.parseInt(searchParams.get('page') || '1'),
            pageSize: Number.parseInt(searchParams.get('size') || '10'),
            sortColumn: searchParams.get('column') || 'CreatedAt',
            orderByDesc: searchParams.get('desc') === 'true' ? false : true,
            levels: [currentAccount.levelId ?? "0"],
            statuses: [0],
            isPublic: true,
            idToken: idToken
        };
        const classPromise = fetchClasses({ ...query }).then((response) => {
            const classes: Class[] = response.data;
            const headers = response.headers;

            const metadata: PaginationMetaData = {
                page: parseInt(headers['x-page'] || '1'),
                pageSize: parseInt(headers['x-page-size'] || '9'),
                totalPages: parseInt(headers['x-total-pages'] || '1'),
                totalCount: parseInt(headers['x-total-count'] || '0'),
            };

            return {
                classes,
                metadata,
            };
        });

        return { classPromise, currentAccount, query };
    });

    const deadlinePromise = fetchSystemConfigByName({ name: DEADLINE_CHANGING_CLASS, idToken }).then((res) => {
        return res.data as SystemConfig;
    });

    return {
        promise,
        idToken,
        deadlinePromise,
    };
}

export async function action({ request }: ActionFunctionArgs) {
    try {
        const formData = await request.formData();
        const studentId = formEntryToString(formData.get("studentId"));
        const oldClassId = formEntryToString(formData.get("oldClassId"));
        const newClassId = formEntryToString(formData.get("newClassId"));
        const token = formEntryToString(formData.get("idToken"));

        if (!token) {
            return {
                success: false,
                error: 'Unauthorized.',
                status: 401
            }
        }
        console.log(studentId, oldClassId, newClassId)
        if (!studentId || !oldClassId || !newClassId) {
            return {
                success: false,
                error: 'Invalid Data.',
                status: 400
            }
        }

        await fetchChangeAClass({
            newClassId: newClassId,
            oldClassId: oldClassId,
            studentId: studentId,
            idToken: token,
        });

        return {
            success: true
        }
    } catch (err) {
        const error = getErrorDetailsInfo(err)
        return {
            success: false,
            error: error.message,
            status: error.status
        }
    }

};

export default function AccountClassChanging() {
    const { promise, deadlinePromise, idToken } = useLoaderData<typeof loader>();
    // const [selectedClass, setSelectedClass] = useState<string | null>()
    const navigate = useNavigate();
    const fetcher = useFetcher<ActionResult>()

    const changeClassSchema = z.object({
        studentId: z.string(),
        oldClassId: z.string(),
        newClassId: z.string(),
        idToken: z.string(),
    });

    type ChangeClassSchema = z.infer<typeof changeClassSchema>;
    const resolver = zodResolver(changeClassSchema)

    const { loadingDialog } = useLoadingDialog({
        fetcher,
        action: () => {
            navigate("/account/class")
        }
    })

    const { open: handleOpenModal, dialog: confirmDialog } = useConfirmationDialog({
        title: 'Confirm Changing New Class',
        description: 'Are you sure want to change to this class?',
        onConfirm: () => {
            handleSubmit();
        }
    })

    const {
        handleSubmit,
        formState: { errors },
        register,
        control
    } = useRemixForm<ChangeClassSchema>({
        mode: "onSubmit",
        resolver,
        fetcher,
        defaultValues: {
            idToken: idToken
        }
    })

    return (
        <div >
            <Button className='m-4' onClick={() => navigate(-1)} iconPlacement='left' Icon={ArrowLeftCircle} variant={'outline'}>Quay lại</Button>
            <div className="py-4 max-w-5xl mx-auto">
                {/* Page Header */}
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-800">Changing Class</h1>
                    <p className="text-gray-600 mt-2">
                        Change to a class that best suit your time!
                    </p>
                </div>

                {/* Classes List */}
                <Suspense fallback={<LoadingSkeleton />}>
                    <Await resolve={deadlinePromise}>
                        {(deadline) => (
                            <Await resolve={promise}>
                                {(data) => (
                                    <Await resolve={data.classPromise}>
                                        {(classesData) => {
                                            if (!data.currentAccount.currentClass) {
                                                return (
                                                    <div className='text-center'>You have no classes to change to</div>
                                                )
                                            }
                                            const classStartDate = data.currentAccount.currentClass.startTime
                                            const deadlineDay = Number.parseInt(deadline.configValue)
                                            const closeDay = classStartDate ? new Date(classStartDate) : null;
                                            if (closeDay) {
                                                closeDay.setDate(closeDay.getDate() - deadlineDay);
                                            }
                                            const today = new Date()
                                            return (!closeDay || today < closeDay) ? (
                                                <div>
                                                    {
                                                        closeDay && closeDay < new Date("9000-01-01") && (
                                                            <div className='my-2 italic text-center'>
                                                                Deadline : Before {closeDay.toISOString().split('T')[0]}
                                                            </div>
                                                        )
                                                    }
                                                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                                        {classesData.classes.map((classItem) => classItem.id != data.currentAccount.currentClass?.id && (
                                                            <Form onSubmit={handleOpenModal}>
                                                                <ClassCard key={classItem.id} classItem={classItem} />
                                                                <input type='submit' className='hidden' />
                                                                <input {...register("oldClassId")} value={data.currentAccount.currentClass?.id} type='hidden' />
                                                                <input {...register("newClassId")} value={classItem.id} type='hidden' />
                                                                <input {...register("studentId")} value={data.currentAccount.accountFirebaseId} type='hidden' />
                                                            </Form>
                                                        ))}
                                                    </div>

                                                    <div className='mt-8'>
                                                        <PaginationBar currentPage={classesData.metadata.page} totalPages={classesData.metadata.totalPages} />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className='my-4'>
                                                    <div className='bg-gray-100 rounded-lg p-2 flex gap-2 items-center mb-4'>
                                                        <TriangleAlert size={100} />
                                                        <div>
                                                            Class changing overdued, please contact support if you have further question.
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        }}
                                    </Await>
                                )}
                            </Await>
                        )
                        }
                    </Await>
                </Suspense>
            </div>
            {loadingDialog}
            {confirmDialog}
        </div >

    );

    /* Class Card Component */
    function ClassCard({ classItem }: { classItem: Class }) {
        return (
            <div className="bg-white shadow-lg rounded-lg p-4 border border-gray-200 transition-transform transform hover:scale-105">
                <h2 className="text-lg font-semibold text-gray-800">{classItem.name}</h2>
                <p className="text-gray-600 mt-1">Schedule: {classItem.scheduleDescription}</p>
                <p className="text-gray-600 mt-1">Start Date: {classItem.startTime}</p>
                <p className="text-gray-600 mt-1">Teacher: {classItem.instructor?.fullName || classItem.instructor?.userName || "N/A"}</p>
                <Button className="mt-4 w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition"
                    type="submit">
                    Pick This Class
                </Button>
            </div>
        );
    }
}



/* Skeleton Loading Component */
function LoadingSkeleton() {
    return (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
                <Skeleton key={index} className="h-[120px] w-full rounded-lg" />
            ))}
        </div>
    );
}
