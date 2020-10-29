import IConnection from "../entities/connections/connections";
import ILocation from "../interfaces/ILocation";
import IProbabilisticValue from "../interfaces/IProbabilisticValue";
import IStep from "../interfaces/IStep";
import { DistanceM, DurationMs } from "../interfaces/units";
/**
 * This Step class serves as an implementation of the [[IStep]] interface and as a home for some helper functions
 * related to [[IStep]] instances
 */
export default class Step implements IStep {
    static create(startLocation: ILocation, stopLocation: ILocation, duration: IProbabilisticValue<DurationMs>, through?: string, // string identifier of a way, route, ... that was taken
    startTime?: Date, stopTime?: Date, distance?: DistanceM): IStep;
    static createFromConnections(enterConnection: IConnection, exitConnection: IConnection): IStep;
    /**
     * Compare two [[IStep]] instances
     * @returns true if the two steps are the same
     */
    static compareEquals(step: IStep, otherStep: IStep): boolean;
    private static compareLocations;
    distance: DistanceM;
    duration: IProbabilisticValue<DurationMs>;
    startLocation: ILocation;
    startTime: Date;
    stopLocation: ILocation;
    stopTime: Date;
    enterConnectionId: string;
    exitConnectionId: string;
    constructor(startLocation: ILocation, stopLocation: ILocation, duration: IProbabilisticValue<DurationMs>, startTime?: Date, stopTime?: Date, distance?: DistanceM, enterConnectionId?: string, exitConnectionId?: string);
}
