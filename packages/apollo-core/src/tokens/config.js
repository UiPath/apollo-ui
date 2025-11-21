module.exports = {
  source: ['src/tokens/**/*.json'],
  format: require('./formats'),
  platforms: {
    scss: {
      transformGroup: 'scss',
      buildPath: 'dist/tokens/scss/',
      files: [
        {
          destination: '_variables.scss',
          format: 'scss/map-deep',
          options: {
            showFileHeader: false,
          },
        },
        {
          destination: 'base-host.scss',
          format: 'scss/base-host',
          filter: {
            attributes: {
              category: 'color',
            },
          },
          options: {
            showFileHeader: false,
          },
        },
        {
          destination: 'theme-variables.scss',
          format: 'scss/theme-variables',
          filter: {
            attributes: {
              category: 'color',
            },
          },
          options: {
            showFileHeader: false,
          },
        },
        {
          destination: 'theme.scss',
          format: 'scss/theme',
          filter: {
            attributes: {
              category: 'color',
            },
          },
          options: {
            showFileHeader: false,
          },
        },
      ],
    },
    css: {
      transformGroup: 'css',
      buildPath: 'dist/tokens/css/',
      files: [
        {
          format: 'css/variables',
          destination: 'variables.css',
          options: {
            showFileHeader: false,
          },
        },
        {
          destination: 'theme-variables.css',
          format: 'css/theme-variables',
          filter: {
            attributes: {
              category: 'color',
            },
          },
          options: {
            showFileHeader: false,
          },
        },
      ],
    },
    less: {
      transformGroup: 'less',
      buildPath: 'dist/tokens/less/',
      files: [
        {
          destination: '_variables.less',
          format: 'less/variables',
          options: {
            showFileHeader: false,
          },
        },
      ],
    },
    js: {
      transformGroup: 'js',
      buildPath: 'dist/tokens/_generated/',
      files: [
        {
          destination: 'Colors.ts',
          format: 'javascript/es6',
          filter: {
            attributes: {
              category: 'color',
            },
          },
          options: {
            showFileHeader: false,
          },
        },
        {
          format: 'javascript/es6',
          destination: 'FontFamily.ts',
          filter: {
            attributes: {
              category: 'font',
            },
          },
          options: {
            showFileHeader: false,
          },
        },
        {
          destination: 'Typography.ts',
          filter: {
            attributes: {
              category: 'font',
            },
          },
          format: 'typography',
        },
        {
          format: 'javascript/es6',
          destination: 'ScreenSizes.ts',
          filter: {
            attributes: {
              category: 'screen',
            },
          },
          options: {
            showFileHeader: false,
          },
        },
        {
          format: 'javascript/es6',
          destination: 'Padding.ts',
          filter: {
            attributes: {
              category: 'pad',
            },
          },
          options: {
            showFileHeader: false,
          },
        },
        {
          format: 'javascript/es6',
          destination: 'Shadow.ts',
          filter: {
            attributes: {
              category: 'shadow',
            },
          },
          options: {
            showFileHeader: false,
          },
        },
        {
          format: 'javascript/es6',
          destination: 'Icon.ts',
          filter: {
            attributes: {
              category: 'icon',
            },
          },
          options: {
            showFileHeader: false,
          },
        },
        {
          format: 'javascript/es6',
          destination: 'Stroke.ts',
          filter: {
            attributes: {
              category: 'stroke',
            },
          },
          options: {
            showFileHeader: false,
          },
        },
        {
          format: 'javascript/es6',
          destination: 'Border.ts',
          filter: {
            attributes: {
              category: 'border',
            },
          },
          options: {
            showFileHeader: false,
          },
        },
        {
          format: 'javascript/es6',
          destination: 'Spacing.ts',
          filter: {
            attributes: {
              category: 'spacing',
            },
          },
          options: {
            showFileHeader: false,
          },
        },
      ],
    },
    ts: {
      transformGroup: 'js',
      buildPath: 'dist/tokens/jss/',
      files: [
        {
          destination: 'palette.ts',
          format: 'palette',
          filter: {
            attributes: {
              category: 'color',
            },
          },
          options: {
            showFileHeader: false,
          },
        },
      ],
    },
  },
};
