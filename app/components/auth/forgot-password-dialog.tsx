import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { useFetcher } from '@remix-run/react'
import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { action } from '~/routes/auth'

type Props = {}

export default function ForgotPasswordDialog({ }: Props) {

    const fetcher = useFetcher<typeof action>();

    useEffect(() => {

        if (fetcher.data?.success === true) {
            toast.success('Gửi yêu cầu đổi mật khẩu thành công!', {
                description: 'Vui lòng kiểm tra email của bạn để đổi mật khẩu',
                position: 'top-center'
            });
            return;
        } 
        if (fetcher.data?.success === false && fetcher.data?.error) {
            toast.error(fetcher.data?.error, {
                position: 'top-center'
            });
            return;
        }

        return () => {

        }

    }, [fetcher.data]);

    const isSubmitting = fetcher.state === 'submitting';

    return (
        <Dialog>
            <DialogTrigger asChild>
                <div className="my-3 text-right">
                    <Button type='button' className='font-bold text-base text-black/70' variant={'linkHover2'}>
                        Quên mật khẩu?
                    </Button>
                </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Quên mật khẩu?</DialogTitle>
                    <DialogDescription>
                        Nhập email của bạn. Chúng tôi sẽ gửi cho bạn một email với hướng dẫn để đặt lại mật khẩu nếu email
                        tồn tại trong hệ thống <strong>PhotonPiano</strong>.
                    </DialogDescription>
                </DialogHeader>
                <fetcher.Form method='POST' id='forgot_passord_form' action='/auth'>
                    <input type="hidden" name='authAction' value={'send_ForgotPassword_Email'} />
                    <div className="py-4">
                        <Input type='email' name='email' placeholder='Nhập email của bạn...'
                            required />
                    </div>
                    <DialogFooter>
                        <Button type="submit" variant={'theme'}
                            disabled={isSubmitting}
                            form='forgot_passord_form'>
                            {isSubmitting && (<Loader2 className='animate-spin' />)}
                            Gửi
                        </Button>
                    </DialogFooter>
                </fetcher.Form>
            </DialogContent>
        </Dialog>
    );
}