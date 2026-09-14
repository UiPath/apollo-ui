import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * The scans a hand-authored catalog needs, shared by every component's i18n test.
 *
 * `src/canvas` uses no lingui macros, so `lingui extract` never feeds
 * `src/canvas/locales/*.json`: the ids are hand-authored and the translations are harvested
 * from the two host products' own catalogs by a one-off script, not by a pipeline. These
 * functions are what `extract` and that pipeline would otherwise be doing, which makes them
 * the only thing standing between a new string and an untranslatable one. They report rather
 * than assert, so a failure points at the calling test's own line.
 */

/** Every locale whose catalog carries translations. */
export const TRANSLATED_LOCALES = [
  'de',
  'es',
  'es-MX',
  'fr',
  'ja',
  'ko',
  'pt',
  'pt-BR',
  'ro',
  'tr',
  'zh-CN',
  'zh-TW',
];

/**
 * Every catalog file. `ru` sits between English and the translated set: both products ship it
 * empty and apollo-react's `ru` falls back to English by convention, so it is out of the
 * coverage scan but inside the orphan scan. Deliberately empty is not licence to keep a
 * stale id.
 */
export const CANVAS_LOCALES = ['en', 'ru', ...TRANSLATED_LOCALES];

const localesDir = join(dirname(fileURLToPath(import.meta.url)), '../../../locales');

export const readCanvasCatalog = (locale: string): Record<string, string> =>
  JSON.parse(readFileSync(join(localesDir, `${locale}.json`), 'utf8'));

/**
 * Ids the source declares that English does not carry, and ids whose English has drifted away
 * from the source default. A drifted entry is the worse of the two: it translates, but into
 * something the component never says.
 */
export function findCatalogDrift(messages: Readonly<Record<string, string>>): {
  missing: string[];
  drifted: string[];
} {
  const catalog = readCanvasCatalog('en');
  const missing: string[] = [];
  const drifted: string[] = [];
  for (const [id, message] of Object.entries(messages)) {
    if (!(id in catalog)) missing.push(id);
    else if (catalog[id] !== message)
      drifted.push(`${id}\n    src: ${message}\n    en:  ${catalog[id]}`);
  }

  return { missing, drifted };
}

/**
 * `locale: id` for every id under `prefix` that the source no longer declares, across all
 * thirteen catalogs. A renamed id otherwise leaves twelve dead translations behind.
 */
export function findCatalogOrphans(
  messages: Readonly<Record<string, string>>,
  prefix: string
): string[] {
  return CANVAS_LOCALES.flatMap((locale) =>
    Object.keys(readCanvasCatalog(locale))
      .filter((id) => id.startsWith(prefix))
      .filter((id) => !(id in messages))
      .map((id) => `${locale}: ${id}`)
  );
}

/** `locale: id` for every source message a translated locale leaves empty or absent. */
export function findCatalogGaps(messages: Readonly<Record<string, string>>): string[] {
  return TRANSLATED_LOCALES.flatMap((locale) => {
    const catalog = readCanvasCatalog(locale);
    return Object.keys(messages)
      .filter((id) => !catalog[id])
      .map((id) => `${locale}: ${id}`);
  });
}
