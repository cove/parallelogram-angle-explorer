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

async function createHarness(page = "./index.html") {
  const html = await readFile(new URL(page, import.meta.url), "utf8");
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  const nodes = new Map(ids.map((id) => [id, new FakeElement()]));
  const root = nodes.get("parallelogram-angle-explorer");
  root.querySelector = (selector) => {
    assert.match(selector, /^#/);
    // A page carrying only some of the diagrams has no node for the others,
    // and the app is expected to cope with that rather than throw.
    return nodes.get(selector.slice(1)) ?? null;
  };
  for (const id of ["pae-angle", "pae-area-angle", "pae-fit-angle"]) {
    if (nodes.has(id)) {
      nodes.get(id).value = "69.69";
    }
  }

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
  assert.equal(nodes.has("pae-forced-title-label"), false);
  // The chain carries what it actually measures, not the claimed 15/50/15.
  assert.equal(nodes.get("pae-top-dim-left-label").textContent, "a · 15 ft");
  assert.equal(nodes.get("pae-top-dim-inner-label").textContent, "b · 50 ft");
  assert.equal(nodes.get("pae-top-dim-right-label").textContent, "c · 15 ft");
  assert.equal(nodes.get("pae-perp-inset-left-label").textContent, "d · 10.03 ft");
  assert.equal(nodes.get("pae-perp-inner-label").textContent, "e · 50.93 ft");
  assert.equal(nodes.get("pae-perp-inset-right-label").textContent, "f · 14.07 ft");
  assert.equal(nodes.get("pae-static-a-label").textContent, "g · A · 65 ft");
  assert.equal(nodes.get("pae-static-b-label").textContent, "h · B · 50 ft");
  assert.equal(nodes.get("pae-overlap-label").textContent, "i · A into left 15 · 4.04 ft");
  assert.equal(
    nodes.get("pae-overlap-extent-a").getAttribute("x1"),
    nodes.get("pae-static-a").getAttribute("x2"),
  );
  assert.equal(nodes.has("pae-overlap-extent-b"), false);
  assert.equal(
    nodes.get("pae-overlap-span").getAttribute("x2"),
    nodes.get("pae-inset-left").getAttribute("x1"),
  );
  assert.equal(nodes.get("pae-calc-shape-expression").textContent, "a + b + c = 15 ft + 50 ft + 15 ft");
  assert.equal(nodes.get("pae-calc-shape-result").textContent, "= 80 ft; long sides = 165.93 ft");
  assert.equal(nodes.get("pae-calc-fixed-arrows-expression").textContent, "g = A = 65 ft");
  assert.equal(nodes.get("pae-calc-fixed-arrows-result").textContent, "· h = B = 50 ft");
  assert.equal(nodes.get("pae-calc-left-boundary-result").textContent, "= 60.96 ft from the right to the left-15 boundary");
  assert.equal(nodes.get("pae-calc-b-reach-result").textContent, "= 64.07 ft from the right to B's end");
  assert.equal(nodes.get("pae-calc-b-overlap-result").textContent, "= 3.11 ft B enters the left 15 ft");
  assert.equal(nodes.get("pae-calc-forced-inner-expression").textContent, "e = g − c × sin(69.69°)");
  assert.equal(nodes.get("pae-calc-projection-loss-result").textContent, "= 0.93 ft A reaches farther left than B");
  assert.match(nodes.get("pae-shape").getAttribute("d"), /^M .+ Z$/);
  assert.match(nodes.get("pae-perp-square-left").getAttribute("d"), /^M .+ L .+ L /);
});

test("updates the diagram and formulas from slider input", async () => {
  const { nodes } = await createHarness();
  const slider = nodes.get("pae-angle");

  slider.value = "86.89";
  slider.dispatch("input");

  assert.equal(nodes.get("pae-angle-output").textContent, "86.89°");
  assert.equal(nodes.get("pae-calc-perp-insets-expression").textContent, "a = c = f = 15 ft × sin(86.89°)");
  assert.equal(
    nodes.get("pae-calc-perp-insets-result").textContent,
    "= 14.98 ft projected on both the left and right",
  );
  assert.equal(nodes.get("pae-calc-overlap-result").textContent, "= 0.10 ft A enters the left 15 ft");
});

