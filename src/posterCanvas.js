/* ============================================================
   Beyond Self — "I am attending" poster canvas renderer
   Faith & Future Summit · September Edition

   PERFORMANCE VERSION

   IMPORTANT:
   1.svg, 2.svg and 3.svg use raw SVG imports.
   4.svg uses a NORMAL Vite asset import because that is the
   correct rendering method for the supplied Beyond Self artwork.
   ============================================================ */


/* ============================================================
   SVG IMPORTS
   ============================================================ */

import summitLogoSvg from './assets/1.svg?raw'
import partnersSvg from './assets/2.svg?raw'
import headlineSvg from './assets/3.svg?raw'

/*
 * IMPORTANT:
 *
 * 4.svg must NOT use ?raw.
 *
 * Vite returns the asset URL here and the browser loads the SVG
 * directly into Image().
 */
import themeSrc from './assets/4.png'


/* ============================================================
   CANVAS SIZE
   ============================================================ */

export const CANVAS_W = 2088
export const CANVAS_H = 2610

const DESIGN_W = 563
const SCALE = CANVAS_W / DESIGN_W
const DESIGN_H = CANVAS_H / SCALE


/* ============================================================
   COLORS
   ============================================================ */

const CREAM_RGB = '245, 237, 220'
const INK_RGB = '10, 24, 40'

const COLOR = {
    mint: '#8DE1A5',
    teal: '#06A6A6',
    deepTeal: '#04465E',
    navy: '#0C283D',
    ink: '#0A1828',
    cream: '#F5EDDC',

    creamSoft:
        `rgba(${CREAM_RGB}, 0.74)`,

    creamFaint:
        `rgba(${CREAM_RGB}, 0.55)`,

    lattice:
        `rgba(${CREAM_RGB}, 0.11)`,

    well:
        `rgba(${INK_RGB}, 0.38)`,

    metaLabel:
        `rgba(${INK_RGB}, 0.55)`,

    metaRule:
        `rgba(${INK_RGB}, 0.16)`,

    shadow:
        `rgba(${INK_RGB}, 0.34)`,
}


/* ============================================================
   FONTS
   ============================================================ */

const FONT = {
    display:
        '"Inter", "Helvetica Neue", Arial, sans-serif',

    ui:
        '"Adapter PE Variable Display", "Archivo", "Inter", sans-serif',
}


/* ============================================================
   LAYOUT
   ============================================================ */

const L = {
    padX: 30,

    lattice: {
        tile: 46,
        weight: 0.7,
    },

    brandBar: {
        centerY: 52,

        summitLogo: {
            x: 9,
            width: 153,
        },

        partners: {
            right: 13,
            width: 257,
        },
    },

    kicker: {
        top: 100,
        size: 15.5,
        padX: 14,
        height: 31,
        radius: 3.5,
        tracking: 3,
    },

    hero: {
        top: 156,
        height: 176,

        headlineX: 50,

        /*
         * Beyond Self artwork position.
         */
        themeX: 323,

        /*
         * Width is easier to control for this particular 4.svg
         * because this is how the artwork works correctly in your
         * original General Summit renderer.
         */
        themeWidth: 180,
    },

    rule: {
        gap: 16,
    },

    identity: {
        gap: 18,
        photo: 170,
        radius: 14,
        columnGap: 18,
    },

    name: {
        size: 32,
        tracking: -0.8,
    },

    role: {
        size: 13.5,
        gap: 13,
        tracking: 1.2,
    },

    meta: {
        height: 82,
        bottom: 54,
        radius: 8,
        padX: 15,
        cellPadX: 13,

        columns: [
            1,
            1,
            2.1,
        ],

        labelSize: 10.5,
        labelTracking: 1.6,
        valueSize: 20,
    },

    band: {
        height: 100,
    },

    footer: {
        size: 22,
        smallSize: 9,
        bottom: 20,
        tracking: 0.6,
    },
}


/* ============================================================
   CONTENT
   ============================================================ */

