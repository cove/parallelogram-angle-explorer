import {
  calculateDiagram,
  calculateParallelAreas,
  calculateRightAngleAreas,
  DIMENSIONS,
  PRESET_ANGLES,
} from "./geometry.mjs?v=35";

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
  const snap9874Button = root.querySelector("#pae-snap-9874");
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

  function setVariableText(node, position, text, rotation = 0) {
    setText(node, position, "", rotation);
    node.innerHTML = text.replace(
      /\b([a-i])\b/g,
      '<tspan class="math-variable">$1</tspan>',
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

  function pathFromPolygons(polygons) {
    return polygons.map((points) => pathFromPoints(points, true)).join(" ");
  }

  function setFormula(id, formula) {
    element(`${id}-expression`).innerHTML = formula.expression.replace(
      /\b([a-i])\b/g,
      "<var>$1</var>",
    );
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
    setVariableText(
      element("pae-top-dim-left-label"),
      diagram.topLabels.left,
      `a · ${DIMENSIONS.inset} ft`,
      diagram.shortRotation,
    );
    setVariableText(
      element("pae-top-dim-inner-label"),
      diagram.topLabels.inner,
      `b · ${DIMENSIONS.innerSpan} ft`,
      diagram.shortRotation,
    );
    setVariableText(
      element("pae-top-dim-right-label"),
      diagram.topLabels.right,
      `c · ${DIMENSIONS.inset} ft`,
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
    setVariableText(
      element("pae-perp-inset-left-label"),
      diagram.perpendicular.leftLabel,
      `d · ${diagram.measurements.perpendicularChain.left.toFixed(2)} ft`,
    );
    setVariableText(
      element("pae-perp-inner-label"),
      diagram.perpendicular.innerLabel,
      `e · ${diagram.measurements.perpendicularChain.inner.toFixed(2)} ft`,
    );
    setVariableText(
      element("pae-perp-inset-right-label"),
      diagram.perpendicular.rightLabel,
      `f · ${diagram.measurements.perpendicularChain.right.toFixed(2)} ft`,
    );

    setLine(element("pae-static-a"), diagram.guides.a);
    setVariableText(element("pae-static-a-label"), diagram.guides.aLabel, `g · A · ${DIMENSIONS.arrowA} ft`);
    setLine(element("pae-static-b"), diagram.guides.b);
    setVariableText(element("pae-static-b-label"), diagram.guides.bLabel, `h · B · ${DIMENSIONS.arrowB} ft`);
    setLine(element("pae-overlap-extent-a"), diagram.guides.overlapExtentA);
    setLine(element("pae-overlap-span"), diagram.guides.overlapSpan);
    setVariableText(
      element("pae-overlap-label"),
      diagram.guides.overlapLabel,
      `i · A into left 15 · ${diagram.measurements.overlap.toFixed(2)} ft`,
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
    setFormula("pae-calc-left-boundary", diagram.formulas.leftBoundary);
    setFormula("pae-calc-fixed-arrows", diagram.formulas.fixedArrows);
    setFormula("pae-calc-b-reach", diagram.formulas.bReach);
    setFormula("pae-calc-left-over", diagram.formulas.leftOver);
    setFormula("pae-calc-forced-inner", diagram.formulas.forcedInner);
    setFormula("pae-calc-overlap", diagram.formulas.overlap);
    setFormula("pae-calc-b-overlap", diagram.formulas.bOverlap);
    setFormula("pae-calc-projection-loss", diagram.formulas.projectionLoss);
  }

  function drawAreas(angleDegrees) {
    if (!areaSvg) {
      return;
    }
    const areas = calculateRightAngleAreas(angleDegrees);

    const shapePath = pathFromPoints(areas.shape, true);
    element("pae-area-shape").setAttribute("d", shapePath);
    element("pae-area-clip-shape").setAttribute("d", shapePath);

    // Reproducing the forced-measurements diagram's own naive top row and
    // its long dashed insets, so A's 65 ft line visibly crosses the dashed
    // line coming down from the left 15 ft boundary here too.
    setLine(element("pae-area-inset-left"), areas.insetLines.left);
    setLine(element("pae-area-inset-right"), areas.insetLines.right);
    setLine(element("pae-area-top-dim-left"), areas.topDimensions.left);
    setLine(element("pae-area-top-dim-inner"), areas.topDimensions.inner);
    setLine(element("pae-area-top-dim-right"), areas.topDimensions.right);
    setLine(element("pae-area-top-ext-left"), areas.topExtensions.left);
    setLine(element("pae-area-top-ext-inset-left"), areas.topExtensions.insetLeft);
    setLine(element("pae-area-top-ext-inset-right"), areas.topExtensions.insetRight);
    setLine(element("pae-area-top-ext-right"), areas.topExtensions.right);
    setVariableText(
      element("pae-area-top-dim-left-label"),
      areas.topLabels.left,
      `a · ${DIMENSIONS.inset} ft`,
      areas.shortRotation,
    );
    setVariableText(
      element("pae-area-top-dim-inner-label"),
      areas.topLabels.inner,
      `b · ${DIMENSIONS.innerSpan} ft`,
      areas.shortRotation,
    );
    setVariableText(
      element("pae-area-top-dim-right-label"),
      areas.topLabels.right,
      `c · ${DIMENSIONS.inset} ft`,
      areas.shortRotation,
    );

    // Draw the attempted fixed 50 ft center from the right-hand strip. Its
    // far end can overlap the independently measured left strip.
    setRect(element("pae-area-middle"), areas.middleArea);
    // Outline, shaded length inside the shape, and the mask that turns each
    // strip into a hole for the gap slivers.
    for (const part of ["", "-fill"]) {
      setRect(element(`pae-area-strip-right${part}`), areas.strips.right);
      setRect(element(`pae-area-strip-left${part}`), areas.strips.left);
    }
    setRect(element("pae-area-mask-middle"), areas.middleArea);
    setRect(element("pae-area-middle-gap"), areas.middleColumn);
    setRect(element("pae-area-mask-strip-right"), areas.strips.right);
    setRect(element("pae-area-mask-strip-left"), areas.strips.left);
    setRect(element("pae-area-strip-right-gap"), areas.stripColumns.right);
    setRect(element("pae-area-strip-left-gap"), areas.stripColumns.left);
    setLine(element("pae-area-chain-right"), areas.chain.rightInset);
    setLine(element("pae-area-chain-inner"), areas.chain.inner);
    setLine(element("pae-area-chain-left"), areas.chain.leftInset);
    for (const boundary of ["right", "rightInset", "inner", "left"]) {
      const id = boundary.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
      setLine(
        element(`pae-area-chain-witness-${id}`),
        areas.chainWitnesses[boundary],
      );
    }
    element("pae-area-square-chain").setAttribute(
      "d",
      pathFromPoints(areas.squares.chain),
    );
    setVariableText(
      element("pae-area-chain-right-label"),
      areas.labels.chainRightInset,
      `f · ${areas.measurements.chainRightAngle.right.toFixed(2)} ft`,
    );
    setVariableText(
      element("pae-area-chain-inner-label"),
      areas.labels.chainInner,
      `e · ${areas.measurements.chainRightAngle.inner.toFixed(2)} ft`,
    );
    setVariableText(
      element("pae-area-chain-left-label"),
      areas.labels.chainLeftInset,
      `d · ${areas.measurements.chainRightAngle.left.toFixed(2)} ft`,
    );

    setLine(element("pae-area-dim-a"), areas.dimensions.a);
    setLine(element("pae-area-dim-b"), areas.dimensions.b);
    for (const id of ["pae-area-dim-a", "pae-area-dim-b"]) {
      element(id).setAttribute("marker-start", "url(#pae-area-purple-arrow)");
      element(id).setAttribute("marker-end", "url(#pae-area-purple-arrow)");
    }
    element("pae-area-square-a").setAttribute("d", pathFromPoints(areas.squares.a));
    element("pae-area-square-b").setAttribute("d", pathFromPoints(areas.squares.b));

    setVariableText(
      element("pae-area-a-label"),
      areas.labels.a,
      `g · A · ${DIMENSIONS.arrowA} ft at 90°`,
    );
    setVariableText(
      element("pae-area-b-label"),
      areas.labels.b,
      `h · B · ${DIMENSIONS.arrowB} ft at 90°`,
    );
    // A's fixed 65 ft reach meets the independently squared left strip. The
    // shared rectangle is rendered by the combined overlap path below; keep
    // this legacy rectangle transparent so it cannot double-darken the fill.
    setRect(element("pae-area-left-overlap-a"), areas.leftStripOverlaps.a.rect);
    element("pae-area-left-overlap-a").setAttribute("opacity", "0");
    // Restore the two exterior spill regions where the square-ended fit runs
    // beyond the sloping top and bottom parcel edges.
    const spillOpacity = areas.spillVisible ? "1" : "0";
    element("pae-area-spill-fill").setAttribute("opacity", spillOpacity);
    element("pae-area-spill-fill").setAttribute(
      "d",
      pathFromPolygons(areas.spillPolygons),
    );
    // The internal overlap is ground claimed by both the fitted center and
    // the independently measured left strip.
    const overlapOpacity = areas.overlapVisible ? "1" : "0";
    element("pae-area-overlap-fill").setAttribute("opacity", overlapOpacity);
    element("pae-area-overlap-fill").setAttribute(
      "d",
      pathFromPoints(areas.overlapPolygon, true),
    );
    setFormula("pae-area-calc-method", areas.formulas.method);
    setFormula("pae-area-calc-width", areas.formulas.width);
    setFormula("pae-area-calc-middle", areas.formulas.middle);
    setFormula("pae-area-calc-middle-short", areas.formulas.middleShort);
    setFormula("pae-area-calc-middle-ends", areas.formulas.middleEnds);
    setFormula("pae-area-calc-overhang", areas.formulas.overhang);
    setFormula("pae-area-calc-left-overlap-a", areas.formulas.leftStripOverlapB);
    setFormula("pae-area-calc-left-overlap-b", areas.formulas.leftStripOverlapA);
    setFormula("pae-area-calc-gap-area", areas.formulas.gapArea);
    setFormula("pae-area-calc-overlap-area", areas.formulas.overlapArea);
    setFormula("pae-area-calc-spill-area", areas.formulas.spillArea);
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

    setLine(element("pae-fit-boundary-right-inset"), fit.boundaryLines.rightInset);
    setLine(element("pae-fit-boundary-inner"), fit.boundaryLines.inner);
    setLine(element("pae-fit-top-dim-right"), fit.topDimensions.rightInset);
    setLine(element("pae-fit-top-dim-inner"), fit.topDimensions.inner);
    setLine(element("pae-fit-top-dim-left"), fit.topDimensions.leftInset);
    for (const id of ["pae-fit-top-dim-right", "pae-fit-top-dim-inner", "pae-fit-top-dim-left"]) {
      element(id).setAttribute("marker-start", "url(#pae-fit-green-arrow)");
      element(id).setAttribute("marker-end", "url(#pae-fit-green-arrow)");
    }
    setLine(element("pae-fit-top-ext-right"), fit.topExtensions.right);
    setLine(element("pae-fit-top-ext-right-inset"), fit.topExtensions.rightInset);
    setLine(element("pae-fit-top-ext-inner"), fit.topExtensions.inner);
    setLine(element("pae-fit-top-ext-left"), fit.topExtensions.left);

    setLine(element("pae-fit-guide-a"), fit.guides.a);
    setLine(element("pae-fit-guide-b"), fit.guides.b);
    setLine(element("pae-fit-match-line"), fit.matchLine);

    setVariableText(
      element("pae-fit-strip-right-label"),
      fit.labels.rightInset,
      `c · ${DIMENSIONS.inset} ft`,
      fit.rotation,
    );
    setVariableText(
      element("pae-fit-strip-inner-label"),
      fit.labels.inner,
      `b · ${DIMENSIONS.innerSpan} ft`,
      fit.rotation,
    );
    setVariableText(
      element("pae-fit-strip-left-label"),
      fit.labels.leftInset,
      `a · ${DIMENSIONS.inset} ft`,
      fit.rotation,
    );
    setVariableText(
      element("pae-fit-guide-a-label"),
      fit.labels.a,
      `g · A · ${DIMENSIONS.arrowA} ft along the top`,
      fit.rotation,
    );
    setVariableText(
      element("pae-fit-guide-b-label"),
      fit.labels.b,
      `h · B · ${DIMENSIONS.innerSpan} ft along the top`,
      fit.rotation,
    );
    setVariableText(
      element("pae-fit-match-label"),
      fit.labels.match,
      `i · Ends match · ${fit.measurements.gap.toFixed(2)} ft`,
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
  snap9874Button?.addEventListener("click", () => setAngle(PRESET_ANGLES.reverse));
  mobileLayout.addEventListener("change", syncMobileViewport);
  syncMobileViewport();
  draw(Number(angleInputs[0].value));

  return { draw, drawForced, drawAreas, drawParallel, setAngle, syncMobileViewport };
}
