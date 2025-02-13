import { toZonedTime } from 'date-fns-tz';

export const getCurrentTimeInSeconds = (): number => Math.floor(Date.now() / 1000);

export function formatDateToRFC3339(date: Date | undefined): string {
    if (!date) {
        return '';
    }

    // Create a Date object in UTC time
    const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds()));

    // Get the year, month, day, hour, minute, and second components
    const year = utcDate.getUTCFullYear();
    const month = String(utcDate.getUTCMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const day = String(utcDate.getUTCDate()).padStart(2, '0');
    const hour = String(utcDate.getUTCHours()).padStart(2, '0');
    const minute = String(utcDate.getUTCMinutes()).padStart(2, '0');
    const second = String(utcDate.getUTCSeconds()).padStart(2, '0');

    // Construct the RFC 3339 formatted string with 'Z' for UTC
    return `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;
}

export function formatRFC3339ToDisplayableDate(dateString: string): string {
    const date = new Date(dateString);

    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();

    const hours = String(date.getUTCHours() + 7).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');

    return `${day}/${month}/${year} vào lúc ${hours}:${minutes}`;
}


export interface WeekRange {
    startDate: Date;
    endDate: Date;
}

export function getWeekRange(year: number, weekNumber: number): WeekRange {
    const firstDayOfYear = new Date(year, 0, 1);

    // Adjust for the first Monday of the year
    const daysOffset = (weekNumber - 1) * 7 - firstDayOfYear.getDay() + (firstDayOfYear.getDay() === 0 ? -6 : 1);
    const startDate = new Date(firstDayOfYear.setDate(firstDayOfYear.getDate() + daysOffset));
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    return { startDate, endDate };
}

