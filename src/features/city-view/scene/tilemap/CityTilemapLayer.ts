import { CITY_COLLISION_DEBUG, CITY_TILEMAP_ASSETS, CITY_TILEMAP_LAYERS } from "../config/cityTilemapConfig";
import { CITY_WORLD_BOUNDS } from "../config/cityWorldConfig";
import type { PhaserScene } from "../shared/phaserTypes";
import type { CityTilemapLayers } from "./cityTilemapTypes";

export function loadCityTilemapAssets(scene: PhaserScene) {
  scene.load.tilemapTiledJSON(CITY_TILEMAP_ASSETS.mapKey, CITY_TILEMAP_ASSETS.mapUrl);

  CITY_TILEMAP_ASSETS.tilesets.forEach((tileset) => {
    scene.load.image(tileset.key, tileset.url);
  });
}

export function createCityTilemapLayer(scene: PhaserScene): CityTilemapLayers {
  const map = scene.make.tilemap({ key: CITY_TILEMAP_ASSETS.mapKey });
  validateCityTilemapDimensions(map);

  const tilesets = CITY_TILEMAP_ASSETS.tilesets.map((tileset) => {
    const loadedTileset = map.addTilesetImage(tileset.name, tileset.key);
    if (!loadedTileset) {
      throw new Error(`City tilemap tileset missing: ${tileset.name}`);
    }
    return loadedTileset;
  });

  const ground = createRequiredLayer(map, CITY_TILEMAP_LAYERS.ground, tilesets);
  const road = createRequiredLayer(map, CITY_TILEMAP_LAYERS.road, tilesets);
  const decoration = createRequiredLayer(map, CITY_TILEMAP_LAYERS.decoration, tilesets);
  const collision = createRequiredLayer(map, CITY_TILEMAP_LAYERS.collision, tilesets);
  collision.setVisible(CITY_COLLISION_DEBUG);
  collision.setAlpha(CITY_COLLISION_DEBUG ? 0.35 : 1);

  return { map, ground, road, decoration, collision };
}

function createRequiredLayer(
  map: Phaser.Tilemaps.Tilemap,
  layerName: string,
  tilesets: Phaser.Tilemaps.Tileset[],
) {
  const layer = map.createLayer(layerName, tilesets, 0, 0);
  if (!layer) {
    throw new Error(`City tilemap layer missing: ${layerName}`);
  }
  return layer;
}

function validateCityTilemapDimensions(map: Phaser.Tilemaps.Tilemap) {
  if (map.widthInPixels === CITY_WORLD_BOUNDS.width && map.heightInPixels === CITY_WORLD_BOUNDS.height) return;

  throw new Error(
    `City tilemap dimensions ${map.widthInPixels}x${map.heightInPixels} do not match CITY_WORLD_BOUNDS ${CITY_WORLD_BOUNDS.width}x${CITY_WORLD_BOUNDS.height}.`,
  );
}
