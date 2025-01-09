import React from 'react'
import { EntranceTest } from '~/lib/types/entrance-test/entrance-test'
import { Button } from '../ui/button'
import { SHIFT_TIME } from '~/lib/utils/constants'

type Props = {
  entranceTest: EntranceTest
}

export default function ExamCard({ entranceTest }: Props) {
  return (
    <div className='shadow-md p-4 rouded-lg bg-white hover:bg-slate-100 rounded-lg'>
      <div className='flex gap-2'>
        <div className='w-full'>
          <div>{entranceTest.name}</div>
          <div className='grid grid-cols-1 lg:grid-cols-2 mt-2'>
            <div className='text-sm'>
              <span className='mr-2 font-bold'>Địa điểm :</span>
              <span>{entranceTest.roomName}</span>
            </div>
            <div className='text-sm'>
              <span className='mr-2 font-bold'>Giảng viên :</span>
              <span>{entranceTest.instructorName}</span>
            </div>
            <div className='text-sm'>
              <span className='mr-2 font-bold'>Ca thi :</span>
              <span>{entranceTest.shift} ({SHIFT_TIME[entranceTest.shift - 1]})</span>
            </div>
            <div className='text-sm'>
              <span className='mr-2 font-bold'>Ngày thi :</span>
              <span>{entranceTest.date}</span>
            </div>
            <div className='text-sm lg:col-span-2'>
              <span className='mr-2 font-bold'>Số lượng đăng ký :</span>
              <span>{entranceTest.registerStudents} / {entranceTest.roomCapacity ?? 20}
                {
                  entranceTest.registerStudents >= (entranceTest.roomCapacity ?? 20) && (
                    <span className='font-bold text-red-500 ml-4'>(Đã hết chỗ)</span>
                  )
                }
              </span>
            </div> 
          </div>

        </div>
        <div><Button disabled={entranceTest.registerStudents >= (entranceTest.roomCapacity ?? 20)}>Đổi</Button></div>
      </div>

    </div>
  )
}