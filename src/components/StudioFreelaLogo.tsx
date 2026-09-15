import React from 'react'

interface StudioFreelaLogoProps {
  variant?: 'full' | 'mark' | 'horizontal'
  className?: string
  size?: number
  showTagline?: boolean
  light?: boolean
}

/**
 * Studio Freela official logo component recreated faithfully in inline SVG:
 * - Icon: rounded square with double stroke (outer dark graphite, inner bronze/copper) containing serif "SF"
 * - Wordmark: "Studio Freela" in two lines or one, noble serif typography
 * - Tagline: "GESTÃO FREELANCE COM A SOBRIEDADE QUE SEU TRABALHO MERECE" (uppercase, tracked, subtle graphite)
 */
export const StudioFreelaLogo: React.FC<StudioFreelaLogoProps> = ({
  variant = 'horizontal',
  className = '',
  size = 40,
  showTagline = false,
  light = false,
}) => {
  const graphite = light ? '#f8fafc' : '#2b2b2b'
  const bronze = '#b07d4f'
  const mutedText = light ? '#94a3b8' : '#737373'

  if (variant === 'mark') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-label="Studio Freela"
      >
        {/* Outer thick graphite rounded square */}
        <rect
          x="4"
          y="4"
          width="92"
          height="92"
          rx="22"
          stroke={graphite}
          strokeWidth="6"
          fill="none"
        />
        {/* Inner thin bronze rounded square */}
        <rect
          x="14"
          y="14"
          width="72"
          height="72"
          rx="14"
          stroke={bronze}
          strokeWidth="2"
          fill="none"
        />
        {/* Serif Monogram SF */}
        <text
          x="50"
          y="62"
          textAnchor="middle"
          fill={graphite}
          fontFamily="Cinzel, 'Playfair Display', 'Cormorant Garamond', 'Times New Roman', serif"
          fontSize="40"
          fontWeight="700"
          letterSpacing="1"
        >
          SF
        </text>
      </svg>
    )
  }

  if (variant === 'full') {
    return (
      <div className={`flex flex-col items-center text-center ${className}`}>
        <svg
          width={size * 1.5}
          height={size * 1.5}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <rect
            x="4"
            y="4"
            width="92"
            height="92"
            rx="22"
            stroke={graphite}
            strokeWidth="6"
            fill="none"
          />
          <rect
            x="14"
            y="14"
            width="72"
            height="72"
            rx="14"
            stroke={bronze}
            strokeWidth="2"
            fill="none"
          />
          <text
            x="50"
            y="62"
            textAnchor="middle"
            fill={graphite}
            fontFamily="Cinzel, 'Playfair Display', 'Cormorant Garamond', 'Times New Roman', serif"
            fontSize="40"
            fontWeight="700"
            letterSpacing="1"
          >
            SF
          </text>
        </svg>

        <div className="mt-3">
          <div
            className="font-serif font-bold text-2xl tracking-tight leading-none"
            style={{ color: graphite }}
          >
            Studio Freela
          </div>
          {showTagline && (
            <div
              className="text-[9px] uppercase tracking-[0.22em] font-medium mt-1.5"
              style={{ color: mutedText }}
            >
              GESTÃO FREELANCE COM A SOBRIEDADE QUE SEU TRABALHO MERECE
            </div>
          )}
        </div>
      </div>
    )
  }

  // Horizontal variant (default)
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-200 group-hover:scale-105"
        aria-hidden="true"
      >
        <rect
          x="4"
          y="4"
          width="92"
          height="92"
          rx="22"
          stroke={graphite}
          strokeWidth="6"
          fill="none"
        />
        <rect
          x="14"
          y="14"
          width="72"
          height="72"
          rx="14"
          stroke={bronze}
          strokeWidth="2"
          fill="none"
        />
        <text
          x="50"
          y="62"
          textAnchor="middle"
          fill={graphite}
          fontFamily="Cinzel, 'Playfair Display', 'Cormorant Garamond', 'Times New Roman', serif"
          fontSize="40"
          fontWeight="700"
          letterSpacing="1"
        >
          SF
        </text>
      </svg>

      <div className="flex flex-col text-left leading-tight">
        <span
          className="font-serif font-bold tracking-tight"
          style={{ fontSize: `${Math.max(16, size * 0.45)}px`, color: graphite }}
        >
          Studio Freela
        </span>
        {showTagline ? (
          <span
            className="text-[9px] uppercase tracking-[0.18em] font-medium mt-0.5 line-clamp-1"
            style={{ color: mutedText }}
          >
            GESTÃO FREELANCE COM A SOBRIEDADE QUE SEU TRABALHO MERECE
          </span>
        ) : (
          <span
            className="text-[10px] uppercase tracking-widest font-medium"
            style={{ color: bronze }}
          >
            Gestão Freelance
          </span>
        )}
      </div>
    </div>
  )
}

export default StudioFreelaLogo
