import type { CityBuildingDefinition } from "../buildings/buildingTypes";

export const CITY_BUILDINGS: CityBuildingDefinition[] = [
  {
    id: "daily-proof-inc",
    name: "DAILY PROOF INC.",
    type: "company",
    worldPosition: { x: 72, y: 72 },
    size: { width: 344, height: 180 },
    interactionZone: { x: 184, y: 252, width: 120, height: 108 },
    entrancePoint: { x: 244, y: 282 },
    destination: {
      sceneKey: "office-daily-proof",
      routeId: "daily-proof-lobby",
      enabled: true,
    },
    active: true,
    visual: {
      wall: 0xe76f51,
      roof: 0x263b50,
      accent: 0xf4c85d,
    },
  },
  {
    id: "ai-lab",
    name: "AI LAB",
    type: "lab",
    worldPosition: { x: 735, y: 78 },
    size: { width: 326, height: 168 },
    interactionZone: { x: 838, y: 246, width: 120, height: 104 },
    entrancePoint: { x: 898, y: 276 },
    destination: {
      sceneKey: "office-ai-lab",
      routeId: "ai-lab-lobby",
      enabled: false,
    },
    active: false,
    visual: {
      wall: 0x7397c2,
      roof: 0x34465b,
      accent: 0x9de6ec,
    },
  },
  {
    id: "portfolio-studio",
    name: "PORTFOLIO STUDIO",
    type: "studio",
    worldPosition: { x: 760, y: 490 },
    size: { width: 350, height: 166 },
    interactionZone: { x: 875, y: 660, width: 120, height: 112 },
    entrancePoint: { x: 935, y: 690 },
    destination: {
      sceneKey: "office-portfolio-studio",
      routeId: "portfolio-studio-lobby",
      enabled: false,
    },
    active: false,
    visual: {
      wall: 0xa67bb8,
      roof: 0x493c5a,
      accent: 0xf0b7d2,
    },
  },
];