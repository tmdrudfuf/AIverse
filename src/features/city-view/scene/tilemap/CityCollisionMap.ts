import type { Point } from "../shared/geometry";

export class CityCollisionMap {
  readonly maxStepSize: number;

  constructor(private readonly collisionLayer: Phaser.Tilemaps.TilemapLayer) {
    this.maxStepSize = Math.min(collisionLayer.tilemap.tileWidth, collisionLayer.tilemap.tileHeight) / 2;
  }

  isBlockedWorldPoint(point: Point): boolean {
    const tileCoordinates = this.collisionLayer.worldToTileXY(point.x, point.y);
    if (!tileCoordinates || this.isOutsideCollisionLayer(tileCoordinates.x, tileCoordinates.y)) return true;

    const tile = this.collisionLayer.getTileAt(tileCoordinates.x, tileCoordinates.y, false);
    return tile ? tile.index > 0 : false;
  }

  private isOutsideCollisionLayer(tileX: number, tileY: number) {
    const map = this.collisionLayer.tilemap;
    return tileX < 0 || tileY < 0 || tileX >= map.width || tileY >= map.height;
  }
}