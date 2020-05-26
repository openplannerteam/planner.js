import { inject, injectable } from "inversify";
import jsonld = require("jsonld");
import LDFetch from "ldfetch";
import CharacteristicProfile from "../../entities/profile/CharacteresticProfile";
import Profile from "../../entities/profile/Profile";
import ProfileConclusion from "../../entities/profile/ProfileConclusion";
import ProfileCondition from "../../entities/profile/ProfileCondition";
import ProfileRule from "../../entities/profile/ProfileRule";
import { LDLoader } from "../../loader/ldloader";
import { ThingView } from "../../loader/views/single";
import TYPES from "../../types";
import { PROFILE } from "../../uri/constants";
import URI from "../../uri/uri";
import IProfileFetcher from "./IProfileFetcher";

@injectable()
export default class ProfileFetcherDefault implements IProfileFetcher {

  protected ldFetch: LDFetch;
  protected ldLoader: LDLoader;

  constructor(
    @inject(TYPES.LDFetch) ldFetch: LDFetch,
  ) {
    this.ldFetch = ldFetch;
    this.ldLoader = new LDLoader();

    // unordered collections
    this.ldLoader.defineCollection(URI.inNS(PROFILE, "hasAccessRules"));
    this.ldLoader.defineCollection(URI.inNS(PROFILE, "hasOnewayRules"));
    this.ldLoader.defineCollection(URI.inNS(PROFILE, "hasSpeedRules"));
    this.ldLoader.defineCollection(URI.inNS(PROFILE, "hasPriorityRules"));
    this.ldLoader.defineCollection(URI.inNS(PROFILE, "hasObstacleRules"));
    this.ldLoader.defineCollection(URI.inNS(PROFILE, "hasObstacleTimeRules"));
    this.ldLoader.defineCollection(URI.inNS(PROFILE, "hasProximityRules"));
  }

  public async parseProfileBlob(blob: object, id: string): Promise<Profile> {
    const triples = await jsonld.toRDF(blob);

    const [profile] = this.ldLoader.process(triples, [
      this.getView(),
    ]);

    profile.id = id;

    return profile;
  }

  public async get(url: string): Promise<Profile> {
    const rdfThing = await this.ldFetch.get(url);
    const triples = rdfThing.triples;

    const [profile] = this.ldLoader.process(triples, [
      this.getView(),
    ]);

    profile.id = url;

    return profile;
  }

  protected getView() {
    const view = new ThingView(CharacteristicProfile.create);
    view.addFilter((entity) =>
      entity[URI.inNS(PROFILE, "hasAccessRules")] !== undefined ||
      entity[URI.inNS(PROFILE, "hasOnewayRules")] !== undefined ||
      entity[URI.inNS(PROFILE, "hasSpeedRules")] !== undefined ||
      entity[URI.inNS(PROFILE, "hasPriorityRules")] !== undefined ||
      entity[URI.inNS(PROFILE, "hasObstacleRules")] !== undefined ||
      entity[URI.inNS(PROFILE, "hasObstacleTimeRules")] !== undefined,
    );
    view.addMapping(URI.inNS(PROFILE, "hasAccessRules"), "accessRules", this.getRuleView());
    view.addMapping(URI.inNS(PROFILE, "hasOnewayRules"), "onewayRules", this.getRuleView());
    view.addMapping(URI.inNS(PROFILE, "hasSpeedRules"), "speedRules", this.getRuleView());
    view.addMapping(URI.inNS(PROFILE, "hasPriorityRules"), "priorityRules", this.getRuleView());
    view.addMapping(URI.inNS(PROFILE, "hasObstacleRules"), "obstacleRules", this.getRuleView());
    view.addMapping(URI.inNS(PROFILE, "hasObstacleTimeRules"), "obstacleTimeRules", this.getRuleView());
    view.addMapping(URI.inNS(PROFILE, "hasProximityRules"), "proximityRules", this.getRuleView());
    view.addMapping(URI.inNS(PROFILE, "hasMaxSpeed"), "maxSpeed");
    view.addMapping(URI.inNS(PROFILE, "usePublicTransport"), "usePublicTransport");
    return view;
  }

  protected getRuleView() {
    const view = new ThingView(ProfileRule.create);
    view.addFilter((entity) =>
      entity[URI.inNS(PROFILE, "concludes")] !== undefined,
    );
    view.addMapping(URI.inNS(PROFILE, "concludes"), "conclusion", this.getConclusionView());
    view.addMapping(URI.inNS(PROFILE, "match"), "condition", this.getConditionView());
    view.addMapping(URI.inNS(PROFILE, "hasOrder"), "order");
    return view;
  }

  protected getConditionView() {
    const view = new ThingView(ProfileCondition.create);
    view.addFilter((entity) =>
      entity[URI.inNS(PROFILE, "hasPredicate")] !== undefined ||
      entity[URI.inNS(PROFILE, "hasObject")] !== undefined,
    );
    view.addMapping(URI.inNS(PROFILE, "hasPredicate"), "predicate");
    view.addMapping(URI.inNS(PROFILE, "hasObject"), "object");
    return view;
  }

  protected getConclusionView() {
    const view = new ThingView(ProfileConclusion.create);
    view.addFilter((entity) =>
      (entity[URI.inNS(PROFILE, "hasAccess")] !== undefined) ||
      (entity[URI.inNS(PROFILE, "isOneway")] !== undefined) ||
      (entity[URI.inNS(PROFILE, "isReversed")] !== undefined) ||
      (entity[URI.inNS(PROFILE, "hasSpeed")] !== undefined) ||
      (entity[URI.inNS(PROFILE, "isObstacle")] !== undefined) ||
      (entity[URI.inNS(PROFILE, "hasPriority")] !== undefined) ||
      (entity[URI.inNS(PROFILE, "hasObstacleTime")] !== undefined),
    );
    view.addMapping(URI.inNS(PROFILE, "hasAccess"), "hasAccess");
    view.addMapping(URI.inNS(PROFILE, "isOneway"), "isOneway");
    view.addMapping(URI.inNS(PROFILE, "isReversed"), "isReversed");
    view.addMapping(URI.inNS(PROFILE, "hasSpeed"), "speed");
    view.addMapping(URI.inNS(PROFILE, "isObstacle"), "isObstacle");
    view.addMapping(URI.inNS(PROFILE, "hasPriority"), "priority");
    view.addMapping(URI.inNS(PROFILE, "hasObstacleTime"), "obstacleTime");
    return view;
  }
}
