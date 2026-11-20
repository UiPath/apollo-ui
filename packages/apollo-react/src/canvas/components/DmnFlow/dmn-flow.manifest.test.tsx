import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { categoryManifestSchema } from '../../schema/node-definition/category-manifest';
import { nodeManifestSchema } from '../../schema/node-definition/node-manifest';
import { isContainerNodeManifest } from '../../utils/container';
import { getIcon } from '../../utils/icon-registry';
import { render } from '../../utils/testing';
import {
  DMN_ICON,
  DMN_REQUIREMENT_SOURCE_HANDLE,
  DMN_REQUIREMENT_TARGET_HANDLE,
  dmnFlowManifest,
} from './dmn-flow.manifest';

const nodeOf = (nodeType: string) => {
  const node = dmnFlowManifest.nodes.find((candidate) => candidate.nodeType === nodeType);
  if (!node) throw new Error(`No manifest for ${nodeType}`);
  return node;
};

const targetHandlesOf = (nodeType: string) =>
  nodeOf(nodeType)
    .handleConfiguration.filter((config) => config.position === 'bottom')
    .flatMap((config) => config.handles.map((handle) => handle.id));

describe('dmnFlowManifest', () => {
  it('parses against the node and category schemas', () => {
    for (const node of dmnFlowManifest.nodes) {
      expect(() => nodeManifestSchema.parse(node)).not.toThrow();
    }
    for (const category of dmnFlowManifest.categories) {
      expect(() => categoryManifestSchema.parse(category)).not.toThrow();
    }
  });

  it('gives every element a requirement source handle on top', () => {
    for (const node of dmnFlowManifest.nodes) {
      const top = node.handleConfiguration.find((config) => config.position === 'top');
      expect(top?.handles.map((handle) => handle.id)).toEqual([DMN_REQUIREMENT_SOURCE_HANDLE]);
    }
  });

  it('gives each element one target handle per requirement kind it can receive', () => {
    const { knowledgeRequirement, informationRequirement, authorityRequirement } =
      DMN_REQUIREMENT_TARGET_HANDLE;

    expect(targetHandlesOf('dmn:decision')).toEqual([
      knowledgeRequirement,
      informationRequirement,
      authorityRequirement,
    ]);
    expect(targetHandlesOf('dmn:businessKnowledgeModel')).toEqual([
      knowledgeRequirement,
      authorityRequirement,
    ]);
    expect(targetHandlesOf('dmn:knowledgeSource')).toEqual([authorityRequirement]);
    expect(targetHandlesOf('dmn:inputData')).toEqual([]);
    expect(targetHandlesOf('dmn:textAnnotation')).toEqual([]);
  });

  it('gives each requirement element its own tile token', () => {
    const tiles = dmnFlowManifest.nodes
      .filter((node) => node.nodeType !== 'dmn:textAnnotation')
      .map((node) => node.display.iconBackground);

    for (const tile of tiles) expect(tile).toMatch(/^var\(--canvas-dmn-[a-z-]+-tile\)$/);
    expect(new Set(tiles).size).toBe(tiles.length);
  });

  it('keeps every element a leaf node, not a structural container', () => {
    for (const node of dmnFlowManifest.nodes) {
      expect(isContainerNodeManifest(node)).toBe(false);
    }
  });
});

describe('DMN icons', () => {
  it('gives every element an icon from the DMN family', () => {
    const family: string[] = Object.values(DMN_ICON);
    for (const node of dmnFlowManifest.nodes) expect(family).toContain(node.display.icon);
  });

  it.each(Object.values(DMN_ICON))('registers %s as a lucide icon sized for the tile', (id) => {
    const Icon = getIcon(id);
    const { container } = render(<Icon w={24} h={24} />);
    const svg = container.querySelector('svg');

    expect(svg).toHaveClass('lucide');
    expect(svg).not.toHaveClass('lucide-box');
    // Drawn at 86% of its box with a 1.5 stroke: the viewBox widens to 27.87 around the centre,
    // and the stroke is set in the widened units.
    expect(svg?.getAttribute('viewBox')).toBe('-1.935 -1.935 27.871 27.871');
    expect(Number(svg?.getAttribute('stroke-width'))).toBeCloseTo(1.742, 3);
    expect(svg?.getAttribute('style')).toBeNull();
  });
});

describe('DMN tile tokens', () => {
  const variablesCss = readFileSync(resolve(__dirname, '../../styles/variables.css'), 'utf8');
  const LIGHT_THEMES = ['body.light', 'body.light-hc', '.future-light', '.wireframe'];
  const DARK_THEMES = ['body.dark', 'body.dark-hc', '.future-dark', '.vertex', '.canvas'];
  const tokens = dmnFlowManifest.nodes
    .map((node) => node.display.iconBackground?.match(/var\((--[a-z-]+)\)/)?.[1])
    .filter((token): token is string => token !== undefined);

  /** Each rule's selectors and the DMN tile values it sets. */
  const rules = [...variablesCss.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selectors, body]) => ({
    selectors: selectors
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .split(',')
      .map((selector) => selector.trim()),
    values: Object.fromEntries(
      [...body.matchAll(/(--canvas-dmn-[a-z-]+):\s*([^;]+);/g)].map(([, name, value]) => [
        name,
        value.trim(),
      ])
    ),
  }));
  const valueFor = (theme: string, token: string) =>
    rules.find((rule) => rule.selectors.includes(theme) && token in rule.values)?.values[token];

  it.each([...LIGHT_THEMES, ...DARK_THEMES])('defines every tile token for %s', (theme) => {
    for (const token of tokens) expect(valueFor(theme, token)).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('uses the dark tiles for every dark theme, the light tiles for every light one', () => {
    for (const token of tokens) {
      const light = valueFor('body.light', token);
      const dark = valueFor('body.dark', token);
      expect(light).not.toBe(dark);
      for (const theme of LIGHT_THEMES) expect(valueFor(theme, token)).toBe(light);
      for (const theme of DARK_THEMES) expect(valueFor(theme, token)).toBe(dark);
    }
  });
});
