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
    // Set the time to midnight UTC
    date.setUTCHours(0, 0, 0, 0);
    // Move to the next day
    date.setUTCDate(date.getUTCDate() + 1);

    return date.toISOString().split('T')[0]
}

export const formEntryToNumber = (formEntry?: FormDataEntryValue | null, defaultValue?: number ) => {
    var value = formEntry?.toString().replace(/"/g, "").trim()
    return value ? Number.parseInt(value) : (defaultValue  ?? undefined)
}