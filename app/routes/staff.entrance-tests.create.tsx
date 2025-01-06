import { Form } from '@remix-run/react'
import React from 'react'
import { Input } from '~/components/ui/input'

type Props = {}

export default function CreateEntranceTestPage({ }: Props) {
    return (
        <article className='px-10'>
            <h1 className="text-xl font-extrabold">Tạo mới đợt thi đầu vào</h1>
            <p className="text-muted-foreground">Thông tin cơ bản</p>

            <Form>
                <Input name='name' placeholder='Nhập tên đợt thi...' />
                
            </Form>
        </article>
    )
}