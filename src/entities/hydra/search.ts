import uriTemplates = require("uri-templates");

import { HydraTemplateMapping } from "./mapping";

export class HydraTemplate {
    public static create(id?: string) {
        return new HydraTemplate(id);
    }

    public id?: string;
    public template: string;
    public mappings: HydraTemplateMapping[];

    constructor(id?: string) {
        this.id = id;
    }

    public fill(values: object): string {
        const template = uriTemplates(this.template);
        const params = {};

        for (const mapping of this.mappings) {
            if (values[mapping.property]) {
                params[mapping.variable] = values[mapping.property];
            }
        }

        return template.fill(params);
    }
}
