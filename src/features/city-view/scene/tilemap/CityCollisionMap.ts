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

  findNearestOpenTileCenter(point: Point, searchRadiusTiles: number): Point | undefined {
    const originTile = this.collisionLayer.worldToTileXY(point.x, point.y);
    const map = this.collisionLayer.tilemap;
    const originX = clamp(Math.floor(originTile?.x ?? 0), 0, map.width - 1);
    const originY = clamp(Math.floor(originTile?.y ?? 0), 0, map.height - 1);
    let nearest: Point | undefined;
    let nearestDistance = Number.POSITIVE_INFINITY;

    for (let radius = 0; radius <= searchRadiusTiles; radius += 1) {
      for (let tileY = originY - radius; tileY <= originY + radius; tileY += 1) {
        for (let tileX = originX - radius; tileX <= originX + radius; tileX += 1) {
          if (Math.max(Math.abs(tileX - originX), Math.abs(tileY - originY)) !== radius) continue;
          if (this.isOutsideCollisionLayer(tileX, tileY)) continue;

          const candidate = this.getTileCenter(tileX, tileY);
          if (this.isBlockedWorldPoint(candidate)) continue;

          const distance = Math.hypot(candidate.x - point.x, candidate.y - point.y);
          if (distance < nearestDistance) {
            nearest = candidate;
            nearestDistance = distance;
          }
        }
      }

      if (nearest) return nearest;
    }

    return undefined;
  }

  private getTileCenter(tileX: number, tileY: number): Point {
    const map = this.collisionLayer.tilemap;
    return {
      x: this.collisionLayer.x + tileX * map.tileWidth + map.tileWidth / 2,
      y: this.collisionLayer.y + tileY * map.tileHeight + map.tileHeight / 2,
    };
  }

  private isOutsideCollisionLayer(tileX: number, tileY: number) {
    const map = this.collisionLayer.tilemap;
    return tileX < 0 || tileY < 0 || tileX >= map.width || tileY >= map.height;
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}