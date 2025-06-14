import { FetcherWithComponents } from '@remix-run/react'
import { CheckCircle, Loader2, X, XCircle } from 'lucide-react'
import { Result } from 'postcss'
import React, { useEffect, useState } from 'react'
import { boolean } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { ActionResult } from '~/lib/types/action-result'

type Props = {
    loadingMessage?: string,
    successMessage?: string
    fetcher: FetcherWithComponents<ActionResult>,
    preventEscape?: boolean,
    action?: () => void
}

export default function useLoadingDialog({ loadingMessage = "Please Wait...", fetcher, successMessage = "Successfully!", action, preventEscape = false }: Props) {
    const [result, setResult] = useState<boolean | null>(null)
    const [message, setMessage] = useState("")
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (fetcher.state === "submitting") {
            setIsOpen(true); // Open dialog on request start
            setResult(null);
            setMessage(loadingMessage);
        }
    }, [fetcher.state, fetcher.data])

    useEffect(() => {
        if (fetcher.data?.success === true) {
            setResult(true)
            setMessage(successMessage)
            return;
        }

        if (fetcher.data?.success === false) {
            setResult(false)
            if (fetcher.data.error) {
                setMessage(fetcher.data.error)
            } else {
                setMessage("An unknown error occured")
            }
            return;
        }

        return () => { }
    }, [fetcher.data]);

    const onOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (!open) {
            if (result && action) {
                action()
            }
        }
    }

    const loadingDialog =
        <Dialog onOpenChange={onOpenChange} open={isOpen}>
            <DialogTitle />
            <DialogContent className='' preventClosing={result === null}>
                {result === null ? (
                    <div className="text-center">
                        <p className="font-bold text-xl">{loadingMessage}</p>
                        <Loader2 size={100} className="animate-spin mx-auto mt-4" />
                    </div>
                ) : result ? (
                    <div className="text-center">
                        <p className="font-bold text-xl text-green-600">{successMessage}</p>
                        <CheckCircle size={100} className="text-green-600 mx-auto mt-4" />
                        {/* <p>{message}</p> */}
                    </div>
                ) : (
                    <div className="text-center">
                        <p className="font-bold text-xl text-red-600">FAILURE</p>
                        <XCircle size={100} className="text-red-600 mx-auto mt-4" />
                        <p>{message}</p>
                    </div>
                )}
            </DialogContent>
        </Dialog>

    return (
        { loadingDialog }
    )
}