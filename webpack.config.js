const path = require("path");
const nodeExternals = require("webpack-node-externals");

module.exports = (env, argv) => {
  const isProduction = argv.mode === "production";
  return {
    target: "node",
    entry: "./src/index.ts",
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "server.js",
    },
    resolve: {
      extensions: [".ts", ".js"],
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: "ts-loader",
          exclude: /node_modules/,
        },
      ],
    },
    externals: [nodeExternals()],
    devtool: isProduction ? "source-map" : "eval-source-map",
  };
};
