import { ReactNode, useEffect } from 'react'
import { ColumnDef, Row } from "@tanstack/react-table";
import { Application, ApplicationStatus } from "~/lib/types/application/application";
import { Badge } from "../ui/badge";
import { APPLICATION_STATUS, APPLICATION_TYPE } from "~/lib/utils/constants";
import { formatRFC3339ToDisplayableDate } from "~/lib/utils/datetime";
import { CircleX, Clock, Download, Eye, FileCheck2, MoreHorizontal, Paperclip } from 'lucide-react'
import { Form, Link, useFetcher, useRouteLoaderData } from "@remix-run/react";
import { Button, buttonVariants } from "../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { useState } from "react";
import { action } from "~/routes/staff.applications";
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { z } from 'zod';
import { useRemixForm } from 'remix-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller } from 'react-hook-form';
import RichTextEditor from '../text-editor';
import { loader } from '~/root';
import { Role } from '~/lib/types/account/account';
import { toastWarning } from '~/lib/utils/toast-utils';

const getStatusStyle = (status: ApplicationStatus) => {
    switch (status) {
        case ApplicationStatus.Pending: return "text-gray-600 bg-gray-500/20 font-semibold";
        case ApplicationStatus.Approved: return "text-green-600 bg-green-500/20 font-semibold";
        case ApplicationStatus.Rejected: return "text-red-600 bg-red-500/20 font-semibold";
        case ApplicationStatus.Cancelled: return "text-red-500 bg-red-400/20 font-semibold";
        default: return "text-black font-semibold";
    }
};

export function ApplicationStatusBadge({ status }: {
    status: ApplicationStatus
}) {
    return <Badge variant={'outline'} className={`uppercase ${getStatusStyle(status)}`}>
        {APPLICATION_STATUS[status]}
    </Badge>
}

export const columns: ColumnDef<Application>[] = [
    {
        accessorKey: 'Type',
        header: 'Type',
        cell: ({ row }) => {
            return <div className="font-bold">
                {APPLICATION_TYPE[row.original.type]}
            </div>
        }
    },
    {
        accessorKey: 'Reason',
        header: 'Reason',
        cell: ({ row }) => {
            return <div>{row.original.reason}</div>
        }
    },
    {
        accessorKey: 'Created Date',
        header: (header) => {
            return <div className="flex flex-row items-center gap-2">
                <Clock />
                Created Date
            </div>
        },
        cell: ({ row }) => {
            return <div>{formatRFC3339ToDisplayableDate(row.original.createdAt, false)} by {row.original.createdByEmail}</div>
        }
    },
    {
        accessorKey: 'File',
        header: () => {
            return <div className="flex flex-row items-center">
                <Paperclip />
                <div className="ml-2">File</div>
            </div>
        },
        cell: ({ row }) => {
            return <div className="text-center">
                {row.original.fileUrl ? (
                    <Link className={` ${buttonVariants({ variant: "link" })}`} to={row.original.fileUrl}
                        target="_blank" rel="noopener noreferrer">
                        <Download />
                    </Link>
                ) : (
                    <div className="">&#40;None&#41;</div>
                )}
            </div>
        }
    },
    {
        accessorKey: 'Status',
        header: 'Status',
        cell: ({ row }) => {
            return <ApplicationStatusBadge status={row.original.status} />
        }
    },
    {
        accessorKey: 'Last update',
        header: 'Last update',
        cell: ({ row }) => {
            return <div>{row.original.updatedAt ? `${formatRFC3339ToDisplayableDate(row.original.updatedAt, false)} by ${row.original.approvedByEmail}` : '(None)'}</div>
        }
    },
    {
        id: 'Actions',
        accessorKey: 'Actions',
        header: 'Actions',
        cell: ({ row }) => {
            return <ActionDropdown row={row} />
        }
    }
]


function ActionDropdown({ row }: {
    row: Row<Application>
}) {

    const authData = useRouteLoaderData<typeof loader>("root");

    const role = authData.role ? parseInt(authData.role) : 0;

    const [dialogProps, setDialogProps] = useState<Omit<DialogProps, 'setIsOpen'>>({
        title: '',
        description: '',
        id: row.original.id,
        isOpen: false,
        status: row.original.status,
        note: row.original.staffConfirmNote,
        additionalData: row.original.additionalData,
        role
    });

    return <>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Actions</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer" onClick={() => {
                    setDialogProps({
                        ...dialogProps,
                        isDetails: true,
                        status: ApplicationStatus.Rejected,
                        isOpen: true,
                        title: 'Application details',
                        description: `Application details`,
                    })
                }}>
                    <Eye />
                    View
                </DropdownMenuItem>

                {/* {role === Role.Staff && <>
                    <DropdownMenuItem className="cursor-pointer" onClick={() => {
                        setDialogProps({
                            ...dialogProps,
                            isDetails: false,
                            status: ApplicationStatus.Approved,
                            isOpen: true,
                            title: 'Confirm action',
                            description: 'Approve this application?',
                        })
                    }}>
                        <FileCheck2 />
                        Approve
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer" onClick={() => {
                        setDialogProps({
                            ...dialogProps,
                            isDetails: false,
                            status: ApplicationStatus.Rejected,
                            isOpen: true,
                            title: 'Confirm action',
                            description: 'Reject this application?',
                        })
                    }}>
                        <CircleX />
                        Reject
                    </DropdownMenuItem>
                </>} */}

            </DropdownMenuContent>
        </DropdownMenu>
        <ActionDialog {...dialogProps} setIsOpen={(isOpen) => {
            setDialogProps({ ...dialogProps, isOpen })
        }} />
    </>
}

