import type Phaser from "phaser";
import { createCityWorldScene } from "./CityWorldScene";

export function createCityScene(PhaserRuntime: typeof Phaser) {
  return createCityWorldScene(PhaserRuntime);
}
