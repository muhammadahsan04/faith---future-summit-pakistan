/* ============================================================
   Beyond Self — "I am attending" poster canvas renderer
   Faith & Future Summit · General Summit 3

   The entire poster is painted here. Nothing about it exists in
   the DOM, so Inspect only ever shows a single <canvas> element.

   Coordinates are written in "design units": the poster is 563
   units wide, and SCALE blows that up to the export resolution.

   Design system reference — Beyond Self Edition:
     Mint #8DE1A5 · Teal #06A6A6 · Deep Teal #04465E · Navy #0C283D
     Type colour #F5EDDC · Label box #0A1828
     Inter Black / Hornset / Adapter PE Variable Display
     Geometric lattice over the signature gradient
   ============================================================ */

import lockupSrc from './assets/beyond-self-lockup.png'

export const CANVAS_W = 2088
export const CANVAS_H = 2610

const DESIGN_W = 563
const SCALE = CANVAS_W / DESIGN_W
const DESIGN_H = CANVAS_H / SCALE

const CREAM_RGB = '245, 237, 220'
const INK_RGB = '10, 24, 40'

const COLOR = {
    mint: '#8DE1A5',
    teal: '#06A6A6',
    deepTeal: '#04465E',
    navy: '#0C283D',
    ink: '#0A1828',
    cream: '#F5EDDC',
    creamSoft: `rgba(${CREAM_RGB}, 0.74)`,
    creamFaint: `rgba(${CREAM_RGB}, 0.55)`,
    lattice: `rgba(${CREAM_RGB}, 0.11)`,
    well: `rgba(${INK_RGB}, 0.38)`,
    metaLabel: `rgba(${INK_RGB}, 0.55)`,
    metaRule: `rgba(${INK_RGB}, 0.16)`,
    shadow: `rgba(${INK_RGB}, 0.34)`,
}

/* The wordmark is now placed as supplied artwork, so Hornset is no
   longer needed here. Adapter PE is still used for interface-level
   type; it is a licensed desktop face, so it is named first and will
   be used wherever it is installed or self-hosted, with Archivo as
   the matched web fallback. */
const FONT = {
    display: '"Inter", "Helvetica Neue", Arial, sans-serif',
    ui: '"Adapter PE Variable Display", "Archivo", "Inter", sans-serif',
}

/* Every position and size in one place — tune here, not in the
   drawing code. */
const L = {
    padX: 30,

    lattice: { tile: 46, weight: 0.7 },

    // kicker: { top: 28, size: 13.5, padX: 12, height: 28, radius: 3, tracking: 2.6 },

    kicker: {
        top: 28,
        size: 13.5,
        padX: 12,
        height: 28,
        radius: 3,
        tracking: 2.6,
    },

    edition: {
        size: 17,
        tracking: 1.2,
        topGap: 12,
        bottomGap: 28,
    },

    /* The wordmark is the supplied lockup PNG. `ratio` is the
       artwork's own height/width, kept here so the layout below it
       holds its place while the image is still loading. */
    // lockup: { top: 76, width: 220, ratio: 1.3037 },

    // lockup: {
    //     width: 220,
    //     ratio: 1.3037,
    // },
    lockup: { top: 100, width: 180, ratio: 1.3037 },
    rule: { gap: 14 },

    identity: { gap: 18, photo: 170, radius: 14, columnGap: 18 },
    name: { size: 32, tracking: -0.8 },
    role: { size: 13.5, gap: 13, tracking: 1.2 },

    meta: {
        height: 82,
        bottom: 54,
        radius: 8,
        padX: 15,
        cellPadX: 13,
        columns: [1, 1, 2.1],
        labelSize: 10.5,
        labelTracking: 1.6,
        valueSize: 20,
    },

    band: { height: 100 },
    footer: { size: 22, smallSize: 9, bottom: 20, tracking: 0.6 },
}