const CONTENT = {
    kicker:
        'I AM ATTENDING',

    meta: [
        {
            label: 'DATE',
            value: [
                '20 Sep 26',
            ],
        },

        {
            label: 'TIME',
            value: [
                '9am - 1pm',
            ],
        },

        {
            label: 'VENUE',
            value: [
                'Al-Kawthar University',
                'Auditorium, Karachi',
            ],
        },
    ],

    footer:
        'FAITH & FUTURE SUMMIT',

    footerSmall:
        ' BY SISL',

    placeholder:
        'ADD YOUR PHOTO',
}


/* ============================================================
   ARTWORK
   ============================================================ */

/*
 * 1, 2 and 3 use raw SVG strings.
 *
 * 4 is deliberately NOT stored here because it is loaded through
 * the normal Vite asset URL method.
 */

const ARTWORK = {
    summitLogo: {
        svg: summitLogoSvg,
        aspect: 5238 / 2785,
        trim: false,
    },

    partners: {
        svg: partnersSvg,
        aspect: 3256 / 514,
        trim: true,
    },

    headline: {
        svg: headlineSvg,
        aspect: 234 / 175,
        trim: false,
    },
}


/* ============================================================
   ARTWORK CACHE
   ============================================================ */

const art =
    Object.create(null)


let artworkPromise =
    null


const artworkRedrawCallbacks =
    new Set()


/* ============================================================
   SVG -> BLOB URL
   ============================================================ */

function svgToObjectUrl(
    svg
) {
    const blob =
        new Blob(
            [
                svg
            ],
            {
                type:
                    'image/svg+xml;charset=utf-8',
            }
        )

    return URL.createObjectURL(
        blob
    )
}


/* ============================================================
   TRANSPARENT PIXEL BOUNDS
   ============================================================ */

function inkBounds(
    img
) {
    const w =
        img.naturalWidth

    const h =
        img.naturalHeight

    const full = {
        sx: 0,
        sy: 0,
        sw: w,
        sh: h,
    }

    try {
        const s =
            Math.min(
                1,
                1024 /
                Math.max(
                    w,
                    h
                )
            )

        const cw =
            Math.max(
                1,
                Math.round(
                    w *
                    s
                )
            )

        const ch =
            Math.max(
                1,
                Math.round(
                    h *
                    s
                )
            )

        const probe =
            document.createElement(
                'canvas'
            )

        probe.width =
            cw

        probe.height =
            ch

        const pctx =
            probe.getContext(
                '2d',
                {
                    willReadFrequently:
                        true,
                }
            )

        if (
            !pctx
        ) {
            return full
        }

        pctx.drawImage(
            img,
            0,
            0,
            cw,
            ch
        )

        const data =
            pctx.getImageData(
                0,
                0,
                cw,
                ch
            ).data

        let minX = cw
        let minY = ch
        let maxX = -1
        let maxY = -1

        for (
            let y = 0;
            y < ch;
            y++
        ) {
            for (
                let x = 0;
                x < cw;
                x++
            ) {
                const alpha =
                    data[
                        (
                            y *
                            cw +
                            x
                        ) *
                        4 +
                        3
                    ]

                if (
                    alpha >
                    8
                ) {
                    if (
                        x <
                        minX
                    ) {
                        minX = x
                    }

                    if (
                        x >
                        maxX
                    ) {
                        maxX = x
                    }

                    if (
                        y <
                        minY
                    ) {
                        minY = y
                    }

                    if (
                        y >
                        maxY
                    ) {
                        maxY = y
                    }
                }
            }
        }

        if (
            maxX <
            0
        ) {
            return full
        }

        const sx =
            Math.max(
                0,
                Math.floor(
                    minX /
                    s
                )
            )

        const sy =
            Math.max(
                0,
                Math.floor(
                    minY /
                    s
                )
            )

        const ex =
            Math.min(
                w,
                Math.ceil(
                    (
                        maxX +
                        1
                    ) /
                    s
                )
            )

        const ey =
            Math.min(
                h,
                Math.ceil(
                    (
                        maxY +
                        1
                    ) /
                    s
                )
            )

        return {
            sx,
            sy,
            sw:
                ex -
                sx,

            sh:
                ey -
                sy,
        }
    } catch {
        return full
    }
}


/* ============================================================
   LOAD RAW SVG
   ============================================================ */

