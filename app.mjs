import {
  calculateDiagram,
  DIMENSIONS,
  PRESET_ANGLES,
  variableMeasurementsText,
} from "./geometry.mjs";

export function initializeApp(documentRef, windowRef) {
  const root = documentRef.getElementById("parallelogram-angle-explorer");
  const angleInput = root.querySelector("#pae-angle");
  const snap90Button = root.querySelector("#pae-snap-90");
  const snap11023Button = root.querySelector("#pae-snap-11023");
  const angleOutput = root.querySelector("#pae-angle-output");
  const svg = root.querySelector("#pae-svg");
  const copyButton = root.querySelector("#pae-copy-measurements");
  const copyStatus = root.querySelector("#pae-copy-status");
  let clipboardText = "";
  const mobileLayout = windowRef.matchMedia("(max-width: 600px)");
  const element = (id) => root.querySelector(`#${id}`);

  function syncMobileViewport() {
    svg.setAttribute("viewBox", mobileLayout.matches ? "88 0 444 676" : "0 0 620 676");
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
    clipboardText = variableMeasurementsText(diagram);
    copyStatus.textContent = "";
    angleOutput.textContent = `${angleDegrees.toFixed(2)}°`;
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
  copyButton.addEventListener("click", () => {
    windowRef.navigator.clipboard.writeText(clipboardText).then(
      () => {
        copyStatus.textContent = "Copied the angle-dependent measurements.";
      },
      () => {
        copyStatus.textContent = "Copy failed — select the values manually.";
      },
    );
  });
  mobileLayout.addEventListener("change", syncMobileViewport);
  syncMobileViewport();
  draw(Number(angleInput.value));

  return { draw, syncMobileViewport };
}
