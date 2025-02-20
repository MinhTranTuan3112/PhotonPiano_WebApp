import { PaginationMetaData } from "../pagination-meta-data";

export type PagedResult<T> = {
    data: T[];
    metadata: PaginationMetaData;
}