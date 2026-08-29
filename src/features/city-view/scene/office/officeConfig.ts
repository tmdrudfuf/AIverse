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
    visualEnvironment: {
      details: [
        {
          id: "daily-proof-brand-wall",
          kind: "brand-sign",
          label: "Proof Wall",
          bounds: { x: 372, y: 92, width: 216, height: 24 },
          accentColor: 0x253247,
          enabled: true,
          markerId: "brand_wall",
        },
        {
          id: "daily-proof-lobby-greenery",
          kind: "plant",
          label: "Lobby Greenery",
          bounds: { x: 220, y: 116, width: 52, height: 52 },
          accentColor: 0x4f9f67,
          enabled: true,
          markerId: "lobby_plant",
        },
        {
          id: "daily-proof-focus-lights",
          kind: "lighting",
          label: "Focus Lights",
          bounds: { x: 396, y: 212, width: 168, height: 28 },
          accentColor: 0xf4c85d,
          enabled: true,
          markerId: "workspace_lights",
        },
        {
          id: "daily-proof-sprint-board",
          kind: "collaboration-board",
          label: "Sprint Board",
          bounds: { x: 584, y: 224, width: 108, height: 66 },
          accentColor: 0x9de2e4,
          enabled: true,
          markerId: "sprint_board",
        },
        {
          id: "daily-proof-supply-shelf",
          kind: "storage",
          label: "Supply Shelf",
          bounds: { x: 760, y: 140, width: 82, height: 46 },
          accentColor: 0xbf7ea2,
          enabled: true,
          markerId: "supply_shelf",
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
