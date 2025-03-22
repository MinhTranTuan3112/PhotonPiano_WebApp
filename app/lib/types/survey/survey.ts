import { SurveyQuestion } from "../survey-question/survey-question";

export type Survey = {
    id: string;
    name: string;
    description?: string;
    createdById: string;
    updatedById?: string;
    createdAt: string;
    updatedAt?: string;
};

type CreateQuestionInSurveyRequest = Omit<SurveyQuestion, 'minAge' | 'maxAge' | 'orderIndex' | 'id'>
    & { id?: string; isRequired: boolean; }

export type CreateSurveyRequest = Pick<Survey, 'name' | 'description'> & {
    questions: CreateQuestionInSurveyRequest[];
};

export type UpdateSurveyRequest = Partial<Pick<Survey, 'id' | 'name' | 'description'>>;