function loadSvgImage(
    key
) {
    const {
        svg,
        trim,
    } =
        ARTWORK[key]

    return new Promise(
        (
            resolve
        ) => {
            const img =
                new Image()

            try {
                img.fetchPriority =
                    'high'
            } catch {
                /* Unsupported browser */
            }

            img.decoding =
                'sync'

            const objectUrl =
                svgToObjectUrl(
                    svg
                )

            const cleanup =
                () => {
                    URL.revokeObjectURL(
                        objectUrl
                    )
                }

            img.onload =
                async () => {
                    if (
                        typeof img.decode ===
                        'function'
                    ) {
                        try {
                            await img.decode()
                        } catch {
                            /* Image still usable */
                        }
                    }

                    const bounds =
                        trim
                            ? inkBounds(
                                img
                            )
                            : {
                                sx: 0,
                                sy: 0,
                                sw:
                                    img.naturalWidth,
                                sh:
                                    img.naturalHeight,
                            }

                    art[key] = {
                        img,
                        ...bounds,
                    }

                    cleanup()

                    resolve(
                        img
                    )
                }

            img.onerror =
                () => {
                    cleanup()

                    console.error(
                        `Failed to load poster artwork: ${key}`
                    )

                    resolve(
                        null
                    )
                }

            img.src =
                objectUrl
        }
    )
}


/* ============================================================
   LOAD 4.SVG DIRECTLY
   ============================================================ */

/*
 * This is the important part.
 *
 * 4.svg is handled exactly like your working General Summit code:
 *
 *     import themeSrc from './assets/4.svg'
 *
 *     const img = new Image()
 *     img.src = themeSrc
 *
 * No Blob.
 * No ?raw.
 * No transparent pixel scan.
 * No viewBox rewriting.
 */

function loadThemeImage() {
    return new Promise(
        (
            resolve
        ) => {
            const img =
                new Image()

            try {
                img.fetchPriority =
                    'high'
            } catch {
                /* unsupported */
            }

            img.decoding =
                'sync'

            img.onload =
                async () => {
                    if (
                        typeof img.decode ===
                        'function'
                    ) {
                        try {
                            await img.decode()
                        } catch {
                            /* image is still usable */
                        }
                    }

                    art.theme = {
                        img,

                        sx: 0,
                        sy: 0,

                        sw:
                            img.naturalWidth,

                        sh:
                            img.naturalHeight,
                    }

                    resolve(
                        img
                    )
                }

            img.onerror =
                () => {
                    console.error(
                        'Failed to load poster artwork: theme'
                    )

                    resolve(
                        null
                    )
                }

            /*
             * NORMAL VITE ASSET URL.
             */
            img.src =
                themeSrc
        }
    )
}


/* ============================================================
   LOAD ALL ARTWORK
   ============================================================ */

function loadArtwork() {
    if (
        artworkPromise
    ) {
        return artworkPromise
    }

    /*
     * 1, 2, 3 + 4 all start at the same time.
     */
    artworkPromise =
        Promise.all([
            loadSvgImage(
                'summitLogo'
            ),

            loadSvgImage(
                'partners'
            ),

            loadSvgImage(
                'headline'
            ),

            loadThemeImage(),
        ])
            .then(
                (
                    results
                ) => {
                    const callbacks = [
                        ...artworkRedrawCallbacks,
                    ]

                    artworkRedrawCallbacks.clear()

                    callbacks.forEach(
                        (
                            redraw
                        ) => {
                            try {
                                redraw()
                            } catch (
                                error
                            ) {
                                console.error(
                                    'Poster artwork redraw failed:',
                                    error
                                )
                            }
                        }
                    )

                    return results
                }
            )
            .catch(
                (
                    error
                ) => {
                    console.error(
                        'Poster artwork loading failed:',
                        error
                    )

                    return []
                }
            )

    return artworkPromise
}


/* ============================================================
   ARTWORK ASPECT RATIO
   ============================================================ */

function artAspect(
    key
) {
    const a =
        art[key]

    if (
        a &&
        a.sw &&
        a.sh
    ) {
        return (
            a.sw /
            a.sh
        )
    }

    /*
     * Theme fallback before image loads.
     */
    if (
        key ===
        'theme'
    ) {
        /*
         * Same approximate footprint used by your
         * working General Summit code.
         */
        return (
            1 /
            1.3037
        )
    }

    return (
        ARTWORK[key]
            .aspect
    )
}


