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

// Copy generated tokens from dist/tokens/_generated to src/tokens/_generated for rslib bundling
const srcGenerated = path.join(__dirname, 'src/tokens/_generated');
const distGenerated = path.join(__dirname, 'dist/tokens/_generated');

// Create src/tokens/_generated directory if it doesn't exist
if (!fs.existsSync(srcGenerated)) {
  fs.mkdirSync(srcGenerated, { recursive: true });
}

// Copy all generated .ts files
const generatedFiles = fs.readdirSync(distGenerated);
generatedFiles.forEach((file) => {
  if (file.endsWith('.ts')) {
    fs.copyFileSync(path.join(distGenerated, file), path.join(srcGenerated, file));
  }
});

// Also copy CSS/SCSS/LESS/JSS to .tokens-temp for rslib to copy after clearing dist
const tempDir = path.join(__dirname, '.tokens-temp');
if (fs.existsSync(tempDir)) {
  fs.rmSync(tempDir, { recursive: true });
}
fs.mkdirSync(tempDir, { recursive: true });

// Copy the generated style files
['css', 'scss', 'less', 'jss'].forEach((dir) => {
  const src = path.join(__dirname, 'dist/tokens', dir);
  const dest = path.join(tempDir, dir);
  if (fs.existsSync(src)) {
    fs.cpSync(src, dest, { recursive: true });
  }
});
