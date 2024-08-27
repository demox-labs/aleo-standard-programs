const path = require("path");
const nodeExternals = require("webpack-node-externals");
const Dotenv = require("dotenv-webpack");

// Determine the mode from the NODE_ENV environment variable
const mode =
  process.env.NODE_ENV === "production" ? "production" : "development";

const appConfig = {
  mode: mode,
  target: "node",
  devtool:
    process.env.NODE_ENV === "production" ? "source-map" : "eval-source-map",
  externals: [
    nodeExternals({
      allowlist: ["@demox-labs/aleo-sdk"],
    }),
  ],

  // Entry point of the application
  entry: {
    index: path.resolve(__dirname, "src") + "/index.ts",
  },

  // Output configuration
  output: {
    pathinfo: false,
    path: path.resolve(__dirname, "dist"),
  },

  // Resolve .ts and .js files
  resolve: {
    extensions: [".ts", ".js", ".wasm"],
  },

  // Module rules for TypeScript
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "babel-loader",
      },
      {
        test: /\.wasm$/,
        type: "asset/inline",
      },
    ],
  },

  plugins: [new Dotenv()],

  experiments: {
    asyncWebAssembly: true,
    syncWebAssembly: true,
  },
};

const workerConfig = {
  mode: process.env.NODE_ENV,
  devtool: process.env.MODE_ENV === "development" ? "inline-source-map" : false,
  externals: [
    nodeExternals({
      allowlist: ["@demox-labs/aleo-sdk"],
    }),
  ],
  performance: {
    hints: false,
  },
  experiments: {
    asyncWebAssembly: true,
    syncWebAssembly: true,
  },
  target: "node",
  entry: {
    authorizeTransaction:
      path.resolve(__dirname, "src") + "/workers/authorizeTransaction.ts",
    authorizeDeployment:
      path.resolve(__dirname, "src") + "/workers/authorizeDeployment.ts",
  },
  output: {
    pathinfo: false,
    path: path.resolve(__dirname, "dist"),
  },
  resolve: {
    extensions: [".ts", ".js", ".wasm"],
  },
  plugins: [new Dotenv()],
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "babel-loader",
      },
      {
        test: /\.wasm$/,
        type: "asset/inline",
      },
    ],
  },
};

const testConfig = {
  mode: mode,
  target: "node",
  devtool:
    process.env.NODE_ENV === "production" ? "source-map" : "eval-source-map",
  externals: [
    nodeExternals({
      allowlist: ["@demox-labs/aleo-sdk"],
    }),
  ],

  // Entry point of the application
  entry: {
    runTestScript:
      path.resolve(__dirname, "src") + "/tests/scripts/runTestScript.ts",
    getTokenOwnerHash:
      path.resolve(__dirname, "src") + "/tests/scripts/getTokenOwnerHash.ts",
    runTokenActions:
      path.resolve(__dirname, "src") + "/tests/scripts/runTokenActions.ts",
    testProgramCalls:
      path.resolve(__dirname, "src") + "/tests/scripts/testProgramCalls.ts",
    estimateFees:
      path.resolve(__dirname, "src") + "/tests/scripts/estimateFees.ts",
    snapshotLedger:
      path.resolve(__dirname, "src") + "/tests/scripts/snapshotLedger.ts",
    testRunner: path.resolve(__dirname, "src") + "/tests/testRunner.ts",
    depositRebalanceTest:
      path.resolve(__dirname, "src") + "/tests/cases/depositRebalance.test.ts",
    withdrawNormalTest:
      path.resolve(__dirname, "src") + "/tests/cases/withdrawNormal.test.ts",
    depositNormalTest:
      path.resolve(__dirname, "src") + "/tests/cases/depositNormal.test.ts",
    depositNormalBondedTest:
      path.resolve(__dirname, "src") + "/tests/cases/depositNormalBonded.test.ts",
    depositPrepRebalanceTest:
      path.resolve(__dirname, "src") + "/tests/cases/depositPrepRebalance.test.ts",
    initialStateTest:
      path.resolve(__dirname, "src") + "/tests/cases/initialState.test.ts",
    oracleUpdateTest:
      path.resolve(__dirname, "src") + "/tests/cases/oracleUpdate.test.ts",
    oracleNonUpdateTest:
      path.resolve(__dirname, "src") + "/tests/cases/oracleNonUpdate.test.ts",
    pondoDelegatorNormalTest:
      path.resolve(__dirname, "src") + "/tests/cases/pondoDelegatorNormal.test.ts",
    snapshotRpcDb:
      path.resolve(__dirname, "src") + "/tests/scripts/snapshotRpcDb.ts",
    swapRpcDb: path.resolve(__dirname, "src") + "/tests/scripts/swapRpcDb.ts",
    buildLedger:
      path.resolve(__dirname, "src") + "/tests/scripts/buildLedger.ts",
  },

  // Output configuration
  output: {
    pathinfo: false,
    path: path.resolve(__dirname, "dist"),
  },

  // Resolve .ts and .js files
  resolve: {
    extensions: [".ts", ".js", ".wasm"],
  },

  // Module rules for TypeScript
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "babel-loader",
      },
      {
        test: /\.wasm$/,
        type: "asset/inline",
      },
    ],
  },

  plugins: [new Dotenv()],

  experiments: {
    asyncWebAssembly: true,
    syncWebAssembly: true,
  },
};

module.exports = [appConfig, workerConfig, testConfig];
