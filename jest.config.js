/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src/"],
  transform: {
    ...tsJestTransformCfg,
  },
};
