export const PRESET_ANGLES = Object.freeze({
  initial: 98.74,
  rightAngle: 90,
  angle10080: 100.8,
  reverse: 98.74,
});

export const DIMENSIONS = Object.freeze({
  side: 80,
  longSide: 165.93,
  inset: 15,
  innerSpan: 50,
  arrowA: 65,
  arrowB: 50,
});

const SCALE = 1.72;
const CENTER_X = 300;
const CENTER_Y = 250;
const INNER_DIMENSION_OFFSET = 23;
const LABEL_OFFSET = 8;
const EXTENSION_START = 3;
const EXTENSION_END = INNER_DIMENSION_OFFSET + 6;
const ARC_RADIUS = 28;
// Right-anchored labels stop here so the mobile viewport never clips them.
const LEFT_LABEL_LIMIT = 250;

const point = (x, y) => ({ x, y });
const line = (start, end) => ({
  x1: start.x,
  y1: start.y,
  x2: end.x,
  y2: end.y,
});
const midpoint = (start, end) => point(
  (start.x + end.x) / 2,
  (start.y + end.y) / 2,
);
const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));
const normalizeZero = (value) => Math.abs(value) < 1e-12 ? 0 : value;
const formatFeet = (value) => normalizeZero(value).toFixed(2);

export function calculateDiagram(angleDegrees) {
  if (!Number.isFinite(angleDegrees) || angleDegrees < 1 || angleDegrees > 180) {
    throw new RangeError("angle must be a finite number from 1 through 180 degrees");
  }

  const angleRadians = angleDegrees * Math.PI / 180;
  const sine = normalizeZero(Math.sin(angleRadians));
  const cosine = normalizeZero(Math.cos(angleRadians));
  const perpendicularWidth = DIMENSIONS.side * sine;
  const projection = DIMENSIONS.side * cosine;
  const scaledWidth = perpendicularWidth * SCALE;
  const scaledProjection = projection * SCALE;
  const scaledLength = DIMENSIONS.longSide * SCALE;
  const leftX = CENTER_X - scaledWidth / 2;
  const rightX = CENTER_X + scaledWidth / 2;
  const topY = CENTER_Y - (scaledLength + scaledProjection) / 2;

  const leftTop = point(leftX, topY + scaledProjection);
  const rightTop = point(rightX, topY);
  const leftBottom = point(leftX, leftTop.y + scaledLength);
  const rightBottom = point(rightX, rightTop.y + scaledLength);
  const insetFraction = DIMENSIONS.inset / DIMENSIONS.side;
  const rightInsetFraction = 1 - insetFraction;
  const leftInsetTop = point(
    leftX + scaledWidth * insetFraction,
    leftTop.y + (rightTop.y - leftTop.y) * insetFraction,
  );
  const rightInsetTop = point(
    leftX + scaledWidth * rightInsetFraction,
    leftTop.y + (rightTop.y - leftTop.y) * rightInsetFraction,
  );
  const leftInsetBottom = point(leftInsetTop.x, leftInsetTop.y + scaledLength);
  const rightInsetBottom = point(rightInsetTop.x, rightInsetTop.y + scaledLength);

  const outwardX = -cosine;
  const outwardY = -sine;
  const offsetPoint = (source, amount) => point(
    source.x + outwardX * amount,
    source.y + outwardY * amount,
  );
  const topDimensionPoints = {
    leftStart: offsetPoint(leftTop, INNER_DIMENSION_OFFSET),
    leftEnd: offsetPoint(leftInsetTop, INNER_DIMENSION_OFFSET),
    innerStart: offsetPoint(leftInsetTop, INNER_DIMENSION_OFFSET),
    innerEnd: offsetPoint(rightInsetTop, INNER_DIMENSION_OFFSET),
    rightStart: offsetPoint(rightInsetTop, INNER_DIMENSION_OFFSET),
    rightEnd: offsetPoint(rightTop, INNER_DIMENSION_OFFSET),
  };
  const topLabelOffset = INNER_DIMENSION_OFFSET + LABEL_OFFSET;
  const topLabels = {
    left: offsetPoint(midpoint(leftTop, leftInsetTop), topLabelOffset),
    inner: offsetPoint(midpoint(leftInsetTop, rightInsetTop), topLabelOffset),
    right: offsetPoint(midpoint(rightInsetTop, rightTop), topLabelOffset),
  };
  const topExtensions = {
    left: line(offsetPoint(leftTop, EXTENSION_START), offsetPoint(leftTop, EXTENSION_END)),
    insetLeft: line(offsetPoint(leftInsetTop, EXTENSION_START), offsetPoint(leftInsetTop, EXTENSION_END)),
    insetRight: line(offsetPoint(rightInsetTop, EXTENSION_START), offsetPoint(rightInsetTop, EXTENSION_END)),
    right: line(offsetPoint(rightTop, EXTENSION_START), offsetPoint(rightTop, EXTENSION_END)),
  };

  const perpendicularY = CENTER_Y - 48;
  const perpendicularInset = DIMENSIONS.inset * sine;
  const perpendicularInner = DIMENSIONS.innerSpan * sine;
  // The chain the assessor's numbers force: the right 15 ft runs to the green
  // inset line, the 50 ft carries on from there to A's far end at 65 ft, and
  // the last 15 ft is whatever is left from A to the parcel's left side.
  const perpendicularRightMark = rightInsetTop.x;
  const perpendicularInnerMark = rightX - DIMENSIONS.arrowA * SCALE;
  const perpendicularLeftOver = perpendicularWidth - DIMENSIONS.arrowA;
  // What each part of the chain actually measures across the shape, as
  // against the 15, 50 and 15 the assessor's figures claim for them. Left
  // stays signed rather than absolute: once A's 65 ft reach exceeds the
  // parcel's own width, there is no ground left for the last 15 ft to
  // measure, and a negative number says so instead of hiding it as 0.
  const perpendicularChain = {
    left: perpendicularLeftOver,
    inner: Math.abs(DIMENSIONS.arrowA - perpendicularInset),
    right: perpendicularInset,
  };
  const perpendicular = {
    left: line(point(leftX, perpendicularY), point(perpendicularInnerMark, perpendicularY)),
    inner: line(point(perpendicularInnerMark, perpendicularY), point(perpendicularRightMark, perpendicularY)),
    right: line(point(perpendicularRightMark, perpendicularY), point(rightX, perpendicularY)),
    leftSquare: [
      point(leftX, perpendicularY - 8),
      point(leftX + 8, perpendicularY - 8),
      point(leftX + 8, perpendicularY),
    ],
    rightSquare: [
      point(rightX, perpendicularY - 8),
      point(rightX - 8, perpendicularY - 8),
      point(rightX - 8, perpendicularY),
    ],
    methodLabel: point(leftX - 10, perpendicularY + 4),
    leftLabel: point((leftX + perpendicularInnerMark) / 2, perpendicularY - 10),
    innerLabel: point((perpendicularInnerMark + perpendicularRightMark) / 2, perpendicularY - 10),
    rightLabel: point((perpendicularRightMark + rightX) / 2, perpendicularY - 10),
  };

  const staticAY = CENTER_Y + 48;
  const staticBY = CENTER_Y + 94;
  const staticAStart = point(rightX, staticAY);
  const staticAEnd = point(rightX - DIMENSIONS.arrowA * SCALE, staticAY);
  const staticBStart = point(rightInsetTop.x, staticBY);
  const staticBEnd = point(rightInsetTop.x - DIMENSIONS.arrowB * SCALE, staticBY);
  const overlapY = (staticAY + staticBY) / 2;
  // A's endpoint reaches into the projected left inset. This is the visible
  // overlap; the separate loss from projecting 15 ft is kept in the math.
  const overlap = (leftInsetTop.x - staticAEnd.x) / SCALE;
  const projectionLoss = DIMENSIONS.inset - perpendicularInset;
  // A's endpoint can fall outside the shape's own width. Past that edge
  // there is no real vertical to trace, so both the fraction and the x it is
  // drawn at are held to the corner - otherwise the line keeps the corner's
  // y while still being drawn out at the original, off-shape x.
  const fullLengthGuide = (x) => {
    const guideX = clamp(x, leftX, rightX);
    const fractionAcrossShape = scaledWidth === 0
      ? 0.5
      : (guideX - leftX) / scaledWidth;
    const guideTopY = leftTop.y + (rightTop.y - leftTop.y) * fractionAcrossShape;
    return line(point(guideX, guideTopY), point(guideX, guideTopY + scaledLength));
  };
  const guides = {
    a: line(staticAStart, staticAEnd),
    aLabel: point((staticAStart.x + staticAEnd.x) / 2, staticAY - 9),
    b: line(staticBStart, staticBEnd),
    bLabel: point((staticBStart.x + staticBEnd.x) / 2, staticBY - 9),
    overlapSpan: line(point(staticAEnd.x, overlapY), point(leftInsetTop.x, overlapY)),
    overlapExtentA: fullLengthGuide(staticAEnd.x),
    // Held clear of the left edge so the label is not clipped on a phone.
    overlapLabel: point(
      Math.max(Math.min(staticAEnd.x, staticBEnd.x) - 8, LEFT_LABEL_LIMIT),
      overlapY + 4,
    ),
  };

  const arcStart = point(rightX, rightTop.y + ARC_RADIUS);
  const arcEndRadians = (90 + angleDegrees) * Math.PI / 180;
  const arcEnd = point(
    rightX + ARC_RADIUS * Math.cos(arcEndRadians),
    rightTop.y + ARC_RADIUS * Math.sin(arcEndRadians),
  );
  const angleLabelRadians = (90 + angleDegrees / 2) * Math.PI / 180;
  const angleLabel = point(
    rightX + 42 * Math.cos(angleLabelRadians),
    rightTop.y + 42 * Math.sin(angleLabelRadians),
  );
  const shortRotation = angleDegrees - 90;
  const measurements = {
    perpendicularInset,
    perpendicularInner,
    perpendicularWidth,
    perpendicularLeftOver,
    perpendicularChain,
    overlap,
    projectionLoss,
  };

  return {
    angleDegrees,
    angleRadians,
    sine,
    cosine,
    projection,
    shortRotation,
    shape: [leftTop, rightTop, rightBottom, leftBottom],
    insetLines: {
      left: line(leftInsetTop, leftInsetBottom),
      right: line(rightInsetTop, rightInsetBottom),
    },
    topDimensions: {
      left: line(topDimensionPoints.leftStart, topDimensionPoints.leftEnd),
      inner: line(topDimensionPoints.innerStart, topDimensionPoints.innerEnd),
      right: line(topDimensionPoints.rightStart, topDimensionPoints.rightEnd),
    },
    topExtensions,
    topLabels,
    perpendicular,
    guides,
    arc: { radius: ARC_RADIUS, start: arcStart, end: arcEnd },
    angleLabel,
    bottomLabel: point(
      (leftBottom.x + rightBottom.x) / 2,
      (leftBottom.y + rightBottom.y) / 2 + 17,
    ),
    rightSideLabel: point(rightX + 13, (rightTop.y + rightBottom.y) / 2),
    measurements,
    formulas: {
      shape: {
        expression: "15 ft + 50 ft + 15 ft",
        result: "= 80 ft; long sides = 165.93 ft",
      },
      outerOffsets: {
        expression: `15 ft × sin(${angleDegrees.toFixed(2)}°)`,
        result: `= ${formatFeet(perpendicularInset)} ft on the right; the left 15 ft is stepped off A's end instead`,
      },
      innerSpan: {
        expression: `50 ft × sin(${angleDegrees.toFixed(2)}°)`,
        result: `= ${formatFeet(perpendicularInner)} ft`,
      },
      fixedArrows: {
        expression: "A = 65 ft",
        result: "· B = 50 ft",
      },
      leftOver: {
        expression: `80 ft × sin(${angleDegrees.toFixed(2)}°) − 65 ft`,
        result: `= ${formatFeet(perpendicularLeftOver)} ft left where 15 ft was claimed`,
      },
      overlap: {
        expression: `65 ft − 65 ft × sin(${angleDegrees.toFixed(2)}°)`,
        result: `= ${formatFeet(overlap)} ft`,
      },
      projectionLoss: {
        expression: `15 ft − 15 ft × sin(${angleDegrees.toFixed(2)}°)`,
        result: `= ${formatFeet(projectionLoss)} ft`,
      },
    },
  };
}

