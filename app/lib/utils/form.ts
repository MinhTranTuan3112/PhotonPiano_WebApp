import { number } from "zod"

export const formEntryToString = (formEntry?: FormDataEntryValue | null, defaultValue?: string) => {
    return formEntry?.toString().replace(/"/g, "").trim() ?? (defaultValue ?? undefined)
}

export const formEntryToStrings = (formEntry?: FormDataEntryValue | null, defaultValue?: string[]) => {
    return formEntry?.toString().replace(/[\[\]"]/g, "").trim().split(',') ?? (defaultValue ?? [])
}

export const formEntryToDateOnly = (formEntry?: FormDataEntryValue | null, defaultValue?: string) => {
    if (!formEntry) return defaultValue ?? undefined;

    const dateStr = formEntry.toString().replace(/"/g, "").trim();
    const date = new Date(dateStr)
    date.setHours(date.getHours() + 7);
    console.log(date.toISOString())
    console.log(date.toISOString().split('T')[0])
    return date.toISOString().split('T')[0]
}

export const formEntryToNumber = (formEntry?: FormDataEntryValue | null, defaultValue?: number) => {
    var value = formEntry?.toString().replace(/"/g, "").trim()
    return value ? Number.parseInt(value) : (defaultValue ?? undefined)
}

export function objectToFormData(
    obj: Record<string, any>,
    form: FormData = new FormData(),
    namespace?: string
): FormData {
    for (const key in obj) {
        if (!obj.hasOwnProperty(key) || obj[key] === undefined || obj[key] === null) continue;

        const formKey = namespace ? `${namespace}[${key}]` : key;
        const value = obj[key];

        if (value instanceof Date) {
            form.append(formKey, value.toISOString());
        } else if (value instanceof File || value instanceof Blob) {
            form.append(formKey, value);
        } else if (Array.isArray(value)) {
            value.forEach((item, index) => {
                const arrayKey = `${formKey}[${index}]`;
                if (typeof item === 'object') {
                    objectToFormData(item, form, arrayKey);
                } else {
                    form.append(arrayKey, item);
                }
            });
        } else if (typeof value === 'object') {
            objectToFormData(value, form, formKey);
        } else {
            form.append(formKey, value);
        }
    }

    return form;
}
