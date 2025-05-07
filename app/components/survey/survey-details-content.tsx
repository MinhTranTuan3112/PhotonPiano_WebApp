import { useState } from "react";
import { SurveyDetails } from "~/lib/types/survey/survey";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from "../ui/card";
import { Badge } from "../ui/badge";
import { ChevronDown, ChevronUp, Clock, FileText, Users } from "lucide-react";
import { formatRFC3339ToDisplayableDate } from "~/lib/utils/datetime";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Button } from "../ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { QUESTION_TYPES } from "~/lib/utils/constants";


type Props = {
    surveyDetails: SurveyDetails;
}

export default function SurveyDetailsContent({ surveyDetails }: Props) {
    const [expandedLearner, setExpandedLearner] = useState<string | null>(null)

    const toggleLearnerExpansion = (learnerId: string) => {
        if (expandedLearner === learnerId) {
            setExpandedLearner(null)
        } else {
            setExpandedLearner(learnerId)
        }
    }

    // Sort questions by orderIndex
    const sortedQuestions = [...surveyDetails.pianoSurveyQuestions].sort((a, b) => a.orderIndex - b.orderIndex)

    // Calculate response rate
    const totalQuestions = surveyDetails.pianoSurveyQuestions.length
    const totalLearners = surveyDetails.learnerSurveys.length

    return (
        <div className="space-y-6">
            <Card className="border-t-4 border-t-theme">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-2xl">{surveyDetails.name}</CardTitle>
                            <CardDescription className="mt-2">
                                {surveyDetails.description || "No description provided"}
                            </CardDescription>
                        </div>
                        <Badge variant={surveyDetails.isEntranceSurvey ? "theme" : "outline"}>
                            {surveyDetails.isEntranceSurvey ? "Entrance Survey" : "Regular Survey"}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <div className="text-sm font-medium">Age Range</div>
                            <div>
                                {surveyDetails.minAge && surveyDetails.maxAge
                                    ? `${surveyDetails.minAge} - ${surveyDetails.maxAge} years`
                                    : surveyDetails.minAge
                                        ? `${surveyDetails.minAge}+ years`
                                        : surveyDetails.maxAge
                                            ? `Up to ${surveyDetails.maxAge} years`
                                            : "No age restriction"}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="text-sm font-medium">Survey Stats</div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    <span>{totalQuestions} Questions</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                    <span>{totalLearners} Responses</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="border-t bg-muted/50 px-6 py-3">
                    <div className="flex w-full items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            <span>Created: {formatRFC3339ToDisplayableDate(surveyDetails.createdAt, false)}</span>
                        </div>
                        {surveyDetails.updatedAt && <div>Updated: {formatRFC3339ToDisplayableDate(surveyDetails.updatedAt, false)}</div>}
                    </div>
                </CardFooter>
            </Card>

            <Tabs defaultValue="questions">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="questions">Questions</TabsTrigger>
                    <TabsTrigger value="responses">Learner Responses</TabsTrigger>
                </TabsList>

                <TabsContent value="questions" className="mt-4">
                    <Card className="border-l-4 border-l-theme">
                        <CardHeader>
                            <CardTitle>Survey Questions</CardTitle>
                            <CardDescription>This survey contains {totalQuestions} questions</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Accordion type="multiple" className="w-full">
                                {sortedQuestions.map((question, index) => (
                                    <AccordionItem key={question.questionId} value={question.questionId}>
                                        <AccordionTrigger className="hover:no-underline">
                                            <div className="flex items-center gap-3 text-left">
                                                <Badge variant="outline" className="h-6 w-6 rounded-full text-center">
                                                    {index + 1}
                                                </Badge>
                                                <span className="font-medium">{question.question.questionContent}</span>
                                                {question.isRequired && (
                                                    <Badge className="ml-2 " variant={'destructive'}>
                                                        Required
                                                    </Badge>
                                                )}
                                                <div className="">
                                                    <Badge variant={'outline'}>{QUESTION_TYPES[question.question.type]}</Badge>
                                                </div>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <div className="pl-9 pt-2">
                                                {question.question.options && question.question.options.length > 0 && (
                                                    <div className="space-y-2">
                                                        <div className="text-sm font-medium">Options:</div>
                                                        <ul className="list-inside list-disc space-y-1 pl-2">
                                                            {question.question.options.map((option, i) => (
                                                                <li key={i} className="text-sm">
                                                                    {option}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="responses" className="mt-4">
                    <Card className="border-l-4 border-l-theme">
                        <CardHeader>
                            <CardTitle>Learner Responses</CardTitle>
                            <CardDescription>{totalLearners} learners have responded to this survey</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {surveyDetails.learnerSurveys.length > 0 ? (
                                <div className="space-y-4">
                                    {surveyDetails.learnerSurveys.map((learnerSurvey) => {
                                        const isExpanded = expandedLearner === learnerSurvey.learnerId
                                        const completedQuestions = learnerSurvey.learnerAnswers.length
                                        const completionRate = Math.round((completedQuestions / totalQuestions) * 100)

                                        return (
                                            <Card key={learnerSurvey.learnerId} className="overflow-hidden">
                                                <div
                                                    className="flex cursor-pointer items-center justify-between p-4 hover:bg-muted/50"
                                                    onClick={() => toggleLearnerExpansion(learnerSurvey.learnerId)}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarFallback className="bg-primary/10 text-primary">
                                                                {learnerSurvey.learnerEmail.substring(0, 2).toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <div className="font-medium">{learnerSurvey.learnerEmail}</div>
                                                            <div className="text-xs text-muted-foreground">
                                                                Completed {completedQuestions} of {totalQuestions} questions ({completionRate}%)
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Button variant="ghost" size="icon">
                                                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                    </Button>
                                                </div>

                                                {isExpanded && (
                                                    <div className="border-t px-4 py-3">
                                                        <Table>
                                                            <TableHeader>
                                                                <TableRow>
                                                                    <TableHead className="w-12">#</TableHead>
                                                                    <TableHead>Question</TableHead>
                                                                    <TableHead>Answer&#40;s&#41;</TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {sortedQuestions.map((question, index) => {
                                                                    const answer = learnerSurvey.learnerAnswers.find(
                                                                        (a) => a.surveyQuestionId === question.questionId,
                                                                    )

                                                                    return (
                                                                        <TableRow key={question.questionId}>
                                                                            <TableCell>{index + 1}</TableCell>
                                                                            <TableCell className="font-medium">
                                                                                {question.question.questionContent}
                                                                                {question.isRequired && (
                                                                                    <Badge className="ml-2 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                                                                        Required
                                                                                    </Badge>
                                                                                )}
                                                                            </TableCell>
                                                                            <TableCell>
                                                                                {answer ? (
                                                                                    answer.answers.length > 0 ? (
                                                                                        <ul className="list-inside list-disc space-y-1">
                                                                                            {answer.answers.map((ans, i) => (
                                                                                                <li key={i}>{ans}</li>
                                                                                            ))}
                                                                                        </ul>
                                                                                    ) : (
                                                                                        <span className="text-muted-foreground">No answer provided</span>
                                                                                    )
                                                                                ) : (
                                                                                    <span className="text-muted-foreground">Not answered</span>
                                                                                )}
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    )
                                                                })}
                                                            </TableBody>
                                                        </Table>
                                                    </div>
                                                )}
                                            </Card>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="flex h-32 items-center justify-center rounded-md border border-dashed">
                                    <div className="text-center text-muted-foreground">
                                        <p>No responses yet</p>
                                        <p className="text-sm">Responses will appear here once learners complete the survey</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
