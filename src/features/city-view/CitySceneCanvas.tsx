"use client";

import { useEffect, useRef } from "react";
import { createCityScene } from "./scene/createCityScene";

export default function CitySceneCanvas() {
  const host = useRef<HTMLDivElement>(null);
  const game = useRef<import("phaser").Game | null>(null);

  useEffect(() => {
    let disposed = false;
    async function mountScene() {
      if (disposed || !host.current) return;
      game.current = await bootCitySceneCanvas(host.current, {
        shouldCreateGame: () => !disposed && Boolean(host.current),
      });
    }
    mountScene();
    return () => { disposed = true; game.current?.destroy(true); game.current = null; };
  }, []);

  return <div ref={host} className="city-scene-canvas" role="img" aria-label="Pixel-art city with roads, sidewalks, grass, trees, Daily Proof Inc., AI Lab, and Portfolio Studio" />;
}

export type CitySceneCanvasBootOptions = {
  shouldCreateGame?: () => boolean;
};

export async function bootCitySceneCanvas(
  host: HTMLDivElement | null,
  options: CitySceneCanvasBootOptions = {},
): Promise<import("phaser").Game | null> {
  if (!host) return null;

  const Phaser = (await import("phaser")).default;
  if (options.shouldCreateGame && !options.shouldCreateGame()) return null;

  return new Phaser.Game({
    type: Phaser.AUTO,
    parent: host,
    width: 1200,
    height: 720,
    pixelArt: true,
    transparent: true,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: createCityScene(Phaser),
  });
}
