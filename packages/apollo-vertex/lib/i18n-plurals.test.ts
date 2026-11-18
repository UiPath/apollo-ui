import { createInstance, type InitOptions, type Resource } from "i18next";
import { describe, expect, it, vi } from "vitest";

import { addVertexTranslations, readMissingPluralFormsFromOther } from "./i18n";

const files = (one: string, other: string) => ({
  translation: { files_one: one, files_other: other },
});

const en = files("{{count}} file", "{{count}} files");
const ro = files("{{count}} fișier", "{{count}} fișiere");
const ru = files("{{count}} файл", "{{count}} файлов");

const setup = async (
  lng: string,
  resources: Resource,
  options: InitOptions = {},
) => {
  const instance = createInstance();
  await instance.init({ lng, fallbackLng: "en", resources, ...options });
  return instance;
};

const render = (i18n: Awaited<ReturnType<typeof setup>>, counts: number[]) =>
  counts.map((count) => i18n.t("files", { count }));

describe("readMissingPluralFormsFromOther", () => {
  it("reads Romanian 'few' numbers from _other instead of showing English", async () => {
    const i18n = await setup("ro", { en, ro });
    expect(i18n.t("files", { count: 5 })).toBe("5 files");

    readMissingPluralFormsFromOther(i18n);

    expect(render(i18n, [0, 1, 2, 19, 20, 101])).toEqual([
      "0 fișiere",
      "1 fișier",
      "2 fișiere",
      "19 fișiere",
      "20 fișiere",
      "101 fișiere",
    ]);
  });

  it("reads Russian 'few' and 'many' from _other and keeps 'one'", async () => {
    const i18n = await setup("ru", { en, ru });
    readMissingPluralFormsFromOther(i18n);

    expect(render(i18n, [1, 2, 5, 21])).toEqual([
      "1 файл",
      "2 файлов",
      "5 файлов",
      "21 файл",
    ]);
  });

  it("keeps the forms of a catalog that has them", async () => {
    const i18n = await setup("ru", {
      en,
      ru: {
        translation: ru.translation,
        library: {
          files_one: "{{count}} файл",
          files_few: "{{count}} файла",
          files_many: "{{count}} файлов",
          files_other: "{{count}} файла",
        },
      },
    });
    readMissingPluralFormsFromOther(i18n);

    expect([
      i18n.t("files", { count: 2 }),
      i18n.t("library:files", { count: 2 }),
      i18n.t("library:files", { count: 5 }),
    ]).toEqual(["2 файлов", "2 файла", "5 файлов"]);
  });

  it("still shows English for a string with no translation", async () => {
    const i18n = await setup("ro", { en, ro: { translation: {} } });
    readMissingPluralFormsFromOther(i18n);

    expect(i18n.t("files", { count: 5 })).toBe("5 files");
  });

  it("reads _other at 0 where the language's form for 0 is zero", async () => {
    const i18n = await setup("ar", {
      en,
      ar: files("ملف", "{{count}} ملفات"),
    });
    readMissingPluralFormsFromOther(i18n);

    expect(render(i18n, [0, 5])).toEqual(["0 ملفات", "5 ملفات"]);
  });

  it("keeps a null or empty translation the app's settings accept", async () => {
    const withNull = await setup(
      "ru",
      { en, ru: { translation: { ...ru.translation, files_few: null } } },
      { returnNull: true },
    );
    const withEmpty = await setup("ru", {
      en,
      ru: { translation: { ...ru.translation, files_few: "" } },
    });
    readMissingPluralFormsFromOther(withNull);
    readMissingPluralFormsFromOther(withEmpty);

    expect(withNull.t("files", { count: 2 })).toBeNull();
    expect(withEmpty.t("files", { count: 2 })).toBe("");
  });

  it("leaves keys alone that only end in a plural form", async () => {
    const i18n = await setup("ru", {
      en: {
        translation: {
          ...en.translation,
          select_many: "Select {{count}}",
          select_other: "Unrelated",
        },
      },
      ru: { translation: { ...ru.translation, select_other: "Другое" } },
    });
    readMissingPluralFormsFromOther(i18n);

    expect([
      i18n.t("select_many", { count: 5 }),
      i18n.t("files", { count: 1, context: "few" }),
      i18n.t("files", { count: 5, context: "few" }),
    ]).toEqual(["Select 5", "1 файл", "5 файлов"]);
  });

  it("reads _other for keys with a key prefix", async () => {
    const i18n = await setup("ro", {
      en: { translation: { invoice: en.translation } },
      ro: { translation: { invoice: ro.translation } },
    });
    readMissingPluralFormsFromOther(i18n);

    const t = i18n.getFixedT(null, null, "invoice");
    expect(t("files", { count: 5 })).toBe("5 fișiere");
  });

  it("works with underscore language codes", async () => {
    const i18n = await setup("ru_RU", { en, ru_RU: ru });
    readMissingPluralFormsFromOther(i18n);

    expect(i18n.t("files", { count: 5 })).toBe("5 файлов");
  });

  it("uses a custom plural separator", async () => {
    const i18n = await setup(
      "ro",
      {
        en: {
          translation: {
            "files.one": "{{count}} file",
            "files.other": "{{count}} files",
          },
        },
        ro: {
          translation: {
            "files.one": "{{count}} fișier",
            "files.other": "{{count}} fișiere",
          },
        },
      },
      { pluralSeparator: ".", keySeparator: false },
    );
    readMissingPluralFormsFromOther(i18n);

    expect(i18n.t("files", { count: 5 })).toBe("5 fișiere");
  });

  it("leaves ordinal plurals unchanged", async () => {
    const i18n = await setup("en", {
      en: {
        translation: {
          place_ordinal_one: "{{count}}st",
          place_ordinal_two: "{{count}}nd",
          place_ordinal_few: "{{count}}rd",
          place_ordinal_other: "{{count}}th",
        },
      },
    });
    readMissingPluralFormsFromOther(i18n);

    const places = [1, 2, 3, 4].map((count) =>
      i18n.t("place", { count, ordinal: true }),
    );
    expect(places).toEqual(["1st", "2nd", "3rd", "4th"]);
  });

  it("does not change the catalogs, even frozen ones", async () => {
    const frozen = Object.freeze({
      translation: Object.freeze({ ...ro.translation }),
    });
    const i18n = await setup("ro", { en, ro: frozen });
    readMissingPluralFormsFromOther(i18n);

    expect(i18n.t("files", { count: 5 })).toBe("5 fișiere");
    expect(i18n.getResourceBundle("ro", "translation")).toEqual(ro.translation);
  });

  it("is safe to apply twice", async () => {
    const i18n = await setup("ro", { en, ro });
    readMissingPluralFormsFromOther(i18n);
    readMissingPluralFormsFromOther(i18n);

    expect(i18n.t("files", { count: 5 })).toBe("5 fișiere");
  });

  it("applies once the instance is initialized when called before init", async () => {
    const i18n = createInstance();
    readMissingPluralFormsFromOther(i18n);
    await i18n.init({ lng: "ro", fallbackLng: "en", resources: { en, ro } });

    expect(i18n.t("files", { count: 5 })).toBe("5 fișiere");
  });

  it("stays applied when the app calls init again", async () => {
    const i18n = await setup("ro", { en, ro });
    readMissingPluralFormsFromOther(i18n);
    await i18n.init({ lng: "ro", fallbackLng: "en", resources: { en, ro } });

    expect(i18n.t("files", { count: 5 })).toBe("5 fișiere");
  });

  it("still reads an explicit _zero key for a count of 0", async () => {
    const i18n = await setup("ro", {
      en,
      ro: { translation: { ...ro.translation, files_zero: "Niciun fișier" } },
    });
    readMissingPluralFormsFromOther(i18n);

    expect(render(i18n, [0, 5])).toEqual(["Niciun fișier", "5 fișiere"]);
  });

  it("reports only _one and _other keys as missing", async () => {
    const missing: string[] = [];
    const i18n = await setup(
      "ru",
      { en, ru },
      {
        saveMissing: true,
        saveMissingPlurals: true,
        saveMissingTo: "current",
        missingKeyHandler: (_lngs, _ns, key) => missing.push(key),
      },
    );
    readMissingPluralFormsFromOther(i18n);
    i18n.t("photos", { count: 5 });

    expect(missing).toEqual(["photos_one", "photos_other"]);
  });

  it("is applied by addVertexTranslations", async () => {
    const i18n = await setup("ro", { en, ro });
    await addVertexTranslations(i18n);

    expect(i18n.t("files", { count: 5 })).toBe("5 fișiere");
  });

  it("stays applied when a second copy of the package registers", async () => {
    const i18n = await setup("ro", { en, ro });
    vi.resetModules();
    const firstCopy = await import("./i18n");
    vi.resetModules();
    const secondCopy = await import("./i18n");
    await firstCopy.addVertexTranslations(i18n);
    await secondCopy.addVertexTranslations(i18n);

    expect(render(i18n, [1, 5, 20])).toEqual([
      "1 fișier",
      "5 fișiere",
      "20 fișiere",
    ]);
  });
});
