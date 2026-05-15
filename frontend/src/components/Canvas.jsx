import { useState, useRef } from 'react'
import { Upload, X, Image, Wand2 } from 'lucide-react'

export default function Canvas({ mode, progress, generating, generatedImage, onDrop, referenceImage, onClearRef }) {
  const [dragOver, setDragOver] = useState(false)
  const dropRef = useRef(null)

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragIn = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(true)
  }

  const handleDragOut = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (dropRef.current && !dropRef.current.contains(e.relatedTarget)) {
      setDragOver(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
    const files = e.dataTransfer?.files
    if (files && files.length > 0) {
      const file = files[0]
      if (file.type.startsWith('image/')) {
        onDrop(file)
      }
    }
  }

  const refUrl = referenceImage ? URL.createObjectURL(referenceImage) : null

  return (
    <main
      ref={dropRef}
      className={`flex-1 flex flex-col items-center justify-center p-6 relative ${
        dragOver ? 'bg-indigo-950/20' : ''
      }`}
      onDragEnter={handleDragIn}
      onDragOver={handleDrag}
      onDragLeave={handleDragOut}
      onDrop={handleDrop}
    >
      {dragOver && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
          <div className="text-center">
            <Upload className="w-16 h-16 text-indigo-400 mx-auto mb-4 animate-bounce" />
            <p className="text-xl font-semibold text-white">拖放图片以启动图生图</p>
            <p className="text-sm text-slate-400 mt-2">图片将作为参考图使用</p>
          </div>
        </div>
      )}

      {referenceImage && (
        <div className="absolute top-4 left-4 z-10 glass rounded-xl p-2 flex items-center gap-3">
          <img src={refUrl} alt="参考图" className="w-12 h-12 rounded-lg object-cover" />
          <div className="flex flex-col">
            <span className="text-xs text-indigo-400 font-medium">参考图片</span>
            <span className="text-xs text-slate-500">{mode === 'img2img' ? '图生图模式已激活' : '请切换到图生图模式'}</span>
          </div>
          <button
            onClick={onClearRef}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-red-400 transition-colors ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {generatedImage && !generating ? (
        <div className="animate-fade-in flex flex-col items-center max-w-full max-h-full">
          <img
            src={generatedImage}
            alt="生成结果"
            className="max-w-full max-h-[70vh] rounded-2xl shadow-2xl shadow-indigo-500/10 border border-slate-800"
          />
        </div>
      ) : generating ? (
        <div className="flex flex-col items-center gap-6 w-full max-w-lg">
          <div className="w-full aspect-square rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center gap-4 overflow-hidden relative">
            <div className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: 'linear-gradient(rgba(99,102,241,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.3) 1px, transparent 1px)',
                backgroundSize: '40px 40px',
              }}
            />
            <Wand2 className="w-12 h-12 text-indigo-500 animate-pulse-glow" />
            <p className="text-slate-500 text-sm font-medium">正在生成图像...</p>
            {progress && (
              <div className="w-3/4 text-center">
                <div className="flex justify-between text-xs text-slate-500 mb-2">
                  <span>步骤 {progress.step} / {progress.total}</span>
                  <span>{Math.round((progress.step / progress.total) * 100)}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${(progress.step / progress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
          <div className="w-full h-0.5 bg-slate-900 rounded-full overflow-hidden relative">
            <div className="flow-bar absolute inset-y-0 animate-flow-bar" />
          </div>
        </div>
      ) : (
        <div className="drop-zone w-full max-w-lg aspect-square rounded-2xl flex flex-col items-center justify-center gap-4 text-slate-600">
          <Image className="w-16 h-16 opacity-40" />
          <div className="text-center">
            <p className="text-lg font-medium text-slate-500">拖拽图片到此处</p>
            <p className="text-sm text-slate-600 mt-1">或使用左侧面板输入提示词</p>
            {mode === 'img2img' && (
              <p className="text-xs text-indigo-500/60 mt-2">图生图模式 — 请拖入图片或上传参考图</p>
            )}
          </div>
        </div>
      )}

      {!generating && !generatedImage && (
        <div className="absolute bottom-6 glass rounded-full px-4 py-1.5 flex items-center gap-2 text-xs text-slate-500">
          <span className={`w-2 h-2 rounded-full ${mode === 'img2img' ? 'bg-violet-500' : 'bg-indigo-500'}`} />
          {mode === 'txt2img' ? '文生图' : '图生图'}
        </div>
      )}
    </main>
  )
}
