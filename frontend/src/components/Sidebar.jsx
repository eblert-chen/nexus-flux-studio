import { useRef } from 'react'
import { Sliders, Cpu, Sparkles, Shuffle, Image, Type, MessageSquare, Ban, Upload } from 'lucide-react'

const SIZES = [
  { label: '正方形 1K', w: 1024, h: 1024 },
  { label: '竖屏 9:16', w: 576, h: 1024 },
  { label: '横屏 16:9', w: 1024, h: 576 },
  { label: '竖屏 3:4', w: 768, h: 1024 },
  { label: '横屏 4:3', w: 1024, h: 768 },
]

export default function Sidebar({
  models, currentModel, mode, params, onModelChange,
  onModeChange, onParamsChange, onGenerate, generating,
  onImageUpload, referenceImage,
}) {
  const fileRef = useRef(null)
  const validModels = Object.entries(models).filter(([, v]) => v.valid)
  const invalidModels = Object.entries(models).filter(([, v]) => !v.valid)

  const update = (k, v) => onParamsChange(p => ({ ...p, [k]: v }))

  return (
    <aside className="w-80 glass border-r border-indigo-500/10 flex flex-col overflow-y-auto shrink-0">
      {/* 模型选择 */}
      <div className="p-5 border-b border-slate-800/50">
        <div className="flex items-center gap-2 text-sm font-semibold text-indigo-300 mb-1">
          <Cpu className="w-4 h-4" /> 模型
        </div>
        <select
          value={currentModel}
          onChange={e => onModelChange(e.target.value)}
          className="w-full mt-2 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all"
        >
          {validModels.length === 0 && <option value="">暂无可用模型</option>}
          {validModels.map(([name]) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>

        {invalidModels.length > 0 && (
          <div className="mt-3 space-y-1">
            {invalidModels.map(([name, info]) => (
              <div key={name} className="text-xs text-amber-500/80 bg-amber-500/5 border border-amber-500/20 rounded-md px-3 py-2">
                <span className="font-medium">{name}</span> — 缺失: {info.missing.join(', ')}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 模式切换 */}
      <div className="p-5 border-b border-slate-800/50">
        <div className="flex items-center gap-2 text-sm font-semibold text-indigo-300 mb-3">
          <Sparkles className="w-4 h-4" /> 模式
        </div>
        <div className="flex gap-1 bg-slate-900 rounded-lg p-1">
          <button
            onClick={() => onModeChange('txt2img')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-medium transition-all ${
              mode === 'txt2img'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Type className="w-3.5 h-3.5" /> 文生图
          </button>
          <button
            onClick={() => onModeChange('img2img')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-medium transition-all ${
              mode === 'img2img'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Image className="w-3.5 h-3.5" /> 图生图
          </button>
        </div>

        {mode === 'img2img' && (
          <div className="mt-3">
            <input
              ref={fileRef}
              type="file" accept="image/*"
              className="hidden"
              onChange={e => { if (e.target.files?.[0]) onImageUpload(e.target.files[0]) }}
            />
            {referenceImage ? (
              <div className="flex items-center gap-3 bg-slate-900 rounded-lg p-2 border border-indigo-500/30">
                <img src={URL.createObjectURL(referenceImage)} alt="参考图" className="w-10 h-10 rounded object-cover" />
                <span className="text-xs text-slate-400 truncate flex-1">{referenceImage.name}</span>
                <button
                  onClick={() => { onImageUpload(null); if (fileRef.current) fileRef.current.value = '' }}
                  className="text-slate-500 hover:text-red-400 text-xs"
                >清除</button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-dashed border-slate-700 text-xs text-slate-500 hover:border-indigo-500/50 hover:text-indigo-400 transition-all"
              >
                <Upload className="w-3.5 h-3.5" /> 上传参考图片
              </button>
            )}
          </div>
        )}
      </div>

      {/* 提示词 */}
      <div className="p-5 border-b border-slate-800/50 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-indigo-300">
          <MessageSquare className="w-4 h-4" /> 提示词
        </div>
        <textarea
          value={params.prompt}
          onChange={e => update('prompt', e.target.value)}
          placeholder="描述你想要生成的图像..."
          rows={3}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all resize-none"
        />
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Ban className="w-3 h-3" /> 负面提示词
        </div>
        <textarea
          value={params.negativePrompt}
          onChange={e => update('negativePrompt', e.target.value)}
          placeholder="不想出现在画面中的内容..."
          rows={2}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-red-500/50 focus:outline-none focus:ring-1 focus:ring-red-500/30 transition-all resize-none"
        />
      </div>

      {/* 参数 */}
      <div className="p-5 border-b border-slate-800/50 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-indigo-300">
          <Sliders className="w-4 h-4" /> 参数
        </div>

        <ParamSlider label="步数" value={params.steps} min={1} max={50} step={1}
          onChange={v => update('steps', v)} />
        <ParamSlider label="引导强度" value={params.guidance} min={1} max={10} step={0.1}
          onChange={v => update('guidance', Number(v.toFixed(1)))} />
        <ParamSlider label="种子" value={params.seed} min={0} max={999999} step={1}
          onChange={v => update('seed', v)}
          extra={
            <button
              onClick={() => update('seed', Math.floor(Math.random() * 999999))}
              className="ml-2 p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-indigo-400 transition-colors"
              title="随机种子"
            >
              <Shuffle className="w-3.5 h-3.5" />
            </button>
          }
        />

        {mode === 'img2img' && (
          <ParamSlider label="重绘强度" value={params.strength} min={0.05} max={1} step={0.05}
            onChange={v => update('strength', Number(v.toFixed(2)))} />
        )}
      </div>

      {/* 尺寸预设 */}
      <div className="p-5 border-b border-slate-800/50">
        <div className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">尺寸</div>
        <div className="grid grid-cols-2 gap-1.5">
          {SIZES.map(s => (
            <button
              key={s.label}
              onClick={() => { update('width', s.w); update('height', s.h) }}
              className={`text-xs py-2 rounded-md border transition-all ${
                params.width === s.w && params.height === s.h
                  ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                  : 'border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* 生成按钮 */}
      <div className="p-5 mt-auto">
        <button
          onClick={onGenerate}
          disabled={generating || !currentModel}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-sm
            hover:from-indigo-500 hover:to-violet-500 disabled:opacity-40 disabled:cursor-not-allowed
            transition-all shadow-lg shadow-indigo-600/25 hover:shadow-indigo-500/40
            active:scale-[0.98] flex items-center justify-center gap-2"
        >
          {generating ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              生成中...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" /> 开始生成
            </>
          )}
        </button>
      </div>
    </aside>
  )
}

function ParamSlider({ label, value, min, max, step, onChange, extra }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs text-slate-400">{label}</label>
        <span className="text-xs font-mono text-slate-300 tabular-nums">{value}</span>
      </div>
      <div className="flex items-center gap-1">
        <input
          type="range" min={min} max={max} step={step}
          value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
          className="flex-1 h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer
            accent-indigo-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5
            [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:bg-indigo-500
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg"
        />
        {extra}
      </div>
    </div>
  )
}
