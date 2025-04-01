import { Account } from "../account/account";
import { SurveyQuestion } from "../survey-question/survey-question";

export type Survey = {
    id: string;
    name: string;
    description?: string;
    minAge?: number;
    maxAge?: number;
    isEntranceSurvey: boolean;
    createdById: string;
    updatedById?: string;
    createdAt: string;
    updatedAt?: string;
};

export type SurveyDetails = {
    pianoSurveyQuestions: PianoSurveyQuestionWithQuestion[];
    learnerSurveys: LearnerSurveyWithAnswers[];
} & Survey;

export type LearnerSurvey = {
    learnerId: string;
    pianoSurveyId: string;
    learnerEmail: string;
};

export type LearnerAnswer = {
    learnerSurveyId: string;
    surveyQuestionId: string;
    answers: string[];
}

export type LearnerSurveyWithAnswers = {
    learnerAnswers: LearnerAnswer[];
} & LearnerSurvey;

export type LearnerAnswerWithQuestion = {
    surveyQuestion : SurveyQuestion;
} & LearnerAnswer

export type LearnerSurveyWithAnswersDetail = {
    learnerAnswers: LearnerAnswerWithQuestion[];
    pianoSurvey : Survey;
    createdAt : string;
} & LearnerSurvey;

export type PianoSurveyQuestion = {
    surveyId: string;
    questionId: string;
    orderIndex: number;
    isRequired: boolean;
};

export type PianoSurveyQuestionWithQuestion = {
    question: SurveyQuestion;
} & PianoSurveyQuestion;

type CreateQuestionInSurveyRequest = Omit<SurveyQuestion, 'minAge' | 'maxAge' | 'orderIndex' | 'id'>
    & { id?: string; isRequired: boolean; }

type UpdateQuestionInSurveyRequest = Omit<SurveyQuestion, 'minAge' | 'maxAge' | 'orderIndex' | 'id'>
    & { id?: string; isRequired: boolean; }

export type CreateSurveyRequest = Pick<Survey, 'name' | 'description' | 'minAge' | 'maxAge'> & {
    questions: CreateQuestionInSurveyRequest[];
};

export type SendEntranceSurveyAnswers = {
    password: string;
    surveyAnswers: {
        surveyQuestionId: string;
        answers: string[];
    }[]
} & Pick<Account, 'fullName' | 'phone' | 'email'>

export type UpdateSurveyRequest = Partial<Pick<Survey, 'name' | 'description' | 'minAge' | 'maxAge'> & {
    isEntranceSurvey: boolean
    questions: UpdateQuestionInSurveyRequest[];
}>;