test("handles both preset buttons and the 180 degree extreme", async () => {
  const { controller, nodes } = await createHarness();
  const slider = nodes.get("pae-angle");

  nodes.get("pae-snap-90").dispatch("click");
  assert.equal(slider.value, "90");
  assert.equal(nodes.get("pae-calc-overlap-result").textContent, "= 0.00 ft A enters the left 15 ft");

  nodes.get("pae-snap-9874").dispatch("click");
  assert.equal(slider.value, "98.74");
  assert.equal(nodes.get("pae-angle-output").textContent, "98.74°");
  assert.equal(nodes.get("pae-calc-left-boundary-result").textContent, "= 64.25 ft from the right to the left-15 boundary");
  assert.equal(nodes.get("pae-calc-b-reach-result").textContent, "= 64.83 ft from the right to B's end");
  assert.equal(nodes.get("pae-calc-overlap-result").textContent, "= 0.75 ft A enters the left 15 ft");
  assert.equal(nodes.get("pae-calc-b-overlap-result").textContent, "= 0.58 ft B enters the left 15 ft");
  assert.equal(nodes.get("pae-calc-projection-loss-result").textContent, "= 0.17 ft A reaches farther left than B");

  controller.draw(180);
  assert.equal(nodes.get("pae-angle-output").textContent, "180.00°");
  // Flat, the parcel has no width left at all for A's 65 ft reach to
  // measure against, so the left mark goes negative to say so.
  assert.equal(nodes.get("pae-perp-inset-left-label").textContent, "d · -65.00 ft");
  assert.equal(nodes.get("pae-calc-overlap-result").textContent, "= 65.00 ft A enters the left 15 ft");
});

test("switches the SVG viewport at the mobile breakpoint", async () => {
  const { controller, mediaQuery, nodes } = await createHarness();

  mediaQuery.setMatches(true);
  assert.equal(nodes.get("pae-svg").getAttribute("viewBox"), "70 0 480 676");

  mediaQuery.matches = false;
  controller.syncMobileViewport();
  assert.equal(nodes.get("pae-svg").getAttribute("viewBox"), "0 0 620 676");
});

test("renders the second right-angle area diagram", async () => {
  const { controller, nodes } = await createHarness("./overlaps.html");

  assert.equal(typeof controller.drawAreas, "function");
  assert.equal(nodes.get("pae-area-svg").getAttribute("viewBox"), "0 0 620 676");
  assert.equal(
    nodes.get("pae-area-shape").getAttribute("d"),
    nodes.get("pae-area-clip-shape").getAttribute("d"),
  );
  assert.equal(nodes.get("pae-area-a-label").textContent, "g · A · 65 ft at 90°");
  assert.equal(nodes.get("pae-area-b-label").textContent, "h · B · 50 ft at 90°");
  // The naive top row, reproduced from the forced-measurements diagram.
  assert.equal(nodes.get("pae-area-top-dim-left-label").textContent, "a · 15 ft");
  assert.equal(nodes.get("pae-area-top-dim-inner-label").textContent, "b · 50 ft");
  assert.equal(nodes.get("pae-area-top-dim-right-label").textContent, "c · 15 ft");
  // The naive inset (this row's boundary) and the squared-off strip's own
  // edge are two different marks off the angle, not the same line.
  assert.notEqual(
    nodes.get("pae-area-inset-left").getAttribute("x1"),
    nodes.get("pae-area-strip-left").getAttribute("x"),
  );
  assert.ok(
    Number(nodes.get("pae-area-inset-left").getAttribute("y2"))
      > Number(nodes.get("pae-area-inset-left").getAttribute("y1")),
  );
  assert.equal(nodes.has("pae-area-overlap-label"), false);
  assert.equal(nodes.has("pae-area-overlap-leader"), false);
  assert.equal(nodes.has("pae-area-gap"), false);
  assert.equal(nodes.has("pae-area-gap-leader"), false);
  assert.equal(nodes.get("pae-area-dim-a").getAttribute("marker-start"), "url(#pae-area-purple-arrow)");
  assert.equal(nodes.get("pae-area-dim-a").getAttribute("marker-end"), "url(#pae-area-purple-arrow)");
  assert.equal(nodes.get("pae-area-dim-b").getAttribute("marker-start"), "url(#pae-area-purple-arrow)");
  assert.equal(nodes.get("pae-area-dim-b").getAttribute("marker-end"), "url(#pae-area-purple-arrow)");
  assert.equal(nodes.has("pae-area-strip-right-label"), false);
  assert.equal(nodes.has("pae-area-strip-left-label"), false);
  assert.equal(nodes.has("pae-area-title-label"), false);
  assert.equal(nodes.has("pae-area-left-overlap-b"), false);
  assert.match(nodes.get("pae-area-square-a").getAttribute("d"), /^M .+ L .+ L /);
  assert.match(nodes.get("pae-area-square-b").getAttribute("d"), /^M .+ L .+ L /);
  assert.equal(
    nodes.get("pae-area-calc-overhang-result").textContent,
    "= 5.21 ft over one edge, short of the other",
  );
  // The overlap is the four-corner intersection of the fitted center and the
  // left strip, clipped to the parcel.
  assert.match(nodes.get("pae-area-overlap-fill").getAttribute("d"), /^M .+ L .+ L .+ L .+ Z$/);
  assert.equal(nodes.get("pae-area-left-overlap-a").getAttribute("opacity"), "0");
  const spillPath = nodes.get("pae-area-spill-fill").getAttribute("d");
  assert.equal(spillPath.match(/\bM /g).length, 2);
  assert.equal(spillPath.match(/ Z/g).length, 2);
  assert.equal(nodes.get("pae-area-spill-fill").getAttribute("opacity"), "1");
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
  assert.equal(nodes.get("pae-area-calc-middle-result").textContent, "= 46.89 ft for a 50 ft middle");
  assert.equal(
    nodes.get("pae-area-calc-middle-short-result").textContent,
    "= 3.11 ft short in the middle",
  );
  assert.equal(
    nodes.get("pae-area-calc-middle-ends-result").textContent,
    "= 23.71 ft at the middle's far end",
  );
  assert.equal(
    nodes.get("pae-area-calc-gap-area-result").textContent,
    "= 709.88 ft² unclaimed",
  );
  assert.equal(
    nodes.get("pae-area-calc-overlap-area-result").textContent,
    "= 429.49 ft² claimed twice",
  );
  assert.equal(
    nodes.get("pae-area-calc-spill-area-result").textContent,
    "= 796.20 ft² outside the parcel",
  );
});

