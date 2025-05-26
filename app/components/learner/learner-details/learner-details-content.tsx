import React from 'react'
import { AccountDetail } from '~/lib/types/account/account'
import StudentHeader from './student-header';
import EntranceTestsSection from './entrance-tests-section';
import { Piano } from 'lucide-react';
import StudiedClassesSection, { ClassCard } from './studied-classes-section';
import TuitionSection from './tuition-section';
import FreeTimesSection from './free-times-section';
import SurveysSection from './surveys-section';

type Props = {
    student: AccountDetail;
}

export function LearnerDetailsContent({ student }: Props) {
    return <LearnerDetails student={student} key={student.accountFirebaseId} />
}

function LearnerDetails({ student }: Props) {
    return (
        <div className="bg-white shadow-2xl rounded-2xl p-6 space-y-8">
            <div className="">
                <h1 className="text-2xl font-bold">Learner details</h1>
                <div className="text-sm text-muted-foreground">View learner details information including basic personal information, classes, free times and surveys</div>
            </div>

            <StudentHeader student={student} />

            <EntranceTestsSection student={student} />

            {student.currentClass && (
                <div className='space-y-4'>
                    <div className="flex items-center gap-2 text-lg font-medium text-neutral-800">
                        <Piano className="h-5 w-5 text-theme" />
                        <h3 className='font-bold'>Current Class</h3>
                    </div>
                    <ClassCard classObj={student.currentClass} type='current' />
                </div>
            )}

            <StudiedClassesSection student={student} type='past' />

            <TuitionSection student={student} />

            <FreeTimesSection student={student} />

            <SurveysSection learnerSurveys={student.learnerSurveys} />
        </div>
    )
}