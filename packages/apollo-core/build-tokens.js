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

// `css/variables` emits base tokens (palette, fonts, radius) under bare `:root {}`,
// which never matches inside a shadow root — so shadow-DOM consumers (traceview WC,
// ap-chat) fall back to Tailwind defaults. Adding `:host` scopes the tokens to the
// shadow host too (inherited through the tree); `:root` still covers the light DOM.
// Delegating to the built-in formatter keeps the token body byte-identical.
StyleDictionary.registerFormat({
  name: 'css/variables-shadow-host',
  formatter: function (dictionary, platform) {
    const css = StyleDictionary.format['css/variables'].call(this, dictionary, platform);
    const scoped = css.replace(':root {', ':root, :host {');
    // Fail loud if the selector didn't change: a silent no-op (e.g. if a future
    // Style Dictionary version emits `:root{` or reformats the block) would
    // regenerate `variables.css` back to bare `:root {}` and reintroduce the
    // shadow-DOM token-scoping bug this format exists to fix, with no signal.
    if (scoped === css) {
      throw new Error(
        "css/variables-shadow-host: expected ':root {' in the built-in css/variables output but found none — " +
          'the selector was not rewritten to :root, :host. Shadow-DOM base tokens would be lost.'
      );
    }
    return scoped;
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