const CONTENT = {
    kicker: 'I AM ATTENDING',
    edition: 'FAITH & FUTURE SUMMIT SEPTEMBER EDITION.',
    meta: [
        { label: 'DATE', value: ['20 Sep 26'] },
        { label: 'TIME', value: ['9am - 1pm'] },
        { label: 'VENUE', value: ['Al-Kawthar University', 'Auditorium, Karachi'] },
    ],
    footer: 'FAITH & FUTURE SUMMIT',
    footerSmall: ' BY SISL',
    placeholder: 'ADD YOUR PHOTO',
}

/* ---------- small drawing helpers ---------- */

function roundRect(ctx, x, y, w, h, r) {
    const m = Math.min(r, w / 2, h / 2)
    ctx.beginPath()
    ctx.moveTo(x + m, y)
    ctx.arcTo(x + w, y, x + w, y + h, m)
    ctx.arcTo(x + w, y + h, x, y + h, m)
    ctx.arcTo(x, y + h, x, y, m)
    ctx.arcTo(x, y, x + w, y, m)
    ctx.closePath()
}

const nativeTracking = (ctx) => 'letterSpacing' in ctx

function setFont(ctx, spec, tracking = 0) {
    ctx.font = spec
    if (nativeTracking(ctx)) ctx.letterSpacing = `${tracking}px`
    ctx._tracking = tracking
}

function measure(ctx, str) {
    const t = ctx._tracking || 0
    if (!t || nativeTracking(ctx)) return ctx.measureText(str).width
    let w = 0
    for (const ch of str) w += ctx.measureText(ch).width + t
    return w - t
}

function write(ctx, str, x, y) {
    const t = ctx._tracking || 0
    if (!t || nativeTracking(ctx)) {
        ctx.fillText(str, x, y)
        return
    }
    let cx = x
    for (const ch of str) {
        ctx.fillText(ch, cx, y)
        cx += ctx.measureText(ch).width + t
    }
}


function clamp(ctx, str, maxWidth) {
    if (measure(ctx, str) <= maxWidth) return str
    let out = str
    while (out.length > 1 && measure(ctx, `${out}…`) > maxWidth) out = out.slice(0, -1)
    return `${out}…`
}

function brandGradient(ctx, x, width) {
    const g = ctx.createLinearGradient(x, 0, x + width, 0)
    g.addColorStop(0, COLOR.mint)
    g.addColorStop(1, COLOR.teal)
    return g
}

function shadowed(ctx, blur, offsetY, paint) {
    ctx.save()
    ctx.shadowColor = COLOR.shadow
    ctx.shadowBlur = blur
    ctx.shadowOffsetY = offsetY
    paint()
    ctx.restore()
}

/* ---------- sections ---------- */

function drawBackground(ctx) {
    const g = ctx.createLinearGradient(0, 0, DESIGN_W * 0.8, DESIGN_H)
    g.addColorStop(0, COLOR.mint)
    g.addColorStop(0.3, COLOR.teal)
    g.addColorStop(0.66, COLOR.deepTeal)
    g.addColorStop(1, COLOR.navy)
    ctx.fillStyle = g
    ctx.fillRect(0, 0, DESIGN_W, DESIGN_H)
}

/* Interlocking squares and diagonals — a square with an inscribed
   rotated square, tiled, at low opacity. */
function drawLattice(ctx) {
    const { tile, weight } = L.lattice
    ctx.save()
    ctx.strokeStyle = COLOR.lattice
    ctx.lineWidth = weight
    for (let y = -tile; y < DESIGN_H + tile; y += tile) {
        for (let x = -tile; x < DESIGN_W + tile; x += tile) {
            ctx.beginPath()
            ctx.rect(x, y, tile, tile)
            ctx.moveTo(x + tile / 2, y)
            ctx.lineTo(x + tile, y + tile / 2)
            ctx.lineTo(x + tile / 2, y + tile)
            ctx.lineTo(x, y + tile / 2)
            ctx.closePath()
            ctx.stroke()
        }
    }
    ctx.restore()
}

