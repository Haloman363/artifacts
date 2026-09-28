// Every filter the UI can add: the engine's full list plus our local stages.
import { filterList, glAvailable } from "@gyng/ditherer-filters";
import { scriptSlayer } from "./scriptSlayer.js";

const hasGL = glAvailable();

export const CATALOG = [
  {
    displayName: "Script Slayer (ASCII)",
    filter: scriptSlayer,
    category: "Script Slayer",
    description: scriptSlayer.description,
  },
  ...filterList.filter((e) => e.category !== "None"),
].map((e) => ({ ...e, disabled: !!e.filter.requiresGL && !hasGL }));

export const CATEGORIES = [...new Set(CATALOG.map((e) => e.category))];

const byName = new Map(CATALOG.map((e) => [e.displayName, e]));
export const findEntry = (displayName) => byName.get(displayName);
