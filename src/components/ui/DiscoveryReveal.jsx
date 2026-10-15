import { useEffect } from 'react'
import {
  EXPERIENCE_STATES,
  useExperienceState,
} from '../../state/experienceMachine'

const STYLE_ID = 'observatory-discovery-reveal-styles'

const discoveryStyles = `
  @keyframes observatoryDiscoveryVeilIn {
    0% {
      opacity: 0;
    }

    100% {
      opacity: 1;
    }
  }

  @keyframes observatoryDiscoveryTextIn {
    0% {
      opacity: 0;
      transform: translate3d(0, 14px, 0);
      filter: blur(8px);
    }

    42% {
      opacity: 0.78;
      filter: blur(1.5px);
    }

    100% {
      opacity: 1;
      transform: translate3d(0, 0, 0);
      filter: blur(0);
    }
  }

  @keyframes observatoryDiscoveryRuleIn {
    0% {
      opacity: 0;
      transform: scaleX(0);
    }

    100% {
      opacity: 0.32;
      transform: scaleX(1);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .observatory-discovery-veil,
    .observatory-discovery-text,
    .observatory-discovery-rule {
      animation: none !important;
    }

    .observatory-discovery-veil {
      opacity: 1 !important;
    }

    .observatory-discovery-text {
      opacity: 1 !important;
      transform: none !important;
      filter: none !important;
    }

    .observatory-discovery-rule {
      opacity: 0.32 !important;
      transform: scaleX(1) !important;
    }
  }
`

function ensureDiscoveryStyles() {
  if (
    document.getElementById(
      STYLE_ID,
    )
  ) {
    return
  }

  const style =
    document.createElement(
      'style',
    )

  style.id =
    STYLE_ID

  style.textContent =
    discoveryStyles

  document.head.appendChild(
    style,
  )
}

function DiscoveryReveal() {
  const { phase } =
    useExperienceState()

  useEffect(() => {
    if (
      phase !==
      EXPERIENCE_STATES.DISCOVERY
    ) {
      return
    }

    ensureDiscoveryStyles()

    return () => {
      const style =
        document.getElementById(
          STYLE_ID,
        )

      if (
        style
      ) {
        style.remove()
      }
    }
  }, [phase])

  if (
    phase !==
    EXPERIENCE_STATES.DISCOVERY
  ) {
    return null
  }

  return (
    <div
      className="observatory-discovery-veil"
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding:
          'clamp(24px, 5vw, 72px)',
        pointerEvents: 'none',
        userSelect: 'none',
        animation:
          'observatoryDiscoveryVeilIn 2.2s cubic-bezier(0.22, 1, 0.36, 1) 0.35s both',
        background:
          'radial-gradient(circle at 50% 44%, rgba(255,255,255,0.024) 0%, rgba(255,255,255,0) 42%), linear-gradient(180deg, rgba(3,7,12,0) 0%, rgba(3,7,12,0.08) 58%, rgba(3,7,12,0.2) 100%)',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: 'min(720px, 88vw)',
          textAlign: 'center',
        }}
      >
        <div
          className="observatory-discovery-rule"
          style={{
            width: '54px',
            height: '1px',
            marginBottom:
              '28px',
            transformOrigin:
              'center',
            background:
              'rgba(220, 235, 246, 0.72)',
            animation:
              'observatoryDiscoveryRuleIn 1.7s cubic-bezier(0.22, 1, 0.36, 1) 1.05s both',
          }}
        />

        <div
          className="observatory-discovery-text"
          style={{
            margin: 0,
            color:
              'rgba(241, 247, 252, 0.94)',
            fontFamily:
              'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            fontSize:
              'clamp(21px, 2.35vw, 34px)',
            fontWeight: 400,
            lineHeight: 1.3,
            letterSpacing:
              '0.075em',
            textRendering:
              'geometricPrecision',
            textShadow:
              '0 0 28px rgba(205, 229, 247, 0.12), 0 2px 24px rgba(0,0,0,0.32)',
            animation:
              'observatoryDiscoveryTextIn 2s cubic-bezier(0.22, 1, 0.36, 1) 1.15s both',
          }}
        >
          Two lights, one orbit.
        </div>
      </div>
    </div>
  )
}

export default DiscoveryReveal