// function drawKicker(ctx) {
//     const { top, size, padX, height, radius, tracking } = L.kicker
//     setFont(ctx, `700 ${size}px ${FONT.ui}`, tracking)
//     const boxWidth = measure(ctx, CONTENT.kicker) + padX * 2

//     shadowed(ctx, 14, 5, () => {
//         ctx.fillStyle = COLOR.ink
//         roundRect(ctx, L.padX, top, boxWidth, height, radius)
//         ctx.fill()
//     })

//     ctx.fillStyle = COLOR.cream
//     write(ctx, CONTENT.kicker, L.padX + padX, top + height / 2 + size * 0.36)

//     // Edition text — I AM ATTENDING ke neeche
//     setFont(ctx, `700 11px ${FONT.ui}`, 1.5)
//     ctx.fillStyle = COLOR.deepTeal

//     const editionY = top + height + 15

//     write(
//         ctx,
//         CONTENT.edition,
//         L.padX,
//         editionY
//     )

//     return editionY
// }

function drawKicker(ctx) {
    const { top, size, padX, height, radius, tracking } = L.kicker
    const { size: editionSize, tracking: editionTracking, topGap, bottomGap } = L.edition

    // I AM ATTENDING
    setFont(ctx, `700 ${size}px ${FONT.ui}`, tracking)

    const boxWidth = measure(ctx, CONTENT.kicker) + padX * 2

    shadowed(ctx, 14, 5, () => {
        ctx.fillStyle = COLOR.ink
        roundRect(ctx, L.padX, top, boxWidth, height, radius)
        ctx.fill()
    })

    ctx.fillStyle = COLOR.cream

    write(
        ctx,
        CONTENT.kicker,
        L.padX + padX,
        top + height / 2 + size * 0.36
    )

    // THE & FUTURE SUMMIT SEPTEMBER EDITION.
    setFont(ctx, `800 ${editionSize}px ${FONT.ui}`, editionTracking)
    ctx.fillStyle = COLOR.ink

    const editionY =
        top +
        height +
        topGap +
        editionSize

    write(
        ctx,
        CONTENT.edition,
        L.padX,
        editionY
    )

    // Return the bottom of edition + bottom spacing
    return editionY + bottomGap
}


/* The wordmark is the approved lockup artwork, placed as-is: the
   cream-on-dark variant with its own fade and drop shadow baked in.
   Nothing about it is re-typeset, so it can never drift from the
   design system. Swap the PNG in ./assets to update it. */
let lockup = null
let lockupPromise = null

function loadLockup() {
    if (lockupPromise) return lockupPromise
    lockupPromise = new Promise((resolve) => {
        const img = new Image()
        img.onload = () => {
            lockup = img
            resolve(img)
        }
        img.onerror = () => resolve(null)
        img.src = lockupSrc
    })
    return lockupPromise
}

function drawLockup(ctx) {
    const { top, width, ratio } = L.lockup

    /* Before the artwork resolves, reserve its exact footprint so the
       rest of the poster never shifts when it lands. */
    if (!lockup || !lockup.naturalWidth) return top + width * ratio

    const height = width * (lockup.naturalHeight / lockup.naturalWidth)
    ctx.drawImage(lockup, L.padX, top, width, height)
    return top + height
}

/* No divider is painted between the wordmark and the identity block —
   `L.rule.gap` is kept purely as the breathing space between them. */
function ruleGap(afterLockup) {
    return afterLockup + L.rule.gap
}

