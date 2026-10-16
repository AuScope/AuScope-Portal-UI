// @ts-check
const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

module.exports = defineConfig([
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      "@angular-eslint/component-selector": [
          "error",
          {
            "prefix": "app",
            "style": "kebab-case",
            "type": [
              "element",
              "attribute"
            ]
          }
        ],
      "@angular-eslint/directive-selector": [
          "error",
          {
            "prefix": "app",
            "style": "camelCase",
            "type": "attribute"
          }
      ],
      // ESLint
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["warn",
      { 
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "caughtErrorsIgnorePattern": "^_"
      }],
      "@typescript-eslint/consistent-type-definitions": ["warn", "interface"],
      "@typescript-eslint/no-empty-function": "warn",
      "@typescript-eslint/no-this-alias": ["warn", {"allowedNames": ["me"]}],
      // Unfortunately this flags every single void method not marked as void
      "@typescript-eslint/explicit-module-boundary-types": "off",
      // This one causes almost every file to error due to "standalone: false: which isn't recommended in Angular 19
      // Fixing it should be on the cards, but it's a nightmare to unravel
      "@angular-eslint/prefer-standalone": "off",
      // Formatting
      "no-trailing-spaces": "error",
      "no-multi-spaces": "error",
      "eol-last": ["error", "always"],
      "space-in-parens": ["error", "never"],
      "object-curly-spacing": ["error", "always"],
      "complexity": ["warn", 100],
      "max-lines": ["warn", 1000],
      "max-params": ["warn", 20],
      "no-var": "warn",
      "no-console": "off",    // Allow console output
      "prefer-const": "warn",
      // Too many warnings on these next ones, perhaps we may want to revisit later
      "@typescript-eslint/no-explicit-any": "off", // Unsafe return of an `any` typed value
      "@typescript-eslint/no-unsafe-member-access": "off", // Unsafe member access .loaded on an `any` value
      "@typescript-eslint/no-unsafe-return": "off", // Unsafe return of an `any` typed value
      "@typescript-eslint/no-unsafe-assignment": "off", // Unsafe assignment of an `any` value
      "@typescript-eslint/no-unsafe-call": "off", // Unsafe call of an `any` (or `error`) typed value
      "@typescript-eslint/member-ordering": "off", // public before private (vars and methods)
      "@typescript-eslint/no-unsafe-argument": "off" // E.g. Unsafe argument of type `any` assigned to a parameter of type `string`
    },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {
      "@angular-eslint/template/banana-in-box": "error",
      "@angular-eslint/template/no-negated-async": "warn",
      "eqeqeq": "error"
    },
  },
]);
