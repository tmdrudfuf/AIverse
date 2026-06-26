export const CITY_TILEMAP_ASSETS = {
  mapKey: "city-district-01-map",
  mapUrl: "/assets/city/district-01/district-01.tmj",
  tilesets: [
    {
      name: "city-terrain",
      key: "city-terrain-tiles",
      url: "/assets/city/district-01/city-terrain.png",
    },
  ],
} as const;

export const CITY_TILEMAP_LAYERS = {
  ground: "Ground Layer",
  road: "Road Layer",
  decoration: "Decoration Layer",
  collision: "Collision Layer",
} as const;

export const CITY_COLLISION_DEBUG = false;
