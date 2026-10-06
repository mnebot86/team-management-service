/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  globalSetup: "<rootDir>/src/core/tests/globalSetup.ts",
  globalTeardown: "<rootDir>/src/core/tests/globalTeardown.ts",
  roots: ["<rootDir>/src/"],
  transform: {
    ...tsJestTransformCfg,
  },
};