test("squares a 15 ft strip off each side and shades what hangs over", async () => {
  const { controller, nodes } = await createHarness("./overlaps.html");

  // The purple center/left boundary is A's fixed endpoint, not the green
  // top row's projected left inset witness.
  assert.equal(nodes.get("pae-area-chain-right-label").textContent, "f · 14.07 ft");
  assert.equal(nodes.get("pae-area-chain-inner-label").textContent, "e · 50.93 ft");
  assert.equal(nodes.get("pae-area-chain-left-label").textContent, "d · 10.03 ft");
  assert.equal(nodes.get("pae-area-calc-chain-result").textContent, "= 10.03 / 50.93 / 14.07 ft, left to right");
  assert.match(nodes.get("pae-area-square-chain").getAttribute("d"), /^M .+ L .+ L /);
  assert.equal(
    nodes.get("pae-area-chain-witness-right-inset").getAttribute("x1"),
    nodes.get("pae-area-chain-right").getAttribute("x2"),
  );
  assert.equal(
    nodes.get("pae-area-chain-witness-inner").getAttribute("x1"),
    nodes.get("pae-area-chain-inner").getAttribute("x2"),
  );
  assert.equal(
    nodes.get("pae-area-chain-inner").getAttribute("x2"),
    nodes.get("pae-area-dim-a").getAttribute("x2"),
  );
  assert.notEqual(
    nodes.get("pae-area-chain-inner").getAttribute("x2"),
    nodes.get("pae-area-inset-left").getAttribute("x1"),
  );

  // Each strip spans its own side, so the two are the same length.
  assert.equal(
    nodes.get("pae-area-strip-right").getAttribute("height"),
    nodes.get("pae-area-strip-left").getAttribute("height"),
  );
  assert.notEqual(
    nodes.get("pae-area-strip-right").getAttribute("y"),
    nodes.get("pae-area-strip-left").getAttribute("y"),
  );
  assert.equal(nodes.get("pae-area-overlap-fill").getAttribute("opacity"), "1");
  const initialStripWidth = nodes.get("pae-area-strip-left").getAttribute("width");
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
  assert.equal(nodes.get("pae-area-overlap-fill").getAttribute("opacity"), "0");
  assert.equal(nodes.get("pae-area-spill-fill").getAttribute("opacity"), "0");
  assert.equal(
    nodes.get("pae-area-strip-right").getAttribute("y"),
    nodes.get("pae-area-strip-left").getAttribute("y"),
  );

  controller.draw(40);
  assert.equal(nodes.get("pae-area-overlap-fill").getAttribute("opacity"), "1");
  assert.notEqual(nodes.get("pae-area-strip-left").getAttribute("width"), initialStripWidth);
  assert.equal(
    nodes.get("pae-area-strip-left").getAttribute("width"),
    nodes.get("pae-area-strip-right").getAttribute("width"),
  );

  // Past 90 degrees the lean flips.
  controller.draw(110.23);
  assert.equal(nodes.get("pae-area-overlap-fill").getAttribute("opacity"), "1");

  // Leaned far enough that the center covers the full width of the left strip.
  controller.draw(128.3);
  assert.equal(nodes.get("pae-area-overlap-fill").getAttribute("opacity"), "1");

  // The end strips keep shrinking as the parcel flattens.
  controller.draw(10);
  assert.ok(Number(nodes.get("pae-area-strip-left").getAttribute("width")) > 0);

  // At steep angles the overlap remains a four-corner shared area.
  controller.draw(20);
  assert.match(nodes.get("pae-area-overlap-fill").getAttribute("d"), /^M .+ L .+ L .+ L .+ Z$/);
});

