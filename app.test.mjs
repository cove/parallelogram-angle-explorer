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
  assert.equal(nodes.get("pae-perp-inset-left-label").textContent, "10.03 ft");
  assert.equal(nodes.get("pae-perp-inner-label").textContent, "50.93 ft");
  assert.equal(nodes.get("pae-overlap-label").textContent, "Overlap · 4.04 ft");
  assert.equal(
    nodes.get("pae-overlap-extent-a").getAttribute("x1"),
    nodes.get("pae-static-a").getAttribute("x2"),
  );
  assert.equal(nodes.has("pae-overlap-extent-b"), false);
  assert.equal(
    nodes.get("pae-overlap-span").getAttribute("x2"),
    nodes.get("pae-inset-left").getAttribute("x1"),
  );
  assert.equal(nodes.get("pae-calc-shape-expression").textContent, "15 ft + 50 ft + 15 ft");
  assert.equal(nodes.get("pae-calc-shape-result").textContent, "= 80 ft; long sides = 165.93 ft");
  assert.equal(nodes.get("pae-calc-fixed-arrows-expression").textContent, "A = 65 ft");
  assert.equal(nodes.get("pae-calc-fixed-arrows-result").textContent, "· B = 50 ft");
  assert.equal(nodes.get("pae-calc-projection-loss-result").textContent, "= 0.93 ft");
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
  assert.equal(nodes.get("pae-calc-overlap-result").textContent, "= 0.10 ft");
});

test("handles both preset buttons and the 180 degree extreme", async () => {
  const { controller, nodes } = await createHarness();
  const slider = nodes.get("pae-angle");

  nodes.get("pae-snap-90").dispatch("click");
  assert.equal(slider.value, "90");
  assert.equal(nodes.get("pae-calc-overlap-result").textContent, "= 0.00 ft");

  nodes.get("pae-snap-9874").dispatch("click");
  assert.equal(slider.value, "98.74");
  assert.equal(nodes.get("pae-angle-output").textContent, "98.74°");

  controller.draw(180);
  assert.equal(nodes.get("pae-angle-output").textContent, "180.00°");
  assert.equal(nodes.get("pae-perp-inset-left-label").textContent, "65.00 ft");
  assert.equal(nodes.get("pae-calc-overlap-result").textContent, "= 65.00 ft");
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
  assert.equal(nodes.get("pae-area-a-label").textContent, "A · 65 ft at 90°");
  assert.equal(nodes.get("pae-area-b-label").textContent, "B · 50 ft at 90°");
  // One label for the whole over-claimed wedge and one for the whole
  // unclaimed wedge, each reporting a single combined total rather than a
  // per-strip breakdown.
  assert.equal(nodes.get("pae-area-overlap-label").textContent, "Overlap · 1041.66 ft²");
  assert.equal(nodes.get("pae-area-overlap-label").getAttribute("opacity"), "1");
  assert.equal(
    nodes.get("pae-area-overlap-leader").getAttribute("marker-end"),
    "url(#pae-area-red-arrow)",
  );
  assert.equal(nodes.get("pae-area-gap").textContent, "Gap · 1041.66 ft²");
  assert.equal(
    nodes.get("pae-area-gap-leader").getAttribute("marker-end"),
    "url(#pae-area-black-arrow)",
  );
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
  assert.equal(nodes.get("pae-area-calc-middle-result").textContent, "= 45.03 ft for a 50 ft middle");
  assert.equal(
    nodes.get("pae-area-calc-middle-short-result").textContent,
    "= 4.97 ft short in the middle",
  );
  assert.equal(
    nodes.get("pae-area-calc-middle-ends-result").textContent,
    "= 24.06 ft at the middle's far end",
  );
  assert.equal(
    nodes.get("pae-area-calc-gap-area-result").textContent,
    "= 1041.66 ft² unclaimed",
  );
  assert.equal(
    nodes.get("pae-area-calc-overlap-area-result").textContent,
    "= 1041.66 ft² over-claimed",
  );
});

