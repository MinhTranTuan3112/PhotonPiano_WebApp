import { useQuery } from '@tanstack/react-query';
import { BookOpen, CircleHelp, GraduationCap } from 'lucide-react';
import { LevelBadge, StatusBadge } from '~/components/staffs/table/student-columns';
import { Badge } from '~/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Skeleton } from '~/components/ui/skeleton';
import { fetchLevels } from '~/lib/services/level';
import { AccountDetail, Level } from '~/lib/types/account/account';
import { PianoLevelTimeline } from './piano-level-timeline';
import { Separator } from '~/components/ui/separator';
import NoInformation from '~/components/common/no-information';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip';

type Props = {}

export default function AcademicSection({
    student
}: {
    student: AccountDetail;
}) {

    const { data, isLoading, isError } = useQuery({
        queryKey: ['levels'],
        queryFn: async () => {
            const response = await fetchLevels();

            return await response.data;
        },
        enabled: true,
        refetchOnWindowFocus: false
    });

    const levels = data ? data as Level[] : [];

    return <section className="space-y-4">
        <div className="flex items-center gap-2 text-lg font-bold text-neutral-800">
            <BookOpen className="size-5 text-theme" />
            <h3 className='font-bold'>Academic information</h3>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
            <Card className="bg-muted/40 border-l-4 border-l-theme">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center">
                        <GraduationCap className="mr-2 text-theme" /> Piano Level
                    </CardTitle>
                </CardHeader>
                <CardContent className='flex flex-col gap-3 my-3'>
                    <div className="flex items-center justify-between">
                        <span className="text-base font-bold">Current</span>
                        <LevelBadge level={student.level} />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                        <span className="text-base font-bold">Self-evaluated</span>
                        {student.selfEvaluatedLevelId ? <LevelBadge level={student.selfEvaluatedLevel} /> : <NoInformation />}
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-muted/40 border-l-4 border-l-theme">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center">
                        <BookOpen className="mr-2 text-theme" /> Academic status
                    </CardTitle>
                </CardHeader>
                <CardContent className='flex flex-col gap-3 my-3'>
                    <div className="flex items-center justify-between">
                        <span className="text-base font-bold">Status</span>
                        <StatusBadge status={student.studentStatus || 0} />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                        <span className="text-base font-bold flex flex-row gap-1 items-center">
                            Requires entrance test participation
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <CircleHelp className='cursor-pointer size-4 text-gray-400' />
                                    </TooltipTrigger>
                                    <TooltipContent className='font-normal'>
                                        This learner have not yet confirmed the piano level through a piano entrance evaluation test.
                                        <br />
                                        To continue learning at Photon Piano,
                                        {' '}
                                        <strong>this learner will need to take part in a piano entrance test</strong> to confirm the level.
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </span>
                        <Badge
                            className={`
                                ${student.selfEvaluatedLevel?.requiresEntranceTest ? 'text-red-600' : 'text-green-600'}
                                 uppercase ${student.selfEvaluatedLevel?.requiresEntranceTest ? 'bg-red-500/20' : 'bg-green-500/20'}`}>
                            {student.selfEvaluatedLevel?.requiresEntranceTest ? 'Required' : 'Not Required'}
                        </Badge>
                    </div>
                </CardContent>
            </Card>
        </div>

        <Card className='border-l-4 border-l-theme'>
            <CardHeader>
                <CardTitle className="text-lg">Continue learning</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-1">
                    <Badge variant={'outline'} className={`uppercase ${student.wantToContinue ? 'text-green-500' : 'text-red-500'}`}>
                        {student.wantToContinue ? 'Registered' : 'Not registered'}
                    </Badge>
                </div>
            </CardContent>
        </Card>

        {isLoading ? <Skeleton className='w-full h-full' /> :
            <PianoLevelTimeline levels={levels} currentLevelId={student.levelId} />}

    </section>
}