/* ============================================================
   ARTWORK SIZE
   ============================================================ */

function artSize(
    key,
    {
        width,
        height,
    }
) {
    const aspect =
        artAspect(
            key
        )

    if (
        width != null
    ) {
        return {
            width,

            height:
                width /
                aspect,
        }
    }

    return {
        width:
            height *
            aspect,

        height,
    }
}


/* ============================================================
   DRAW ARTWORK
   ============================================================ */

function placeArt(
    ctx,
    key,
    x,
    y,
    size
) {
    const box =
        artSize(
            key,
            size
        )

    const a =
        art[key]

    if (
        a &&
        a.img &&
        a.img.naturalWidth
    ) {
        ctx.drawImage(
            a.img,

            a.sx,
            a.sy,
            a.sw,
            a.sh,

            x,
            y,

            box.width,
            box.height
        )
    }

    return box
}


/* ============================================================
   DRAWING HELPERS
   ============================================================ */

function roundRect(
    ctx,
    x,
    y,
    w,
    h,
    r
) {
    const m =
        Math.min(
            r,
            w / 2,
            h / 2
        )

    ctx.beginPath()

    ctx.moveTo(
        x + m,
        y
    )

    ctx.arcTo(
        x + w,
        y,
        x + w,
        y + h,
        m
    )

    ctx.arcTo(
        x + w,
        y + h,
        x,
        y + h,
        m
    )

    ctx.arcTo(
        x,
        y + h,
        x,
        y,
        m
    )

    ctx.arcTo(
        x,
        y,
        x + w,
        y,
        m
    )

    ctx.closePath()
}


const nativeTracking =
    (
        ctx
    ) =>
        'letterSpacing' in ctx


function setFont(
    ctx,
    spec,
    tracking = 0
) {
    ctx.font =
        spec

    if (
        nativeTracking(
            ctx
        )
    ) {
        ctx.letterSpacing =
            `${tracking}px`
    }

    ctx._tracking =
        tracking
}


function measure(
    ctx,
    str
) {
    const t =
        ctx._tracking ||
        0

    if (
        !t ||
        nativeTracking(
            ctx
        )
    ) {
        return (
            ctx.measureText(
                str
            ).width
        )
    }

    let w = 0

    for (
        const ch of str
    ) {
        w +=
            ctx.measureText(
                ch
            ).width +
            t
    }

    return (
        w -
        t
    )
}


function inkWidth(
    ctx,
    str
) {
    const t =
        ctx._tracking ||
        0

    return nativeTracking(
        ctx
    )
        ? measure(
            ctx,
            str
        ) -
        t

        : measure(
            ctx,
            str
        )
}


function write(
    ctx,
    str,
    x,
    y
) {
    const t =
        ctx._tracking ||
        0

    if (
        !t ||
        nativeTracking(
            ctx
        )
    ) {
        ctx.fillText(
            str,
            x,
            y
        )

        return
    }

    let cx =
        x

    for (
        const ch of str
    ) {
        ctx.fillText(
            ch,
            cx,
            y
        )

        cx +=
            ctx.measureText(
                ch
            ).width +
            t
    }
}


function clamp(
    ctx,
    str,
    maxWidth
) {
    if (
        measure(
            ctx,
            str
        ) <=
        maxWidth
    ) {
        return str
    }

    let out =
        str

    while (
        out.length >
        1 &&
        measure(
            ctx,
            `${out}…`
        ) >
        maxWidth
    ) {
        out =
            out.slice(
                0,
                -1
            )
    }

    return `${out}…`
}


function brandGradient(
    ctx,
    x,
    width
) {
    const g =
        ctx.createLinearGradient(
            x,
            0,
            x + width,
            0
        )

    g.addColorStop(
        0,
        COLOR.mint
    )

    g.addColorStop(
        1,
        COLOR.teal
    )

    return g
}


function shadowed(
    ctx,
    blur,
    offsetY,
    paint
) {
    ctx.save()

    ctx.shadowColor =
        COLOR.shadow

    ctx.shadowBlur =
        blur

    ctx.shadowOffsetY =
        offsetY

    paint()

    ctx.restore()
}


/* ============================================================
   BACKGROUND
   ============================================================ */

