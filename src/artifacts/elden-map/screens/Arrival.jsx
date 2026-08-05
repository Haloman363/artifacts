export default function Arrival({ onDismiss }) {
  return (
    <div
      onClick={onDismiss}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(4,2,0,0.95)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 24, cursor: 'pointer',
        animation: 'arrival-in 0.8s ease-out',
      }}
    >
      <style>{`
        @keyframes arrival-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes shimmer {
          0%   { opacity: 0.4; transform: scale(0.95); }
          50%  { opacity: 1;   transform: scale(1.05); }
          100% { opacity: 0.4; transform: scale(0.95); }
        }
        @keyframes gold-particle {
          0%   { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-80px) scale(0); opacity: 0; }
        }
      `}</style>

      {/* Golden shimmer ring */}
      <div style={{
        width: 120, height: 120,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(249,192,67,0.3) 0%, transparent 70%)',
        border: '2px solid var(--color-gold-bright)',
        boxShadow: '0 0 40px 20px rgba(249,192,67,0.2)',
        animation: 'shimmer 2s ease-in-out infinite',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '3rem',
      }}>
        ✦
      </div>

      <div style={{ textAlign: 'center', padding: '0 32px' }}>
        <h2 style={{
          fontFamily: 'var(--font-main)',
          fontSize: 'clamp(1rem, 6vw, 1.6rem)',
          fontWeight: 900,
          letterSpacing: '0.2em',
          color: 'var(--color-gold-bright)',
          textShadow: '0 0 20px rgba(249,192,67,0.5)',
          textTransform: 'uppercase',
          lineHeight: 1.4,
        }}>
          A Site of Grace<br />Has Been Found
        </h2>
        <p style={{
          fontFamily: 'var(--font-main)',
          fontSize: '0.65rem',
          letterSpacing: '0.2em',
          color: 'var(--color-gold-burnt)',
          marginTop: 16,
          textTransform: 'uppercase',
        }}>
          Tap to return
        </p>
      </div>
    </div>
  )
}