const updateApplicationSchema = z.object({
    id: z.string(),
    status: z.number(),
    note: z.string().optional()
});

type ApplicationStatusFormData = z.infer<typeof updateApplicationSchema>;

function formatCurrency(amount: number) {
  return amount.toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
  });
}

function renderFieldValue(field: string, value: any): ReactNode {
  switch (field.toLowerCase()) {
    case "getamount":
    case "amount":
      return (
        <span className="text-green-600 font-bold">
          {formatCurrency(Number(value))}
        </span>
      );
    case "bankaccountnumber":
      return <span className="font-mono">{value}</span>;
    case "bankname":
      return (
        <span>
          🏦 <span className="font-semibold">{value}</span>
        </span>
      );
    case "bankaccountname":
    case "accountname":
      return (
        <span>
          👤 <span>{value}</span>
        </span>
      );
    default:
      return <span>{String(value)}</span>;
  }
}

export function AdditionalDataList({
  additionalData,
}: {
  additionalData: string;
}): ReactNode {
  let parsedData: Record<string, any> = {};

  try {
    parsedData = JSON.parse(additionalData);
  } catch (error) {
    console.error("Failed to parse additionalData:", error);
    return (
      <div className="text-red-500 p-4 bg-red-100 rounded">
        Invalid additional data
      </div>
    );
  }

  return (
    <ul className="bg-white shadow-md rounded-lg p-4 space-y-3 text-gray-800">
      {Object.entries(parsedData).map(([key, value]) => (
        <li key={key} className="flex gap-2">
          <span className="font-semibold capitalize">{key}:</span>
          {renderFieldValue(key, value)}
        </li>
      ))}
    </ul>
  );
}

type DialogProps = {
    isDetails?: boolean;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    title: string;
    description: string;
    role: Role;
    additionalData?: string;
} & ApplicationStatusFormData;

function ActionDialog({
    isDetails = false,
    isOpen,
    setIsOpen,
    title,
    description,
    id,
    status: defaultStatus,
    note: defaultNote,
    role,
    additionalData
}: DialogProps) {

    const fetcher = useFetcher<typeof action>();

    const isSubmitting = fetcher.state === 'submitting';

    const {
        handleSubmit,
        formState: { errors },
        register,
        control,
        getValues: getFormValues,
        setValue: setFormValue,
        reset
    } = useRemixForm<ApplicationStatusFormData>({
        mode: 'onSubmit',
        resolver: zodResolver(updateApplicationSchema),
        defaultValues: {
            status: defaultStatus,
            id
        },
        fetcher
    });

    const { status: currentStatus } = getFormValues();

    useEffect(() => {

        if (fetcher.data?.success === true) {
            toast.success('Success!');
            setIsOpen(false);
            reset();
            return;
        }

        if (fetcher.data?.success === false && fetcher.data.error) {
            toastWarning(fetcher.data.error, {
                duration: 5000
            });
            return;
        }


        return () => {

        }

    }, [fetcher.data]);

    return <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
                <DialogDescription>
                    {description}
                </DialogDescription>
            </DialogHeader>
            <Form method='POST' onSubmit={handleSubmit} action='/staff/applications' navigate={false}>
                {
                    additionalData && (
                        <AdditionalDataList additionalData={additionalData} />                    
                    )
                }
                <Controller
                    name='note'
                    control={control}
                    render={({ field: { value, onChange } }) => (
                        <RichTextEditor value={value || defaultNote || ''} onChange={onChange} placeholder='Enter note...' />
                    )}
                />
                {errors.note && <div className="text-red-500">{errors.note.message}</div>}
                <DialogFooter className='my-2'>
                    {!isDetails ? <>
                        {role === Role.Staff ? <Button type="submit"
                            disabled={isSubmitting}
                            isLoading={isSubmitting}>{defaultStatus === ApplicationStatus.Approved ? 'Approve' : 'Reject'}
                        </Button> : <Button type='button' variant="ghost" onClick={() => setIsOpen(false)}
                            disabled={isSubmitting}>Cancel</Button>}
                    </> : role === Role.Staff && <>
                        <Button type="button"
                            disabled={isSubmitting}
                            isLoading={isSubmitting && currentStatus === ApplicationStatus.Approved}
                            onClick={() => {
                                setFormValue('status', ApplicationStatus.Approved);
                                handleSubmit();
                            }}>
                            Approve
                        </Button>
                        <Button type="button"
                            disabled={isSubmitting}
                            isLoading={isSubmitting && currentStatus === ApplicationStatus.Rejected}
                            variant={'destructive'}
                            onClick={() => {
                                setFormValue('status', ApplicationStatus.Rejected);
                                handleSubmit();
                            }}>
                            Reject
                        </Button>
                    </>}
                </DialogFooter>
            </Form>
        </DialogContent>
    </Dialog>
}