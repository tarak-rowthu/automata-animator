import React from 'react';

interface AcceptingStatePulseProps {
  cx: number;
  cy: number;
  nodeRadius?: number;
  isActive?: boolean;
  isFinalCelebration?: boolean;
  showBadge?: boolean;
  badgeLabel?: string;
}

/**
 * Animated visual effects for Automata Accepting States:
 * - Double-ring pulse around the accepting state
 * - Expanding circular ripple
 * - Subtle sparkle / particle burst
 * - Polished "FINAL STATE" / "ACCEPTING STATE" badge
 * - Non-obstructive SVG layer
 */
export const AcceptingStatePulse: React.FC<AcceptingStatePulseProps> = ({
  cx,
  cy,
  nodeRadius = 26,
  isActive = false,
  isFinalCelebration = false,
  showBadge = true,
  badgeLabel = 'ACCEPTING STATE',
}) => {
  // Sparkle angles around the node
  const sparkles = [
    { angle: 30, dist: nodeRadius + 14, size: 2.2 },
    { angle: 75, dist: nodeRadius + 18, size: 1.8 },
    { angle: 120, dist: nodeRadius + 14, size: 2.4 },
    { angle: 210, dist: nodeRadius + 15, size: 2.0 },
    { angle: 260, dist: nodeRadius + 19, size: 1.9 },
    { angle: 330, dist: nodeRadius + 16, size: 2.5 },
  ];

  return (
    <g className="accepting-state-effects" pointerEvents="none">
      {/* Outer double circle required by FA theory: baseline accepting ring */}
      <circle
        cx={cx}
        cy={cy}
        r={nodeRadius + 6}
        fill="none"
        stroke={isActive ? '#34d399' : '#10b981'}
        strokeWidth={isActive ? 2 : 1.6}
        opacity={isActive ? 0.95 : 0.6}
      />

      {/* When active or reached in simulation: Double-ring pulse */}
      {isActive && (
        <>
          {/* First pulse ring */}
          <circle
            cx={cx}
            cy={cy}
            r={nodeRadius + 10}
            fill="none"
            stroke="#10b981"
            strokeWidth={1.5}
            opacity={0.7}
            strokeDasharray="4 2"
          >
            <animate
              attributeName="r"
              values={`${nodeRadius + 7};${nodeRadius + 12};${nodeRadius + 7}`}
              dur="2s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.4;0.85;0.4"
              dur="2s"
              repeatCount="indefinite"
            />
          </circle>

          {/* Second pulse ring */}
          <circle
            cx={cx}
            cy={cy}
            r={nodeRadius + 15}
            fill="none"
            stroke="#22d3ee"
            strokeWidth={1.2}
            opacity={0.5}
          >
            <animate
              attributeName="r"
              values={`${nodeRadius + 12};${nodeRadius + 17};${nodeRadius + 12}`}
              dur="2s"
              begin="0.4s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.2;0.6;0.2"
              dur="2s"
              begin="0.4s"
              repeatCount="indefinite"
            />
          </circle>

          {/* Expanding circular ripple */}
          <circle
            cx={cx}
            cy={cy}
            r={nodeRadius + 6}
            fill="none"
            stroke="#34d399"
            strokeWidth={2}
            opacity={0.8}
          >
            <animate
              attributeName="r"
              values={`${nodeRadius + 6};${nodeRadius + 30}`}
              dur="1.8s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.8;0"
              dur="1.8s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="stroke-width"
              values="2;0.5"
              dur="1.8s"
              repeatCount="indefinite"
            />
          </circle>

          {/* Sparkle particle burst around the accepting state */}
          {sparkles.map((sp, idx) => {
            const rad = (sp.angle * Math.PI) / 180;
            const sx = cx + sp.dist * Math.cos(rad);
            const sy = cy + sp.dist * Math.sin(rad);
            return (
              <g key={idx}>
                <circle
                  cx={sx}
                  cy={sy}
                  r={sp.size}
                  fill="#6ee7b7"
                  filter="url(#glow)"
                >
                  <animate
                    attributeName="opacity"
                    values="0.2;1;0.2"
                    dur={`${1.2 + idx * 0.2}s`}
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="transform"
                    type="scale"
                    values="0.8;1.3;0.8"
                    additive="sum"
                    dur={`${1.2 + idx * 0.2}s`}
                    repeatCount="indefinite"
                  />
                </circle>
              </g>
            );
          })}
        </>
      )}

      {/* Extra celebration sparkle rings if final state reached & celebration is active */}
      {isFinalCelebration && (
        <circle
          cx={cx}
          cy={cy}
          r={nodeRadius + 22}
          fill="rgba(16, 185, 129, 0.08)"
          stroke="#10b981"
          strokeWidth={1}
          strokeDasharray="2 2"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from={`0 ${cx} ${cy}`}
            to={`360 ${cx} ${cy}`}
            dur="8s"
            repeatCount="indefinite"
          />
        </circle>
      )}

      {/* Small badge / label "FINAL STATE" or "ACCEPTING STATE" */}
      {showBadge && isActive && (
        <g transform={`translate(${cx}, ${cy - nodeRadius - 16})`}>
          <rect
            x={-38}
            y={-10}
            width={76}
            height={16}
            rx={8}
            fill="#064e3b"
            stroke="#34d399"
            strokeWidth={1}
            opacity={0.95}
          />
          <text
            x={0}
            y={2}
            textAnchor="middle"
            fill="#a7f3d0"
            fontSize="7.5"
            fontWeight="700"
            fontFamily="Inter, sans-serif"
            letterSpacing="0.04em"
          >
            {badgeLabel}
          </text>
        </g>
      )}
    </g>
  );
};
