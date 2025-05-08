import { ActionFunctionArgs, redirect } from "@remix-run/node";
import { fetchCreateSlot, fetchDeleteSlot, fetchUpdateSlot } from "~/lib/services/scheduler";
import { Role } from "~/lib/types/account/account";
import { requireAuth } from "~/lib/utils/auth";
import { getErrorDetailsInfo } from "~/lib/utils/error";
import { formEntryToDateOnly, formEntryToNumber, formEntryToString } from "~/lib/utils/form";


export async function action({ request }: ActionFunctionArgs) {
    try {

        const { idToken, role } = await requireAuth(request);

        if (role !== Role.Staff) {
            return redirect('/');
        }

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
            const date = formEntryToDateOnly(formData.get("date"));
            const roomId = formEntryToString(formData.get("room"));
            const shift = formEntryToNumber(formData.get("shift"));
            const classId = formEntryToString(formData.get("classId"));


            if (!roomId || !classId || !date || shift == undefined || shift < 0) {
                return {
                    success: false,
                    error: 'Data is missing!',
                    status: 400
                }
            }
            const body = {
                roomId: roomId,
                classId: classId,
                date: date,
                shift: shift,
                idToken
            }
            await fetchCreateSlot(body);

            return {
                success: true
            }
        } else if (action === "EDIT") {
            const date = formEntryToDateOnly(formData.get("date"));
            const roomId = formEntryToString(formData.get("room"));
            const shift = formEntryToNumber(formData.get("shift"));
            const id = formEntryToString(formData.get("slotId"));
            const teacherId = formEntryToString(formData.get("teacherId"));
            const reason = formEntryToString(formData.get("reason"));

            console.log(teacherId)
            if (!id) {
                return {
                    success: false,
                    error: 'Slot not found.',
                    status: 400
                }
            }

            const body = {
                id: id,
                roomId: roomId,
                date: date,
                shift: shift,
                reason: reason,
                teacherId: teacherId,
                idToken
            }
            await fetchUpdateSlot(body);

            return {
                success: true
            }
        } else if (action === "DELETE") {
            const id = formEntryToString(formData.get("slotId"));

            if (!id) {
                return {
                    success: false,
                    error: 'Slot not found.',
                    status: 400
                }
            }

            await fetchDeleteSlot({ id, idToken });

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
};