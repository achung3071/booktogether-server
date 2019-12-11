module.exports = {
  transform: {
    "^.+\\.ts$": "ts-jest"
  },
  testRegex: "\\.test\\.ts$",
  moduleFileExtensions: ["ts", "tsx", "js", "json"],
  testEnvironment: "node",
  globals: {
    "ts-jest": {
      diagnostics: true,
      tsConfig: "tsconfig.json"
    }
  }
};
