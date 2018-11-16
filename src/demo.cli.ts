import runDemo from "./demo";

const isDebugging = process && process.argv.includes("--debug");

(async () => {
  if (isDebugging) {    // tslint:disable-next-line:no-debugger
    debugger;
  }

  runDemo()
    .then(() => console.log("Success"))
    .catch((e) => console.error(e));
})();