function drawPhoto(ctx, x, y, box, image, adjustments) {
    ctx.save()
    roundRect(ctx, x, y, box, box, L.identity.radius)
    ctx.clip()
    ctx.fillStyle = COLOR.well
    ctx.fillRect(x, y, box, box)

    if (image && image.naturalWidth) {
        const { zoom = 1, horizontal = 50, vertical = 50 } = adjustments || {}
        const cover = Math.max(box / image.naturalWidth, box / image.naturalHeight)
        const w = image.naturalWidth * cover
        const h = image.naturalHeight * cover
        ctx.translate(x + box / 2, y + box / 2)
        ctx.scale(zoom, zoom)
        ctx.translate(((horizontal - 50) / 100) * box, ((vertical - 50) / 100) * box)
        ctx.drawImage(image, -w / 2, -h / 2, w, h)
    } else {
        setFont(ctx, `700 11px ${FONT.ui}`, 1.6)
        ctx.fillStyle = COLOR.creamFaint
        const label = CONTENT.placeholder
        write(ctx, label, x + box / 2 - measure(ctx, label) / 2, y + box / 2 + 4)
    }
    ctx.restore()

    ctx.save()
    ctx.strokeStyle = brandGradient(ctx, x, box)
    ctx.lineWidth = 2
    roundRect(ctx, x + 1, y + 1, box - 2, box - 2, L.identity.radius - 1)
    ctx.stroke()
    ctx.restore()
}

function drawIdentity(ctx, afterRule, details, image, adjustments) {
    const box = L.identity.photo
    const top = afterRule + L.identity.gap
    drawPhoto(ctx, L.padX, top, box, image, adjustments)

    const copyX = L.padX + box + L.identity.columnGap
    const copyWidth = DESIGN_W - L.padX - copyX

    const nameLine = L.name.size
    const roleLine = L.role.size * 1.35
    const blockHeight = nameLine + L.role.gap + roleLine + L.role.gap * 0.75 + roleLine
    let baseline = top + (box - blockHeight) / 2 + nameLine * 0.8

    setFont(ctx, `900 ${L.name.size}px ${FONT.display}`, L.name.tracking)
    ctx.fillStyle = COLOR.cream
    write(ctx, clamp(ctx, (details.name || 'Your name').toUpperCase(), copyWidth), copyX, baseline)

    baseline += L.role.gap + roleLine
    setFont(ctx, `600 ${L.role.size}px ${FONT.ui}`, L.role.tracking)
    ctx.fillStyle = COLOR.creamSoft
    write(ctx, clamp(ctx, (details.title || 'Your designation').toUpperCase(), copyWidth), copyX, baseline)

    baseline += L.role.gap * 0.75 + roleLine
    ctx.fillStyle = COLOR.mint
    write(ctx, clamp(ctx, (details.company || 'Your organisation').toUpperCase(), copyWidth), copyX, baseline)
}

function drawBand(ctx) {
    ctx.fillStyle = COLOR.ink
    ctx.fillRect(0, DESIGN_H - L.band.height, DESIGN_W, L.band.height)
}