test("keeps both right-angle diagrams on the same mobile viewport", async () => {
  const { mediaQuery, nodes } = await createHarness("./overlaps.html");

  mediaQuery.setMatches(true);
  assert.equal(nodes.get("pae-area-svg").getAttribute("viewBox"), "70 0 480 676");
});

test("renders the third parallel-to-the-top diagram", async () => {
  const { controller, nodes } = await createHarness("./overlaps.html");

  assert.equal(typeof controller.drawParallel, "function");
  assert.equal(nodes.get("pae-fit-svg").getAttribute("viewBox"), "0 0 620 676");
  assert.equal(
    nodes.get("pae-fit-shape").getAttribute("d"),
    nodes.get("pae-fit-clip-shape").getAttribute("d"),
  );
  assert.equal(nodes.get("pae-fit-strip-right-label").textContent, "c · 15 ft");
  assert.equal(nodes.get("pae-fit-strip-inner-label").textContent, "b · 50 ft");
  assert.equal(nodes.get("pae-fit-strip-left-label").textContent, "a · 15 ft");
  assert.equal(nodes.get("pae-fit-guide-a-label").textContent, "g · A · 65 ft along the top");
  assert.equal(nodes.get("pae-fit-guide-b-label").textContent, "h · B · 50 ft along the top");
  assert.equal(nodes.get("pae-fit-match-label").textContent, "i · Ends match · 0.00 ft");
  assert.equal(nodes.has("pae-fit-title-label"), false);
  assert.equal(nodes.get("pae-fit-calc-reach-result").textContent, "= 65.00 ft, exactly where A ends");
  assert.equal(nodes.get("pae-fit-calc-total-result").textContent, "= 80.00 ft, the whole side");
  assert.equal(nodes.get("pae-fit-calc-gap-result").textContent, "= 0.00 ft at every angle");
  assert.equal(
    nodes.get("pae-fit-boundary-right-inset").getAttribute("x1"),
    nodes.get("pae-fit-boundary-right-inset").getAttribute("x2"),
  );
  assert.equal(
    nodes.get("pae-fit-boundary-inner").getAttribute("x1"),
    nodes.get("pae-fit-boundary-inner").getAttribute("x2"),
  );
  assert.equal(nodes.get("pae-fit-top-dim-right").getAttribute("marker-start"), "url(#pae-fit-green-arrow)");
  assert.equal(nodes.get("pae-fit-top-dim-inner").getAttribute("marker-end"), "url(#pae-fit-green-arrow)");

  // Both guides stop on the same line, however far the shape leans.
  assert.equal(
    nodes.get("pae-fit-guide-a").getAttribute("x2"),
    nodes.get("pae-fit-guide-b").getAttribute("x2"),
  );
});

