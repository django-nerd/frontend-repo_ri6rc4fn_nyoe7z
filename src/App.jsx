import { useEffect, useRef, useState } from 'react'

function App() {
  const [imageFile, setImageFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])
  const inputRef = useRef(null)

  const backend = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${backend}/api/analyses`)
      const data = await res.json()
      setHistory(data.items || [])
    } catch (e) {
      setHistory([])
    }
  }

  const onSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setResult(null)
    const url = URL.createObjectURL(file)
    setPreview(url)
  }

  const analyze = async () => {
    if (!imageFile) return
    setLoading(true)
    setResult(null)
    try {
      const form = new FormData()
      form.append('file', imageFile)
      const res = await fetch(`${backend}/api/analyze`, {
        method: 'POST',
        body: form,
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text)
      }
      const data = await res.json()
      setResult(data)
      fetchHistory()
    } catch (err) {
      setResult({
        category: 'error',
        confidence: 0,
        instructions: [
          'Could not reach AI service. Please check your API key or try again.',
        ],
        notes: String(err?.message || err),
      })
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setImageFile(null)
    setPreview(null)
    setResult(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-sky-50 to-indigo-50">
      <header className="max-w-5xl mx-auto px-6 py-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-600 text-white font-bold grid place-items-center">EW</div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">EcoWaste</h1>
            <p className="text-xs text-gray-500">AI-powered waste guidance</p>
          </div>
        </div>
        <a href="/test" className="text-sm text-gray-600 hover:text-gray-900">System test</a>
      </header>

      <main className="max-w-5xl mx-auto px-6 pb-16">
        <section className="bg-white/80 backdrop-blur rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
          <div className="md:flex items-start gap-8">
            <div className="md:w-1/2 w-full">
              <h2 className="text-2xl font-semibold text-gray-900">Identify your waste</h2>
              <p className="text-gray-600 mt-2">Snap or upload a photo. We’ll classify it and suggest eco-friendly dismantling steps.</p>

              <div className="mt-6 grid gap-3">
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={onSelect}
                  className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                />
                <div className="flex gap-3">
                  <button
                    onClick={analyze}
                    disabled={!imageFile || loading}
                    className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-emerald-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-700 transition-colors"
                  >
                    {loading ? 'Analyzing…' : 'Analyze'}
                  </button>
                  <button
                    onClick={reset}
                    className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
                  >
                    Reset
                  </button>
                </div>
                <p className="text-xs text-gray-500">Backend: {backend}</p>
              </div>

              {result && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-900">Result</h3>
                  <div className="mt-3 p-4 rounded-lg border border-gray-200 bg-white">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600">Category</p>
                      <p className="text-sm font-medium text-gray-900">{result.category}</p>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-sm text-gray-600">Confidence</p>
                      <p className="text-sm font-medium text-gray-900">{Math.round((result.confidence || 0) * 100)}%</p>
                    </div>
                    {result.notes && (
                      <p className="mt-3 text-sm text-amber-700 bg-amber-50 p-2 rounded">{result.notes}</p>
                    )}
                    <div className="mt-4">
                      <p className="text-sm font-semibold text-gray-900">Eco-friendly steps</p>
                      <ul className="mt-2 space-y-2 list-disc pl-5">
                        {(result.instructions || []).map((s, i) => (
                          <li key={i} className="text-sm text-gray-700">{s}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="md:w-1/2 w-full mt-6 md:mt-0">
              <div className="aspect-video w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-50 grid place-items-center">
                {preview ? (
                  <img src={preview} alt="preview" className="h-full w-full object-contain" />
                ) : (
                  <div className="text-center p-6 text-gray-500">
                    <p className="font-medium">No image selected</p>
                    <p className="text-sm">Use your camera or upload a file</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Recent analyses</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {history.length === 0 && (
              <div className="col-span-full text-sm text-gray-500">No history yet.</div>
            )}
            {history.map((h, i) => (
              <div key={i} className="p-4 rounded-xl border border-gray-200 bg-white">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">{h.category || 'unknown'}</p>
                  <span className="text-xs text-gray-500">{Math.round((h.confidence || 0) * 100)}%</span>
                </div>
                <ul className="mt-2 space-y-1 list-disc pl-4">
                  {(h.instructions || []).slice(0,3).map((s, j) => (
                    <li key={j} className="text-xs text-gray-600">{s}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="max-w-5xl mx-auto px-6 py-10 text-center text-xs text-gray-500">
        Built for simple, eco-friendly waste management.
      </footer>
    </div>
  )
}

export default App
