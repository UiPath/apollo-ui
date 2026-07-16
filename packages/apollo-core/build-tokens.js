/* eslint-disable @typescript-eslint/no-require-imports */
const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const StyleDictionary = require('style-dictionary').extend(require('./src/tokens/config'));

const templateDir = path.join(__dirname, 'src/tokens/templates');

StyleDictionary.registerFormat({
  name: 'palette',
  formatter: _.template(fs.readFileSync(path.join(templateDir, 'palette.template'))),
});

StyleDictionary.registerFormat({
  name: 'scss/base-host',
  formatter: _.template(fs.readFileSync(path.join(templateDir, 'base-host.template'))),
});

StyleDictionary.registerFormat({
  name: 'scss/theme-variables',
  formatter: _.template(fs.readFileSync(path.join(templateDir, 'theme-variables.template'))),
});

StyleDictionary.registerFormat({
  name: 'scss/theme',
  formatter: _.template(fs.readFileSync(path.join(templateDir, 'theme.template'))),
});

StyleDictionary.registerFormat({
  name: 'css/theme-variables',
  formatter: _.template(fs.readFileSync(path.join(templateDir, 'css-theme-variables.template'))),
});

// The built-in `css/variables` format emits `variables.css`'s base tokens
// (palette, fonts, radius) under bare `:root {}`, which never matches inside a
// shadow root (`:root` = <html>; a shadow root is a DocumentFragment).
//
// So shadow-DOM canvas consumers (traceview's web component, ap-chat) lose the
// fonts and fall back to Tailwind's `ui-monospace`. Emitting `:root, :host` too
// makes the base tokens apply to any shadow host that adopts/injects this sheet;
// they then inherit through the whole shadow tree (including portaled content),
// with no `.apollo-design` wrapper required. In the light DOM `:root` still
// applies; `:host` simply matches nothing there.
//
// Delegating to the built-in formatter keeps the generated token body
// byte-identical; only the selector changes.
StyleDictionary.registerFormat({
  name: 'css/variables-shadow-host',
  formatter: function (dictionary, platform) {
    return StyleDictionary.format['css/variables']
      .call(this, dictionary, platform)
      .replace(':root {', ':root, :host {');
  },
});

StyleDictionary.registerFormat({
  name: 'scss/scoped-theme-variables',
  formatter: _.template(fs.readFileSync(path.join(templateDir, 'scoped-theme-variables.template'))),
});

StyleDictionary.registerFormat({
  name: 'scss/css-variables-mixin',
  formatter: function (dictionary) {
    const props = dictionary.allProperties
      .map((p) => {
        let line = `  --${p.name}: ${p.value};`;
        if (p.comment) line += ` /* ${p.comment} */`;
        return line;
      })
      .join('\n');
    return `@mixin css-variables {\n${props}\n}\n`;
  },
});

StyleDictionary.buildAllPlatforms();

// Hand-written SCSS (helpers, mixins) shipped alongside the generated files so
// consumers migrating from the apollo-design-system apollo-core v4 package can
// keep their deep imports. Copied here because src/tokens/scss/ is gitignored.
const staticScssDir = path.join(__dirname, 'src/tokens/scss-static');
const generatedScssDir = path.join(__dirname, 'src/tokens/scss');
for (const file of fs.readdirSync(staticScssDir)) {
  fs.copyFileSync(path.join(staticScssDir, file), path.join(generatedScssDir, file));
}


