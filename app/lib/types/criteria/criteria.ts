export type Criteria = {
  id: string;
  name: string;
  weight: number;
  description: string;
  for: CriteriaFor;
};

export type MinimalCriteria = Pick<Criteria, "id" | "name" | "weight" | 'description'>;

export enum CriteriaFor {
  EntranceTest,
  Class,
}