function drawBackground(
    ctx
) {
    const g =
        ctx.createLinearGradient(
            0,
            0,
            DESIGN_W *
            0.8,
            DESIGN_H
        )

    g.addColorStop(
        0,
        COLOR.mint
    )

    g.addColorStop(
        0.3,
        COLOR.teal
    )

    g.addColorStop(
        0.66,
        COLOR.deepTeal
    )

    g.addColorStop(
        1,
        COLOR.navy
    )

    ctx.fillStyle =
        g

    ctx.fillRect(
        0,
        0,
        DESIGN_W,
        DESIGN_H
    )
}


/* ============================================================
   LATTICE
   ============================================================ */

function drawLattice(
    ctx
) {
    const {
        tile,
        weight,
    } =
        L.lattice

    ctx.save()

    ctx.strokeStyle =
        COLOR.lattice

    ctx.lineWidth =
        weight

    for (
        let y =
            -tile;

        y <
        DESIGN_H +
        tile;

        y += tile
    ) {
        for (
            let x =
                -tile;

            x <
            DESIGN_W +
            tile;

            x += tile
        ) {
            ctx.beginPath()

            ctx.rect(
                x,
                y,
                tile,
                tile
            )

            ctx.moveTo(
                x +
                tile / 2,
                y
            )

            ctx.lineTo(
                x +
                tile,
                y +
                tile / 2
            )

            ctx.lineTo(
                x +
                tile / 2,
                y +
                tile
            )

            ctx.lineTo(
                x,
                y +
                tile / 2
            )

            ctx.closePath()

            ctx.stroke()
        }
    }

    ctx.restore()
}


/* ============================================================
   BRAND BAR
   ============================================================ */

function drawBrandBar(
    ctx
) {
    const {
        centerY,
        summitLogo,
        partners,
    } =
        L.brandBar

    const logo =
        artSize(
            'summitLogo',
            {
                width:
                    summitLogo.width,
            }
        )

    placeArt(
        ctx,
        'summitLogo',

        summitLogo.x,

        centerY -
        logo.height /
        2,

        logo
    )

    const lockup =
        artSize(
            'partners',
            {
                width:
                    partners.width,
            }
        )

    placeArt(
        ctx,
        'partners',

        DESIGN_W -
        partners.right -
        lockup.width,

        centerY -
        lockup.height /
        2,

        lockup
    )
}


/* ============================================================
   KICKER
   ============================================================ */

function drawKicker(
    ctx
) {
    const {
        top,
        size,
        padX,
        height,
        radius,
        tracking,
    } =
        L.kicker

    setFont(
        ctx,
        `700 ${size}px ${FONT.ui}`,
        tracking
    )

    const boxWidth =
        inkWidth(
            ctx,
            CONTENT.kicker
        ) +
        padX *
        2

    const x =
        (
            DESIGN_W -
            boxWidth
        ) /
        2

    shadowed(
        ctx,
        14,
        5,
        () => {
            ctx.fillStyle =
                COLOR.ink

            roundRect(
                ctx,
                x,
                top,
                boxWidth,
                height,
                radius
            )

            ctx.fill()
        }
    )

    ctx.fillStyle =
        COLOR.cream

    write(
        ctx,
        CONTENT.kicker,

        x +
        padX,

        top +
        height /
        2 +
        size *
        0.36
    )
}


/* ============================================================
   HERO
   ============================================================ */

function drawHero(
    ctx
) {
    const {
        top,
        height,
        headlineX,
        themeX,
        themeWidth,
    } =
        L.hero


    /* --------------------------------------------------------
       LEFT — FFS headline
       -------------------------------------------------------- */

    const headline =
        placeArt(
            ctx,
            'headline',

            headlineX,
            top,

            {
                height,
            }
        )


    /* --------------------------------------------------------
       RIGHT — Beyond Self / 4.svg

       IMPORTANT:
       Render by WIDTH, exactly like the working renderer.
       Natural image ratio determines the height.
       -------------------------------------------------------- */

    const themeSize =
        artSize(
            'theme',
            {
                width:
                    themeWidth,
            }
        )


    /*
     * Vertically centre 4.svg in the hero area.
     */
    const themeY =
        top +
        (
            height -
            themeSize.height
        ) /
        2


    const theme =
        placeArt(
            ctx,
            'theme',

            themeX,
            themeY,

            {
                width:
                    themeWidth,
            }
        )


    return (
        top +
        Math.max(
            headline.height,
            theme.height
        )
    )
}


