import { LoaderFunctionArgs, redirect } from '@remix-run/node'
import { Await, useAsyncValue, useLoaderData } from '@remix-run/react'
import { DollarSign, Music, Piano, UserRound, Users } from 'lucide-react'
import { Suspense } from 'react'
import LevelChart from '~/components/admin/dashboard/level-chart'
import RevenueChart from '~/components/admin/dashboard/revenue-chart'
import { Badge } from '~/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Separator } from '~/components/ui/separator'
import { Skeleton } from '~/components/ui/skeleton'
import { fetchOverviewStatistics } from '~/lib/services/statistics'
import { Role } from '~/lib/types/account/account'
import { Stat } from '~/lib/types/statistics/stat'
import { requireAuth } from '~/lib/utils/auth'
import { getErrorDetailsInfo, isRedirectError } from '~/lib/utils/error'
import { formatPrice } from '~/lib/utils/price'

type Props = {}

export async function loader({ request }: LoaderFunctionArgs) {

    try {

        const { idToken, role } = await requireAuth(request);

        if (role !== Role.Administrator) {
            return redirect('/');
        }

        const { searchParams } = new URL(request.url);

        const query = {
            idToken,
            month: searchParams.get('month') ? parseInt(searchParams.get('month') || '1') : undefined,
            year: searchParams.get('year') ? parseInt(searchParams.get('year') || '2025') : undefined,
        };

        console.log({ month: query.month, year: query.year });

        const overviewStatsPromise = fetchOverviewStatistics({ ...query }).then((response) => {

            const statsPromise = response.data;

            return {
                statsPromise
            }
        });

        return {
            overviewStatsPromise, query: {
                ...query, idToken: undefined
            },
            idToken
        };

    } catch (error) {
        console.error({ error });

        if (isRedirectError(error)) {
            throw error;
        }

        const { message, status } = getErrorDetailsInfo(error);

        throw new Response(message, { status });
    }
}

export default function DashboardPage({ }: Props) {

    const { overviewStatsPromise, query, idToken } = useLoaderData<typeof loader>();

    return (
        <article className='px-10'>
            <h1 className="text-3xl font-bold flex flex-row gap-2 items-center">
                <Piano /> Dashboard
            </h1>
            <Separator className='my-4' />

            <Suspense fallback={<OverviewLoadingSkeleton />} key={JSON.stringify(query)}>
                <Await resolve={overviewStatsPromise}>
                    {({ statsPromise }) => (
                        <Await resolve={statsPromise}>
                            <OverviewSection />
                        </Await>
                    )}
                </Await>
            </Suspense>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-8">
                <TuitionRevenueSection idToken={idToken} />
                <LevelStatistics idToken={idToken} />
            </div>
        </article>
    )
}

function OverviewSection() {

    const stats = useAsyncValue() as Stat[];

    const totalClassStat = stats?.find(s => s.name === "TotalClasses");
    const totalLearnerStat = stats?.find(s => s.name === "TotalLearners");
    const totalTeacherStat = stats?.find(s => s.name === "TotalTeachers");
    const totalRevenueStat = stats?.find(s => s.name === "TotalRevenue");

    return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-sky-600">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
                <Music className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{totalClassStat?.value}</div>
                {totalClassStat?.valueCompareToLastMonth &&
                    <StatComparisonBadge value={totalClassStat?.valueCompareToLastMonth} />
                }
            </CardContent>
        </Card>
        <Card className="border-l-4 border-l-sky-600">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Learners</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{totalLearnerStat?.value}</div>
                {totalLearnerStat?.valueCompareToLastMonth &&
                    <StatComparisonBadge value={totalLearnerStat?.valueCompareToLastMonth} />
                }

            </CardContent>
        </Card>
        <Card className="border-l-4 border-l-sky-600">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
                <UserRound className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{totalTeacherStat?.value}</div>
                {totalTeacherStat?.valueCompareToLastMonth &&
                    <StatComparisonBadge value={totalTeacherStat?.valueCompareToLastMonth} />
                }
            </CardContent>
        </Card>
        <Card className="border-l-4 border-l-sky-600">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{formatPrice(totalRevenueStat?.value || 0)} đ</div>
                {totalRevenueStat?.valueCompareToLastMonth &&
                    <StatComparisonBadge value={(totalRevenueStat?.valueCompareToLastMonth / totalRevenueStat.value) * 100} unit='%' />
                }
            </CardContent>
        </Card>
    </div>
}

function TuitionRevenueSection({
    idToken
}: {
    idToken: string,
}) {
    return <Card className="my-5 col-span-4">
        <CardHeader>
            <CardTitle>Revenue Statistics</CardTitle>
            <CardDescription>Monthly tuition revenue for the current year</CardDescription>
        </CardHeader>
        <CardContent className="pl-2">
            <RevenueChart idToken={idToken} />
        </CardContent>
    </Card>
}

function LevelStatistics({
    idToken
}: {
    idToken: string,
}) {
    return <Card className="my-5 col-span-4">
        <CardHeader>
            <CardTitle>Piano Level Distribution</CardTitle>
            <CardDescription>Distribution by level</CardDescription>
        </CardHeader>
        <CardContent>
            <LevelChart idToken={idToken} />
        </CardContent>
    </Card>
}

function OverviewLoadingSkeleton() {
    return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Skeleton className='w-full' />
    </div>
}

function StatComparisonBadge({ value, unit }: { value: number, unit?: string }) {
    return <Badge variant={'outline'} className={`mt-4 text-xs ${value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
        {value > 0 ? `+${value}` : `-${value}`}{unit || ''} from last month
    </Badge>
}