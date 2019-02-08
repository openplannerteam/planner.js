import runDemo from "./demo";

const isDebugging = process && process.argv.includes("--debug");

(async () => {
  if (isDebugging) {    // tslint:disable-next-line:no-debugger
    debugger;
  }

  runDemo(true)
    .then((success) => console.log(success ? "Success" : "Fail"))
    .catch((e) => console.error(e));
})();
