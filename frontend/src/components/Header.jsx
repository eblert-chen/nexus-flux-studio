import { Zap } from 'lucide-react'

export default function Header({ statusMsg }) {
  return (
    <header className="glass flex items-center justify-between px-6 py-3 border-b border-indigo-500/10">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-lg font-bold tracking-tight">
          <span className="text-white">Nexus</span>
          <span className="text-indigo-400"> Flux</span>
          <span className="text-slate-500 font-normal ml-1">Studio</span>
        </h1>
      </div>
      <div className="flex items-center gap-3">
        {statusMsg && (
          <span className="text-xs text-slate-400 bg-slate-900/60 px-3 py-1 rounded-full border border-slate-800">
            {statusMsg}
          </span>
        )}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          RTX 5090 · BF16
        </div>
      </div>
    </header>
  )
}
