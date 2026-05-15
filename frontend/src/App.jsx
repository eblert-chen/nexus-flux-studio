import { useState, useEffect, useRef, useCallback } from 'react'
import Sidebar from './components/Sidebar'
import Canvas from './components/Canvas'
import Gallery from './components/Gallery'
import Header from './components/Header'

const API = '/api'

export default function App() {
  const [models, setModels] = useState({})
  const [currentModel, setCurrentModel] = useState('')
  const [mode, setMode] = useState('txt2img')
  const [params, setParams] = useState({
    prompt: '',
    negativePrompt: '',
    seed: 42,
    steps: 28,
    guidance: 3.5,
    width: 1024,
    height: 1024,
    strength: 0.8,
  })
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(null)
  const [generatedImage, setGeneratedImage] = useState(null)
  const [referenceImage, setReferenceImage] = useState(null)
  const [history, setHistory] = useState([])
  const [statusMsg, setStatusMsg] = useState('')

  const wsRef = useRef(null)

  useEffect(() => {
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${location.host}/ws/progress`
    wsRef.current = new WebSocket(wsUrl)
    wsRef.current.onmessage = (e) => {
      const data = JSON.parse(e.data)
      if (data.type === 'progress') {
        setProgress(data)
      }
    }
    return () => wsRef.current?.close()
  }, [])

  useEffect(() => {
    fetchModels()
    fetchHistory()
  }, [])

  const fetchModels = async () => {
    try {
      const res = await fetch(`${API}/models`)
      const data = await res.json()
      setModels(data.models || {})
      const valid = Object.entries(data.models || {}).find(([, v]) => v.valid)
      if (valid && !currentModel) setCurrentModel(valid[0])
    } catch (e) {
      setStatusMsg('无法连接后端服务')
    }
  }

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API}/history?limit=50`)
      const data = await res.json()
      setHistory(data.history || [])
    } catch (e) { /* ignore */ }
  }

  const loadModel = useCallback(async (name) => {
    setStatusMsg(`正在加载 ${name}...`)
    const form = new FormData()
    form.append('model_name', name)
    form.append('pipe_type', mode)
    try {
      const res = await fetch(`${API}/load-model`, { method: 'POST', body: form })
      const data = await res.json()
      setStatusMsg(data.message || '就绪')
      setCurrentModel(name)
    } catch (e) {
      setStatusMsg(`加载失败: ${name}`)
    }
  }, [mode])

  const handleGenerate = async () => {
    if (!params.prompt.trim()) return
    setGenerating(true)
    setProgress(null)
    setGeneratedImage(null)

    const form = new FormData()
    form.append('prompt', params.prompt)
    form.append('negative_prompt', params.negativePrompt)
    form.append('seed', params.seed)
    form.append('steps', params.steps)
    form.append('guidance', params.guidance)
    form.append('width', params.width)
    form.append('height', params.height)
    form.append('mode', mode)
    form.append('strength', params.strength)
    if (referenceImage) {
      form.append('reference_image', referenceImage)
    }

    try {
      const res = await fetch(`${API}/generate`, { method: 'POST', body: form })
      const data = await res.json()
      if (data.status === 'ok') {
        setGeneratedImage(data.image_url)
        setParams(p => ({ ...p, seed: data.seed }))
      } else {
        setStatusMsg(data.message || '生成失败')
      }
      fetchHistory()
    } catch (e) {
      setStatusMsg('生成请求失败')
    } finally {
      setGenerating(false)
    }
  }

  const handleDrop = (file) => {
    setReferenceImage(file)
    setMode('img2img')
  }

  const handleHistoryClick = (item) => {
    setParams(p => ({
      ...p,
      prompt: item.prompt,
      negativePrompt: item.negative_prompt || '',
      seed: item.seed,
      steps: item.steps,
      guidance: item.guidance,
      width: item.width,
      height: item.height,
    }))
    setMode(item.mode || 'txt2img')
    setGeneratedImage(item.image_path ? `/outputs/${item.image_path}` : null)
  }

  return (
    <div className="flex flex-col h-screen bg-slate-950">
      <Header statusMsg={statusMsg} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          models={models}
          currentModel={currentModel}
          mode={mode}
          params={params}
          onModelChange={loadModel}
          onModeChange={setMode}
          onParamsChange={setParams}
          onGenerate={handleGenerate}
          generating={generating}
          onImageUpload={setReferenceImage}
          referenceImage={referenceImage}
        />
        <Canvas
          mode={mode}
          progress={progress}
          generating={generating}
          generatedImage={generatedImage}
          onDrop={handleDrop}
          referenceImage={referenceImage}
          onClearRef={() => setReferenceImage(null)}
        />
        <Gallery history={history} onItemClick={handleHistoryClick} onRefresh={fetchHistory} />
      </div>
    </div>
  )
}
