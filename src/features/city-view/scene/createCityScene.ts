import type Phaser from "phaser";
import { createCityWorldScene } from "./CityWorldScene";
import { createCompanyOfficeScene } from "./office/CompanyOfficeScene";

export function createCityScene(PhaserRuntime: typeof Phaser) {
  return [createCityWorldScene(PhaserRuntime), createCompanyOfficeScene(PhaserRuntime)];
}
