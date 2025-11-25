import * as Icons from '../icons';

export const iconNames = Object.keys(Icons)
  .filter(name => !name.endsWith('Icon'))
  .sort();
