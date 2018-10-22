import "isomorphic-fetch";
import "reflect-metadata";
import Planner from "./Planner";

const planner = new Planner();

(async () => {

  const result = await planner.query({
    from: "Bissegem",
    to: "Harelbeke",
  });
  console.log(result);

})();
