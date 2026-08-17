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
  assert.equal(nodes.get("pae-calc-shape").textContent.includes("165.93 ft"), true);
  assert.equal(nodes.get("pae-calc-fixed-arrows").textContent, "A = 65 ft; B = 50 ft");
  assert.match(nodes.get("pae-shape").getAttribute("d"), /^M .+ Z$/);
  assert.match(nodes.get("pae-perp-square-left").getAttribute("d"), /^M .+ L .+ L /);
});

test("updates the diagram and formulas from slider input", async () => {
  const { nodes } = await createHarness();
  const slider = nodes.get("pae-angle");

  slider.value = "86.89";
  slider.dispatch("input");

  assert.equal(nodes.get("pae-angle-output").textContent, "86.89°");
  assert.equal(nodes.get("pae-calc-perp-insets").textContent, "15 × sin(86.89°) = 14.98 ft each");
  assert.equal(nodes.get("pae-calc-overlap").textContent.endsWith("0.02 ft"), true);
});

test("handles both preset buttons and the 180 degree extreme", async () => {
  const { controller, nodes } = await createHarness();
  const slider = nodes.get("pae-angle");

  nodes.get("pae-snap-90").dispatch("click");
  assert.equal(slider.value, "90");
  assert.equal(nodes.get("pae-calc-overlap").textContent.endsWith("0.00 ft"), true);

  nodes.get("pae-snap-11023").dispatch("click");
  assert.equal(slider.value, "110.23");
  assert.equal(nodes.get("pae-angle-output").textContent, "110.23°");

  controller.draw(180);
  assert.equal(nodes.get("pae-angle-output").textContent, "180.00°");
  assert.equal(nodes.get("pae-perp-inset-left-label").textContent, "0.00 ft");
  assert.equal(nodes.get("pae-calc-overlap").textContent.endsWith("15.00 ft"), true);
});

test("switches the SVG viewport at the mobile breakpoint", async () => {
  const { controller, mediaQuery, nodes } = await createHarness();

  mediaQuery.setMatches(true);
  assert.equal(nodes.get("pae-svg").getAttribute("viewBox"), "88 0 444 676");

  mediaQuery.matches = false;
  controller.syncMobileViewport();
  assert.equal(nodes.get("pae-svg").getAttribute("viewBox"), "0 0 620 676");
});
