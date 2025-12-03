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

StyleDictionary.buildAllPlatforms();


