import URI from "./uri";

export default class JSONLDContext {
    private rawData: object;
    private aliases: object;

    public constructor(blob: object) {
        this.rawData = {};
        this.aliases = {};

        if (Array.isArray(blob)) {
            this.processArray(blob);
        } else {
            this.rawData = blob;
            this.processObject(blob);
        }
    }

    public resolveIdentifier(name: string): string {
        if (name.indexOf("://") > 0) {
            // absolute URI
            return name;
        }

        if (this.aliases[name]) {
            return this.aliases[name];
        }

        if (name.indexOf(":") > 0) {
            this.aliases[name] = this.expandURI(name);
            return this.aliases[name];
        }

        return name;
    }

    private processObject(blob: object) {
        for (const [name, data] of Object.entries(blob)) {
            if (name.indexOf(":") >= 0) {
                this.aliases[name] = this.expandURI(name);
            }

            if (typeof (data) === "object") {
                if (data["@id"]) {
                    const rawId = data["@id"];
                    this.aliases[name] = this.expandURI(rawId);
                }
            } else if (typeof (data) === "string") {
                this.aliases[name] = this.expandURI(data);
            }
        }
    }

    private expandURI(name: string) {
        if (name.indexOf("://") > 0) {
            // absolute URI
            return name;
        }

        if (name.indexOf(":") < 0) {
            return name;
        }

        const [prefix, rest] = name.split(":");
        const namespace = this.rawData[prefix];
        if (namespace) {
            return URI.inNS(namespace, rest);
        } else {
            return name;
        }
    }

    private processArray(blobs: object[]) {
        for (const blob of blobs) {
            this.rawData = Object.assign(this.rawData, blob);
            this.processObject(blob);
        }
    }
}
