// Attribute types to be excluded from the generated Typography tokens (since they are not in design)
const EXCLUDED_TYPES = ['normal', 'title', 'mono', 'weight', 'micro', 'left-rail'];

// Convert the attribute item to the CSS property name
const CONVERT_PROP = {
  family: 'fontFamily',
  size: 'fontSize',
  weight: 'fontWeight',
  line_height: 'lineHeight',
  letter_spacing: 'letterSpacing',
};

const getCommonPrefix = (type) => {
  if (type.includes('brand') || type.includes('mono')) {
    return 'font';
  }

  return 'fontSize';
};

const typography = (dictionary) => {
  const final = {};
  // Map design token name to apollo-core defined token
  let typeExport = `export enum FontVariantToken {\n`;
  let headerExport = `export const HeaderVariants = {\n`;

  dictionary.allProperties
    // filter out unwanted tokens
    .filter((prop) => {
      return !EXCLUDED_TYPES.includes(prop.attributes.type);
    })
    .forEach(function (prop) {
      let type = prop.attributes.type.replace('header', 'h');
      const upperSentenceType = type.charAt(0).toUpperCase() + type.slice(1);
      const name = getCommonPrefix(prop.attributes.type) + upperSentenceType;
      const nextType = `    ${name} = '${prop.attributes.type}',\n`;
      const isHeader = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(prop.comment);

      if (!typeExport.includes(nextType)) {
        typeExport += nextType;
      }

      if (isHeader && !headerExport.includes(name)) {
        headerExport += `    ${prop.attributes.type}: '${prop.comment[1]}',\n`;
      }

      if (!final[name]) {
        final[name] = {};
      }

      final[name][CONVERT_PROP[prop.attributes.item]] = prop.value;
    });

  headerExport += `};\n\n`;
  typeExport += `}\n\n`;

  return (
    headerExport +
    typeExport +
    Object.keys(final)
      .map((key) => {
        return `export const ${key} = ${JSON.stringify(final[key], null, 4).replace(/"/g, "'")};`;
      })
      .join('\n\n') +
    '\n'
  );
};

module.exports = {
  typography,
};
