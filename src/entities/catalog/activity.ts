export class Activity {
    public static create(id?: string) {
        return new Activity(id);
    }

    public id: string;
    public algorithm: string;
    public usedProfile: string;

    constructor(id?: string) {
        this.id = id;
    }
}