import { useNavigate } from '@remix-run/react';
import { Calendar, Clock, GraduationCap, Piano, Users } from 'lucide-react';
import React from 'react'
import { Badge } from '~/components/ui/badge';
import { Card, CardContent, CardHeader } from '~/components/ui/card';
import { AccountDetail } from '~/lib/types/account/account';
import { Class } from '~/lib/types/class/class';
import { CLASS_STATUS } from '~/lib/utils/constants';

type Props = {
    student: AccountDetail;
    type: 'current' | 'past';
}

export default function StudiedClassesSection({ student, type }: Props) {
    const isCurrentClass = type === 'current';
    const classes = isCurrentClass
        ? (student.currentClass ? [student.currentClass] : [])
        : student.studentClasses.filter(sc => sc.classId !== student.currentClass?.id).map(sc => sc.class);

    const title = isCurrentClass ? 'Current Class' : 'Studied Classes';
    const icon = isCurrentClass ? <Piano className="h-5 w-5 text-theme" /> : <GraduationCap className="h-5 w-5 text-theme" />;
    const emptyMessage = isCurrentClass ? 'Not currently enrolled in any class' : 'No previous classes found';
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 text-lg font-medium text-neutral-800">
                {icon}
                <h3 className='font-bold'>{title}</h3>
            </div>

            {classes.length > 0 ? (
                <div className={`grid gap-4 ${!isCurrentClass ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : ''}`}>
                    {classes.map((classObj) => (
                        <ClassCard
                            key={classObj.id}
                            classObj={classObj}
                            type={type}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex items-center justify-center h-32 bg-neutral-50 border border-dashed rounded-xl text-neutral-500">
                    <p>{emptyMessage}</p>
                </div>
            )}
        </div>
    )
}

const getStatusColor = (status: number) => {
    switch (status) {
        case 0: return "text-gray-600";
        case 1: return "text-emerald-600";
        case 2: return "text-blue-600";
        case 3: return "text-red-600";
        default: return "text-gray-600";
    }
};

const getCardStyle = (type: 'current' | 'past') => {
    return type === 'current'
        ? "border-l-4 border-l-theme bg-gradient-to-r from-theme/20 to-white"
        : "bg-white hover:shadow-md transition-shadow";
};

export function ClassCard({
    classObj, type = 'current'
}: {
    classObj: Class;
    type?: 'current' | 'past';
}) {

    const navigate = useNavigate();

    return <Card className={`overflow-hidden cursor-pointer ${getCardStyle(type)}`} onClick={() => navigate(`/staff/classes/${classObj.id}`)}>
        <CardHeader className="">
            <div className="flex items-center justify-between">
                <h4 className="text-md font-bold">{classObj.name}</h4>
                <Badge className={`px-2 py-1 bg-white/10 ${getStatusColor(classObj.status)}`} variant={'outline'}>
                    {CLASS_STATUS[classObj.status]}
                </Badge>
            </div>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
            <div className="flex items-center text-sm text-gray-700">
                <GraduationCap className="mr-2 h-4 w-4 text-theme" />
                <span className="font-medium">Level:</span>
                <span className="ml-2">{classObj.level?.name || "N/A"}</span>
            </div>

            <div className="flex items-center text-sm text-gray-700">
                <Calendar className="mr-2 h-4 w-4 text-theme" />
                <span className="font-medium">Start Date:</span>
                <span className="ml-2">{classObj.startTime || "TBD"}</span>
            </div>

            <div className="flex items-center text-sm text-gray-700">
                <Clock className="mr-2 h-4 w-4 text-theme" />
                <span className="font-medium">Schedule:</span>
                <span className="ml-2 line-clamp-1">{classObj.scheduleDescription || "N/A"}</span>
            </div>

            {classObj.instructorName && (
                <div className="flex items-center text-sm text-gray-700">
                    <Users className="mr-2 h-4 w-4 text-theme" />
                    <span className="font-medium">Teacher:</span>
                    <span className="ml-2">{classObj.instructorName}</span>
                </div>
            )}
        </CardContent>
    </Card>
}