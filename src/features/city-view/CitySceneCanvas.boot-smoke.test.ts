import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { bootCitySceneCanvas } from "./CitySceneCanvas";

const gameConstructor = vi.hoisted(() => vi.fn());

vi.mock("phaser", () => {
  class Scene {}
  class Game {
    constructor(config: unknown) {
      gameConstructor(config);
    }

    destroy() {
      return undefined;
    }
  }

  return {
    default: {
      AUTO: "AUTO",
      Scale: {
        FIT: "FIT",
        CENTER_BOTH: "CENTER_BOTH",
      },
      Scene,
      Game,
    },
  };
});

describe("Daily Proof canvas boot console smoke", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    gameConstructor.mockClear();
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("boots the Daily Proof city canvas configuration without console warnings or errors", async () => {
    const host = {} as HTMLDivElement;

    const game = await bootCitySceneCanvas(host);

    expect(game).toBeTruthy();
    expect(gameConstructor).toHaveBeenCalledTimes(1);
    expect(gameConstructor).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "AUTO",
        parent: host,
        width: 1200,
        height: 720,
        pixelArt: true,
        transparent: true,
        scale: {
          mode: "FIT",
          autoCenter: "CENTER_BOTH",
        },
        scene: expect.arrayContaining([expect.any(Function), expect.any(Function)]),
      }),
    );
    expect((gameConstructor.mock.calls[0][0] as { scene: unknown[] }).scene).toHaveLength(2);
    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("skips game creation for an absent host without console warnings or errors", async () => {
    const game = await bootCitySceneCanvas(null);

    expect(game).toBeNull();
    expect(gameConstructor).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("skips game creation when the component is disposed before dynamic import completes", async () => {
    const game = await bootCitySceneCanvas({} as HTMLDivElement, { shouldCreateGame: () => false });

    expect(game).toBeNull();
    expect(gameConstructor).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });
});