test("squares a 15 ft strip off each side and shades what hangs over", async () => {
  const { controller, nodes } = await createHarness("./overlaps.html");

  assert.equal(nodes.get("pae-area-chain-right-label").textContent, "15 ft");
  assert.equal(nodes.get("pae-area-chain-inner-label").textContent, "50 ft");
  assert.equal(nodes.get("pae-area-chain-left-label").textContent, "15 ft");
  assert.equal(nodes.get("pae-area-calc-chain-result").textContent, "= 80 ft of room needed at 90°");
  assert.match(nodes.get("pae-area-square-chain").getAttribute("d"), /^M .+ L .+ L /);
  assert.equal(
    nodes.get("pae-area-chain-witness-right-inset").getAttribute("x1"),
    nodes.get("pae-area-chain-right").getAttribute("x2"),
  );
  assert.equal(
    nodes.get("pae-area-chain-witness-inner").getAttribute("x1"),
    nodes.get("pae-area-chain-inner").getAttribute("x2"),
  );

  // Each strip spans its own side, so the two are the same length.
  assert.equal(
    nodes.get("pae-area-strip-right").getAttribute("height"),
    nodes.get("pae-area-strip-left").getAttribute("height"),
  );
  assert.equal(nodes.get("pae-area-overlap-label").getAttribute("opacity"), "1");
  assert.equal(nodes.get("pae-area-gap").getAttribute("opacity"), "1");
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
  assert.equal(nodes.get("pae-area-overlap-label").getAttribute("opacity"), "0");
  assert.equal(nodes.get("pae-area-gap").getAttribute("opacity"), "0");
  assert.equal(nodes.get("pae-area-gap-leader").getAttribute("opacity"), "0");
  assert.equal(
    nodes.get("pae-area-strip-right").getAttribute("y"),
    nodes.get("pae-area-strip-left").getAttribute("y"),
  );

  controller.draw(40);
  assert.equal(nodes.get("pae-area-overlap-label").getAttribute("opacity"), "1");
  assert.equal(nodes.get("pae-area-gap").textContent, "Gap · 1575.69 ft²");

  // Past 90 degrees the lean flips.
  controller.draw(110.23);
  assert.equal(nodes.get("pae-area-overlap-label").getAttribute("opacity"), "1");
  assert.equal(nodes.get("pae-area-gap").textContent, "Gap · 1038.27 ft²");

  // Leaned far enough that the left strip has walked off the parcel entirely,
  // the total is exactly what the right and middle strips alone leave behind.
  controller.draw(128.3);
  assert.equal(nodes.get("pae-area-overlap-label").getAttribute("opacity"), "1");
  assert.equal(nodes.get("pae-area-gap").textContent, "Gap · 1556.44 ft²");

  // The chain's square ends still leave the parcel's own far corner uncovered.
  controller.draw(10);
  assert.equal(nodes.get("pae-area-gap").getAttribute("opacity"), "1");

  // Leaned steep enough that most of the middle's nominal 50 ft sits past
  // the parcel's true edge, the shaded fill still stops exactly at that edge
  // rather than washing the whole rectangle red.
  controller.draw(20);
  assert.equal(
    nodes.get("pae-area-middle-spill").getAttribute("width"),
    nodes.get("pae-area-middle").getAttribute("width"),
  );
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
  assert.equal(nodes.get("pae-fit-strip-right-label").textContent, "15 ft");
  assert.equal(nodes.get("pae-fit-strip-inner-label").textContent, "50 ft");
  assert.equal(nodes.get("pae-fit-strip-left-label").textContent, "15 ft");
  assert.equal(nodes.get("pae-fit-guide-a-label").textContent, "A · 65 ft along the top");
  assert.equal(nodes.get("pae-fit-guide-b-label").textContent, "B · 50 ft along the top");
  assert.equal(nodes.get("pae-fit-match-label").textContent, "Ends match · 0.00 ft");
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
  assert.equal(nodes.get("pae-fit-match-label").textContent, "Ends match · 0.00 ft");
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
  assert.equal(nodes.get("pae-area-overlap-label").getAttribute("opacity"), "1");
  assert.match(nodes.get("pae-area-shape").getAttribute("d"), /^M .+ Z$/);

  const slider = nodes.get("pae-area-angle");
  slider.value = "90";
  slider.dispatch("input");
  assert.equal(nodes.get("pae-area-angle-output").textContent, "90.00°");
  assert.equal(nodes.get("pae-area-overlap-label").getAttribute("opacity"), "0");

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
