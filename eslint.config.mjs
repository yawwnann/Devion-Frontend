// @ts-check
import withNuxt from "./.nuxt/eslint.config.mjs";

export default withNuxt({
  rules: {
    // Stylistic rules - dimatikan untuk mengurangi noise
    "@stylistic/semi": "off",
    "@stylistic/quotes": "off",
    "@stylistic/comma-dangle": "off",
    "@stylistic/indent": "off",
    "@stylistic/space-before-function-paren": "off",
    "@stylistic/member-delimiter-style": "off",
    "@stylistic/arrow-parens": "off",
    "@stylistic/operator-linebreak": "off",
    "@stylistic/eol-last": "off",

    // Vue rules
    "vue/no-multiple-template-root": "off",
    "vue/max-attributes-per-line": "off",
    "vue/multi-word-component-names": "off",
    "vue/html-self-closing": "off",
    "vue/component-name-in-template-casing": "off",
    "vue/block-order": "off",
    "vue/singleline-html-element-content-newline": "off",
    "vue/html-indent": "off",
    "vue/comma-dangle": "off",
    "vue/operator-linebreak": "off",
    "vue/html-closing-bracket-newline": "off",

    // TypeScript rules
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-unused-vars": "off",

    // General rules
    "no-console": "off",
    "no-debugger": "off",
  },
});
