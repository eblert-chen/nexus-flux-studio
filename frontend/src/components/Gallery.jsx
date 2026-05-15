import { History, RefreshCw, Image } from 'lucide-react'

export default function Gallery({ history, onItemClick, onRefresh }) {
  return (
    <aside className="w-72 glass border-l border-indigo-500/10 flex flex-col shrink-0">
      <div className="p-4 border-b border-slate-800/50 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-indigo-300">
          <History className="w-4 h-4" /> 历史记录
        </div>
        <button
          onClick={onRefresh}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-indigo-400 transition-colors"
          title="刷新"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-700 gap-2">
            <Image className="w-8 h-8" />
            <p className="text-xs">暂无生成记录</p>
          </div>
        ) : (
          history.map((item) => (
            <button
              key={item.id}
              onClick={() => onItemClick(item)}
              className="w-full glass rounded-xl p-3 text-left hover:border-indigo-500/40 transition-all group animate-fade-in"
            >
              <div className="flex gap-3">
                <div className="w-14 h-14 rounded-lg bg-slate-900 border border-slate-800 overflow-hidden shrink-0">
                  {item.image_path ? (
                    <img
                      src={`/outputs/${item.image_path}`}
                      alt=""
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image className="w-5 h-5 text-slate-700" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-300 truncate group-hover:text-white transition-colors leading-relaxed">
                    {item.prompt}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-600 bg-slate-900 px-1.5 py-0.5 rounded">
                      {item.model_name}
                    </span>
                    <span className="text-[10px] text-slate-600 bg-slate-900 px-1.5 py-0.5 rounded">
                      {item.mode === 'txt2img' ? '文生图' : '图生图'}
                    </span>
                    <span className="text-[10px] text-slate-600">种子:{item.seed}</span>
                  </div>
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      <div className="p-3 border-t border-slate-800/50 text-center text-[10px] text-slate-700">
        点击卡片可回填提示词和参数
      </div>
    </aside>
  )
}
