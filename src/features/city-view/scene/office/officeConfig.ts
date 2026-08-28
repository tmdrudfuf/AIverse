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
    interiorFoundation: {
      zones: [
        {
          id: "daily-proof-reception",
          label: "Reception",
          role: "reception",
          bounds: { x: 288, y: 72, width: 384, height: 72 },
          accentColor: 0x5f7f8d,
          enabled: true,
          markerId: "reception_zone",
        },
        {
          id: "daily-proof-founder-desk",
          label: "Founder Desk",
          role: "founder-desk",
          bounds: { x: 96, y: 336, width: 168, height: 96 },
          accentColor: 0xf4c85d,
          enabled: true,
          markerId: "future_desk_zone_01",
        },
        {
          id: "daily-proof-workspace",
          label: "Project Workspace",
          role: "workspace",
          bounds: { x: 408, y: 264, width: 144, height: 72 },
          accentColor: 0x9de2e4,
          enabled: true,
          markerId: "future_computer_zone_01",
        },
        {
          id: "daily-proof-employee-desk",
          label: "Employee Desk",
          role: "employee-desk",
          bounds: { x: 696, y: 336, width: 168, height: 96 },
          accentColor: 0xbf7ea2,
          enabled: true,
          markerId: "future_desk_zone_02",
        },
      ],
    },
    tilemap: {
      mapKey: "office-daily-proof-map",
      mapUrl: "/assets/office/daily-proof/daily-proof-office.tmj",
      tilesets: [
        {
          name: "office-tiles",
          key: "office-daily-proof-tiles",
          url: "/assets/office/daily-proof/office-tiles.png",
        },
      ],
      layers: {
        floor: "Floor Layer",
        wall: "Wall Layer",
        decoration: "Decoration Layer",
        collision: "Collision Layer",
        objects: "Object Layer",
        interaction: "Interaction Layer",
      },
    },
  },
];
