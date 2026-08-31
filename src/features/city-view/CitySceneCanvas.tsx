"use client";

import { useEffect, useRef } from "react";
import { createCityScene } from "./scene/createCityScene";

const CITY_CANVAS_WIDTH = 1200;
const CITY_CANVAS_HEIGHT = 720;
const CITY_CANVAS_PROBE_PREFIX = "data-aiverse-city-canvas";

type CityCanvasProbeState = "booting" | "ready" | "skipped" | "destroyed";

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
    return () => {
      disposed = true;
      setCityCanvasProbeState(host.current, "destroyed");
      game.current?.destroy(true);
      game.current = null;
    };
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

  setCityCanvasProbeState(host, "booting");

  const Phaser = (await import("phaser")).default;
  if (options.shouldCreateGame && !options.shouldCreateGame()) {
    setCityCanvasProbeState(host, "skipped");
    return null;
  }

  const scene = createCityScene(Phaser);
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: host,
    width: CITY_CANVAS_WIDTH,
    height: CITY_CANVAS_HEIGHT,
    pixelArt: true,
    transparent: true,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene,
  });

  setCityCanvasReadyProbeState(host, scene.length, game);

  return game;
}

function setCityCanvasProbeState(host: HTMLDivElement | null, state: CityCanvasProbeState) {
  if (!host) return;

  host.setAttribute(`${CITY_CANVAS_PROBE_PREFIX}-state`, state);
  if (state !== "ready") {
    host.removeAttribute(`${CITY_CANVAS_PROBE_PREFIX}-width`);
    host.removeAttribute(`${CITY_CANVAS_PROBE_PREFIX}-height`);
    host.removeAttribute(`${CITY_CANVAS_PROBE_PREFIX}-scene-count`);
    host.removeAttribute(`${CITY_CANVAS_PROBE_PREFIX}-rendered-count`);
  }
}

function setCityCanvasReadyProbeState(host: HTMLDivElement, sceneCount: number, game: import("phaser").Game) {
  host.setAttribute(`${CITY_CANVAS_PROBE_PREFIX}-state`, "ready");
  host.setAttribute(`${CITY_CANVAS_PROBE_PREFIX}-width`, String(CITY_CANVAS_WIDTH));
  host.setAttribute(`${CITY_CANVAS_PROBE_PREFIX}-height`, String(CITY_CANVAS_HEIGHT));
  host.setAttribute(`${CITY_CANVAS_PROBE_PREFIX}-scene-count`, String(sceneCount));
  setCityCanvasRenderedCountProbeAttribute(host);
  scheduleCityCanvasPortfolioProbeAttribute(host, game);

  if (typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {
    window.requestAnimationFrame(() => {
      setCityCanvasRenderedCountProbeAttribute(host);
      scheduleCityCanvasPortfolioProbeAttribute(host, game);
    });
  }
}

function setCityCanvasRenderedCountProbeAttribute(host: HTMLDivElement) {
  host.setAttribute(
    `${CITY_CANVAS_PROBE_PREFIX}-rendered-count`,
    String(host.querySelectorAll("canvas").length),
  );
}

function scheduleCityCanvasPortfolioProbeAttribute(host: HTMLDivElement, game: import("phaser").Game, attemptsRemaining = 10) {
  if (setCityCanvasPortfolioProbeAttribute(host, game) || attemptsRemaining <= 0) return;
  if (typeof window === "undefined" || typeof window.requestAnimationFrame !== "function") return;

  window.requestAnimationFrame(() => scheduleCityCanvasPortfolioProbeAttribute(host, game, attemptsRemaining - 1));
}

function setCityCanvasPortfolioProbeAttribute(host: HTMLDivElement, game: import("phaser").Game) {
  const sceneManager = (game as { scene?: { getScene?: (key: string) => unknown } }).scene;
  const cityScene = sceneManager?.getScene?.("city-world") as {
    getWorldStateSnapshot?: () => { buildings?: Array<{ projectId?: string; operationLabel?: string }> };
  } | null;
  const labels = cityScene?.getWorldStateSnapshot?.()?.buildings
    ?.map((building) => `${building.projectId ?? "unknown"}:${building.operationLabel ?? "UNKNOWN"}`)
    .join("|");

  if (!labels) return false;

  host.setAttribute(`${CITY_CANVAS_PROBE_PREFIX}-portfolio-labels`, labels);
  return true;
}
