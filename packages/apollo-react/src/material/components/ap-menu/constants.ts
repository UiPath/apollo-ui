import type { IMenuItem } from './ApMenu.types';

export const debugItems: IMenuItem[] = [
  {
    variant: 'section',
    title: 'Section Header',
  },
  {
    variant: 'item',
    title: 'Menu Item 1',
    subtitle: 'With subtitle',
  },
  {
    variant: 'item',
    title: 'Menu Item 2',
  },
  {
    variant: 'separator',
  },
  {
    variant: 'submenu',
    title: 'Submenu',
    subItems: [
      {
        variant: 'item',
        title: 'Submenu Item 1',
      },
      {
        variant: 'item',
        title: 'Submenu Item 2',
      },
    ],
  },
];
