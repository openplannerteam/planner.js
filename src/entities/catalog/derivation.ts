import { Activity } from "./activity";

export class Derivation {
    public static create(id: string){
        return new Derivation(id);
    }

    public id: string;
    public entity: string;
    public activity: Activity;

    //oplossing voor probleem met ThingView
    constructor(id: string){
        this.id = id;
    }
}