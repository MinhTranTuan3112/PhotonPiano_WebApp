import React, { Dispatch, SetStateAction, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'
import { Checkbox } from '../ui/checkbox'
import { RadioGroup, RadioGroupItem } from '../ui/radio-group'
import { Form } from '@remix-run/react'
import StepperBar from '../ui/stepper'

type Props = {
    isOpen: boolean,
    setIsOpen: Dispatch<SetStateAction<boolean>>,
    entranceTestId: string
}

export default function EnrollDialog({ isOpen, setIsOpen, entranceTestId }: Props) {

    const [currentStep, setCurrentStep] = useState(0);

    const steps = ["Xác nhận thông tin", "Thanh toán lệ phí"];

    const [isAgreed, setIsAgreee] = useState(false)
    const [paymentMethod, setPaymentMethod] = useState("")


    return (
        <Form method='POST' action={`/entrance-tests/${entranceTestId}`} navigate={false}>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Đăng ký nhập học</DialogTitle>
                        <DialogDescription>
                            Hãy xác nhận các thông tin sau để tiến hành đăng ký.
                        </DialogDescription>
                    </DialogHeader>
                    <StepperBar steps={steps} currentStep={currentStep} />
                    <div className={`transition-opacity duration-300 ease-in-out ${currentStep === 0 ? 'opacity-100' : 'opacity-0'}`}>
                        {
                            currentStep === 0 && (
                                <div className='mt-4 flex flex-col gap-4'>
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
                                        <Checkbox checked={isAgreed} onCheckedChange={(e) => setIsAgreee(!!e)} />
                                        <span className='text-sm'>Tôi đồng ý với các <a className='underline font-bold' href='/'>quy định</a>   của trung tâm Photon Piano</span>
                                    </div>
                                    <div className='w-full'>
                                        <Button disabled={!isAgreed} onClick={() => setCurrentStep(1)}
                                            type="submit" className='w-full'>Tiếp tục</Button>
                                    </div>
                                </div>
                            )
                        }
                    </div>
                    <div className={`transition-opacity duration-300 ease-in-out ${currentStep === 1 ? 'opacity-100' : 'opacity-0'}`}>
                        {
                            currentStep === 1 && (
                                <div>
                                    <div className='text-gray-600 italic text-sm mb-4'>
                                        Để tránh trường hợp spam yêu cầu đăng ký, trung tâm Photon Piano sẽ thu lệ phí <span className='font-bold'>100.000đ</span> cho mỗi đơn đăng ký thi đầu vào
                                    </div>
                                    <RadioGroup value={paymentMethod} onValueChange={(e) => setPaymentMethod(e)}>
                                        <div className="flex items-center space-x-2 p-4 border rounded-lg">
                                            <RadioGroupItem value="vnpay" id="r1" />
                                            <div className='flex place-content-between w-full items-center'>
                                                <Label htmlFor="r1">Thanh toán qua Vnpay</Label>
                                                <img src='/images/vnpay.webp' className='w-8' />
                                            </div>
                                        </div>
                                    </RadioGroup>
                                    <div className='flex justify-end my-4 gap-4 items-end'>
                                        <div>Tổng cộng : </div>
                                        <div className='font-extrabold text-xl'>100.000 đ </div>
                                    </div>
                                    <div className='w-full flex gap-4 '>
                                        <Button variant={'outline'} onClick={() => setCurrentStep(0)}
                                            type="submit" className='w-full'>Quay lại</Button>
                                        <Button disabled={paymentMethod === ""}
                                            type="submit" className='w-full'>Thanh toán lệ phí</Button>
                                    </div>

                                </div>
                            )
                        }
                    </div>
                </DialogContent>
            </Dialog>
        </Form>
    )
}