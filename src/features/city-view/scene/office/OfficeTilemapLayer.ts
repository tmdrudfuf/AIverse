import type { Rect } from "../buildings/buildingTypes";
import type { Point } from "../shared/geometry";
import type { PhaserScene } from "../shared/phaserTypes";
import type { OfficeDefinition, OfficeLayoutMarkers } from "./officeTypes";

export type OfficeTilemapLayers = {
  map: Phaser.Tilemaps.Tilemap;
  floor: Phaser.Tilemaps.TilemapLayer;
  wall: Phaser.Tilemaps.TilemapLayer;
  decoration: Phaser.Tilemaps.TilemapLayer;
  collision: Phaser.Tilemaps.TilemapLayer;
  objectLayer: Phaser.Tilemaps.ObjectLayer;
  interactionLayer: Phaser.Tilemaps.ObjectLayer;
  markers: OfficeLayoutMarkers;
};

const REQUIRED_RESERVED_MARKERS = [
  "reception_zone",
  "future_desk_zone_01",
  "future_desk_zone_02",
  "future_computer_zone_01",
] as const;

export function loadOfficeTilemapAssets(scene: PhaserScene, office: OfficeDefinition) {
  scene.load.tilemapTiledJSON(office.tilemap.mapKey, office.tilemap.mapUrl);

  office.tilemap.tilesets.forEach((tileset) => {
    scene.load.image(tileset.key, tileset.url);
  });
}

export function createOfficeTilemapLayer(scene: PhaserScene, office: OfficeDefinition): OfficeTilemapLayers {
  const map = scene.make.tilemap({ key: office.tilemap.mapKey });
  validateOfficeTilemapDimensions(map, office);

  const tilesets = office.tilemap.tilesets.map((tileset) => {
    const loadedTileset = map.addTilesetImage(tileset.name, tileset.key);
    if (!loadedTileset) {
      throw new Error(`Office tilemap tileset missing: ${tileset.name}`);
    }
    return loadedTileset;
  });

  const floor = createRequiredLayer(map, office.tilemap.layers.floor, tilesets);
  const wall = createRequiredLayer(map, office.tilemap.layers.wall, tilesets);
  const decoration = createRequiredLayer(map, office.tilemap.layers.decoration, tilesets);
  const collision = createRequiredLayer(map, office.tilemap.layers.collision, tilesets);
  const objectLayer = getRequiredObjectLayer(map, office.tilemap.layers.objects);
  const interactionLayer = getRequiredObjectLayer(map, office.tilemap.layers.interaction);
  const markers = resolveOfficeMarkers(objectLayer, office);

  collision.setVisible(false);

  return { map, floor, wall, decoration, collision, objectLayer, interactionLayer, markers };
}

function createRequiredLayer(
  map: Phaser.Tilemaps.Tilemap,
  layerName: string,
  tilesets: Phaser.Tilemaps.Tileset[],
) {
  const layer = map.createLayer(layerName, tilesets, 0, 0);
  if (!layer) {
    throw new Error(`Office tilemap layer missing: ${layerName}`);
  }
  return layer;
}

function getRequiredObjectLayer(map: Phaser.Tilemaps.Tilemap, layerName: string) {
  const layer = map.getObjectLayer(layerName);
  if (!layer) {
    throw new Error(`Office tilemap object layer missing: ${layerName}`);
  }
  return layer;
}

function resolveOfficeMarkers(objectLayer: Phaser.Tilemaps.ObjectLayer, office: OfficeDefinition): OfficeLayoutMarkers {
  const founderSpawn = resolvePointMarker(objectLayer, "founder_spawn") ?? { ...office.founderSpawn };
  const exitZone = resolveRectMarker(objectLayer, "exit_zone") ?? { ...office.exitZone };
  const reservedZones = REQUIRED_RESERVED_MARKERS.reduce<Record<string, Rect>>((zones, markerName) => {
    const marker = resolveRectMarker(objectLayer, markerName);
    if (!marker) {
      throw new Error(`Office tilemap marker missing: ${markerName}`);
    }

    zones[markerName] = marker;
    return zones;
  }, {});

  return { founderSpawn, exitZone, reservedZones };
}

function resolvePointMarker(objectLayer: Phaser.Tilemaps.ObjectLayer, markerName: string): Point | undefined {
  const marker = objectLayer.objects.find((object) => object.name === markerName);
  if (!marker || marker.x === undefined || marker.y === undefined) return undefined;

  return { x: marker.x, y: marker.y };
}

function resolveRectMarker(objectLayer: Phaser.Tilemaps.ObjectLayer, markerName: string): Rect | undefined {
  const marker = objectLayer.objects.find((object) => object.name === markerName);
  if (!marker || marker.x === undefined || marker.y === undefined) return undefined;
  if (marker.width === undefined || marker.height === undefined || marker.width <= 0 || marker.height <= 0) return undefined;

  return { x: marker.x, y: marker.y, width: marker.width, height: marker.height };
}

function validateOfficeTilemapDimensions(map: Phaser.Tilemaps.Tilemap, office: OfficeDefinition) {
  if (map.widthInPixels === office.worldBounds.width && map.heightInPixels === office.worldBounds.height) return;

  throw new Error(
    `Office tilemap dimensions ${map.widthInPixels}x${map.heightInPixels} do not match ${office.sceneKey} world bounds ${office.worldBounds.width}x${office.worldBounds.height}.`,
  );
}
