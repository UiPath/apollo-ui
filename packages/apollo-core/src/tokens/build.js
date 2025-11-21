const _ = require('lodash');
const fs = require('fs');
const StyleDictionary = require('style-dictionary').extend(require('./config'));

StyleDictionary.registerFormat({
  name: 'palette',
  formatter: _.template(fs.readFileSync(`${__dirname}/templates/palette.template`)),
});

StyleDictionary.registerFormat({
  name: 'scss/base-host',
  formatter: _.template(fs.readFileSync(`${__dirname}/templates/base-host.template`)),
});

StyleDictionary.registerFormat({
  name: 'scss/theme-variables',
  formatter: _.template(fs.readFileSync(`${__dirname}/templates/theme-variables.template`)),
});

StyleDictionary.registerFormat({
  name: 'scss/theme',
  formatter: _.template(fs.readFileSync(`${__dirname}/templates/theme.template`)),
});

StyleDictionary.registerFormat({
  name: 'css/theme-variables',
  formatter: _.template(fs.readFileSync(`${__dirname}/templates/css-theme-variables.template`)),
});

StyleDictionary.buildAllPlatforms();
