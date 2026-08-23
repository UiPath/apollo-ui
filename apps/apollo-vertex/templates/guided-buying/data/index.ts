// Public surface of the J3 shared data module. Wiring catalog/v1 and
// requests to this module is a later prompt; workbench already reads from
// it (see cockpit-10482.ts and exceptions.ts).

export * from "./analytics";
export * from "./cockpit-10482";
export * from "./exceptions";
export * from "./journeys";
export * from "./people";
export * from "./placeholders";
export * from "./req-10482";
