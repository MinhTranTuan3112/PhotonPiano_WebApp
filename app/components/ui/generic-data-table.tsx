import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from './data-table';
import { Link, useAsyncValue, useLocation, useSearchParams } from '@remix-run/react';
import { FilterX, SearchX } from 'lucide-react';
import { buttonVariants } from './button';
import { PaginationMetaData } from '~/lib/types/pagination-meta-data';

type Props<T> = {
    columns: ColumnDef<T, unknown>[];
    emptyText?: string;
    enableRefresh?: boolean;
    extraHeaderContent?: React.ReactNode;
    metadata: PaginationMetaData;
    resolvedData? : T[],
    pageParamName? : string,
    sizeParamName? : string,
    allowHideColumns? : boolean;
    className? : string
}

export default function GenericDataTable<T>({ columns,
    extraHeaderContent,
    emptyText = 'No results.',
    enableRefresh = true,
    resolvedData = [],
    metadata,
    pageParamName = 'page',
    sizeParamName = 'size',
    allowHideColumns = true,
    className
}: Props<T>) {

    const { totalCount, totalPages } = metadata;

    const resolvedValues = useAsyncValue();

    const data = resolvedData.length > 0 ? resolvedData : resolvedValues as T[];

    const [searchParams, setSearchParams] = useSearchParams();

    const { pathname } = useLocation();

    return (
        <DataTable data={data} columns={columns}
            className={className}
            extraHeaderContent={extraHeaderContent}
            enableColumnDisplayOptions={allowHideColumns}
            defaultPageSize={Number.parseInt(searchParams.get('size') || '10')}
            manualPagination={true}
            onPaginationChange={(newPage) => {
                const newSearchParams = new URLSearchParams(searchParams);
                newSearchParams.set(pageParamName, newPage.toString());
                setSearchParams(newSearchParams);
            }}
            onPageSizeChange={(newPageSize) => {
                const newSearchParams = new URLSearchParams(searchParams);
                newSearchParams.set(sizeParamName, newPageSize.toString());
                setSearchParams(newSearchParams);
            }}
            totalCount={totalCount}
            totalPages={totalPages}
            pageParamName={pageParamName}
            sizeParamName={sizeParamName}
            emptyContent={<div className='flex flex-col gap-5 justify-center items-center'>
                <SearchX className="size-24" />
                <p className="text-center text-xl">{emptyText}</p>
                {enableRefresh && <Link className={`${buttonVariants({ variant: "theme" })} size-52 font-bold uppercase 
                                  flex flex-row gap-3`}
                    to={pathname ? `${pathname}` : '/'}
                    replace={true}
                    reloadDocument={true}>
                    <FilterX /> Reset filter
                </Link>}
            </div>}
        />
    );
};