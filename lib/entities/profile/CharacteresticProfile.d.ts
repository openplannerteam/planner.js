import { RoutableTileWay } from "../tiles/RoutableTileWay";
import DynamicProfile from "./DynamicProfile";
export default class CharacteristicProfile extends DynamicProfile {
    static create(url: string): CharacteristicProfile;
    private accessCache;
    private onewayCache;
    private speedCache;
    private priorityCache;
    constructor(url: string);
    getID(): string;
    isOneWay(way: RoutableTileWay): boolean;
    hasAccess(way: RoutableTileWay): boolean;
    getSpeed(way: RoutableTileWay): number;
    getMultiplier(way: RoutableTileWay): number;
    private getWayCharacteristic;
}