test("keeps the parallel guides matched after the angle changes", async () => {
  const { nodes } = await createHarness("./overlaps.html");
  const slider = nodes.get("pae-fit-angle");

  slider.value = "122.5";
  slider.dispatch("input");

  assert.equal(nodes.get("pae-fit-svg").getAttribute("viewBox"), "0 0 620 676");
  assert.equal(nodes.get("pae-fit-match-label").textContent, "i · Ends match · 0.00 ft");
  assert.equal(
    nodes.get("pae-fit-guide-a").getAttribute("x2"),
    nodes.get("pae-fit-guide-b").getAttribute("x2"),
  );
  assert.equal(nodes.get("pae-fit-match-line").getAttribute("x1"), nodes.get("pae-fit-match-line").getAttribute("x2"));
});

test("keeps the parallel diagram on the same mobile viewport", async () => {
  const { mediaQuery, nodes } = await createHarness("./overlaps.html");

  mediaQuery.setMatches(true);
  assert.equal(nodes.get("pae-fit-svg").getAttribute("viewBox"), "70 0 480 676");
});

test("keeps the right-angle page's two sliders in step", async () => {
  const { nodes } = await createHarness("./overlaps.html");
  const sliders = ["pae-area-angle", "pae-fit-angle"].map((id) => nodes.get(id));
  const outputs = ["pae-area-angle-output", "pae-fit-angle-output"].map((id) => nodes.get(id));

  // Dragging either diagram's slider moves the other with it.
  sliders[0].value = "34.5";
  sliders[0].dispatch("input");
  for (const slider of sliders) {
    assert.equal(slider.value, "34.5");
  }
  for (const output of outputs) {
    assert.equal(output.textContent, "34.50°");
  }

  sliders[1].value = "128.75";
  sliders[1].dispatch("input");
  for (const slider of sliders) {
    assert.equal(slider.value, "128.75");
  }
  assert.equal(nodes.get("pae-area-angle-output").textContent, "128.75°");

  // The presets drive both too.
  nodes.get("pae-snap-90").dispatch("click");
  for (const slider of sliders) {
    assert.equal(slider.value, "90");
  }
  for (const output of outputs) {
    assert.equal(output.textContent, "90.00°");
  }
});

test("each page carries only its own diagrams", async () => {
  // The recorded measurements stand alone; the right-angle method and the
  // parallel-to-the-top answer to it travel together on the second page.
  const recorded = await createHarness();
  assert.equal(recorded.nodes.has("pae-svg"), true);
  assert.equal(recorded.nodes.has("pae-area-svg"), false);
  assert.equal(recorded.nodes.has("pae-fit-svg"), false);

  const { controller, nodes, mediaQuery } = await createHarness("./overlaps.html");

  assert.equal(nodes.has("pae-svg"), false);
  assert.equal(nodes.has("pae-fit-svg"), true);
  assert.equal(nodes.get("pae-area-angle-output").textContent, "69.69°");
  assert.equal(nodes.get("pae-area-overlap-fill").getAttribute("opacity"), "1");
  assert.match(nodes.get("pae-area-shape").getAttribute("d"), /^M .+ Z$/);

  const slider = nodes.get("pae-area-angle");
  slider.value = "90";
  slider.dispatch("input");
  assert.equal(nodes.get("pae-area-angle-output").textContent, "90.00°");
  assert.equal(nodes.get("pae-area-overlap-fill").getAttribute("opacity"), "0");

  nodes.get("pae-snap-9874").dispatch("click");
  assert.equal(nodes.get("pae-area-angle-output").textContent, "98.74°");

  mediaQuery.setMatches(true);
  assert.equal(nodes.get("pae-area-svg").getAttribute("viewBox"), "70 0 480 676");
});

test("every module version query matches", async () => {
  // A page can load a fresh app.mjs beside a cached geometry.mjs if these
  // drift apart, and the mismatched pair throws instead of drawing.
  const files = ["index.html", "overlaps.html", "main.mjs", "app.mjs", "geometry.test.mjs"];
  const versions = new Set();
  for (const file of files) {
    const source = await readFile(new URL(`./${file}`, import.meta.url), "utf8");
    for (const [, version] of source.matchAll(/\.mjs\?v=(\d+)/g)) {
      versions.add(version);
    }
  }
  assert.equal(versions.size, 1, `mixed module versions: ${[...versions].join(", ")}`);
});