/* ============================================================
   RULE GAP
   ============================================================ */

function ruleGap(
    afterHero
) {
    return (
        afterHero +
        L.rule.gap
    )
}


/* ============================================================
   PHOTO
   ============================================================ */

function drawPhoto(
    ctx,
    x,
    y,
    box,
    image,
    adjustments
) {
    ctx.save()

    roundRect(
        ctx,
        x,
        y,
        box,
        box,
        L.identity.radius
    )

    ctx.clip()

    ctx.fillStyle =
        COLOR.well

    ctx.fillRect(
        x,
        y,
        box,
        box
    )

    if (
        image &&
        image.naturalWidth
    ) {
        const {
            zoom = 1,
            horizontal = 50,
            vertical = 50,
        } =
            adjustments ||
            {}

        const cover =
            Math.max(
                box /
                image.naturalWidth,

                box /
                image.naturalHeight
            )

        const w =
            image.naturalWidth *
            cover

        const h =
            image.naturalHeight *
            cover

        ctx.translate(
            x +
            box /
            2,

            y +
            box /
            2
        )

        ctx.scale(
            zoom,
            zoom
        )

        ctx.translate(
            (
                (
                    horizontal -
                    50
                ) /
                100
            ) *
            box,

            (
                (
                    vertical -
                    50
                ) /
                100
            ) *
            box
        )

        ctx.drawImage(
            image,
            -w /
            2,
            -h /
            2,
            w,
            h
        )
    } else {
        setFont(
            ctx,
            `700 11px ${FONT.ui}`,
            1.6
        )

        ctx.fillStyle =
            COLOR.creamFaint

        const label =
            CONTENT.placeholder

        write(
            ctx,
            label,

            x +
            box /
            2 -
            measure(
                ctx,
                label
            ) /
            2,

            y +
            box /
            2 +
            4
        )
    }

    ctx.restore()

    ctx.save()

    ctx.strokeStyle =
        brandGradient(
            ctx,
            x,
            box
        )

    ctx.lineWidth =
        2

    roundRect(
        ctx,
        x +
        1,

        y +
        1,

        box -
        2,

        box -
        2,

        L.identity.radius -
        1
    )

    ctx.stroke()

    ctx.restore()
}


/* ============================================================
   IDENTITY
   ============================================================ */

function drawIdentity(
    ctx,
    afterRule,
    details,
    image,
    adjustments
) {
    const box =
        L.identity.photo

    const top =
        afterRule +
        L.identity.gap

    drawPhoto(
        ctx,
        L.padX,
        top,
        box,
        image,
        adjustments
    )

    const copyX =
        L.padX +
        box +
        L.identity.columnGap

    const copyWidth =
        DESIGN_W -
        L.padX -
        copyX

    const nameLine =
        L.name.size

    const roleLine =
        L.role.size *
        1.35

    const blockHeight =
        nameLine +
        L.role.gap +
        roleLine +
        L.role.gap *
        0.75 +
        roleLine

    let baseline =
        top +
        (
            box -
            blockHeight
        ) /
        2 +
        nameLine *
        0.8


    /* NAME */

    setFont(
        ctx,
        `900 ${L.name.size}px ${FONT.display}`,
        L.name.tracking
    )

    ctx.fillStyle =
        COLOR.cream

    write(
        ctx,

        clamp(
            ctx,

            (
                details.name ||
                'Your name'
            ).toUpperCase(),

            copyWidth
        ),

        copyX,
        baseline
    )


    /* TITLE */

    baseline +=
        L.role.gap +
        roleLine

    setFont(
        ctx,
        `600 ${L.role.size}px ${FONT.ui}`,
        L.role.tracking
    )

    ctx.fillStyle =
        COLOR.creamSoft

    write(
        ctx,

        clamp(
            ctx,

            (
                details.title ||
                'Your designation'
            ).toUpperCase(),

            copyWidth
        ),

        copyX,
        baseline
    )


    /* COMPANY */

    baseline +=
        L.role.gap *
        0.75 +
        roleLine

    ctx.fillStyle =
        COLOR.mint

    write(
        ctx,

        clamp(
            ctx,

            (
                details.company ||
                'Your organisation'
            ).toUpperCase(),

            copyWidth
        ),

        copyX,
        baseline
    )
}


