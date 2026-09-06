import { useEffect, useRef, useState } from 'react'
import { Info } from 'lucide-react'
import { CANVAS_H, CANVAS_W, drawPoster, loadPosterFonts } from './posterCanvas'

const initialDetails = { name: '', title: '', company: '' }
const initialAdjustments = { zoom: 1, horizontal: 50, vertical: 50 }

function UploadIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="upload-icon"><path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14v4.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V14" /></svg>
}

function DownloadIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="download-icon"><path d="M12 4v11m0 0 4-4m-4 4-4-4M5 17v1.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V17" /></svg>
}

function truncateFileName(name, maxLength = 24) {
  if (name.length <= maxLength) return name
  return `${name.slice(0, maxLength)}…`
}

export default function App() {
  const [details, setDetails] = useState(initialDetails)
  const [photo, setPhoto] = useState(null)
  const [fileName, setFileName] = useState('')
  const [image, setImage] = useState(null)
  const [fileError, setFileError] = useState('')
  const [adjustments, setAdjustments] = useState(initialAdjustments)
  const [fontsReady, setFontsReady] = useState(false)
  const fileInput = useRef(null)
  const canvasRef = useRef(null)

  const updateDetail = (field) => (event) =>
    setDetails((current) => ({ ...current, [field]: event.target.value }))

  const acceptFile = (file) => {
    if (!file) return
    if (!['image/png', 'image/jpeg'].includes(file.type)) return setFileError('That file type won\u2019t work here. Choose a PNG or JPG image.')
    setFileError('')
    setFileName(file.name)

    const reader = new FileReader()
    reader.onload = () => setPhoto(String(reader.result))
    reader.readAsDataURL(file)
  }

  const reset = () => {
    setDetails(initialDetails)
    setPhoto(null)
    setFileName('')
    setImage(null)
    setFileError('')
    setAdjustments(initialAdjustments)
    if (fileInput.current) fileInput.current.value = ''
  }

  useEffect(() => {
    let active = true
    loadPosterFonts().then(() => { if (active) setFontsReady(true) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!photo) return setImage(null)
    const next = new Image()
    next.onload = () => setImage(next)
    next.src = photo
  }, [photo])

  useEffect(() => {
    drawPoster(canvasRef.current, { details, image, adjustments })
  }, [details, image, adjustments, fontsReady])

  const download = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.toBlob((blob) => {
      if (!blob) return
      const slug = (details.name || 'beyond-self').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `${slug}-beyond-self.png`
      link.click()
      URL.revokeObjectURL(link.href)
    }, 'image/png')
  }

  return (
    <main className="summit-page">
      <section className="intro">
        <p className="eyebrow"><span className="dot" /> FAITH &amp; FUTURE SUMMIT · GENERAL SUMMIT 3</p>
        <h1 >Beyond Self <strong >LinkedIn post generator.</strong></h1>
        <p className="intro-copy">Tell the world you&apos;ll be there. Add your details, drop in a photo, and download a<br className="desktop-break" /> ready-to-post image for LinkedIn.</p>
        <div className="intro-rule" />
      </section>

      <section className="workspace">
        <form className="details-card" onSubmit={(event) => event.preventDefault()}>
          <h2>Your details</h2>
          <label>FULL NAME<input value={details.name} onChange={updateDetail('name')} placeholder="e.g. SHAKIR" /></label>
          <label>DESIGNATION / TITLE<input value={details.title} onChange={updateDetail('title')} placeholder="e.g. DESIGNER" /></label>
          <label>ORGANISATION<input value={details.company} onChange={updateDetail('company')} placeholder="e.g. Al-Kawthar University" /></label>

          <label className="photo-label">YOUR PHOTO</label>

          <div
            className={`drop-zone ${photo ? 'uploaded' : ''}`}
            role="button"
            tabIndex={0}
            onClick={() => fileInput.current?.click()}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault()
              acceptFile(event.dataTransfer.files[0])
            }}
            onKeyDown={(event) => {
              if ((event.key === 'Enter' || event.key === ' ') && !event.nativeEvent.isComposing) {
                event.preventDefault()
                fileInput.current?.click()
              }
            }}
          >
            <input
              ref={fileInput}
              className="visually-hidden"
              type="file"
              accept="image/png,image/jpeg"
              onChange={(event) => acceptFile(event.target.files?.[0])}
            />

            <span className="upload-button">
              <UploadIcon />
            </span>

            <b>{photo ? truncateFileName(fileName, 24) : 'DRAG & DROP OR BROWSE'}</b>

            <small className='text-center'>
              {photo
                ? 'PHOTO ADDED — TAP TO CHANGE'
                : 'PNG OR JPG — YOU CAN RESIZE & REPOSITION AFTER'}
            </small>
          </div>

          {fileError && (
            <p className="error-text" role="alert">{fileError}</p>
          )}

          {photo && (
            <section className="adjust-section" aria-label="Adjust photo">
              <div className="adjust-heading">
                <span>ADJUST PHOTO</span>
                <button type="button" onClick={() => setAdjustments(initialAdjustments)}>Recenter</button>
              </div>

              <div className="adjust-scroll">
                {[
                  ['zoom', 'Zoom', 1, 2, 0.01],
                  ['horizontal', 'Horizontal', 0, 100, 1],
                  ['vertical', 'Vertical', 0, 100, 1],
                ].map(([key, label, min, max, step]) => (
                  <label className="range-row" key={key}>
                    <span>{label}</span>
                    <input
                      type="range"
                      min={min}
                      max={max}
                      step={step}
                      value={adjustments[key]}
                      onChange={(event) =>
                        setAdjustments((current) => ({ ...current, [key]: Number(event.target.value) }))
                      }
                    />
                  </label>
                ))}
              </div>
            </section>
          )}
        </form>

        <div className="preview-column">
          <div className="canvas-frame">
            <canvas
              id="card"
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              role="img"
              aria-label="Beyond Self LinkedIn post preview"
            />
          </div>

          <div className="actions">
            <button className="download-button" type="button" onClick={download}>
              <DownloadIcon /> Download image
            </button>
            <button className="reset-button" type="button" onClick={reset}>Reset</button>
          </div>

          <p className="tip">
            <Info size={15} className="tip-icon" />
            <span><b>Framing tip:</b> any photo works — once it&apos;s in, use Zoom and the Horizontal / Vertical sliders to position yourself perfectly inside the frame.</span>
          </p>
        </div>
      </section>
    </main>
  )
}