function drawMeta(ctx) {
    const { height, bottom, radius, padX, cellPadX, columns, labelSize, labelTracking, valueSize } = L.meta
    const top = DESIGN_H - bottom - height
    const width = DESIGN_W - L.padX * 2

    shadowed(ctx, 20, 9, () => {
        ctx.fillStyle = COLOR.cream
        roundRect(ctx, L.padX, top, width, height, radius)
        ctx.fill()
    })

    const inner = width - padX * 2
    const total = columns.reduce((a, b) => a + b, 0)
    const cellWidths = columns.map((c) => (c / total) * inner)

    /* One value size for the whole bar: the longest line decides it,
       so nothing is ever truncated and the three cells stay in step. */
    setFont(ctx, `800 ${valueSize}px ${FONT.display}`, -0.4)
    let valueScale = 1
    CONTENT.meta.forEach((cell, index) => {
        const room = cellWidths[index] - cellPadX * 1.6
        cell.value.forEach((line) => {
            const w = measure(ctx, line)
            if (w > room) valueScale = Math.min(valueScale, room / w)
        })
    })
    const fittedValue = valueSize * valueScale

    const labelLine = labelSize * 1.15
    const valueLine = fittedValue * 0.98
    const maxLines = Math.max(...CONTENT.meta.map((cell) => cell.value.length))
    const blockHeight = labelLine + 6 + maxLines * valueLine
    const labelBaseline = top + (height - blockHeight) / 2 + labelSize * 0.85
    const firstValueBaseline = labelBaseline + 6 + fittedValue * 0.78

    let x = L.padX + padX

    CONTENT.meta.forEach((cell, index) => {
        const cellWidth = cellWidths[index]
        const textX = x + cellPadX

        setFont(ctx, `700 ${labelSize}px ${FONT.ui}`, labelTracking)
        ctx.fillStyle = COLOR.metaLabel
        write(ctx, cell.label, textX, labelBaseline)

        setFont(ctx, `800 ${fittedValue}px ${FONT.display}`, -0.4)
        ctx.fillStyle = COLOR.deepTeal
        cell.value.forEach((line, i) => {
            write(ctx, line, textX, firstValueBaseline + i * valueLine)
        })

        if (index < CONTENT.meta.length - 1) {
            ctx.fillStyle = COLOR.metaRule
            ctx.fillRect(x + cellWidth - 0.8, top + 12, 1.6, height - 24)
        }
        x += cellWidth
    })
}

function drawFooter(ctx) {
    const { size, smallSize, bottom, tracking } = L.footer
    const baseline = DESIGN_H - bottom

    setFont(ctx, `800 ${size}px ${FONT.display}`, tracking)
    const mainWidth = measure(ctx, CONTENT.footer)
    setFont(ctx, `700 ${smallSize}px ${FONT.ui}`, 2)
    const smallWidth = measure(ctx, CONTENT.footerSmall)

    let x = (DESIGN_W - (mainWidth + smallWidth)) / 2

    setFont(ctx, `800 ${size}px ${FONT.display}`, tracking)
    ctx.fillStyle = COLOR.cream
    write(ctx, CONTENT.footer, x, baseline)

    x += mainWidth
    setFont(ctx, `700 ${smallSize}px ${FONT.ui}`, 2)
    ctx.fillStyle = COLOR.mint
    write(ctx, CONTENT.footerSmall, x, baseline - size * 0.06)
}

/* ---------- entry point ---------- */

export function drawPoster(canvas, { details = {}, image = null, adjustments } = {}) {
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = CANVAS_W
    canvas.height = CANVAS_H
    ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0)
    ctx.textBaseline = 'alphabetic'
    ctx.textAlign = 'left'

    drawBackground(ctx)
    drawLattice(ctx)
    drawBand(ctx)

    drawKicker(ctx)
    const afterLockup = drawLockup(ctx)
    const afterRule = ruleGap(afterLockup)
    drawIdentity(ctx, afterRule, details, image, adjustments)
    drawMeta(ctx)
    drawFooter(ctx)
}

/* Fonts and the wordmark artwork must both resolve before the first
   paint, otherwise the canvas bakes in a fallback face or draws the
   poster with a hole where the lockup goes. Adapter PE is requested
   too, so it is used wherever it happens to be available. */
export function loadPosterFonts() {
    const artwork = loadLockup()
    if (!document.fonts) return artwork

    const faces = [
        '900 100px "Inter"',
        '800 100px "Inter"',
        '700 100px "Inter"',
        '900 100px "Archivo"',
        '700 100px "Archivo"',
        '600 100px "Archivo"',
        '900 100px "Adapter PE Variable Display"',
        '700 100px "Adapter PE Variable Display"',
        '600 100px "Adapter PE Variable Display"',
    ]

    return Promise.all([
        artwork,
        ...faces.map((f) => document.fonts.load(f).catch(() => null)),
    ]).then(() => document.fonts.ready)
}