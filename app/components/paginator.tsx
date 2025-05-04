import React from 'react'
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from './ui/pagination'

type Props = {
    page: number,
    totalPage: number,
    maxPageShown?: number,
    onPageChanged?: (page: number) => void,
    className?: string
}

export default function Paginator({
    page,
    totalPage,
    maxPageShown = 5,
    onPageChanged,
    className,
}: Props) {
    const startPage = Math.max(1, page - Math.floor(maxPageShown / 2));
    const endPage = Math.min(totalPage, startPage + maxPageShown - 1);
    const adjustedStartPage = Math.max(1, endPage - maxPageShown + 1);

    const handlePrevious = () => {
        if (page > 1) onPageChanged?.(page - 1);
    };

    const handleNext = () => {
        if (page < totalPage) onPageChanged?.(page + 1);
    };

    return (
        <div className={`flex justify-center mt-4 ${className}`}>
            <Pagination>
                <PaginationContent className='flex flex-wrap'>
                    {/* Previous Button */}
                    <PaginationItem>
                        <PaginationPrevious
                            isActive={page !== 1}
                            onClick={handlePrevious}
                            className='cursor-pointer'
                        />
                    </PaginationItem>
                    
                    {/* Ellipsis at the start */}
                    {adjustedStartPage > 1 && (
                        <PaginationItem>
                            <PaginationEllipsis />
                        </PaginationItem>
                    )}

                    {/* Page Numbers */}
                    {Array.from({ length: endPage - adjustedStartPage + 1 }, (_, i) => {
                        const pageNumber = adjustedStartPage + i;
                        return (
                            <PaginationItem key={pageNumber}>
                                <PaginationLink
                                    isActive={page === pageNumber}
                                    onClick={() => onPageChanged?.(pageNumber)}
                                >
                                    {pageNumber}
                                </PaginationLink>
                            </PaginationItem>
                        );
                    })}

                    {/* Ellipsis if more pages exist */}
                    {endPage < totalPage && (
                        <PaginationItem>
                            <PaginationEllipsis />
                        </PaginationItem>
                    )}

                    {/* Next Button */}
                    <PaginationItem>
                        <PaginationNext
                            isActive={page !== totalPage}
                            onClick={handleNext}
                            className='cursor-pointer'
                        />
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
        </div>
    );
}