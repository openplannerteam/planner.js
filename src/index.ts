import "reflect-metadata";
import Planner from "./Planner";

const planner = new Planner();

console.log(planner.query({
  from: 'Bissegem',
  to: 'Harelbeke',
}));