/* ============================================================
   FOOTER BAND
   ============================================================ */

function drawBand(
    ctx
) {
    ctx.fillStyle =
        COLOR.ink

    ctx.fillRect(
        0,

        DESIGN_H -
        L.band.height,

        DESIGN_W,
        L.band.height
    )
}


/* ============================================================
   META BAR
   ============================================================ */

function drawMeta(
    ctx
) {
    const {
        height,
        bottom,
        radius,
        padX,
        cellPadX,
        columns,
        labelSize,
        labelTracking,
        valueSize,
    } =
        L.meta

    const top =
        DESIGN_H -
        bottom -
        height

    const width =
        DESIGN_W -
        L.padX *
        2

    shadowed(
        ctx,
        20,
        9,
        () => {
            ctx.fillStyle =
                COLOR.cream

            roundRect(
                ctx,
                L.padX,
                top,
                width,
                height,
                radius
            )

            ctx.fill()
        }
    )

    const inner =
        width -
        padX *
        2

    const total =
        columns.reduce(
            (
                a,
                b
            ) =>
                a +
                b,
            0
        )

    const cellWidths =
        columns.map(
            (
                c
            ) =>
                (
                    c /
                    total
                ) *
                inner
        )

    setFont(
        ctx,
        `800 ${valueSize}px ${FONT.display}`,
        -0.4
    )

    let valueScale =
        1

    CONTENT.meta.forEach(
        (
            cell,
            index
        ) => {
            const room =
                cellWidths[
                    index
                ] -
                cellPadX *
                1.6

            cell.value.forEach(
                (
                    line
                ) => {
                    const w =
                        measure(
                            ctx,
                            line
                        )

                    if (
                        w >
                        room
                    ) {
                        valueScale =
                            Math.min(
                                valueScale,

                                room /
                                w
                            )
                    }
                }
            )
        }
    )

    const fittedValue =
        valueSize *
        valueScale

    const labelLine =
        labelSize *
        1.15

    const valueLine =
        fittedValue *
        0.98

    const maxLines =
        Math.max(
            ...CONTENT.meta.map(
                (
                    cell
                ) =>
                    cell.value.length
            )
        )

    const blockHeight =
        labelLine +
        6 +
        maxLines *
        valueLine

    const labelBaseline =
        top +
        (
            height -
            blockHeight
        ) /
        2 +
        labelSize *
        0.85

    const firstValueBaseline =
        labelBaseline +
        6 +
        fittedValue *
        0.78

    let x =
        L.padX +
        padX

    CONTENT.meta.forEach(
        (
            cell,
            index
        ) => {
            const cellWidth =
                cellWidths[
                    index
                ]

            const textX =
                x +
                cellPadX


            /* LABEL */

            setFont(
                ctx,
                `700 ${labelSize}px ${FONT.ui}`,
                labelTracking
            )

            ctx.fillStyle =
                COLOR.metaLabel

            write(
                ctx,
                cell.label,
                textX,
                labelBaseline
            )


            /* VALUE */

            setFont(
                ctx,
                `800 ${fittedValue}px ${FONT.display}`,
                -0.4
            )

            ctx.fillStyle =
                COLOR.deepTeal

            cell.value.forEach(
                (
                    line,
                    i
                ) => {
                    write(
                        ctx,
                        line,
                        textX,

                        firstValueBaseline +
                        i *
                        valueLine
                    )
                }
            )


            /* DIVIDER */

            if (
                index <
                CONTENT.meta.length -
                1
            ) {
                ctx.fillStyle =
                    COLOR.metaRule

                ctx.fillRect(
                    x +
                    cellWidth -
                    0.8,

                    top +
                    12,

                    1.6,

                    height -
                    24
                )
            }

            x +=
                cellWidth
        }
    )
}


/* ============================================================
   FOOTER
   ============================================================ */

