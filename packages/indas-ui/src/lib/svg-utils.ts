/**
 * SVG Drawing Utilities
 * Reusable functions for drawing SVG elements like dimension arrows, text, shapes, etc.
 */

// ========================================================================================================
// Text Drawing
// ========================================================================================================

interface DrawTextParams {
  svg: SVGSVGElement
  x: number
  y: number
  text: string
  fontSize: number
  color: string
  fontWeight?: string
  textAnchor?: 'start' | 'middle' | 'end'
  dominantBaseline?: 'auto' | 'middle' | 'hanging' | 'alphabetic'
}

export function drawText({
  svg,
  x,
  y,
  text,
  fontSize,
  color,
  fontWeight = 'normal',
  textAnchor = 'middle',
  dominantBaseline = 'middle'
}: DrawTextParams): void {
  const textEl = document.createElementNS("http://www.w3.org/2000/svg", 'text')
  textEl.setAttribute('x', x.toString())
  textEl.setAttribute('y', y.toString())
  textEl.setAttribute('font-size', fontSize.toString())
  textEl.setAttribute('fill', color)
  textEl.setAttribute('font-weight', fontWeight)
  textEl.setAttribute('text-anchor', textAnchor)
  textEl.setAttribute('dominant-baseline', dominantBaseline)
  textEl.textContent = text
  svg.appendChild(textEl)
}

// ========================================================================================================
// Rectangle Drawing
// ========================================================================================================

interface DrawRectangleParams {
  svg: SVGSVGElement
  x: number
  y: number
  width: number
  height: number
  borderColor: string
  borderWidth: number
  fillColor: string
  fillOpacity?: number
  rx?: number
}

export function drawRectangle({
  svg,
  x,
  y,
  width,
  height,
  borderColor,
  borderWidth,
  fillColor,
  fillOpacity = 1,
  rx = 0
}: DrawRectangleParams): void {
  if (isNaN(x) || isNaN(y) || isNaN(width) || isNaN(height)) return
  const rect = document.createElementNS("http://www.w3.org/2000/svg", 'rect')
  rect.setAttributeNS(null, "x", x.toString())
  rect.setAttributeNS(null, "y", y.toString())
  rect.setAttributeNS(null, "width", width.toString())
  rect.setAttributeNS(null, "height", height.toString())
  rect.setAttributeNS(null, "stroke", borderColor)
  rect.setAttributeNS(null, "stroke-width", borderWidth.toString())
  rect.setAttributeNS(null, "fill", fillColor)
  rect.setAttributeNS(null, "fill-opacity", fillOpacity.toString())
  if (rx > 0) {
    rect.setAttributeNS(null, "rx", rx.toString())
  }
  svg.appendChild(rect)
}

// ========================================================================================================
// Line Drawing
// ========================================================================================================

interface DrawLineParams {
  svg: SVGSVGElement
  x1: number
  y1: number
  x2: number
  y2: number
  color: string
  width: number
  dashArray?: string
  opacity?: number
}

export function drawLine({
  svg,
  x1,
  y1,
  x2,
  y2,
  color,
  width,
  dashArray,
  opacity = 1
}: DrawLineParams): void {
  if (isNaN(x1) || isNaN(y1) || isNaN(x2) || isNaN(y2)) return
  const line = document.createElementNS("http://www.w3.org/2000/svg", 'line')
  line.setAttribute("x1", x1.toString())
  line.setAttribute("y1", y1.toString())
  line.setAttribute("x2", x2.toString())
  line.setAttribute("y2", y2.toString())
  line.setAttribute("stroke", color)
  line.setAttribute("stroke-width", width.toString())
  if (dashArray) {
    line.setAttribute("stroke-dasharray", dashArray)
  }
  if (opacity < 1) {
    line.setAttribute("opacity", opacity.toString())
  }
  svg.appendChild(line)
}

// ========================================================================================================
// Dimension Arrow Drawing
// ========================================================================================================