const AREA_LABEL_INSET = 12;

export function calculateRightAngleAreas(angleDegrees) {
  const base = calculateDiagram(angleDegrees);
  const [leftTop, rightTop, rightBottom, leftBottom] = base.shape;
  const rightX = rightTop.x;
  const topY = Math.min(leftTop.y, rightTop.y);
  const bottomY = Math.max(leftBottom.y, rightBottom.y);
  const height = bottomY - topY;

  // Both areas are measured at a right angle to the right side, so each one
  // starts at the right edge and runs horizontally back into the shape.
  const bandRect = (widthFeet) => ({
    x: rightX - widthFeet * SCALE,
    y: topY,
    width: widthFeet * SCALE,
    height,
  });
  const areaA = bandRect(DIMENSIONS.arrowA);
  // B starts where the 15 ft inset lands when it is stepped off along the
  // leaning side, so its 50 ft ends up somewhere other than A's 65 ft and the
  // two claims overlap by however far apart those ends fall.
  const insetAlongSide = DIMENSIONS.inset * base.sine;
  const areaBStartFeet = insetAlongSide;
  const areaBEndFeet = areaBStartFeet + DIMENSIONS.arrowB;
  const areaB = {
    x: rightX - areaBEndFeet * SCALE,
    y: topY,
    width: DIMENSIONS.arrowB * SCALE,
    height,
  };

  // Each 15 ft end mark is carried along the slanted parcel edge and then
  // squared off from its own side. Its horizontal footprint is therefore the
  // projection 15 × sin(theta), so the purple strips visibly change width as
  // the angle changes. Their square ends also sit at different heights.
  const projectedInsetFeet = base.measurements.perpendicularInset;
  const stripWidth = projectedInsetFeet * SCALE;
  const strips = {
    right: {
      x: rightX - stripWidth,
      y: rightTop.y,
      width: stripWidth,
      height: rightBottom.y - rightTop.y,
    },
    left: {
      x: leftTop.x,
      y: leftTop.y,
      width: stripWidth,
      height: leftBottom.y - leftTop.y,
    },
  };
  // At the projected inner boundary, the edge has moved vertically by the
  // other component of the same 15 ft slanted-edge measurement.
  const cotangentMagnitude = base.sine === 0
    ? 0
    : Math.abs(base.cosine) / base.sine;
  const overhangFeet = base.sine === 0
    ? 0
    : DIMENSIONS.inset * Math.abs(base.cosine);

  // Laying 15 + 50 + 15 out at a right angle to the side needs a full 80 ft of
  // horizontal room, but the shape only offers 80 × sin(theta) of it.
  const perpendicularWidth = base.measurements.perpendicularWidth;

  // The true 15 / 50 / 15 edge marks project to 15 sin / 50 sin / 15 sin.
  // The incorrect fit below nevertheless forces a full horizontal 50 ft
  // center into the smaller projected middle space.
  const middleFeet = Math.max(0, perpendicularWidth - projectedInsetFeet * 2);
  const middleShortFeet = DIMENSIONS.innerSpan - middleFeet;
  // The incorrect fit still lays out a full 50 ft center from the right-hand
  // strip. Since the perpendicular parcel width is less than 80 ft away from
  // 90 degrees, that fixed center reaches into the independently measured
  // left strip. This is the overlap the diagram is meant to expose.
  const middleStart = strips.right.x - DIMENSIONS.innerSpan * SCALE;
  const middleArea = {
    x: middleStart,
    y: strips.right.y,
    width: DIMENSIONS.innerSpan * SCALE,
    height: strips.right.height,
  };
  const middleColumn = { x: middleArea.x, y: topY, width: middleArea.width, height };
  const middleReachFeet = projectedInsetFeet + DIMENSIONS.innerSpan;
  const middleEndFeet = middleReachFeet * cotangentMagnitude;
  const middleOffParcel = perpendicularWidth < middleReachFeet;
  // The purple row uses A's fixed 65 ft endpoint as the shared boundary
  // between the center-50 line and the left-15 line. This intentionally does
  // not use the projected left inset witness from the green top dimensions.
  const chainY = CENTER_Y - 48;
  const chainRightMarkX = strips.right.x;
  const chainInnerMarkX = areaA.x;
  const chain = {
    rightInset: line(point(rightX, chainY), point(chainRightMarkX, chainY)),
    inner: line(point(chainRightMarkX, chainY), point(chainInnerMarkX, chainY)),
    leftInset: line(point(chainInnerMarkX, chainY), point(leftTop.x, chainY)),
  };
  // The shape's top and bottom edges lean, so a witness held to the global
  // top/bottom bounds sticks out past whichever edge is higher or lower at
  // that x. Stopping each witness at the real edge keeps it inside the shape.
  const topEdgeYAtX = (x) => {
    const width = rightX - leftTop.x;
    const fraction = width === 0 ? 0.5 : (x - leftTop.x) / width;
    return leftTop.y + (rightTop.y - leftTop.y) * fraction;
  };
  const bottomEdgeYAtX = (x) => topEdgeYAtX(x) + (leftBottom.y - leftTop.y);
  // A chain mark can fall past the shape's own corner once a strip has
  // spilled off the parcel entirely. Past that corner there is no edge left
  // to hit, so the witness is held to the corner itself rather than
  // extrapolating the edge line beyond where the shape actually ends.
  const chainWitness = (x) => {
    const witnessX = clamp(x, leftTop.x, rightX);
    return line(point(witnessX, topEdgeYAtX(witnessX)), point(witnessX, bottomEdgeYAtX(witnessX)));
  };
  const chainWitnesses = {
    right: chainWitness(rightX),
    rightInset: chainWitness(chain.rightInset.x2),
    inner: chainWitness(chain.inner.x2),
    left: chainWitness(chain.leftInset.x2),
  };
  const chainLabel = ({ x1, x2 }) => point((x1 + x2) / 2, chainY - 10);


  // Held below the chain row (now fixed, like the forced-measurements
  // diagram's own rows) rather than centered on the shape, so the A/B
  // dimensions never collide with it as the angle changes.
  const bandY = (offset) => chainY + 90 + offset;
  const dimensionA = line(
    point(rightX, bandY(-34)),
    point(areaA.x, bandY(-34)),
  );
  const dimensionB = line(
    point(rightX - areaBStartFeet * SCALE, bandY(34)),
    point(areaB.x, bandY(34)),
  );
  const rightAngleSquare = (y, direction, x = rightX) => [
    point(x - 9, y),
    point(x - 9, y + 9 * direction),
    point(x, y + 9 * direction),
  ];
  const leftStripInnerX = strips.left.x + stripWidth;
  // Linear encroachment into the left strip. A is the right strip plus the
  // fitted 50 ft center; B is retained as a second diagnostic guide.
  const stripEncroachment = (claimLeftX) => {
    const overlapRightX = Math.min(leftStripInnerX, rightX);
    const overlapLeftX = clamp(claimLeftX, leftTop.x, overlapRightX);
    const feet = Math.max(0, (overlapRightX - overlapLeftX) / SCALE);
    return {
      feet,
      rect: {
        x: overlapLeftX,
        y: Math.max(leftTop.y, rightTop.y),
        width: feet * SCALE,
        height: Math.max(0, Math.min(leftBottom.y, rightBottom.y)
          - Math.max(leftTop.y, rightTop.y)),
      },
    };
  };
  const leftStripOverlaps = {
    a: stripEncroachment(areaA.x),
    b: stripEncroachment(areaB.x),
  };
  const leansRight = base.cosine > 0;

  const polygonAreaFeet = (points) => {
    let twiceArea = 0;
    for (let index = 0; index < points.length; index += 1) {
      const a = points[index];
      const b = points[(index + 1) % points.length];
      twiceArea += a.x * b.y - b.x * a.y;
    }
    return Math.abs(twiceArea) / (2 * SCALE * SCALE);
  };
  // The double-claimed overlap is the intersection of the left projected
  // strip with the incorrectly fixed 50 ft center (B). Its purple/red
  // rectangle shifts above or below the center as the lean reverses.
  const overlapRect = leftStripOverlaps.b.rect;
  const overlapPolygon = [
    point(overlapRect.x, overlapRect.y),
    point(overlapRect.x + overlapRect.width, overlapRect.y),
    point(overlapRect.x + overlapRect.width, overlapRect.y + overlapRect.height),
    point(overlapRect.x, overlapRect.y + overlapRect.height),
  ];
  const overlapArea = polygonAreaFeet(overlapPolygon);

  // Fitting the left strip from the left and A from the right leaves two
  // unclaimed triangles inside the parcel: one beside each independently
  // anchored square end. The overlap between the claims covers the would-be
  // gap between those two boundaries.
  const areaLeftX = clamp(middleStart, leftTop.x, rightX);
  const stripInnerX = clamp(leftStripInnerX, leftTop.x, rightX);
  const leftGap = leansRight
    ? [leftTop, point(areaLeftX, leftTop.y), point(areaLeftX, topEdgeYAtX(areaLeftX))]
    : [leftBottom, point(areaLeftX, leftBottom.y), point(areaLeftX, bottomEdgeYAtX(areaLeftX))];
  const rightGap = leansRight
    ? [rightBottom, point(stripInnerX, rightBottom.y), point(stripInnerX, bottomEdgeYAtX(stripInnerX))]
    : [rightTop, point(stripInnerX, rightTop.y), point(stripInnerX, topEdgeYAtX(stripInnerX))];
  const gapPolygons = [leftGap, rightGap];
  const gapPolygonAreas = gapPolygons.map(polygonAreaFeet);
  const gapArea = gapPolygonAreas.reduce((sum, area) => sum + area, 0);

  // The same square-ended rectangles also claim ground beyond the sloping
  // parcel boundary. The strip launched from the left spills past one edge;
  // the fixed center and right strip, launched from the right, spill past the
  // opposite edge. Keep these exterior over-claims separate from the red
  // center/left-strip intersection inside the parcel.
  const spillLeftInnerX = clamp(leftStripInnerX, leftTop.x, rightX);
  const spillCenterStartX = clamp(middleStart, leftTop.x, rightX);
  const leftSpill = leansRight
    ? [
      leftBottom,
      point(spillLeftInnerX, leftBottom.y),
      point(spillLeftInnerX, bottomEdgeYAtX(spillLeftInnerX)),
    ]
    : [
      leftTop,
      point(spillLeftInnerX, leftTop.y),
      point(spillLeftInnerX, topEdgeYAtX(spillLeftInnerX)),
    ];
  const centerSpill = leansRight
    ? [
      rightTop,
      point(spillCenterStartX, rightTop.y),
      point(spillCenterStartX, topEdgeYAtX(spillCenterStartX)),
    ]
    : [
      rightBottom,
      point(spillCenterStartX, rightBottom.y),
      point(spillCenterStartX, bottomEdgeYAtX(spillCenterStartX)),
    ];
  const spillPolygons = [leftSpill, centerSpill];
  const spillArea = spillPolygons
    .map(polygonAreaFeet)
    .reduce((sum, area) => sum + area, 0);

  return {
    angleDegrees,
    shape: base.shape,
    areaA,
    areaB,
    strips,
    // Which way the shape leans decides which end of a strip runs past its
    // edge and which end stops short of it.
    leansRight,
    stripColumns: {
      right: { x: strips.right.x, y: topY, width: stripWidth, height },
      left: { x: strips.left.x, y: topY, width: stripWidth, height },
    },
    middleArea,
    middleColumn,
    middleOffParcel,
    chain,
    chainWitnesses,
    // Reproducing the forced-measurements diagram's own naive top row and
    // its long dashed insets, so it is visible here too how A's 65 ft line
    // crosses the dashed line coming down from the left 15 ft boundary.
    shortRotation: base.shortRotation,
    insetLines: base.insetLines,
    topDimensions: base.topDimensions,
    topExtensions: base.topExtensions,
    topLabels: base.topLabels,
    dimensions: { a: dimensionA, b: dimensionB },
    gapArea,
    gapPolygon: rightGap,
    gapPolygons,
    leftStripOverlaps,
    overlapArea,
    overlapPolygon,
    overlapVisible: overlapArea > 1e-9,
    spillArea,
    spillPolygons,
    spillVisible: spillArea > 1e-9,
    squares: {
      a: rightAngleSquare(bandY(-34), -1),
      b: rightAngleSquare(bandY(34), 1, rightX - areaBStartFeet * SCALE),
      chain: rightAngleSquare(chainY, 1),
    },
    labels: {
      a: point((rightX + areaA.x) / 2, bandY(-34) - 9),
      b: point((rightX + areaB.x) / 2, bandY(34) + 17),
      chainRightInset: chainLabel(chain.rightInset),
      chainInner: chainLabel(chain.inner),
      chainLeftInset: chainLabel(chain.leftInset),
    },
    measurements: {
      perpendicularWidth,
      overhang: overhangFeet,
      middle: middleFeet,
      middleShort: middleShortFeet,
      middleEnds: middleEndFeet,
      leftStripOverlapA: leftStripOverlaps.a.feet,
      leftStripOverlapB: leftStripOverlaps.b.feet,
      gapArea,
      overlapArea,
      spillArea,
      // The purple row: right projected inset, then to A's fixed endpoint,
      // then from A's endpoint to the real left side.
      chainRightAngle: {
        right: projectedInsetFeet,
        inner: Math.abs(DIMENSIONS.arrowA - projectedInsetFeet),
        left: perpendicularWidth - DIMENSIONS.arrowA,
      },
    },
    formulas: {
      leftStripOverlapA: {
        expression: `intersection of fixed A with the left projected strip`,
        result: `= ${formatFeet(leftStripOverlaps.a.feet)} ft`,
      },
      leftStripOverlapB: {
        expression: `intersection of the fixed ${DIMENSIONS.innerSpan} ft center with the left projected strip`,
        result: `= ${formatFeet(leftStripOverlaps.b.feet)} ft`,
      },
      gapArea: {
        expression: "two unclaimed triangles inside the parcel",
        result: `= ${formatFeet(gapArea)} ft² unclaimed`,
      },
      overlapArea: {
        expression: `${formatFeet(leftStripOverlaps.b.feet)} ft × ${formatFeet(overlapRect.height / SCALE)} ft`,
        result: `= ${formatFeet(overlapArea)} ft² claimed twice`,
      },
      spillArea: {
        expression: "square-ended fit beyond the sloping top and bottom",
        result: `= ${formatFeet(spillArea)} ft² outside the parcel`,
      },
      method: {
        expression: "each 15 ft mark follows the slanted edge, then is squared off",
        result: `· the ${DIMENSIONS.innerSpan} ft center is fitted from the right`,
      },
      width: {
        expression: `80 ft × sin(${angleDegrees.toFixed(2)}°)`,
        result: `= ${formatFeet(perpendicularWidth)} ft across`,
      },
      middle: {
        expression: `${formatFeet(perpendicularWidth)} ft − ${formatFeet(projectedInsetFeet)} ft − ${formatFeet(projectedInsetFeet)} ft`,
        result: `= ${formatFeet(middleFeet)} ft for a ${DIMENSIONS.innerSpan} ft middle`,
      },
      middleShort: {
        expression: `${DIMENSIONS.innerSpan} ft − ${formatFeet(middleFeet)} ft`,
        result: `= ${formatFeet(middleShortFeet)} ft short in the middle`,
      },
      middleEnds: {
        expression: `(${DIMENSIONS.innerSpan} ft + ${formatFeet(projectedInsetFeet)} ft) × |cot(${angleDegrees.toFixed(2)}°)|`,
        result: `= ${formatFeet(middleEndFeet)} ft at the middle's far end`,
      },
      overhang: {
        expression: `${DIMENSIONS.inset} ft × |cos(${angleDegrees.toFixed(2)}°)|`,
        result: `= ${formatFeet(overhangFeet)} ft over one edge, short of the other`,
      },
      chain: {
        expression: `right mark → A's ${DIMENSIONS.arrowA} ft endpoint → left side`,
        result: `= ${formatFeet(perpendicularWidth - DIMENSIONS.arrowA)} / ${formatFeet(Math.abs(DIMENSIONS.arrowA - projectedInsetFeet))} / ${formatFeet(projectedInsetFeet)} ft, left to right`,
      },
    },
  };
}

