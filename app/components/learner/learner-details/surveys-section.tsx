import { useNavigate } from "@remix-run/react";
import { CalendarDays, ClipboardCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { LearnerSurveyWithAnswersDetail } from "~/lib/types/survey/survey";
import { formatRFC3339ToDisplayableDate } from "~/lib/utils/datetime";

export default function SurveysSection({
    learnerSurveys
}: {
    learnerSurveys: LearnerSurveyWithAnswersDetail[];
}) {

    const navigate = useNavigate();

    return <div className="space-y-4">
        <div className="flex items-center gap-2 text-lg font-medium text-neutral-800">
            <ClipboardCheck className="h-5 w-5 text-theme" />
            <h3 className='font-bold'>Completed Surveys</h3>
        </div>

        {learnerSurveys.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {learnerSurveys.map(({ pianoSurvey: survey, createdAt }, index) => (
                    <Card
                        key={index}
                        className="overflow-hidden border-t-4 border-t-theme hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => navigate(`/staff/surveys/${survey.id}`)}
                    >
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg">{survey.name}</CardTitle>
                            <CardDescription className="line-clamp-2">
                                {survey.description}
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="pt-0">
                            <div className="flex items-center text-sm text-muted-foreground mt-2">
                                <CalendarDays className="mr-2 h-4 w-4 text-theme" />
                                <span>Completed on: </span>
                                <span className="ml-1 font-medium text-neutral-700">
                                    {formatRFC3339ToDisplayableDate(createdAt, false)}
                                </span>

                            </div>

                            {/* Piano key decorative element */}
                            <div className="mt-4 flex h-2">
                                {Array.from({ length: 10 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={`h-full ${i % 2 === 0 ? 'bg-black w-3' : 'bg-white border-r border-neutral-200 w-2'}`}
                                    />
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        ) : (
            <Card className="bg-neutral-50 border border-dashed">
                <CardContent className="flex flex-col items-center justify-center p-6 text-neutral-500">
                    <ClipboardCheck className="h-12 w-12 mb-2 opacity-20" />
                    <p>No surveys completed yet</p>
                </CardContent>
            </Card>
        )}
    </div>
}