
export type SurveyQuestion = {
    id: string;
    type: QuestionType;
    questionContent: string;
    options: string[];
    orderIndex: number;
    allowOtherAnswer: boolean;
    minAge?: number;
    maxAge?: number;
};

export type CreateSurveyQuestionRequest = Omit<SurveyQuestion, 'id' | 'orderIndex'>;

export type UpdateSurveyQuestionRequest = Partial<Pick<SurveyQuestion, 'id' | 'questionContent' | 'type' | 'options'>>;

export enum QuestionType {
    SingleChoice,
    MultipleChoice,
    OpenText,
    LikertScale,
    NumericInput
}

export const sampleSurveyQuestions: SurveyQuestion[] = [
    {
        id: "1",
        type: QuestionType.SingleChoice,
        questionContent: "What is your favorite type of cuisine?",
        options: ["Italian", "Chinese", "Mexican", "Indian", "Other"],
        orderIndex: 1,
        allowOtherAnswer: true
    },
    {
        id: "2",
        type: QuestionType.MultipleChoice,
        questionContent: "Which of the following hobbies do you enjoy? (Select all that apply)",
        options: ["Reading", "Traveling", "Cooking", "Sports", "Gaming", "Other"],
        orderIndex: 2,
        allowOtherAnswer: true,
    },
    {
        id: "3",
        type: QuestionType.OpenText,
        questionContent: "Please describe your ideal vacation destination.",
        options: [],
        orderIndex: 3,
        allowOtherAnswer: false,
    },
    {
        id: "4",
        type: QuestionType.LikertScale,
        questionContent: "How satisfied are you with your current work-life balance?",
        options: ["1 - Very Dissatisfied", "2 - Dissatisfied", "3 - Neutral", "4 - Satisfied", "5 - Very Satisfied"],
        orderIndex: 4,
        allowOtherAnswer: false,
    },
    {
        id: "5",
        type: QuestionType.NumericInput,
        questionContent: "How many hours per week do you spend exercising?",
        options: [],
        orderIndex: 5,
        allowOtherAnswer: false,
        minAge: 18,
        maxAge: 65,
    }
];
