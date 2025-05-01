import { ActionFunctionArgs, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Await, useFetcher, useLoaderData, useSearchParams } from "@remix-run/react";
import { Suspense, useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { useConfirmationDialog } from "~/hooks/use-confirmation-dialog";
import useLoadingDialog from "~/hooks/use-loading-dialog";
import { fetchFreeSlots, fetchUpsertFreeSlot } from "~/lib/services/free-slot";
import { Role } from "~/lib/types/account/account";
import { ActionResult } from "~/lib/types/action-result";
import { CreateFreeSlot, FreeSlot } from "~/lib/types/free-slot/free-slot";
import { requireAuth } from "~/lib/utils/auth";
import { SHIFT_TIME } from "~/lib/utils/constants";
import { getErrorDetailsInfo, isRedirectError } from "~/lib/utils/error";
import { formEntryToString } from "~/lib/utils/form";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export async function loader({ request }: LoaderFunctionArgs) {

    try {

        const { idToken, role } = await requireAuth(request);

        if (role !== Role.Student) {
            return redirect('/sign-in');
        }

        const promise = fetchFreeSlots({ idToken }).then((response) => {
            const freeSlots = response.data as FreeSlot[];

            return { freeSlots };
        });

        return {
            promise, idToken
        }

    } catch (error) {
        if (isRedirectError(error)) {
            throw error;
        }
        const { message, status } = getErrorDetailsInfo(error);
        throw new Response(message, { status });
    }
}

export async function action({ request }: ActionFunctionArgs) {
    const formData = await request.formData();

    const token = formEntryToString(formData.get("idToken"));

    if (!token) {
        return {
            success: false,
            error: 'Unauthorized.',
            status: 401
        }
    }

    const dataString = formData.get("slots"); // This is a JSON string
    if (!dataString) {
        return {
            success: false,
            error: 'Invalid data.',
            status: 400
        }
    }
    const slots = JSON.parse(dataString.toString()) as CreateFreeSlot[]; // Convert back to an object

    await fetchUpsertFreeSlot({ idToken: token, createFreeSlotModels: slots })
    //console.log(state); 
    // Output: { name: "John Doe", age: 25, preferences: { theme: "dark", notifications: true } }

    return {
        success: true,
        status: 200
    }
}

export default function AccountFreeSlots() {
    const { promise, idToken } = useLoaderData<typeof loader>();
    const [selectedSlots, setSelectedSlots] = useState<CreateFreeSlot[]>([]);
    const fetcher = useFetcher<ActionResult>()
    const [searchParams, setSearchParams] = useSearchParams();

    const { loadingDialog } = useLoadingDialog({
        fetcher,
        action: () => {
            setSearchParams([...searchParams])
        }
    })

    const { open: handleOpenModal, dialog: confirmDialog } = useConfirmationDialog({
        title: 'Confirm updating',
        description: 'Are you sure want to update your free slots?',
        onConfirm: () => {
            saveSlots();
        }
    })

    const toggleSlot = (day: number, shift: number) => {
        setSelectedSlots(prevSlots => {
            const exists = prevSlots.some(s => s.dayOfWeek === day && s.shift === shift);

            if (exists) {
                // Remove the slot if it already exists
                return prevSlots.filter(s => !(s.dayOfWeek === day && s.shift === shift));
            } else {
                // Add the slot if it doesn't exist
                return [...prevSlots, { dayOfWeek: day, shift: shift }];
            }
        });
    };


    const saveSlots = () => {
        //console.log("Selected Slots:", Array.from(selectedSlots));
        // Call API to save slots
        const formData = new FormData();
        formData.append("slots", JSON.stringify(selectedSlots)); // Serialize state
        formData.append("idToken", idToken); // Serialize state
        fetcher.submit(formData, { method: "post" });

    };

    return (
        <div className="px-10 py-6">
            <h1 className="font-bold text-2xl mb-2">What time do you free?</h1>
            <p className="mb-4">Pick all slot in the week that you're able to take piano lesson, this help us to schedule classes in the most convenient way possible!</p>

            <div className="overflow-x-auto">
                <div className="grid grid-cols-8 gap-2 border-b pb-2">
                    <div className="font-bold text-center"></div>
                    {DAYS.map((day) => (
                        <div key={day} className="font-bold text-center">{day}</div>
                    ))}
                </div>
                <Suspense fallback={<LoadingSkeleton />}>
                    <Await resolve={promise}>
                        {(data) => {
                            useEffect(() => {
                                setSelectedSlots(data.freeSlots);
                            }, [data]); // Runs only when `data` changes
                            return (
                                <div>
                                    {SHIFT_TIME.map((time, rowIndex) => (
                                        <div key={time} className="grid grid-cols-8 gap-2 items-center py-2 border-b">
                                            <div className="text-center font-medium">{time}</div>
                                            {DAYS.map((day, colIndex) => {
                                                const key = `${day}-${time}`;
                                                const isSelected = selectedSlots.some(s => s.dayOfWeek === colIndex && s.shift === rowIndex);
                                                return (
                                                    <div
                                                        key={key}
                                                        className={`h-12 rounded-lg cursor-pointer text-center flex items-center justify-center transition-all 
                    ${isSelected ? "bg-blue-500 text-white" : "bg-gray-200 hover:bg-gray-300"}`}
                                                        onClick={() => toggleSlot(colIndex, rowIndex)}
                                                    >
                                                        {isSelected ? "✔" : ""}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            )
                        }}
                    </Await>
                </Suspense>

            </div>

            <div className="mt-6 text-center">
                <Button onClick={handleOpenModal} className="w-64 py-2 text-white font-bold rounded-lg">Save</Button>
            </div>
            {loadingDialog}
            {confirmDialog}
        </div>
    );
}

function LoadingSkeleton() {
    return (
        <div className="mt-8 grid grid-cols-7 gap-2">
            {[...Array(56)].map((_, index) => (
                <Skeleton key={index} className="h-[60px] w-full rounded-lg" />
            ))}
        </div>
    );
}