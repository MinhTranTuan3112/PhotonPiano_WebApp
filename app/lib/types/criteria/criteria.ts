export type Criteria = {
    id : string,
    name : string,
    weight : number
    for: CriteriaFor;
}

export type MinimalCriteria = Pick<Criteria, 'id' | 'name' | 'weight'>;

export enum CriteriaFor
{
    EntranceTest,
    Class
}
