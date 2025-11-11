import { ReactNode } from "react"

interface AuthLayoutProps {
  children: ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen relative bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-stone-900 dark:via-slate-900 dark:to-zinc-900">
      {/* Warm ambient background overlay with dark accents */}
      <div className="absolute inset-0 bg-gradient-to-tr from-amber-100/30 via-transparent to-orange-100/30 dark:from-stone-800/20 dark:via-transparent dark:to-slate-800/20" />

      {/* Dark accent shadows mimicking the laptop and phone */}
      <div className="absolute top-20 right-8 w-32 h-20 bg-gradient-to-br from-gray-800/10 to-slate-900/20 rounded-lg blur-2xl dark:from-gray-900/30 dark:to-black/40" />
      <div className="absolute bottom-32 left-12 w-24 h-16 bg-gradient-to-tr from-stone-700/15 to-gray-800/25 rounded-xl blur-xl dark:from-stone-900/40 dark:to-black/50" />

      {/* Headline Banner with warm wood-inspired styling and dark accents */}
      <div className="relative w-full h-[350px] bg-gradient-to-r from-amber-200/60 via-orange-100/60 to-yellow-200/60 dark:from-stone-800/60 dark:via-slate-800/60 dark:to-zinc-800/60 backdrop-blur-sm border-b border-amber-200/50 dark:border-stone-700/60" style={{backgroundImage: 'url(/remy_loz-3S0INpfREQc-unsplash.jpg)', backgroundSize: 'cover', backgroundPosition: 'center'}}>
        {/* Dark accent stripe mimicking laptop edge */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-gray-700 via-slate-800 to-stone-700 dark:from-gray-900 dark:via-black dark:to-stone-900" />
        {/* Subtle wood grain highlight with dark undertones */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-300/10 to-transparent dark:via-stone-600/10" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-center">
          <div className="text-center">
        {/* Logo with warm accent and dark shadow */}
        <div className="flex items-center justify-center align-middle space-x-3 mb-3">
          <div className="relative">
            <div className="relative w-10 h-10 bg-black rounded-xl shadow-lg flex items-center justify-center transform rotate-3 ring-2 ring-stone-700/20 dark:ring-stone-300/20">
          <span className="text-white font-bold text-lg drop-shadow-md">T</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white bg-clip-text text-transparent drop-shadow-sm">
            TaskiSpace
          </h1>
        </div>
        <p className="text-white text-lg font-medium">
          Organize your tasks, manage your workspaces
        </p>
          </div>
        </div>
      </div>


      {/* Main Content Area with warm lighting effect and dark accents */}
      <div className="relative flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16">
        {/* Ambient light glow effect with dark undertones */}
        <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-radial from-amber-300/20 via-orange-200/10 to-transparent rounded-full blur-3xl" />
        
        {/* Dark accent shadow mimicking laptop shadow */}
        <div className="absolute top-1/3 right-1/4 w-48 h-32 bg-gradient-to-bl from-gray-800/5 via-slate-900/10 to-stone-800/15 rounded-2xl blur-2xl dark:from-gray-900/20 dark:via-black/30 dark:to-stone-900/25" />
        
        {/* Content container with wood-inspired styling and dark shadows */}
        <div className="relative w-full max-w-md">
          {/* Enhanced card shadow with dark accents */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-600/10 via-orange-600/5 to-yellow-600/10 rounded-2xl blur-xl transform translate-y-2" />
          <div className="absolute inset-0 bg-gradient-to-tl from-stone-700/8 via-transparent to-gray-800/6 rounded-2xl blur-lg transform translate-y-1 translate-x-1 dark:from-stone-900/15 dark:to-black/10" />
          
          {/* Main content wrapper */}
          <div className="relative">
            {children}
          </div>
        </div>

        {/* Decorative elements inspired by the workspace with dark accents */}
        <div className="absolute bottom-8 left-8 w-3 h-3 bg-amber-400/60 rounded-full animate-pulse ring-2 ring-stone-600/20 dark:ring-stone-400/30" />
        <div className="absolute top-1/3 right-12 w-2 h-2 bg-orange-400/60 rounded-full animate-pulse delay-300 ring-1 ring-gray-700/25 dark:ring-gray-300/30" />
        <div className="absolute bottom-1/3 right-8 w-4 h-4 bg-yellow-400/40 rounded-full animate-pulse delay-500 ring-2 ring-slate-700/20 dark:ring-slate-300/25" />
        
        {/* Additional dark accent elements mimicking device outlines */}
        <div className="absolute top-16 left-16 w-1 h-8 bg-gradient-to-b from-gray-700/30 to-stone-800/40 rounded-full dark:from-gray-900/50 dark:to-black/60" />
        <div className="absolute bottom-24 right-24 w-6 h-1 bg-gradient-to-r from-slate-700/25 to-gray-800/35 rounded-full dark:from-slate-900/40 dark:to-black/50" />
      </div>

      {/* Footer with subtle wood texture and dark accent base */}
      <div className="absolute bottom-0 w-full h-24 bg-gradient-to-t from-amber-100/30 via-orange-50/20 to-transparent dark:from-stone-900/40 dark:via-slate-900/20 dark:to-transparent" />
      <div className="absolute bottom-0 w-full h-2 bg-gradient-to-r from-gray-700/20 via-slate-800/30 to-stone-700/20 dark:from-gray-900/60 dark:via-black/70 dark:to-stone-900/60" />
    </div>
  )
}