import { ActionFunctionArgs } from "@remix-run/node";
import { fetchClasses, fetchClearScheduleClass, fetchCreateClass, fetchDelayAClass, fetchDeleteClass, fetchPublishAClass, fetchSchduleAClass, fetchUpdateClass } from "~/lib/services/class";
import { requireAuth } from "~/lib/utils/auth";
import { getErrorDetailsInfo } from "~/lib/utils/error";
import { formEntryToDateOnly, formEntryToNumber, formEntryToString, formEntryToStrings } from "~/lib/utils/form";

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
            const level = formEntryToString(formData.get("level"));
            const token = formEntryToString(formData.get("idToken"));

            if (!level) {
                return {
                    success: false,
                    error: 'Level là bắt buộc.',
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
                level : level,
                idToken: token
            }
            await fetchCreateClass(body);

            return {
                success: true
            }
        } else if (action === "EDIT") {
            const level = formEntryToString(formData.get("level"));
            const instructorId = formEntryToString(formData.get("instructorId"));
            const name = formEntryToString(formData.get("name"));
            const id = formEntryToString(formData.get("id"));
            const description = formEntryToString(formData.get("description"));
            const token = formEntryToString(formData.get("idToken"));
            if (!id) {
                return {
                    success: false,
                    error: 'Không xác định lớp học.',
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
                level : level,
                instructorId : instructorId,
                name : name,
                idToken: token,
                scheduleDescription : description
            }
            await fetchUpdateClass(body);

            return {
                success: true
            }
        } else if (action === "DELETE") {
            const id = formEntryToString(formData.get("id"));
            const token = formEntryToString(formData.get("idToken"));

            if (!id) {
                return {
                    success: false,
                    error: 'Không xác định lớp học.',
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

            await fetchDeleteClass({id,idToken : token});

            return {
                success: true
            }
        } else if (action === "DELETE_SCHEDULE") {
            const id = formEntryToString(formData.get("id"));
            const token = formEntryToString(formData.get("idToken"));

            if (!id) {
                return {
                    success: false,
                    error: 'Không xác định lớp học.',
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

            await fetchClearScheduleClass({id,idToken : token});

            return {
                success: true
            }
        } else if (action === "SCHEDULE"){
            const dayOfWeeks = formEntryToStrings(formData.getAll("dayOfWeeks").toString());
            const startWeek = formEntryToDateOnly(formData.get("startWeek"));
            const shift = formEntryToNumber(formData.get("shift"));
            const token = formEntryToString(formData.get("idToken"));
            const id = formEntryToString(formData.get("id"));

            if (!token) {
                return {
                    success: false,
                    error: 'Unauthorized.',
                    status: 401
                }
            }
            console.log(dayOfWeeks,startWeek,shift,id)
            if (dayOfWeeks.length === 0 || !startWeek || shift == undefined || shift < 0 || !id) {
                return {
                    success: false,
                    error: 'Invalid Data.',
                    status: 400
                }
            }

            await fetchSchduleAClass({
                dayOfWeeks : dayOfWeeks.map(Number),
                id : id,
                idToken : token,
                shift : shift,
                startWeek : startWeek
            });

            return {
                success: true
            }
        } else if (action === "PUBLISH"){
            const id = formEntryToString(formData.get("id"));
            const token = formEntryToString(formData.get("idToken"));

            if (!id) {
                return {
                    success: false,
                    error: 'Invalid Class.',
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

            await fetchPublishAClass({id,idToken : token});

            return {
                success: true
            }
        } else if (action === "DELAY"){
            const classId = formEntryToString(formData.get("classId"));
            const weeks = formEntryToNumber(formData.get("weeks"));
            const {idToken} = await requireAuth(request)

            if (!classId || !weeks) {
                return {
                    success: false,
                    error: 'Invalid Data.',
                    status: 400
                }
            }

            await fetchDelayAClass({classId, weeks,idToken});

            return {
                success: true
            }
        } else {
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