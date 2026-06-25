"use client";

import { useEffect, useRef } from "react";
import { createCityScene } from "./scene/createCityScene";

export default function CitySceneCanvas() {
  const host = useRef<HTMLDivElement>(null);
  const game = useRef<import("phaser").Game | null>(null);

  useEffect(() => {
    let disposed = false;
    async function mountScene() {
      const Phaser = (await import("phaser")).default;
      if (disposed || !host.current) return;
      game.current = new Phaser.Game({
        type: Phaser.AUTO, parent: host.current, width: 1200, height: 720,
        pixelArt: true, transparent: true,
        scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
        scene: createCityScene(Phaser),
      });
    }
    mountScene();
    return () => { disposed = true; game.current?.destroy(true); game.current = null; };
  }, []);

  return <div ref={host} className="city-scene-canvas" role="img" aria-label="Pixel-art city with roads, sidewalks, grass, trees, Daily Proof Inc., AI Lab, and Portfolio Studio" />;
}
