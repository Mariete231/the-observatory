import {
  EXPERIENCE_STATES,
  useExperienceState,
} from '../../state/experienceMachine'
import {
  DISCOVERY_TIMELINE,
} from '../../data/discoveryChoreographyData'
import {
  useDiscoveryChoreographyState,
} from '../../state/discoveryChoreographyStore'

const discoveryCss = `
  @keyframes observatoryDiscoveryStageText {
    0% {
      opacity: 0;
      transform: translate3d(0, 8px, 0);
      filter: blur(5px);
    }

    15% {
      opacity: 0.64;
      transform: translate3d(0, 0, 0);
      filter: blur(0);
    }

    76% {
      opacity: 0.64;
      transform: translate3d(0, 0, 0);
      filter: blur(0);
    }

    100% {
      opacity: 0;
      transform: translate3d(0, -4px, 0);
      filter: blur(4px);
    }
  }

  @keyframes observatoryDiscoveryTextIn {
    0% {
      opacity: 0;
      transform: translate3d(0, 12px, 0);
      filter: blur(8px);
    }

    45% {
      opacity: 0.72;
      filter: blur(1.4px);
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
      opacity: 0.34;
      transform: scaleX(1);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .observatory-discovery-stage-text,
    .observatory-discovery-final-text,
    .observatory-discovery-final-rule {
      animation: none !important;
    }

    .observatory-discovery-stage-text {
      opacity: 0.64 !important;
      transform: none !important;
      filter: none !important;
    }

    .observatory-discovery-final-text {
      opacity: 1 !important;
      transform: none !important;
      filter: none !important;
    }

    .observatory-discovery-final-rule {
      opacity: 0.34 !important;
      transform: scaleX(1) !important;
    }
  }
`

function DiscoveryOverlay() {
  const { phase } =
    useExperienceState()

  const {
    activeStageIndex,
  } = useDiscoveryChoreographyState()

  const isDiscovery =
    phase === EXPERIENCE_STATES.DISCOVERY

  const isEnding =
    phase === EXPERIENCE_STATES.ENDING

  if (!isDiscovery && !isEnding) {
    return null
  }

  const activeStage =
    isDiscovery &&
    activeStageIndex >= 0
      ? DISCOVERY_TIMELINE.stages[
          activeStageIndex
        ]
      : null

  const stageAnimation =
    activeStage
      ? `observatoryDiscoveryStageText ${
          activeStage.duration +
          activeStage.hold
        }s cubic-bezier(0.22, 1, 0.36, 1) both`
      : 'none'

  const animation =
    isDiscovery
      ? `observatoryDiscoveryTextIn 2.2s cubic-bezier(0.22, 1, 0.36, 1) ${DISCOVERY_TIMELINE.textRevealStart}s both`
      : 'none'

  const ruleAnimation =
    isDiscovery
      ? `observatoryDiscoveryRuleIn 1.6s cubic-bezier(0.22, 1, 0.36, 1) ${DISCOVERY_TIMELINE.textRevealStart}s both`
      : 'none'

  return (
    <>
      <style>{discoveryCss}</style>

      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 30,
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        {activeStage?.text ? (
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom:
                'clamp(126px, 16vh, 174px)',
              display: 'flex',
              justifyContent: 'center',
              padding: '0 24px',
              pointerEvents: 'none',
            }}
          >
            <div
              key={activeStage.id}
              className="observatory-discovery-stage-text"
              style={{
                width:
                  'min(620px, 88vw)',
                transform:
                  'translate3d(0, 8px, 0)',
                color:
                  'rgba(222, 235, 244, 0.64)',
                fontFamily:
                  'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                fontSize:
                  'clamp(10px, 2.05vw, 24px)',
                fontWeight: 400,
                lineHeight: 1.5,
                letterSpacing:
                  '0.12em',
                textAlign: 'center',
                textShadow:
                  '0 0 24px rgba(190, 225, 244, 0.12), 0 2px 18px rgba(0, 0, 0, 0.38)',
                animation:
                  stageAnimation,
                willChange:
                  'opacity, transform, filter',
              }}
            >
              {activeStage.text}
            </div>
          </div>
        ) : null}

        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            padding:
              '0 24px clamp(72px, 10vh, 118px)',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: 'min(720px, 90vw)',
              textAlign: 'center',
            }}
          >
            <div
              className="observatory-discovery-final-rule"
              style={{
                width: 54,
                height: 1,
                marginBottom: 27,
                transformOrigin: 'center',
                background:
                  'rgba(221, 235, 246, 0.72)',
                opacity: isEnding
                  ? 0.34
                  : 0,
                transform:
                  isEnding
                    ? 'scaleX(1)'
                    : 'scaleX(0)',
                animation:
                  ruleAnimation,
              }}
            />

            <div
              className="observatory-discovery-final-text"
              style={{
                color:
                  'rgba(243, 248, 252, 0.95)',
                fontFamily:
                  'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                fontSize:
                  'clamp(21px, 2.3vw, 34px)',
                fontWeight: 400,
                lineHeight: 1.3,
                letterSpacing: '0.08em',
                textShadow:
                  '0 0 30px rgba(211, 233, 249, 0.16), 0 2px 24px rgba(0, 0, 0, 0.34)',
                opacity: isEnding
                  ? 1
                  : 0,
                transform:
                  isEnding
                    ? 'translate3d(0, 0, 0)'
                    : 'translate3d(0, 12px, 0)',
                filter:
                  isEnding
                    ? 'blur(0)'
                    : 'blur(8px)',
                animation,
              }}
            >
              Two lights, one orbit.
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default DiscoveryOverlay