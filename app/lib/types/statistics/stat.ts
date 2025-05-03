
export type Stat = {
    name: string;
    value: number;
    unit: StatUnit;
    month?: number;
    year?: number;
    valueCompareToLastMonth?: number;
};

export type PieStat = {
    name: string;
    percentage: number;
    value: number;
    color?: string;
};

export enum StatUnit
{
    Count,
    Percent,
    Money
}