
export type SurveyQuestion = {
    id: string;
    type: QuestionType;
    questionContent: string;
    options: string[];
    orderIndex: number;
    allowOtherAnswer: boolean;
    isRequired: boolean;
    minAge?: number;
    maxAge?: number;
};

export enum QuestionType
{
    SingleChoice,
    MultipleChoice,
    OpenText,
    LikertScale,
    NumericInput
}
