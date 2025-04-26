import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { useFetcher } from '@remix-run/react'
import { ReactNode, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { action } from '~/routes/auth'
import { toastWarning } from '~/lib/utils/toast-utils'

type Props = {
    trigger?: ReactNode // Allowing optional custom trigger
}

export default function ForgotPasswordDialog({ trigger }: Props) {

    const fetcher = useFetcher<typeof action>();

    useEffect(() => {
        if (fetcher.data?.success === true) {
            toast.success('Send password reset email successfully!', {
                description: 'Vui lòng kiểm tra email của bạn để đổi mật khẩu',
                position: 'top-center'
            });
            return;
        } 
        if (fetcher.data?.success === false && fetcher.data?.error) {
            toastWarning(fetcher.data?.error, {
                position: 'top-center',
                duration: 5000
            });
            return;
        }
    }, [fetcher.data]);

    const isSubmitting = fetcher.state === 'submitting';

    return (
        <Dialog>
            <DialogTrigger asChild>
                {trigger ? (
                    trigger
                ) : (
                    <div className="my-3 text-right">
                        <Button type='button' className='font-bold text-base text-black/70' variant={'linkHover2'}>
                            Forgot password?
                        </Button>
                    </div>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Forgot password?</DialogTitle>
                    <DialogDescription>
                        Enter your email. We will send you an email with instructions to reset your password if the email exists in the 
                        <strong>PhotonPiano</strong> system.
                    </DialogDescription>
                </DialogHeader>
                <fetcher.Form method='POST' id='forgot_passord_form' action='/auth'>
                    <input type="hidden" name='authAction' value={'send_ForgotPassword_Email'} />
                    <div className="py-4">
                        <Input type='email' name='email' placeholder='Enter your email...'
                            required />
                    </div>
                    <DialogFooter>
                        <Button type="submit" variant={'theme'}
                            disabled={isSubmitting}
                            form='forgot_passord_form'>
                            {isSubmitting && (<Loader2 className='animate-spin' />)}
                            Send
                        </Button>
                    </DialogFooter>
                </fetcher.Form>
            </DialogContent>
        </Dialog>
    );
}
