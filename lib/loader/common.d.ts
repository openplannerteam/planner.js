export interface ISemiEntity {
    id?: string;
}
export interface IEntity extends ISemiEntity {
    id: string;
}
export interface IEntityMap<T extends ISemiEntity> {
    [id: string]: T;
}
