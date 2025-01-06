import React, { Dispatch, SetStateAction, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'
import { Checkbox } from '../ui/checkbox'
import { RadioGroup, RadioGroupItem } from '../ui/radio-group'

type Props = {
    isOpen: boolean,
    setIsOpen: Dispatch<SetStateAction<boolean>>,
}

export default function EnrollDialog({ isOpen, setIsOpen }: Props) {
    const [isAgreed, setIsAgreee] = useState(false)
    const [paymentMethod, setPaymentMethod] = useState("")

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Đăng ký nhập học</DialogTitle>
                    <DialogDescription>
                        Hãy hoàn tất hồ sơ sau để tiến hành đăng ký.
                    </DialogDescription>
                </DialogHeader>
                <div className='flex gap-4 items-center'>
                    <Label htmlFor="email" className="w-32">
                        Email
                    </Label>
                    <Input id="email" className="col-span-3" placeholder='abc@gmail.com' />
                </div>
                <div className='flex gap-4 items-center'>
                    <Label htmlFor="sdt" className="w-32" >
                        SĐT
                    </Label>
                    <Input id="sdt" className="col-span-3" placeholder='0987654321' />
                </div>
                <div className='flex gap-4 items-start'>
                    <Label htmlFor="desc" className="w-32">
                        Mô tả trình độ
                    </Label>
                    <Textarea id="desc" className="col-span-3 resize-none" placeholder='Mô tả ngắn về trình độ piano hiện tại của bạn...'
                        rows={3} />
                </div>
                <div className='flex gap-4 items-start'>
                    <Checkbox checked={isAgreed} onCheckedChange={(e) => setIsAgreee(!!e)}/>
                    <span className='text-sm'>Tôi đồng ý với các <a className='underline font-bold' href='/'>quy định</a>   của trung tâm Photon Piano</span>
                </div>
                <div className='text-gray-600 italic text-sm'>
                    Để tránh trường hợp spam yêu cầu đăng ký, trung tâm Photon Piano sẽ thu lệ phí <span className='font-bold'>100.000đ</span> cho mỗi đơn đăng ký thi đầu vào
                </div>
                <RadioGroup defaultValue="comfortable" onValueChange={(e) => setPaymentMethod(e)}>
                    <div className="flex items-center space-x-2 p-4 border rounded-lg">
                        <RadioGroupItem value="vnpay" id="r1" />
                        <Label htmlFor="r1">Thanh toán qua Vnpay</Label>
                    </div>
                </RadioGroup>
                <DialogFooter>
                    <div className='w-full'>
                        <Button disabled={!isAgreed || paymentMethod === ""} 
                            type="submit" className='w-full'>Thanh toán lệ phí</Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}