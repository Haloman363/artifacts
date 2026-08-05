const ARROW_MAP = {
  'turn-left': '←',
  'turn-right': '→',
  'turn-sharp-left': '↰',
  'turn-sharp-right': '↱',
  'turn-slight-left': '↖',
  'turn-slight-right': '↗',
  straight: '↑',
  merge: '↑',
  uturn: '↩',
  default: '↑',
}

function getArrow(maneuver) {
  if (!maneuver) return '↑'
  const key = maneuver.modifier
    ? `${maneuver.type}-${maneuver.modifier}`.replace(' ', '-')
    : maneuver.type
  return ARROW_MAP[key] || ARROW_MAP.default
}

export default function HUD({ step, eta, onRecenter }) {
  return (
    <>
      {/* Recenter button */}
      <button
        onClick={onRecenter}
        style={{
          position: 'absolute', top: 20, right: 20, zIndex: 10,
          width: 44, height: 44,
          background: 'rgba(4,2,0,0.85)',
          border: '1px solid var(--color-gold-burnt)',
          borderRadius: 2,
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.2rem',
        }}
        title="Recenter"
      >
        ✦
      </button>

      {/* Turn card */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10,
        background: 'rgba(4,2,0,0.9)',
        borderTop: '1px solid var(--color-gold-burnt)',
        padding: '16px 20px 24px',
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        {step ? (
          <>
            <div style={{
              fontSize: '2.5rem', color: 'var(--color-gold-bright)',
              minWidth: 48, textAlign: 'center',
              textShadow: '0 0 12px rgba(249,192,67,0.5)',
            }}>
              {getArrow(step.maneuver)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: 'var(--font-main)',
                fontSize: '0.8rem',
                letterSpacing: '0.12em',
                color: 'var(--color-gold-bright)',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {step.instruction || 'Continue'}
              </div>
              {step.distance && (
                <div style={{
                  fontFamily: 'var(--font-main)',
                  fontSize: '0.7rem',
                  color: 'var(--color-gold-burnt)',
                  letterSpacing: '0.08em',
                  marginTop: 4,
                }}>
                  {step.distance}
                </div>
              )}
            </div>
            {eta && (
              <div style={{
                fontFamily: 'var(--font-main)',
                fontSize: '0.75rem',
                color: 'var(--color-gold-accent)',
                letterSpacing: '0.08em',
                textAlign: 'right',
                minWidth: 60,
              }}>
                {eta}
              </div>
            )}
          </>
        ) : (
          <div style={{
            fontFamily: 'var(--font-main)',
            fontSize: '0.8rem',
            letterSpacing: '0.12em',
            color: 'var(--color-gold-burnt)',
            textAlign: 'center',
            width: '100%',
          }}>
            SEEK YOUR DESTINATION
          </div>
        )}
      </div>
    </>
  )
}
