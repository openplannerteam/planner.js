const path = require("path");

// These modules are imported by ldfetch, but are never actually used because (right now) we only fetch jsonld files
const excludeModules = [
  "rdfa-processor",
  "rdf-canonize",
  "rdfxmlprocessor",
  "xmldom",
  'n3'
];

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
    alias: excludeModules.reduce((alias, moduleName) => {
      alias[moduleName] = path.resolve(__dirname, "webpack.mockModule.js");
      return alias;
    }, {})
  },
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
    library: "Planner",
    libraryTarget: "umd",
    libraryExport: "default"
  }
};
