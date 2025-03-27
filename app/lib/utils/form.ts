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

export const formEntryToNumber = (formEntry?: FormDataEntryValue | null, defaultValue?: number ) => {
    var value = formEntry?.toString().replace(/"/g, "").trim()
    return value ? Number.parseInt(value) : (defaultValue  ?? undefined)
}