export function calculateParallelAreas(angleDegrees) {
  const base = calculateDiagram(angleDegrees);
  const [leftTop, rightTop, rightBottom, leftBottom] = base.shape;
  const rightX = rightTop.x;
  const leftX = leftTop.x;
  const topY = Math.min(leftTop.y, rightTop.y);
  const bottomY = Math.max(leftBottom.y, rightBottom.y);
  const height = bottomY - topY;

  // Walking the top edge is the one direction where a foot is a foot at any
  // angle: the edge is exactly 80 ft long however far the shape leans.
  const alongTop = (feet) => point(
    rightTop.x - base.sine * feet * SCALE,
    rightTop.y + base.cosine * feet * SCALE,
  );
  const rightInsetMark = alongTop(DIMENSIONS.inset);
  const innerMark = alongTop(DIMENSIONS.inset + DIMENSIONS.innerSpan);

  const topOffset = (source, amount) => point(
    source.x - base.cosine * amount,
    source.y - base.sine * amount,
  );
  const topDimensionOffset = 14;
  const topLabelOffset = 27;
  const topDimensions = {
    rightInset: line(topOffset(rightTop, topDimensionOffset), topOffset(rightInsetMark, topDimensionOffset)),
    inner: line(topOffset(rightInsetMark, topDimensionOffset), topOffset(innerMark, topDimensionOffset)),
    leftInset: line(topOffset(innerMark, topDimensionOffset), topOffset(leftTop, topDimensionOffset)),
  };
  const topExtensions = {
    right: line(rightTop, topOffset(rightTop, topDimensionOffset + 4)),
    rightInset: line(rightInsetMark, topOffset(rightInsetMark, topDimensionOffset + 4)),
    inner: line(innerMark, topOffset(innerMark, topDimensionOffset + 4)),
    left: line(leftTop, topOffset(leftTop, topDimensionOffset + 4)),
  };

  const stripRect = (startX, endX) => ({
    x: Math.min(startX, endX),
    y: topY,
    width: Math.abs(endX - startX),
    height,
  });
  const strips = {
    rightInset: stripRect(rightInsetMark.x, rightX),
    inner: stripRect(innerMark.x, rightInsetMark.x),
    leftInset: stripRect(leftX, innerMark.x),
  };

  const stripLabel = (start, end) => topOffset(midpoint(start, end), topLabelOffset);
  const guide = (start, feet) => line(
    start,
    point(start.x - base.sine * feet * SCALE, start.y + base.cosine * feet * SCALE),
  );
  const guideA = guide(point(rightTop.x, rightTop.y + 118), DIMENSIONS.arrowA);
  const guideB = guide(
    point(rightInsetMark.x, rightInsetMark.y + 188),
    DIMENSIONS.innerSpan,
  );

  // A starts at the corner and B starts 15 ft along, so 15 + 50 = 65 puts both
  // far ends on the same line no matter how the shape leans.
  const gap = Math.abs(
    DIMENSIONS.arrowA - (DIMENSIONS.inset + DIMENSIONS.innerSpan),
  );
  const matchLine = line(
    point(guideA.x2, guideA.y2),
    point(guideB.x2, guideB.y2),
  );
  // The shape's top and bottom edges lean, so a boundary held to the global
  // top/bottom bounds sticks out past whichever edge is higher or lower at
  // that x. Stopping each one at the real edge keeps it inside the shape.
  const topEdgeYAtX = (x) => {
    const width = rightX - leftX;
    const fraction = width === 0 ? 0.5 : (x - leftX) / width;
    return leftTop.y + (rightTop.y - leftTop.y) * fraction;
  };
  const bottomEdgeYAtX = (x) => topEdgeYAtX(x) + (leftBottom.y - leftTop.y);
  const boundaryLine = (x) => line(point(x, topEdgeYAtX(x)), point(x, bottomEdgeYAtX(x)));
  const boundaryLines = {
    rightInset: boundaryLine(rightInsetMark.x),
    inner: boundaryLine(innerMark.x),
  };

  return {
    angleDegrees,
    shape: base.shape,
    rotation: base.shortRotation,
    strips,
    topDimensions,
    topExtensions,
    boundaryLines,
    guides: { a: guideA, b: guideB },
    matchLine,
    labels: {
      rightInset: stripLabel(rightInsetMark, rightTop),
      inner: stripLabel(innerMark, rightInsetMark),
      leftInset: stripLabel(leftTop, innerMark),
      a: point((guideA.x1 + guideA.x2) / 2, (guideA.y1 + guideA.y2) / 2 - 9),
      b: point((guideB.x1 + guideB.x2) / 2, (guideB.y1 + guideB.y2) / 2 - 9),
      match: point(
        Math.max(guideA.x2 - 10, LEFT_LABEL_LIMIT + 15),
        (guideA.y2 + guideB.y2) / 2,
      ),
    },
    measurements: {
      topEdge: DIMENSIONS.side,
      reach: DIMENSIONS.inset + DIMENSIONS.innerSpan,
      gap,
    },
    formulas: {
      method: {
        expression: "A and B run parallel to the 80 ft top edge",
        result: "· no sine, no shrink",
      },
      reach: {
        expression: `${DIMENSIONS.inset} ft + ${DIMENSIONS.innerSpan} ft`,
        result: `= ${formatFeet(DIMENSIONS.inset + DIMENSIONS.innerSpan)} ft, exactly where A ends`,
      },
      total: {
        expression: `${DIMENSIONS.arrowA} ft + ${DIMENSIONS.inset} ft`,
        result: `= ${formatFeet(DIMENSIONS.side)} ft, the whole side`,
      },
      gap: {
        expression: `|${DIMENSIONS.arrowA} ft − (${DIMENSIONS.inset} ft + ${DIMENSIONS.innerSpan} ft)|`,
        result: `= ${formatFeet(gap)} ft at every angle`,
      },
    },
  };
}
