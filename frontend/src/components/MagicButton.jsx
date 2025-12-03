import { Sparkles, ArrowRight } from 'lucide-react'

export default function MagicButton({
    onClick,
    children,
    icon: Icon = Sparkles,
    disabled = false,
    type = 'button',
    showArrow = false,
    className = ''
}) {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-300 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-voyanero-500/50 rounded-2xl backdrop-blur-sm shadow-xl hover:shadow-voyanero-500/20 overflow-hidden hover:scale-105 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:translate-y-0 ${className}`}
        >
            {/* Gradient Sweep Effect */}
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-voyanero-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            {/* Button Content */}
            <span className="relative flex items-center gap-2">
                {Icon && <Icon className="w-5 h-5 text-yellow-400" />}
                {children}
                {showArrow && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
            </span>
        </button>
    )
}
