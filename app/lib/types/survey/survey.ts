
export type Survey = {
    id: string;
    name: string;
    description?: string;
    createdById: string;
    updatedById?: string;
    createdAt: string;
    updatedAt?: string;
};

export type CreateSurveyRequest = Pick<Survey, 'name' | 'description'>;

export type UpdateSurveyRequest = Partial<Pick<Survey, 'id' | 'name' | 'description'>>;