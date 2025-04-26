import { ExternalToast, toast } from "sonner";

type customTitleT = (() => React.ReactNode) | React.ReactNode;

export function toastWarning(message: customTitleT | React.ReactNode, data?: ExternalToast) {
    return toast.warning(message, {
        ...data,
        style: {
            color: '#f97316',
            background: '#ffedd5'
        }
    })
}