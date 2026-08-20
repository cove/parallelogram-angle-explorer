import {
  calculateDiagram,
  calculateParallelAreas,
  calculateRightAngleAreas,
  DIMENSIONS,
  PRESET_ANGLES,
} from "./geometry.mjs?v=5";

export function initializeApp(documentRef, windowRef) {
  const root = documentRef.getElementById("parallelogram-angle-explorer");
  // One slider per diagram, all driving the same angle, so a phone reader can
  // reach a slider without scrolling back to the top.
  // Pages may carry any subset of the diagrams, so every lookup below tolerates
  // a missing one and the draw step for an absent diagram is skipped.
  const angleInputs = ["pae-angle", "pae-area-angle", "pae-fit-angle"]
    .map((id) => root.querySelector(`#${id}`))
    .filter((input) => input !== null);
  const angleOutputs = ["pae-angle-output", "pae-area-angle-output", "pae-fit-angle-output"]
    .map((id) => root.querySelector(`#${id}`))
    .filter((output) => output !== null);
  const snap90Button = root.querySelector("#pae-snap-90");
  const snap11023Button = root.querySelector("#pae-snap-11023");
  const svg = root.querySelector("#pae-svg");
  const areaSvg = root.querySelector("#pae-area-svg");
  const fitSvg = root.querySelector("#pae-fit-svg");
  const mobileLayout = windowRef.matchMedia("(max-width: 600px)");
  const element = (id) => root.querySelector(`#${id}`);

  function syncMobileViewport() {
    // Wide enough that the overlap and gap labels are not clipped on a phone.
    const viewBox = mobileLayout.matches ? "70 0 480 676" : "0 0 620 676";
    for (const node of [svg, areaSvg, fitSvg]) {
      if (node) {
        node.setAttribute("viewBox", viewBox);
      }
    }
  }

  function setLine(node, coordinates) {
    for (const attribute of ["x1", "y1", "x2", "y2"]) {
      node.setAttribute(attribute, coordinates[attribute].toFixed(2));
    }
  }

  function setText(node, position, text, rotation = 0) {
    node.setAttribute("x", position.x.toFixed(2));
    node.setAttribute("y", position.y.toFixed(2));
    node.textContent = text;
    node.setAttribute(
      "transform",
      `rotate(${rotation.toFixed(2)} ${position.x.toFixed(2)} ${position.y.toFixed(2)})`,
    );
  }

  function setRect(node, rect) {
    for (const attribute of ["x", "y", "width", "height"]) {
      node.setAttribute(attribute, rect[attribute].toFixed(2));
    }
  }

  function pathFromPoints(points, close = false) {
    const commands = points.map((position, index) => (
      `${index === 0 ? "M" : "L"} ${position.x} ${position.y}`
    ));
    return `${commands.join(" ")}${close ? " Z" : ""}`;
  }

  function setFormula(id, formula) {
    element(`${id}-expression`).textContent = formula.expression;
    element(`${id}-result`).textContent = formula.result;
  }

  function draw(angleDegrees) {
    for (const output of angleOutputs) {
      output.textContent = `${angleDegrees.toFixed(2)}°`;
    }
    drawForced(angleDegrees);
    drawAreas(angleDegrees);
    drawParallel(angleDegrees);
  }

  function drawForced(angleDegrees) {
    if (!svg) {
      return;
    }
    const diagram = calculateDiagram(angleDegrees);

    element("pae-shape").setAttribute("d", pathFromPoints(diagram.shape, true));
    setLine(element("pae-inset-left"), diagram.insetLines.left);
    setLine(element("pae-inset-right"), diagram.insetLines.right);

    setLine(element("pae-top-dim-left"), diagram.topDimensions.left);
    setLine(element("pae-top-dim-inner"), diagram.topDimensions.inner);
    setLine(element("pae-top-dim-right"), diagram.topDimensions.right);
    setLine(element("pae-top-ext-left"), diagram.topExtensions.left);
    setLine(element("pae-top-ext-inset-left"), diagram.topExtensions.insetLeft);
    setLine(element("pae-top-ext-inset-right"), diagram.topExtensions.insetRight);
    setLine(element("pae-top-ext-right"), diagram.topExtensions.right);
    setText(
      element("pae-top-dim-left-label"),
      diagram.topLabels.left,
      `${DIMENSIONS.inset} ft`,
      diagram.shortRotation,
    );
    setText(
      element("pae-top-dim-inner-label"),
      diagram.topLabels.inner,
      `${DIMENSIONS.innerSpan} ft`,
      diagram.shortRotation,
    );
    setText(
      element("pae-top-dim-right-label"),
      diagram.topLabels.right,
      `${DIMENSIONS.inset} ft`,
      diagram.shortRotation,
    );

    setLine(element("pae-perp-inset-left"), diagram.perpendicular.left);
    setLine(element("pae-perp-inner"), diagram.perpendicular.inner);
    setLine(element("pae-perp-inset-right"), diagram.perpendicular.right);
    element("pae-perp-square-left").setAttribute(
      "d",
      pathFromPoints(diagram.perpendicular.leftSquare),
    );
    element("pae-perp-square-right").setAttribute(
      "d",
      pathFromPoints(diagram.perpendicular.rightSquare),
    );
    setText(
      element("pae-right-angle-method-label"),
      diagram.perpendicular.methodLabel,
      "Right angle method",
    );
    setText(
      element("pae-perp-inset-left-label"),
      diagram.perpendicular.leftLabel,
      `${diagram.measurements.perpendicularInset.toFixed(2)} ft`,
    );
    setText(
      element("pae-perp-inner-label"),
      diagram.perpendicular.innerLabel,
      `${diagram.measurements.perpendicularInner.toFixed(2)} ft`,
    );
    setText(
      element("pae-perp-inset-right-label"),
      diagram.perpendicular.rightLabel,
      `${diagram.measurements.perpendicularInset.toFixed(2)} ft`,
    );

    setLine(element("pae-static-a"), diagram.guides.a);
    setText(element("pae-static-a-label"), diagram.guides.aLabel, `A · ${DIMENSIONS.arrowA} ft`);
    setLine(element("pae-static-b"), diagram.guides.b);
    setText(element("pae-static-b-label"), diagram.guides.bLabel, `B · ${DIMENSIONS.arrowB} ft`);
    setLine(element("pae-overlap-extent-a"), diagram.guides.overlapExtentA);
    setLine(element("pae-overlap-span"), diagram.guides.overlapSpan);
    setText(
      element("pae-overlap-label"),
      diagram.guides.overlapLabel,
      `Overlap · ${diagram.measurements.overlap.toFixed(2)} ft`,
    );

    element("pae-angle-arc").setAttribute(
      "d",
      `M ${diagram.arc.start.x} ${diagram.arc.start.y} A ${diagram.arc.radius} ${diagram.arc.radius} 0 0 1 ${diagram.arc.end.x} ${diagram.arc.end.y}`,
    );
    setText(
      element("pae-angle-label"),
      diagram.angleLabel,
      `${angleDegrees.toFixed(2)}°`,
    );
    setText(
      element("pae-bottom-side-label"),
      diagram.bottomLabel,
      `${DIMENSIONS.side} ft`,
      diagram.shortRotation,
    );
    setText(
      element("pae-right-side-label"),
      diagram.rightSideLabel,
      `${DIMENSIONS.longSide} ft`,
      90,
    );

    setFormula("pae-calc-shape", diagram.formulas.shape);
    setFormula("pae-calc-perp-insets", diagram.formulas.outerOffsets);
    setFormula("pae-calc-perp-inner", diagram.formulas.innerSpan);
    setFormula("pae-calc-fixed-arrows", diagram.formulas.fixedArrows);
    setFormula("pae-calc-overlap", diagram.formulas.overlap);
  }

  function drawAreas(angleDegrees) {
    if (!areaSvg) {
      return;
    }
    const areas = calculateRightAngleAreas(angleDegrees);

    const shapePath = pathFromPoints(areas.shape, true);
    element("pae-area-shape").setAttribute("d", shapePath);
    element("pae-area-clip-shape").setAttribute("d", shapePath);
    // The mask knocks the shape out, leaving only what the strips hang over.
    element("pae-area-mask-shape").setAttribute("d", shapePath);

    // Either the middle still has room, or the two strips have run into
    // each other and what is left is a clash rather than a middle.
    setRect(element("pae-area-middle"), areas.middleArea);
    setRect(element("pae-area-middle-collide"), areas.middleArea);
    element("pae-area-middle").setAttribute("opacity", areas.stripsCollide ? "0" : "1");
    element("pae-area-middle-collide").setAttribute("opacity", areas.stripsCollide ? "1" : "0");
    // Outline, shaded length inside the shape, the spill past its edges, and
    // the mask that turns each strip into a hole for the gap slivers.
    for (const part of ["", "-fill", "-spill"]) {
      setRect(element(`pae-area-strip-right${part}`), areas.strips.right);
      setRect(element(`pae-area-strip-left${part}`), areas.strips.left);
    }
    setRect(element("pae-area-mask-middle"), areas.middleArea);
    setRect(element("pae-area-middle-spill"), areas.middleArea);
    setRect(element("pae-area-middle-gap"), areas.middleColumn);
    setRect(element("pae-area-mask-strip-right"), areas.strips.right);
    setRect(element("pae-area-mask-strip-left"), areas.strips.left);
    setRect(element("pae-area-strip-right-gap"), areas.stripColumns.right);
    setRect(element("pae-area-strip-left-gap"), areas.stripColumns.left);
    setText(element("pae-area-strip-right-label"), areas.labels.rightStrip, `${DIMENSIONS.inset} ft`, 90);
    setText(element("pae-area-strip-left-label"), areas.labels.leftStrip, `${DIMENSIONS.inset} ft`, 90);

    setLine(element("pae-area-chain-right"), areas.chain.rightInset);
    setLine(element("pae-area-chain-inner"), areas.chain.inner);
    setLine(element("pae-area-chain-left"), areas.chain.leftInset);
    setLine(element("pae-area-far-edge-witness"), areas.farEdgeWitness);
    element("pae-area-square-chain").setAttribute(
      "d",
      pathFromPoints(areas.squares.chain),
    );
    setText(element("pae-area-chain-right-label"), areas.labels.chainRightInset, `${DIMENSIONS.inset} ft`);
    setText(element("pae-area-chain-inner-label"), areas.labels.chainInner, `${DIMENSIONS.innerSpan} ft`);
    setText(element("pae-area-chain-left-label"), areas.labels.chainLeftInset, `${DIMENSIONS.inset} ft`);

    setLine(element("pae-area-dim-a"), areas.dimensions.a);
    setLine(element("pae-area-dim-b"), areas.dimensions.b);
    element("pae-area-square-a").setAttribute("d", pathFromPoints(areas.squares.a));
    element("pae-area-square-b").setAttribute("d", pathFromPoints(areas.squares.b));

    setText(
      element("pae-area-a-label"),
      areas.labels.a,
      `A · ${DIMENSIONS.arrowA} ft at 90°`,
    );
    setText(
      element("pae-area-b-label"),
      areas.labels.b,
      `B · ${DIMENSIONS.arrowB} ft at 90°`,
    );
    // Either line reaching past the inner edge of the left 15 ft strip is
    // claiming ground that strip already claims, so that run is shaded red.
    setRect(element("pae-area-left-overlap-a"), areas.leftStripOverlaps.a.rect);
    setRect(element("pae-area-left-overlap-b"), areas.leftStripOverlaps.b.rect);
    // Square on, the strip ends land on the edges: nothing over, nothing short.
    const overhang = areas.measurements.overhang;
    const middleEnds = areas.measurements.middleEnds;
    const corners = [
      ["rt", areas.labels.rightTop, areas.leansRight, overhang],
      ["rb", areas.labels.rightBottom, !areas.leansRight, overhang],
      ["lt", areas.labels.leftTop, !areas.leansRight, overhang],
      ["lb", areas.labels.leftBottom, areas.leansRight, overhang],
      ["mt", areas.labels.middleTop, areas.leansRight, middleEnds],
      ["mb", areas.labels.middleBottom, !areas.leansRight, middleEnds],
    ];
    for (const [corner, position, isOverlap, feet] of corners) {
      const node = element(`pae-area-corner-${corner}`);
      node.setAttribute("opacity", feet > 0 ? "1" : "0");
      // Inline so it wins over the shared label colour in the stylesheet.
      node.setAttribute("style", `fill: ${isOverlap ? "#c00000" : "#111111"}`);
      setText(
        node,
        position,
        `${isOverlap ? "Overlap" : "Gap"} · ${feet.toFixed(2)} ft`,
      );
    }

    setFormula("pae-area-calc-method", areas.formulas.method);
    setFormula("pae-area-calc-width", areas.formulas.width);
    setFormula("pae-area-calc-middle", areas.formulas.middle);
    setFormula("pae-area-calc-middle-short", areas.formulas.middleShort);
    setFormula("pae-area-calc-middle-ends", areas.formulas.middleEnds);
    setFormula("pae-area-calc-overhang", areas.formulas.overhang);
    setFormula("pae-area-calc-left-overlap", areas.formulas.leftStripOverlap);
    setFormula("pae-area-calc-chain", areas.formulas.chain);
  }

  function drawParallel(angleDegrees) {
    if (!fitSvg) {
      return;
    }
    const fit = calculateParallelAreas(angleDegrees);

    const shapePath = pathFromPoints(fit.shape, true);
    element("pae-fit-shape").setAttribute("d", shapePath);
    element("pae-fit-clip-shape").setAttribute("d", shapePath);

    setRect(element("pae-fit-strip-right"), fit.strips.rightInset);
    setRect(element("pae-fit-strip-inner"), fit.strips.inner);
    setRect(element("pae-fit-strip-left"), fit.strips.leftInset);

    setLine(element("pae-fit-guide-a"), fit.guides.a);
    setLine(element("pae-fit-guide-b"), fit.guides.b);
    setLine(element("pae-fit-match-line"), fit.matchLine);

    setText(
      element("pae-fit-strip-right-label"),
      fit.labels.rightInset,
      `${DIMENSIONS.inset} ft`,
      fit.rotation,
    );
    setText(
      element("pae-fit-strip-inner-label"),
      fit.labels.inner,
      `${DIMENSIONS.innerSpan} ft`,
      fit.rotation,
    );
    setText(
      element("pae-fit-strip-left-label"),
      fit.labels.leftInset,
      `${DIMENSIONS.inset} ft`,
      fit.rotation,
    );
    setText(
      element("pae-fit-guide-a-label"),
      fit.labels.a,
      `A · ${DIMENSIONS.arrowA} ft along the top`,
      fit.rotation,
    );
    setText(
      element("pae-fit-guide-b-label"),
      fit.labels.b,
      `B · ${DIMENSIONS.innerSpan} ft along the top`,
      fit.rotation,
    );
    setText(
      element("pae-fit-match-label"),
      fit.labels.match,
      `Ends match · ${fit.measurements.gap.toFixed(2)} ft`,
    );

    setFormula("pae-fit-calc-method", fit.formulas.method);
    setFormula("pae-fit-calc-reach", fit.formulas.reach);
    setFormula("pae-fit-calc-total", fit.formulas.total);
    setFormula("pae-fit-calc-gap", fit.formulas.gap);
  }

  function setAngle(angleDegrees) {
    for (const input of angleInputs) {
      input.value = String(angleDegrees);
    }
    draw(angleDegrees);
  }

  for (const input of angleInputs) {
    input.addEventListener("input", () => setAngle(Number(input.value)));
  }
  snap90Button?.addEventListener("click", () => setAngle(PRESET_ANGLES.rightAngle));
  snap11023Button?.addEventListener("click", () => setAngle(PRESET_ANGLES.reverse));
  mobileLayout.addEventListener("change", syncMobileViewport);
  syncMobileViewport();
  draw(Number(angleInputs[0].value));

  return { draw, drawForced, drawAreas, drawParallel, setAngle, syncMobileViewport };
}
