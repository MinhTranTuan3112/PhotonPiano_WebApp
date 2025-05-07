import { zodResolver } from "@hookform/resolvers/zod";
import { ActionFunctionArgs } from "@remix-run/node";
import { getValidatedFormData } from "remix-hook-form";
import { z } from "zod";
import { addSlotSchema, AddSlotSchema } from "~/components/staffs/classes/add-slot-dialog";
import { fetchCreateSlot, fetchDeleteSlot, fetchUpdateSlot } from "~/lib/services/scheduler";
import { getErrorDetailsInfo } from "~/lib/utils/error";
import { formEntryToDateOnly, formEntryToNumber, formEntryToString } from "~/lib/utils/form";


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
            const date = formEntryToDateOnly(formData.get("date"));
            const roomId = formEntryToString(formData.get("room"));
            const shift = formEntryToNumber(formData.get("shift"));
            const classId = formEntryToString(formData.get("classId"));
            const token = formEntryToString(formData.get("idToken"));

            if (!token) {
                return {
                    success: false,
                    error: 'Unauthorized.',
                    status: 401
                }
            }

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
                idToken: token
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
            const token = formEntryToString(formData.get("idToken"));

            console.log(teacherId)
            if (!id) {
                return {
                    success: false,
                    error: 'Slot not found.',
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

            const body = {
                id: id,
                roomId: roomId,
                date: date,
                shift: shift,
                reason : reason,
                teacherId : teacherId,
                idToken: token
            }
            await fetchUpdateSlot(body);

            return {
                success: true
            }
        } else if (action === "DELETE") {
            const id = formEntryToString(formData.get("slotId"));
            const token = formEntryToString(formData.get("idToken"));

            if (!id) {
                return {
                    success: false,
                    error: 'Slot not found.',
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

            await fetchDeleteSlot({id,idToken : token});

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