function drawFooter(
    ctx
) {
    const {
        size,
        smallSize,
        bottom,
        tracking,
    } =
        L.footer

    const baseline =
        DESIGN_H -
        bottom

    setFont(
        ctx,
        `800 ${size}px ${FONT.display}`,
        tracking
    )

    const mainWidth =
        measure(
            ctx,
            CONTENT.footer
        )

    setFont(
        ctx,
        `700 ${smallSize}px ${FONT.ui}`,
        2
    )

    const smallWidth =
        measure(
            ctx,
            CONTENT.footerSmall
        )

    let x =
        (
            DESIGN_W -
            (
                mainWidth +
                smallWidth
            )
        ) /
        2


    /* MAIN FOOTER */

    setFont(
        ctx,
        `800 ${size}px ${FONT.display}`,
        tracking
    )

    ctx.fillStyle =
        COLOR.cream

    write(
        ctx,
        CONTENT.footer,
        x,
        baseline
    )

    x +=
        mainWidth


    /* SMALL FOOTER */

    setFont(
        ctx,
        `700 ${smallSize}px ${FONT.ui}`,
        2
    )

    ctx.fillStyle =
        COLOR.mint

    write(
        ctx,
        CONTENT.footerSmall,
        x,

        baseline -
        size *
        0.06
    )
}


/* ============================================================
   MAIN POSTER RENDERER
   ============================================================ */

export function drawPoster(
    canvas,
    {
        details = {},
        image = null,
        adjustments,
    } = {}
) {
    if (
        !canvas
    ) {
        return
    }

    const ctx =
        canvas.getContext(
            '2d'
        )

    if (
        !ctx
    ) {
        return
    }


    /* --------------------------------------------------------
       Start all artwork immediately
       -------------------------------------------------------- */

    const artworkLoading =
        loadArtwork()


    /* --------------------------------------------------------
       Check all FOUR assets
       -------------------------------------------------------- */

    const artworkReady = (
        art.summitLogo &&
        art.summitLogo.img &&
        art.summitLogo.img.naturalWidth &&

        art.partners &&
        art.partners.img &&
        art.partners.img.naturalWidth &&

        art.headline &&
        art.headline.img &&
        art.headline.img.naturalWidth &&

        art.theme &&
        art.theme.img &&
        art.theme.img.naturalWidth
    )


    /* --------------------------------------------------------
       Redraw after assets load
       -------------------------------------------------------- */

    if (
        !artworkReady
    ) {
        artworkRedrawCallbacks.add(
            () => {
                drawPoster(
                    canvas,
                    {
                        details,
                        image,
                        adjustments,
                    }
                )
            }
        )
    }


    /* --------------------------------------------------------
       Canvas
       -------------------------------------------------------- */

    canvas.width =
        CANVAS_W

    canvas.height =
        CANVAS_H


    ctx.setTransform(
        SCALE,
        0,
        0,
        SCALE,
        0,
        0
    )


    ctx.textBaseline =
        'alphabetic'

    ctx.textAlign =
        'left'

    ctx.imageSmoothingEnabled =
        true

    ctx.imageSmoothingQuality =
        'high'


    /* ========================================================
       DRAW POSTER
       ======================================================== */

    drawBackground(
        ctx
    )

    drawLattice(
        ctx
    )

    drawBand(
        ctx
    )

    drawBrandBar(
        ctx
    )

    drawKicker(
        ctx
    )


    const afterHero =
        drawHero(
            ctx
        )


    const afterRule =
        ruleGap(
            afterHero
        )


    drawIdentity(
        ctx,
        afterRule,
        details,
        image,
        adjustments
    )


    drawMeta(
        ctx
    )


    drawFooter(
        ctx
    )


    artworkLoading.catch(
        (
            error
        ) => {
            console.error(
                'Poster artwork loading error:',
                error
            )
        }
    )
}


/* ============================================================
   PRELOAD FONTS + ARTWORK
   ============================================================ */

export function loadPosterFonts() {
    const artwork =
        loadArtwork()

    if (
        !document.fonts
    ) {
        return artwork
    }

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

        ...faces.map(
            (
                face
            ) =>
                document.fonts
                    .load(
                        face
                    )
                    .catch(
                        () =>
                            null
                    )
        ),
    ])
        .then(
            () =>
                document.fonts.ready
        )
}


/* ============================================================
   OPTIONAL ARTWORK PRELOAD
   ============================================================ */

export function preloadPosterArtwork() {
    return loadArtwork()
}
