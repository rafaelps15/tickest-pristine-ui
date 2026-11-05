// @ts-check
const eslint = require("@eslint/js");
const { defineConfig } = require("eslint/config");
const tseslint = require("typescript-eslint");
const angular = require("angular-eslint");

module.exports = defineConfig([
  {
    files: ["**/*.ts"],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      "@angular-eslint/directive-selector": [
        "error",
        {
          type: "attribute",
          prefix: "app",
          style: "camelCase",
        },
      ],
      "@angular-eslint/component-selector": [
        "error",
        {
          type: "element",
          prefix: "app",
          style: "kebab-case",
        },
      ],
    },
  },
  {
    files: ["**/*.html"],
    extends: [
      angular.configs.templateRecommended,
      angular.configs.templateAccessibility,
    ],
    rules: {},
  },
  {
    // As telas de autenticação têm um formulário só: o foco no primeiro campo é o esperado (como em
    // qualquer tela de entrada), e o rótulo do campo diz o que a tela pede. No resto do app, vale a regra.
    files: [
      "src/app/shared/feature-login/login.component.html",
      "src/app/shared/feature-first-access/first-access.component.html",
      "src/app/shared/feature-activate-account/activate-account.component.html",
    ],
    rules: {
      "@angular-eslint/template/no-autofocus": "off",
    },
  }
]);
