import type { OfficeDefinition } from "./officeTypes";

export const DAILY_PROOF_OFFICE_SCENE_KEY = "office-daily-proof";

export const OFFICE_DEFINITIONS: OfficeDefinition[] = [
  {
    sceneKey: DAILY_PROOF_OFFICE_SCENE_KEY,
    buildingId: "daily-proof-inc",
    companyName: "DAILY PROOF INC.",
    worldBounds: { x: 0, y: 0, width: 960, height: 600 },
    walkableBounds: { x: 48, y: 72, width: 864, height: 468 },
    founderSpawn: { x: 480, y: 490 },
    exitZone: { x: 420, y: 510, width: 120, height: 54 },
  },
];
