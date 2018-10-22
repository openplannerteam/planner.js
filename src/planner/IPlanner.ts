import IJourney from "./IJourney";

export default interface IPlanner {
  plan: () => Promise<IJourney[]>
}
