import type Phaser from "phaser";

export type CityTilemapLayers = {
  map: Phaser.Tilemaps.Tilemap;
  ground: Phaser.Tilemaps.TilemapLayer;
  road: Phaser.Tilemaps.TilemapLayer;
  decoration: Phaser.Tilemaps.TilemapLayer;
  collision: Phaser.Tilemaps.TilemapLayer;
};
