export default function VoyaneroLogo({ size = 40, animated = true }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 100 70"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-lg"
        >
            <defs>
                <linearGradient id="voyaneroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3B82F6" />
                    <stop offset="100%" stopColor="#7C3AED" />
                </linearGradient>
                <filter id="voyaneroGlow">
                    <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#3B82F6" floodOpacity="0.4" />
                </filter>
            </defs>

            {/* Signal Waves (Animated) */}
            {animated && (
                <g transform="translate(5, 0)">
                    <path
                        className="animate-pulse-flow-3"
                        d="M 45 15 Q 65 35, 45 55"
                        fill="none"
                        stroke="#3B82F6"
                        strokeWidth="4"
                        strokeLinecap="round"
                        opacity="0.3"
                    />
                    <path
                        className="animate-pulse-flow-2"
                        d="M 52 20 Q 68 35, 52 50"
                        fill="none"
                        stroke="#3B82F6"
                        strokeWidth="4"
                        strokeLinecap="round"
                        opacity="0.5"
                    />
                    <path
                        className="animate-pulse-flow-1"
                        d="M 59 25 Q 70 35, 59 45"
                        fill="none"
                        stroke="#60A5FA"
                        strokeWidth="4"
                        strokeLinecap="round"
                        opacity="0.8"
                    />
                </g>
            )}

            {/* The Pilot Arrow */}
            <path
                d="M 10 20 L 40 35 L 10 50 L 20 35 Z"
                fill="url(#voyaneroGrad)"
                filter="url(#voyaneroGlow)"
            />

            {/* The Target Node */}
            <circle cx="75" cy="35" r="6" fill="#7C3AED">
                {animated && (
                    <animate attributeName="r" values="6;7;6" dur="2s" repeatCount="indefinite" />
                )}
            </circle>
        </svg>
    )
}
