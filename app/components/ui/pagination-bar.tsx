import { useLocation } from '@remix-run/react';
import { useCallback } from 'react';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from './pagination';

type Props = {
    currentPage?: number;
    totalPages?: number;
    maxPagesDisplayed?: number;
}

function getPaginationLink({ pathname, search, page = 1 }: {
    pathname: string;
    search?: string;
    page?: number
}) {

    const baseUrl = `${pathname}${search || '?'}`;

    return search?.includes('page=') ? baseUrl.replace(/page=\d+/, `page=${page}`) : `${baseUrl}&page=${page}`;
}

export default function PaginationBar({ currentPage = 1, totalPages = 1, maxPagesDisplayed = 5 }: Props) {

    const { pathname, search } = useLocation();

    const getPaginationItems = useCallback(() => {
        const pages = [];
        const halfMaxPages = Math.floor(maxPagesDisplayed / 2);

        let startPage = Math.max(currentPage - halfMaxPages, 1);
        let endPage = Math.min(currentPage + halfMaxPages, totalPages);

        if (currentPage - halfMaxPages < 1) {
            endPage = Math.min(maxPagesDisplayed, totalPages);
        }

        if (currentPage + halfMaxPages > totalPages) {
            startPage = Math.max(totalPages - maxPagesDisplayed + 1, 1);
        }

        if (startPage > 1) {
            pages.push(
                <PaginationItem key={1}>
                    <PaginationLink href={getPaginationLink({
                        pathname,
                        search,
                        page: 1
                    })}>1</PaginationLink>
                </PaginationItem>
            );
            if (startPage > 2) {
                pages.push(<PaginationEllipsis key="start-ellipsis" />);
            }
        }

        for (let pageCnt = startPage; pageCnt <= endPage; pageCnt++) {
            pages.push(
                <PaginationItem key={pageCnt}>
                    <PaginationLink href={getPaginationLink({
                        pathname,
                        search,
                        page: pageCnt
                    })} isActive={pageCnt === currentPage}>
                        {pageCnt}
                    </PaginationLink>
                </PaginationItem>
            );
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                pages.push(<PaginationEllipsis key="end-ellipsis" />);
            }
            pages.push(
                <PaginationItem key={totalPages}>
                    <PaginationLink href={getPaginationLink({
                        pathname,
                        search,
                        page: totalPages
                    })}>{totalPages}</PaginationLink>
                </PaginationItem>
            );
        }

        return pages;

    }, [currentPage, totalPages, maxPagesDisplayed]);

    return (
        <Pagination>
            <PaginationContent>
                {currentPage > 1 && (
                    <PaginationItem>
                        <PaginationPrevious href={getPaginationLink({
                            pathname,
                            page: currentPage - 1,
                        })} />
                    </PaginationItem>
                )}
                {getPaginationItems()}
                {currentPage < totalPages && (
                    <PaginationItem>
                        <PaginationNext href={getPaginationLink({
                            pathname,
                            page: currentPage + 1,
                        })} />
                    </PaginationItem>
                )}
            </PaginationContent>
        </Pagination>
    );
}