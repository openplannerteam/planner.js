const path = require("path");

// These modules are imported by ldfetch, but are never actually used because (right now) we only fetch jsonld files
const excludeModules = [
  "rdfa-processor",
  //"rdf-canonize",
  "rdfxmlprocessor",
  "xmldom",
  'n3'
];

const excludeAlias = excludeModules.reduce((alias, moduleName) => {
  alias[moduleName] = path.resolve(__dirname, "webpack/mockModule.js");
  return alias;
}, {});

module.exports = {
  entry: "./src/index.ts",
  devtool: "cheap-module-source-map",
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: [".ts", ".js"],
    alias: {
      ...excludeAlias,
      "q": path.resolve(__dirname, "webpack/shimQ.js")
    }
  },
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
    library: "Planner",
    libraryTarget: "umd",
    libraryExport: "default"
  }
};
