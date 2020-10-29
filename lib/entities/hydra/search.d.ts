import { HydraTemplateMapping } from "./mapping";
export declare class HydraTemplate {
    static create(id?: string): HydraTemplate;
    id?: string;
    template: string;
    mappings: HydraTemplateMapping[];
    constructor(id?: string);
    fill(values: object): string;
}
