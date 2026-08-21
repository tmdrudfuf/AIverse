import { isValidElement, type ReactElement, type ReactNode } from "react";
import { describe, expect, it } from "vitest";

import Home from "./page";
import { CityView } from "@/features/city-view/CityView";
import CitySceneCanvas from "@/features/city-view/CitySceneCanvas";

function flattenChildren(node: unknown): unknown[] {
  if (!isValidElement(node)) return [];

  const children = (node as ReactElement<{ children?: ReactNode }>).props.children;
  const childList = Array.isArray(children) ? children : [children];

  return childList.flatMap((child) => [child, ...flattenChildren(child)]);
}

describe("home route Playwright canvas boot smoke", () => {
  it("routes the home page into the city canvas entry point", () => {
    const homeRoute = Home();

    expect(homeRoute).toEqual(expect.objectContaining({ type: CityView }));

    const cityView = CityView();
    const cityViewChildren = flattenChildren(cityView);

    expect(cityViewChildren).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: CitySceneCanvas })]),
    );
  });
});
