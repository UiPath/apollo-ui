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

// `variables.css` holds the theme-invariant base tokens (raw color palette,
// font families, radius, …). Style Dictionary's built-in `css/variables` format
// scopes them to `:root {}` only, which does NOT match inside a shadow root:
// `:root` matches the document element (<html>), and a shadow root is a
// DocumentFragment, not an element. Shadow-DOM consumers (e.g. web-component
// embeds of the canvas) therefore never receive these tokens and fall back to
// Tailwind's generic `ui-monospace` mono stack / undefined fonts. Emit
// `:root, :host` instead so the base tokens also apply to — and inherit from —
// the shadow host. Delegates to the built-in formatter, so the generated token
// body stays byte-identical; only the selector changes.
StyleDictionary.registerFormat({
  name: 'css/variables-host',
  formatter: function (dictionary, platform) {
    return StyleDictionary.format['css/variables']
      .call(this, dictionary, platform)
      .replace(':root {', ':root, :host {');
  },
});

StyleDictionary.buildAllPlatforms();