interface DrawDimensionArrowParams {
  svg: SVGSVGElement
  x1: number
  y1: number
  x2: number
  y2: number
  label: string
  isVertical?: boolean
  offset?: number // Offset from the dimension line for label
}

export function drawDimensionArrow({
  svg,
  x1,
  y1,
  x2,
  y2,
  label,
  isVertical = false,
  offset = 10
}: DrawDimensionArrowParams): void {
  if (isNaN(x1) || isNaN(y1) || isNaN(x2) || isNaN(y2)) return
  // Wrap all dimension elements in a group so exports can strip them
  const childCountBefore = svg.childElementCount

  const lineColor = "#1e293b" // Slate-800 - professional dark
  const arrowColor = "#0f172a" // Slate-900 - maximum contrast
  const lineWidth = 1.5

  // Main dimension line
  drawLine({
    svg,
    x1,
    y1,
    x2,
    y2,
    color: lineColor,
    width: lineWidth
  })

  // Arrowheads - sleek triangular design
  const arrowSize = 7
  if (isVertical) {
    // Vertical arrow - pointing up at start
    const arrow1 = document.createElementNS("http://www.w3.org/2000/svg", 'polygon')
    arrow1.setAttribute("points", `${x1},${y1} ${x1-arrowSize/2},${y1+arrowSize} ${x1+arrowSize/2},${y1+arrowSize}`)
    arrow1.setAttribute("fill", arrowColor)
    arrow1.setAttribute("stroke", "none")
    svg.appendChild(arrow1)

    // Arrowhead at end - pointing down
    const arrow2 = document.createElementNS("http://www.w3.org/2000/svg", 'polygon')
    arrow2.setAttribute("points", `${x2},${y2} ${x2-arrowSize/2},${y2-arrowSize} ${x2+arrowSize/2},${y2-arrowSize}`)
    arrow2.setAttribute("fill", arrowColor)
    arrow2.setAttribute("stroke", "none")
    svg.appendChild(arrow2)
  } else {
    // Horizontal arrow - pointing left at start
    const arrow1 = document.createElementNS("http://www.w3.org/2000/svg", 'polygon')
    arrow1.setAttribute("points", `${x1},${y1} ${x1+arrowSize},${y1-arrowSize/2} ${x1+arrowSize},${y1+arrowSize/2}`)
    arrow1.setAttribute("fill", arrowColor)
    arrow1.setAttribute("stroke", "none")
    svg.appendChild(arrow1)

    // Arrowhead at end - pointing right
    const arrow2 = document.createElementNS("http://www.w3.org/2000/svg", 'polygon')
    arrow2.setAttribute("points", `${x2},${y2} ${x2-arrowSize},${y2-arrowSize/2} ${x2-arrowSize},${y2+arrowSize/2}`)
    arrow2.setAttribute("fill", arrowColor)
    arrow2.setAttribute("stroke", "none")
    svg.appendChild(arrow2)
  }

  // Label with professional styling
  const labelX = (x1 + x2) / 2
  const labelY = (y1 + y2) / 2

  // Compact label sizing
  const padding = 5
  const fontSize = 12
  const textWidth = label.length * 7
  const textHeight = fontSize + 2

  if (isVertical) {
    // For vertical arrows, rotate the text 90 degrees counterclockwise

    // Background rectangle (rotated) - subtle shadow effect
    const shadow = document.createElementNS("http://www.w3.org/2000/svg", 'rect')
    shadow.setAttribute("x", (-(textWidth/2 + padding) + 1).toString())
    shadow.setAttribute("y", (-(textHeight/2 + padding) + 1).toString())
    shadow.setAttribute("width", (textWidth + padding * 2).toString())
    shadow.setAttribute("height", (textHeight + padding * 2).toString())
    shadow.setAttribute("fill", "#000000")
    shadow.setAttribute("opacity", "0.1")
    shadow.setAttribute("rx", "3")
    shadow.setAttribute("transform", `translate(${labelX}, ${labelY}) rotate(-90)`)
    svg.appendChild(shadow)

    // Background rectangle (rotated)
    const rect = document.createElementNS("http://www.w3.org/2000/svg", 'rect')
    rect.setAttribute("x", (-(textWidth/2 + padding)).toString())
    rect.setAttribute("y", (-(textHeight/2 + padding)).toString())
    rect.setAttribute("width", (textWidth + padding * 2).toString())
    rect.setAttribute("height", (textHeight + padding * 2).toString())
    rect.setAttribute("fill", "white")
    rect.setAttribute("stroke", "#94a3b8") // Slate-400 - defined border
    rect.setAttribute("stroke-width", "1")
    rect.setAttribute("rx", "3")
    rect.setAttribute("transform", `translate(${labelX}, ${labelY}) rotate(-90)`)
    svg.appendChild(rect)

    // Rotated text
    const textEl = document.createElementNS("http://www.w3.org/2000/svg", 'text')
    textEl.setAttribute('x', "0")
    textEl.setAttribute('y', "0")
    textEl.setAttribute('font-size', fontSize.toString())
    textEl.setAttribute('fill', arrowColor)
    textEl.setAttribute('font-weight', "600")
    textEl.setAttribute('text-anchor', 'middle')
    textEl.setAttribute('dominant-baseline', 'middle')
    textEl.setAttribute('transform', `translate(${labelX}, ${labelY}) rotate(-90)`)
    textEl.textContent = label
    svg.appendChild(textEl)
  } else {
    // Horizontal arrow - subtle shadow
    drawRectangle({
      svg,
      x: labelX - textWidth/2 - padding + 1,
      y: labelY - textHeight/2 - padding + 1,
      width: textWidth + padding * 2,
      height: textHeight + padding * 2,
      borderColor: "transparent",
      borderWidth: 0,
      fillColor: "#000000",
      fillOpacity: 0.1,
      rx: 3
    })

    // Horizontal arrow - label background
    drawRectangle({
      svg,
      x: labelX - textWidth/2 - padding,
      y: labelY - textHeight/2 - padding,
      width: textWidth + padding * 2,
      height: textHeight + padding * 2,
      borderColor: "#94a3b8", // Slate-400 - defined border
      borderWidth: 1,
      fillColor: "white",
      fillOpacity: 1,
      rx: 3
    })

    drawText({
      svg,
      x: labelX,
      y: labelY,
      text: label,
      fontSize: fontSize,
      color: arrowColor,
      fontWeight: "600"
    })
  }

  // Move all newly appended children into a <g data-dimension> group
  const group = document.createElementNS("http://www.w3.org/2000/svg", 'g')
  group.setAttribute('data-dimension', 'true')
  const newChildren: Element[] = []
  for (let i = childCountBefore; i < svg.childElementCount; i++) {
    newChildren.push(svg.children[i])
  }
  for (const child of newChildren) {
    group.appendChild(child)
  }
  svg.appendChild(group)
}

// ========================================================================================================
// Polygon Drawing
// ========================================================================================================

interface DrawPolygonParams {
  svg: SVGSVGElement
  points: string
  fillColor: string
  borderColor?: string
  borderWidth?: number
  fillOpacity?: number
}

export function drawPolygon({
  svg,
  points,
  fillColor,
  borderColor,
  borderWidth = 0,
  fillOpacity = 1
}: DrawPolygonParams): void {
  const polygon = document.createElementNS("http://www.w3.org/2000/svg", 'polygon')
  polygon.setAttribute("points", points)
  polygon.setAttribute("fill", fillColor)
  polygon.setAttribute("fill-opacity", fillOpacity.toString())
  if (borderColor && borderWidth > 0) {
    polygon.setAttribute("stroke", borderColor)
    polygon.setAttribute("stroke-width", borderWidth.toString())
  }
  svg.appendChild(polygon)
}
