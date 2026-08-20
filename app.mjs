import {
  calculateDiagram,
  calculateRightAngleAreas,
  DIMENSIONS,
  PRESET_ANGLES,
} from "./geometry.mjs";

export function initializeApp(documentRef, windowRef) {
  const root = documentRef.getElementById("parallelogram-angle-explorer");
  const angleInput = root.querySelector("#pae-angle");
  const snap90Button = root.querySelector("#pae-snap-90");
  const snap11023Button = root.querySelector("#pae-snap-11023");
  const angleOutput = root.querySelector("#pae-angle-output");
  const svg = root.querySelector("#pae-svg");
  const areaSvg = root.querySelector("#pae-area-svg");
  const mobileLayout = windowRef.matchMedia("(max-width: 600px)");
  const element = (id) => root.querySelector(`#${id}`);

  function syncMobileViewport() {
    const viewBox = mobileLayout.matches ? "88 0 444 676" : "0 0 620 676";
    svg.setAttribute("viewBox", viewBox);
    areaSvg.setAttribute("viewBox", viewBox);
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
    setLine(element("pae-overlap-span"), diagram.guides.overlapSpan);
    setLine(element("pae-overlap-extension"), diagram.guides.overlapExtension);
    setLine(element("pae-overlap-witness-a"), diagram.guides.overlapWitness);
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
    angleOutput.textContent = `${angleDegrees.toFixed(2)}°`;
    drawAreas(angleDegrees);
  }

  function drawAreas(angleDegrees) {
    const areas = calculateRightAngleAreas(angleDegrees);

    const shapePath = pathFromPoints(areas.shape, true);
    element("pae-area-shape").setAttribute("d", shapePath);
    element("pae-area-clip-shape").setAttribute("d", shapePath);

    setRect(element("pae-area-a"), areas.areaA);
    setRect(element("pae-area-b"), areas.areaB);
    setRect(element("pae-area-overlap"), areas.overlapArea);
    setRect(element("pae-area-beyond"), areas.beyondArea);

    setLine(element("pae-area-dim-a"), areas.dimensions.a);
    setLine(element("pae-area-dim-b"), areas.dimensions.b);
    element("pae-area-square-a").setAttribute("d", pathFromPoints(areas.squares.a));
    element("pae-area-square-b").setAttribute("d", pathFromPoints(areas.squares.b));

    setText(
      element("pae-area-title-label"),
      areas.labels.title,
      "Both areas turned 90° off the right side",
    );
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
    setText(
      element("pae-area-overlap-label"),
      areas.labels.overlap,
      `Overlapping · ${areas.measurements.overlap.toFixed(2)} ft`,
    );

    // The far-edge spill only exists at shallow angles, so hide it otherwise.
    const beyondVisible = areas.measurements.beyond > 0;
    element("pae-area-beyond").setAttribute("opacity", beyondVisible ? "1" : "0");
    element("pae-area-beyond-label").setAttribute("opacity", beyondVisible ? "1" : "0");
    setText(
      element("pae-area-beyond-label"),
      areas.labels.beyond,
      `Past far edge · ${areas.measurements.beyond.toFixed(2)} ft`,
    );

    setFormula("pae-area-calc-method", areas.formulas.method);
    setFormula("pae-area-calc-width", areas.formulas.width);
    setFormula("pae-area-calc-overlap", areas.formulas.overlap);
    setFormula("pae-area-calc-beyond", areas.formulas.beyond);
  }

  angleInput.addEventListener("input", () => draw(Number(angleInput.value)));
  snap90Button.addEventListener("click", () => {
    angleInput.value = String(PRESET_ANGLES.rightAngle);
    draw(PRESET_ANGLES.rightAngle);
  });
  snap11023Button.addEventListener("click", () => {
    angleInput.value = String(PRESET_ANGLES.reverse);
    draw(PRESET_ANGLES.reverse);
  });
  mobileLayout.addEventListener("change", syncMobileViewport);
  syncMobileViewport();
  draw(Number(angleInput.value));

  return { draw, drawAreas, syncMobileViewport };
}
