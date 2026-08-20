import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { initializeApp } from "./app.mjs";

class FakeElement {
  constructor() {
    this.attributes = new Map();
    this.listeners = new Map();
    this.textContent = "";
    this.value = "";
  }

  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) ?? [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  dispatch(type) {
    for (const listener of this.listeners.get(type) ?? []) {
      listener({ target: this });
    }
  }

  getAttribute(name) {
    return this.attributes.get(name) ?? null;
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }
}

class FakeMediaQuery {
  constructor() {
    this.matches = false;
    this.listeners = [];
  }

  addEventListener(type, listener) {
    assert.equal(type, "change");
    this.listeners.push(listener);
  }

  setMatches(matches) {
    this.matches = matches;
    for (const listener of this.listeners) {
      listener({ matches });
    }
  }
}

async function createHarness() {
  const html = await readFile(new URL("./index.html", import.meta.url), "utf8");
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  const nodes = new Map(ids.map((id) => [id, new FakeElement()]));
  const root = nodes.get("parallelogram-angle-explorer");
  root.querySelector = (selector) => {
    assert.match(selector, /^#/);
    const node = nodes.get(selector.slice(1));
    assert.ok(node, `missing fixture for ${selector}`);
    return node;
  };
  nodes.get("pae-angle").value = "69.69";

  const documentRef = {
    getElementById(id) {
      assert.equal(id, "parallelogram-angle-explorer");
      return root;
    },
  };
  const mediaQuery = new FakeMediaQuery();
  const windowRef = {
    matchMedia(query) {
      assert.equal(query, "(max-width: 600px)");
      return mediaQuery;
    },
  };
  const controller = initializeApp(documentRef, windowRef);
  return { controller, mediaQuery, nodes };
}

test("renders the initial state from the shared geometry module", async () => {
  const { controller, nodes } = await createHarness();

  assert.equal(typeof controller.draw, "function");
  assert.equal(typeof controller.syncMobileViewport, "function");
  assert.equal(nodes.get("pae-svg").getAttribute("viewBox"), "0 0 620 676");
  assert.equal(nodes.get("pae-angle-output").textContent, "69.69°");
  assert.equal(nodes.get("pae-perp-inset-left-label").textContent, "14.07 ft");
  assert.equal(nodes.get("pae-perp-inner-label").textContent, "46.89 ft");
  assert.equal(nodes.get("pae-overlap-label").textContent, "Overlap · 0.93 ft");
  assert.equal(nodes.get("pae-calc-shape-expression").textContent, "15 ft + 50 ft + 15 ft");
  assert.equal(nodes.get("pae-calc-shape-result").textContent, "= 80 ft; long sides = 165.93 ft");
  assert.equal(nodes.get("pae-calc-fixed-arrows-expression").textContent, "A = 65 ft");
  assert.equal(nodes.get("pae-calc-fixed-arrows-result").textContent, "· B = 50 ft");
  assert.match(nodes.get("pae-shape").getAttribute("d"), /^M .+ Z$/);
  assert.match(nodes.get("pae-perp-square-left").getAttribute("d"), /^M .+ L .+ L /);
});

test("updates the diagram and formulas from slider input", async () => {
  const { nodes } = await createHarness();
  const slider = nodes.get("pae-angle");

  slider.value = "86.89";
  slider.dispatch("input");

  assert.equal(nodes.get("pae-angle-output").textContent, "86.89°");
  assert.equal(nodes.get("pae-calc-perp-insets-expression").textContent, "15 ft × sin(86.89°)");
  assert.equal(nodes.get("pae-calc-perp-insets-result").textContent, "= 14.98 ft each");
  assert.equal(nodes.get("pae-calc-overlap-result").textContent, "= 0.02 ft");
});

test("handles both preset buttons and the 180 degree extreme", async () => {
  const { controller, nodes } = await createHarness();
  const slider = nodes.get("pae-angle");

  nodes.get("pae-snap-90").dispatch("click");
  assert.equal(slider.value, "90");
  assert.equal(nodes.get("pae-calc-overlap-result").textContent, "= 0.00 ft");

  nodes.get("pae-snap-11023").dispatch("click");
  assert.equal(slider.value, "110.23");
  assert.equal(nodes.get("pae-angle-output").textContent, "110.23°");

  controller.draw(180);
  assert.equal(nodes.get("pae-angle-output").textContent, "180.00°");
  assert.equal(nodes.get("pae-perp-inset-left-label").textContent, "0.00 ft");
  assert.equal(nodes.get("pae-calc-overlap-result").textContent, "= 15.00 ft");
});

test("switches the SVG viewport at the mobile breakpoint", async () => {
  const { controller, mediaQuery, nodes } = await createHarness();

  mediaQuery.setMatches(true);
  assert.equal(nodes.get("pae-svg").getAttribute("viewBox"), "88 0 444 676");

  mediaQuery.matches = false;
  controller.syncMobileViewport();
  assert.equal(nodes.get("pae-svg").getAttribute("viewBox"), "0 0 620 676");
});

test("renders the second right-angle area diagram", async () => {
  const { controller, nodes } = await createHarness();

  assert.equal(typeof controller.drawAreas, "function");
  assert.equal(nodes.get("pae-area-svg").getAttribute("viewBox"), "0 0 620 676");
  assert.equal(
    nodes.get("pae-area-shape").getAttribute("d"),
    nodes.get("pae-area-clip-shape").getAttribute("d"),
  );
  assert.equal(nodes.get("pae-area-a-label").textContent, "A · 65 ft at 90°");
  assert.equal(nodes.get("pae-area-b-label").textContent, "B · 50 ft at 90°");
  // Leaning right: the strips run past the top-right and bottom-left, and
  // stop short at the other two corners.
  assert.equal(nodes.get("pae-area-corner-rt").textContent, "Overlap · 5.55 ft");
  assert.equal(nodes.get("pae-area-corner-lb").textContent, "Overlap · 5.55 ft");
  assert.equal(nodes.get("pae-area-corner-rb").textContent, "Underlap · 5.55 ft");
  assert.equal(nodes.get("pae-area-corner-lt").textContent, "Underlap · 5.55 ft");
  assert.equal(nodes.get("pae-area-corner-rt").getAttribute("style"), "fill: #c00000");
  assert.equal(nodes.get("pae-area-corner-rb").getAttribute("style"), "fill: #a3520f");
  assert.equal(nodes.get("pae-area-strip-right-label").textContent, "15 ft");
  assert.equal(nodes.get("pae-area-strip-left-label").textContent, "15 ft");
  assert.equal(
    nodes.get("pae-area-title-label").textContent,
    "15 ft squared off each side, 50 ft in the middle",
  );
  assert.match(nodes.get("pae-area-square-a").getAttribute("d"), /^M .+ L .+ L /);
  assert.match(nodes.get("pae-area-square-b").getAttribute("d"), /^M .+ L .+ L /);
  assert.equal(
    nodes.get("pae-area-calc-overhang-result").textContent,
    "= 5.55 ft over one edge, short of the other",
  );
  // The mask uses the same outline, so only the overhang shows red.
  assert.equal(
    nodes.get("pae-area-mask-shape").getAttribute("d"),
    nodes.get("pae-area-shape").getAttribute("d"),
  );
  assert.equal(
    nodes.get("pae-area-strip-right-spill").getAttribute("x"),
    nodes.get("pae-area-strip-right").getAttribute("x"),
  );
  assert.equal(
    nodes.get("pae-area-strip-left-spill").getAttribute("width"),
    nodes.get("pae-area-strip-left").getAttribute("width"),
  );
  // The shaded length covers the same rectangle as the outline.
  for (const side of ["right", "left"]) {
    for (const attribute of ["x", "y", "width", "height"]) {
      assert.equal(
        nodes.get(`pae-area-strip-${side}-fill`).getAttribute(attribute),
        nodes.get(`pae-area-strip-${side}`).getAttribute(attribute),
      );
    }
  }
  assert.equal(nodes.get("pae-area-calc-width-result").textContent, "= 75.03 ft across");

  // The middle band is whatever the two squared-off strips leave behind.
  assert.equal(nodes.get("pae-area-middle").getAttribute("opacity"), "1");
  assert.equal(nodes.get("pae-area-middle-collide").getAttribute("opacity"), "0");
  assert.equal(
    nodes.get("pae-area-middle-label").textContent,
    "45.03 ft left for the 50 ft middle",
  );
  assert.equal(nodes.get("pae-area-calc-middle-result").textContent, "= 45.03 ft for a 50 ft middle");
  assert.equal(
    nodes.get("pae-area-calc-middle-short-result").textContent,
    "= 4.97 ft short in the middle",
  );
  assert.equal(
    nodes.get("pae-area-calc-middle-ends-result").textContent,
    "= 22.22 ft at the middle's far end",
  );
});

test("squares a 15 ft strip off each side and shades what hangs over", async () => {
  const { controller, nodes } = await createHarness();

  assert.equal(nodes.get("pae-area-chain-right-label").textContent, "15 ft");
  assert.equal(nodes.get("pae-area-chain-inner-label").textContent, "50 ft");
  assert.equal(nodes.get("pae-area-chain-left-label").textContent, "15 ft");
  assert.equal(nodes.get("pae-area-calc-chain-result").textContent, "= 80 ft of room needed at 90°");
  assert.match(nodes.get("pae-area-square-chain").getAttribute("d"), /^M .+ L .+ L /);

  // Each strip spans its own side, so the two are the same length.
  assert.equal(
    nodes.get("pae-area-strip-right").getAttribute("height"),
    nodes.get("pae-area-strip-left").getAttribute("height"),
  );
  for (const corner of ["rt", "rb", "lt", "lb", "mt", "mb"]) {
    assert.equal(nodes.get(`pae-area-corner-${corner}`).getAttribute("opacity"), "1");
  }
  // The middle carries the same square ends further from the side, so its
  // over and under run deeper than the strips'.
  assert.equal(nodes.get("pae-area-corner-mt").textContent, "Overlap · 22.22 ft");
  assert.equal(nodes.get("pae-area-corner-mb").textContent, "Underlap · 22.22 ft");
  // The uncovered sliver is masked by the strip it belongs to.
  assert.equal(
    nodes.get("pae-area-mask-strip-right").getAttribute("x"),
    nodes.get("pae-area-strip-right").getAttribute("x"),
  );
  assert.equal(
    nodes.get("pae-area-strip-left-gap").getAttribute("x"),
    nodes.get("pae-area-strip-left").getAttribute("x"),
  );

  // Square on, the ends line up with the edges and nothing hangs over.
  controller.draw(90);
  for (const corner of ["rt", "rb", "lt", "lb", "mt", "mb"]) {
    assert.equal(nodes.get(`pae-area-corner-${corner}`).getAttribute("opacity"), "0");
  }
  // Hidden at 90 degrees, and every corner measures nothing either way.
  for (const corner of ["rt", "rb", "lt", "lb", "mt", "mb"]) {
    assert.match(nodes.get(`pae-area-corner-${corner}`).textContent, /lap · 0\.00 ft$/);
  }
  assert.equal(
    nodes.get("pae-area-middle-label").textContent,
    "50.00 ft left for the 50 ft middle",
  );
  assert.equal(
    nodes.get("pae-area-strip-right").getAttribute("y"),
    nodes.get("pae-area-strip-left").getAttribute("y"),
  );

  controller.draw(40);
  assert.equal(nodes.get("pae-area-corner-lb").textContent, "Overlap · 17.88 ft");
  assert.equal(nodes.get("pae-area-corner-lt").textContent, "Underlap · 17.88 ft");

  // Past 90 degrees the lean flips, and so does each corner's role.
  controller.draw(110.23);
  assert.equal(nodes.get("pae-area-corner-rt").textContent, "Underlap · 5.53 ft");
  assert.equal(nodes.get("pae-area-corner-rb").textContent, "Overlap · 5.53 ft");
  assert.equal(nodes.get("pae-area-corner-rt").getAttribute("style"), "fill: #a3520f");

  // Leaned far enough, the two strips run into each other.
  controller.draw(20);
  assert.equal(nodes.get("pae-area-middle").getAttribute("opacity"), "0");
  assert.equal(nodes.get("pae-area-middle-collide").getAttribute("opacity"), "1");
  assert.equal(nodes.get("pae-area-middle-label").textContent, "Strips collide · 2.64 ft");
});

test("keeps both diagrams on the same mobile viewport", async () => {
  const { mediaQuery, nodes } = await createHarness();

  mediaQuery.setMatches(true);
  assert.equal(nodes.get("pae-area-svg").getAttribute("viewBox"), "88 0 444 676");
});

test("renders the third parallel-to-the-top diagram", async () => {
  const { controller, nodes } = await createHarness();

  assert.equal(typeof controller.drawParallel, "function");
  assert.equal(nodes.get("pae-fit-svg").getAttribute("viewBox"), "0 0 620 676");
  assert.equal(
    nodes.get("pae-fit-shape").getAttribute("d"),
    nodes.get("pae-fit-clip-shape").getAttribute("d"),
  );
  assert.equal(nodes.get("pae-fit-strip-right-label").textContent, "15 ft");
  assert.equal(nodes.get("pae-fit-strip-inner-label").textContent, "50 ft");
  assert.equal(nodes.get("pae-fit-strip-left-label").textContent, "15 ft");
  assert.equal(nodes.get("pae-fit-guide-a-label").textContent, "A · 65 ft along the top");
  assert.equal(nodes.get("pae-fit-guide-b-label").textContent, "B · 50 ft along the top");
  assert.equal(nodes.get("pae-fit-match-label").textContent, "Both end here · 0.00 ft gap");
  assert.equal(
    nodes.get("pae-fit-title-label").textContent,
    "Lines drawn parallel to the 80 ft top edge",
  );
  assert.equal(nodes.get("pae-fit-calc-reach-result").textContent, "= 65.00 ft, exactly where A ends");
  assert.equal(nodes.get("pae-fit-calc-total-result").textContent, "= 80.00 ft, the whole side");
  assert.equal(nodes.get("pae-fit-calc-gap-result").textContent, "= 0.00 ft at every angle");

  // Both guides stop on the same line, however far the shape leans.
  assert.equal(
    nodes.get("pae-fit-guide-a").getAttribute("x2"),
    nodes.get("pae-fit-guide-b").getAttribute("x2"),
  );
});

test("keeps the parallel guides matched after the angle changes", async () => {
  const { nodes } = await createHarness();
  const slider = nodes.get("pae-angle");

  slider.value = "122.5";
  slider.dispatch("input");

  assert.equal(nodes.get("pae-fit-svg").getAttribute("viewBox"), "0 0 620 676");
  assert.equal(nodes.get("pae-fit-match-label").textContent, "Both end here · 0.00 ft gap");
  assert.equal(
    nodes.get("pae-fit-guide-a").getAttribute("x2"),
    nodes.get("pae-fit-guide-b").getAttribute("x2"),
  );
  assert.equal(nodes.get("pae-fit-match-line").getAttribute("x1"), nodes.get("pae-fit-match-line").getAttribute("x2"));
});

test("keeps all three diagrams on the same mobile viewport", async () => {
  const { mediaQuery, nodes } = await createHarness();

  mediaQuery.setMatches(true);
  assert.equal(nodes.get("pae-fit-svg").getAttribute("viewBox"), "88 0 444 676");
});
