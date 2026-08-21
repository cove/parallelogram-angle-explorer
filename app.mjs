import {
  calculateDiagram,
  calculateParallelAreas,
  calculateRightAngleAreas,
  DIMENSIONS,
  PRESET_ANGLES,
} from "./geometry.mjs?v=26";

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
      `${diagram.measurements.perpendicularChain.left.toFixed(2)} ft`,
    );
    setText(
      element("pae-perp-inner-label"),
      diagram.perpendicular.innerLabel,
      `${diagram.measurements.perpendicularChain.inner.toFixed(2)} ft`,
    );
    setText(
      element("pae-perp-inset-right-label"),
      diagram.perpendicular.rightLabel,
      `${diagram.measurements.perpendicularChain.right.toFixed(2)} ft`,
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
    setFormula("pae-calc-left-over", diagram.formulas.leftOver);
    setFormula("pae-calc-overlap", diagram.formulas.overlap);
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
    // The mask knocks the shape out, leaving only what the strips hang over.
    element("pae-area-mask-shape").setAttribute("d", shapePath);

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
    setText(
      element("pae-area-top-dim-left-label"),
      areas.topLabels.left,
      `${DIMENSIONS.inset} ft`,
      areas.shortRotation,
    );
    setText(
      element("pae-area-top-dim-inner-label"),
      areas.topLabels.inner,
      `${DIMENSIONS.innerSpan} ft`,
      areas.shortRotation,
    );
    setText(
      element("pae-area-top-dim-right-label"),
      areas.topLabels.right,
      `${DIMENSIONS.inset} ft`,
      areas.shortRotation,
    );

    // Either the middle still lands on the parcel, or it has leaned far
    // enough that its far end has walked off the parcel entirely.
    setRect(element("pae-area-middle"), areas.middleArea);
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
    setText(
      element("pae-area-chain-right-label"),
      areas.labels.chainRightInset,
      `${areas.measurements.chainRightAngle.right.toFixed(2)} ft`,
    );
    setText(
      element("pae-area-chain-inner-label"),
      areas.labels.chainInner,
      `${areas.measurements.chainRightAngle.inner.toFixed(2)} ft`,
    );
    setText(
      element("pae-area-chain-left-label"),
      areas.labels.chainLeftInset,
      `${areas.measurements.chainRightAngle.left.toFixed(2)} ft`,
    );

    setLine(element("pae-area-dim-a"), areas.dimensions.a);
    setLine(element("pae-area-dim-b"), areas.dimensions.b);
    for (const id of ["pae-area-dim-a", "pae-area-dim-b"]) {
      element(id).setAttribute("marker-start", "url(#pae-area-purple-arrow)");
      element(id).setAttribute("marker-end", "url(#pae-area-purple-arrow)");
    }
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
    // claiming ground that strip already claims. A always reaches farther, so
    // it alone defines the visible red overlap; B remains in the hidden math.
    setRect(element("pae-area-left-overlap-a"), areas.leftStripOverlaps.a.rect);
    // One label for the whole over-claimed wedge, held off far enough that
    // the leader reads as a line with an arrowhead, not just the arrowhead.
    const overlapLabel = element("pae-area-overlap-label");
    const overlapLeader = element("pae-area-overlap-leader");
    const overlapOpacity = areas.overlapVisible ? "1" : "0";
    overlapLabel.setAttribute("opacity", overlapOpacity);
    overlapLeader.setAttribute("opacity", overlapOpacity);
    overlapLeader.setAttribute("marker-end", "url(#pae-area-red-arrow)");
    setLine(overlapLeader, areas.overlapLeader);
    setText(overlapLabel, areas.labels.overlap, `Overlap · ${areas.overlapArea.toFixed(2)} ft²`);

    // One label for the whole unclaimed wedge, held directly above it when
    // the wedge sits on the top edge and directly below when it sits on the
    // bottom, rather than splitting it into per-strip totals.
    const gapLabel = element("pae-area-gap");
    const gapLeader = element("pae-area-gap-leader");
    const gapOpacity = areas.gapVisible ? "1" : "0";
    gapLabel.setAttribute("opacity", gapOpacity);
    gapLeader.setAttribute("opacity", gapOpacity);
    gapLeader.setAttribute("marker-end", "url(#pae-area-black-arrow)");
    setLine(gapLeader, areas.gapLeader);
    setText(gapLabel, areas.labels.gap, `Gap · ${areas.gapArea.toFixed(2)} ft²`);

    setFormula("pae-area-calc-method", areas.formulas.method);
    setFormula("pae-area-calc-width", areas.formulas.width);
    setFormula("pae-area-calc-middle", areas.formulas.middle);
    setFormula("pae-area-calc-middle-short", areas.formulas.middleShort);
    setFormula("pae-area-calc-middle-ends", areas.formulas.middleEnds);
    setFormula("pae-area-calc-overhang", areas.formulas.overhang);
    setFormula("pae-area-calc-left-overlap-a", areas.formulas.leftStripOverlapA);
    setFormula("pae-area-calc-left-overlap-b", areas.formulas.leftStripOverlapB);
    setFormula("pae-area-calc-gap-area", areas.formulas.gapArea);
    setFormula("pae-area-calc-overlap-area", areas.formulas.overlapArea);
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
  snap9874Button?.addEventListener("click", () => setAngle(PRESET_ANGLES.reverse));
  mobileLayout.addEventListener("change", syncMobileViewport);
  syncMobileViewport();
  draw(Number(angleInputs[0].value));

  return { draw, drawForced, drawAreas, drawParallel, setAngle, syncMobileViewport };
}
