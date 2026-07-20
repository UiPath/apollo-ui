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


