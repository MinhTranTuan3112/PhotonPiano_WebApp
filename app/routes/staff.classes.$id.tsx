import { data, LoaderFunctionArgs, redirect } from '@remix-run/node';
import { Await, useLoaderData } from '@remix-run/react';
import React, { Suspense } from 'react'
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Skeleton } from '~/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { fetchClassDetail } from '~/lib/services/class';
import { ClassDetail } from '~/lib/types/class/class-detail';
import { requireAuth } from '~/lib/utils/auth';

type Props = {}
export async function loader({ params, request }: LoaderFunctionArgs) {

  const { idToken, role } = await requireAuth(request);

  if (role !== 4) {
    return redirect('/');
  }
  if (!params.id) {
    return redirect('/staff/classes')
  }

  const promise = fetchClassDetail(params.id).then((response) => {

    const classDetail: ClassDetail = response.data;

    return {
      classDetail,
    }
  });

  return {
    promise,
  }
}

export default function StaffClassDetailPage({ }: Props) {

  const { promise } = useLoaderData<typeof loader>()

  return (
    <div className='px-8'>
      <h3 className="text-lg font-medium">Thông tin chi tiết lớp</h3>
      <p className="text-sm text-muted-foreground">
        Quản lý thông tin về học sinh, thời khóa biểu và bảng điểm của lớp
      </p>
      <Suspense fallback={<LoadingSkeleton />}>
        <Await resolve={promise}>
          {
            (data) => (
              <div className='w-full mt-8'>
                <Tabs defaultValue="account">
                  <TabsList className="w-full flex flex-wrap">
                    <TabsTrigger value="general" className='flex-grow'>Thông tin chung</TabsTrigger>
                    <TabsTrigger value="students" className='flex-grow'>Danh sách học viên</TabsTrigger>
                    <TabsTrigger value="scores" className='flex-grow'>Bảng điểm học viên</TabsTrigger>
                    <TabsTrigger value="timeTable" className='flex-grow'  >Thời khóa biểu</TabsTrigger>
                  </TabsList>
                  <TabsContent value="general">
                    <Card>
                      <CardHeader>
                        <CardTitle>Thông tin chung</CardTitle>
                        <CardDescription>
                          Thông tin cơ bản của lớp
                        </CardDescription>
                      </CardHeader>
                      <CardContent>

                      </CardContent>
                    </Card>
                  </TabsContent>
                  <TabsContent value="students">
                    <Card>
                      <CardHeader>
                        <CardTitle>Danh sách học viên</CardTitle>
                        <CardDescription>
                          Danh sách này hiển thị chủ yếu các thông tin liên lạc của học viên
                        </CardDescription>
                      </CardHeader>
                      <CardContent>

                      </CardContent>
                    </Card>
                  </TabsContent>
                  <TabsContent value="scores">
                    <Card>
                      <CardHeader>
                        <CardTitle>Bảng điểm</CardTitle>
                        <CardDescription>
                          Danh sách này hiển thị các cột điểm của từng học viên trong lớp
                        </CardDescription>
                      </CardHeader>
                      <CardContent>

                      </CardContent>
                    </Card>
                  </TabsContent>
                  <TabsContent value="timeTable">
                    <Card>
                      <CardHeader>
                        <CardTitle>Thời khóa biểu</CardTitle>
                        <CardDescription>
                          Quản lý lịch trình của lớp
                        </CardDescription>
                      </CardHeader>
                      <CardContent>

                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            )
          }
        </Await>

      </Suspense>

    </div>
  )
}


function LoadingSkeleton() {
  return <div className="flex justify-center items-center my-4">
    <Skeleton className="w-full h-[500px] rounded-md" />
  </div>
}