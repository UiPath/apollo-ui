import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * The scans a hand-authored catalog needs, for any component's i18n test.
 *
 * `src/canvas` uses no lingui macros, so `lingui extract` never feeds
 * `src/canvas/locales/*.json`: the English ids are hand-authored. Translations are not ours to
 * write - `chore(l10n): sync from Localization` appends them every week or two - so these
 * scans cover what a PR is actually responsible for: that English matches the source, and that
 * no catalog keeps an id the source has dropped. They report rather than assert, so a failure
 * points at the calling test's own line.
 */

/** Every catalog file, including the locales the sync has yet to reach. */
export const CANVAS_LOCALES = [
  'en',
  'ru',
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
 * fourteen catalogs. A renamed id otherwise leaves the sync's translations behind as dead
 * entries nothing will ever clean up.
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
