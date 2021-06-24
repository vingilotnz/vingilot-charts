const path = require('path')
const nodeExternals = require('webpack-node-externals')

module.exports = {
    mode: "production",
    target: "node",
    devtool: "inline-source-map",
    entry: "./pkg_entry.js",
    output: {
      path: path.resolve(__dirname, "./build"),
      filename: "bundle.js"
    },
    resolve: {
      extensions: [".ts", ".tsx", ".js"]
    },
    module: {
      rules: [
        { test: /\.tsx?$/, loader: "ts-loader" }
      ]
    },
    externals: [nodeExternals()]
  };