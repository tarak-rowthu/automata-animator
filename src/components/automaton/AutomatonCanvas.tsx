import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Automaton, Transition } from '../../types/automaton';

interface StatePosition {
  id: string;
  x: number;
  y: number;
}

interface AutomatonCanvasProps {
  automaton: Automaton;
  highlightedStates?: string[];
  highlightedTransitions?: Transition[];
  activeStates?: string[];
  onStateClick?: (state: string) => void;
  height?: number;
  readOnly?: boolean;
  dfaSubsets?: Record<string, string[]>; // maps dfaState -> nfaStates
}

function layoutStates(states: string[], existingPositions?: StatePosition[]): StatePosition[] {
  const positions: StatePosition[] = [];
  const n = states.length;
  const cx = 320;
  const cy = 180;
  const r = Math.min(130, 60 + n * 18);

  for (let i = 0; i < n; i++) {
    const existing = existingPositions?.find(p => p.id === states[i]);
    if (existing) {
      positions.push(existing);
    } else {
      const angle = (2 * Math.PI * i) / n - Math.PI / 2;
      positions.push({
        id: states[i],
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle),
      });
    }
  }
  return positions;
}

function curvePath(x1: number, y1: number, x2: number, y2: number, offset: number = 0): string {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return `M ${x1} ${y1}`;
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const nx = -dy / len;
  const ny = dx / len;
  const curvature = offset === 0 ? 0 : 40 * Math.sign(offset);
  return `M ${x1} ${y1} Q ${mx + nx * curvature} ${my + ny * curvature} ${x2} ${y2}`;
}

function selfLoopPath(cx: number, cy: number, r: number = 28): string {
  return `M ${cx - r * 0.5} ${cy - r} C ${cx - r * 1.5} ${cy - r * 2.5} ${cx + r * 1.5} ${cy - r * 2.5} ${cx + r * 0.5} ${cy - r}`;
}

export const AutomatonCanvas: React.FC<AutomatonCanvasProps> = ({
  automaton,
  highlightedStates = [],
  activeStates = [],
  onStateClick,
  height = 360,
  readOnly = true,
  dfaSubsets,
}) => {
  const [positions, setPositions] = useState<StatePosition[]>([]);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: 640, h: 360 });
  const [panning, setPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    setPositions(prev => layoutStates(automaton.states, prev));
  }, [automaton.states.join(',')]);

  const getPos = (id: string) => positions.find(p => p.id === id) || { id, x: 100, y: 100 };
  const NODE_R = 26;

  // Group transitions by (from, to) pair
  const transitionGroups: Record<string, Transition[]> = {};
  for (const t of automaton.transitions) {
    const key = `${t.from}->${t.to}`;
    if (!transitionGroups[key]) transitionGroups[key] = [];
    transitionGroups[key].push(t);
  }

  // Check reverse pair for offset
  function getOffset(from: string, to: string): number {
    const rev = transitionGroups[`${to}->${from}`];
    return rev && from !== to ? 1 : 0;
  }

  const handleMouseDown = useCallback((e: React.MouseEvent, stateId: string) => {
    if (readOnly) return;
    e.stopPropagation();
    const svg = svgRef.current!;
    const rect = svg.getBoundingClientRect();
    const scaleX = viewBox.w / rect.width;
    const scaleY = viewBox.h / rect.height;
    const pos = getPos(stateId);
    setDragging(stateId);
    setDragOffset({
      x: pos.x - (e.clientX - rect.left) * scaleX - viewBox.x,
      y: pos.y - (e.clientY - rect.top) * scaleY - viewBox.y,
    });
  }, [readOnly, positions, viewBox]);

  const handleSvgMouseDown = useCallback((e: React.MouseEvent) => {
    if (readOnly || e.button !== 0) {
      setPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  }, [readOnly]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const svg = svgRef.current!;
    const rect = svg.getBoundingClientRect();
    const scaleX = viewBox.w / rect.width;
    const scaleY = viewBox.h / rect.height;

    if (dragging) {
      const nx = (e.clientX - rect.left) * scaleX + viewBox.x + dragOffset.x;
      const ny = (e.clientY - rect.top) * scaleY + viewBox.y + dragOffset.y;
      setPositions(prev => prev.map(p => p.id === dragging ? { ...p, x: nx, y: ny } : p));
    } else if (panning) {
      const dx = (e.clientX - panStart.x) * scaleX;
      const dy = (e.clientY - panStart.y) * scaleY;
      setViewBox(v => ({ ...v, x: v.x - dx, y: v.y - dy }));
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  }, [dragging, dragOffset, panning, panStart, viewBox]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
    setPanning(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 1.1 : 0.9;
    setViewBox(v => {
      const nw = Math.max(200, Math.min(1200, v.w * factor));
      const nh = nw * (height / 640);
      return { ...v, w: nw, h: nh };
    });
  }, [height]);

  function resetView() {
    setViewBox({ x: 0, y: 0, w: 640, h: 360 });
  }

  function fitToScreen() {
    if (positions.length === 0) return;
    const xs = positions.map(p => p.x);
    const ys = positions.map(p => p.y);
    const minX = Math.min(...xs) - 60;
    const minY = Math.min(...ys) - 60;
    const maxX = Math.max(...xs) + 60;
    const maxY = Math.max(...ys) + 60;
    setViewBox({ x: minX, y: minY, w: maxX - minX, h: maxY - minY });
  }

  const EPSILON_SYM = 'ε';

  function renderArrowhead(color: string) {
    return color;
  }

  const getStateColor = (state: string) => {
    if (activeStates.includes(state)) return '#22d3ee';
    if (highlightedStates.includes(state)) return '#fbbf24';
    if (automaton.acceptingStates.includes(state)) return '#10b981';
    if (automaton.initialState === state) return '#8b5cf6';
    return '#3b82f6';
  };

  return (
    <div className="automaton-canvas relative" style={{ height }}>
      {/* Controls */}
      <div className="absolute top-2 right-2 z-10 flex gap-1">
        <button onClick={fitToScreen} className="btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>Fit</button>
        <button onClick={resetView} className="btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>Reset</button>
      </div>

      <svg
        ref={svgRef}
        width="100%"
        height={height}
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
        onMouseDown={handleSvgMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{ cursor: panning ? 'grabbing' : 'default' }}
      >
        <defs>
          {['blue', 'violet', 'cyan', 'green', 'amber'].map(color => {
            const colors: Record<string, string> = {
              blue: '#3b82f6', violet: '#8b5cf6', cyan: '#22d3ee', green: '#10b981', amber: '#fbbf24'
            };
            return (
              <marker
                key={color}
                id={`arrow-${color}`}
                markerWidth="8"
                markerHeight="8"
                refX="7"
                refY="4"
                orient="auto"
              >
                <path d="M 0 0 L 8 4 L 0 8 z" fill={colors[color]} />
              </marker>
            );
          })}
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* Start arrow for initial state */}
        {automaton.initialState && (() => {
          const pos = getPos(automaton.initialState);
          return (
            <g>
              <line
                x1={pos.x - 60}
                y1={pos.y}
                x2={pos.x - NODE_R - 2}
                y2={pos.y}
                stroke="#8b5cf6"
                strokeWidth="2"
                markerEnd="url(#arrow-violet)"
              />
              <text x={pos.x - 65} y={pos.y - 6} fill="#a78bfa" fontSize="10" textAnchor="middle">start</text>
            </g>
          );
        })()}

        {/* Transitions */}
        {Object.entries(transitionGroups).map(([key, transitions]) => {
          const [fromId, toId] = key.split('->');
          const from = getPos(fromId);
          const to = getPos(toId);
          const label = transitions.map(t => t.symbol === 'ε' ? 'ε' : t.symbol).join(', ');
          const isHighlighted = transitions.some(t =>
            activeStates.includes(t.from) || highlightedStates.includes(t.from)
          );
          const color = isHighlighted ? '#22d3ee' : 'rgba(148, 163, 184, 0.6)';
          const arrowColor = isHighlighted ? 'cyan' : 'blue';
          const hasEpsilon = transitions.some(t => t.symbol === 'ε');

          if (fromId === toId) {
            // Self-loop
            const path = selfLoopPath(from.x, from.y - NODE_R, NODE_R);
            return (
              <g key={key}>
                <path
                  d={path}
                  fill="none"
                  stroke={hasEpsilon ? '#8b5cf6' : color}
                  strokeWidth={isHighlighted ? 2 : 1.5}
                  markerEnd={`url(#arrow-${hasEpsilon ? 'violet' : arrowColor})`}
                  strokeDasharray={hasEpsilon ? '4 2' : undefined}
                />
                <text
                  x={from.x}
                  y={from.y - NODE_R - 40}
                  textAnchor="middle"
                  fill={hasEpsilon ? '#a78bfa' : '#94a3b8'}
                  fontSize="11"
                  fontFamily="JetBrains Mono, monospace"
                  fontWeight={isHighlighted ? '700' : '400'}
                >{label}</text>
              </g>
            );
          }

          const offset = getOffset(fromId, toId);
          const dx = to.x - from.x;
          const dy = to.y - from.y;
          const len = Math.sqrt(dx * dx + dy * dy) || 1;
          const ux = dx / len;
          const uy = dy / len;
          const x1 = from.x + ux * NODE_R;
          const y1 = from.y + uy * NODE_R;
          const x2 = to.x - ux * (NODE_R + 4);
          const y2 = to.y - uy * (NODE_R + 4);
          const path = curvePath(x1, y1, x2, y2, offset);

          // Label midpoint (offset for curve)
          const mx = (x1 + x2) / 2;
          const my = (y1 + y2) / 2;
          const nx2 = -dy / len;
          const ny2 = dx / len;
          const curvature = offset ? 40 : 0;
          const lx = mx + nx2 * curvature * 0.5 + ny2 * 10;
          const ly = my + ny2 * curvature * 0.5 - nx2 * 10;

          return (
            <g key={key}>
              <path
                d={path}
                fill="none"
                stroke={hasEpsilon ? '#8b5cf6' : color}
                strokeWidth={isHighlighted ? 2 : 1.5}
                markerEnd={`url(#arrow-${hasEpsilon ? 'violet' : arrowColor})`}
                strokeDasharray={hasEpsilon ? '4 2' : undefined}
                filter={isHighlighted ? 'url(#glow)' : undefined}
              />
              <text
                x={lx}
                y={ly}
                textAnchor="middle"
                fill={hasEpsilon ? '#a78bfa' : '#94a3b8'}
                fontSize="11"
                fontFamily="JetBrains Mono, monospace"
                fontWeight={isHighlighted ? '700' : '400'}
              >{label}</text>
            </g>
          );
        })}

        {/* States */}
        {positions.map(({ id, x, y }) => {
          const isAccepting = automaton.acceptingStates.includes(id);
          const isInitial = automaton.initialState === id;
          const isActive = activeStates.includes(id);
          const isHighlighted = highlightedStates.includes(id);
          const color = getStateColor(id);
          const strokeWidth = isActive || isHighlighted ? 2.5 : 2;

          return (
            <g
              key={id}
              transform={`translate(${x},${y})`}
              onMouseDown={(e) => handleMouseDown(e, id)}
              onClick={() => onStateClick?.(id)}
              style={{ cursor: readOnly ? 'default' : 'grab' }}
            >
              {/* Double circle for accepting */}
              {isAccepting && (
                <circle r={NODE_R + 5} fill="none" stroke={color} strokeWidth={1.5} opacity={0.6} />
              )}
              <circle
                r={NODE_R}
                fill={`rgba(${color === '#10b981' ? '16,185,129' : color === '#8b5cf6' ? '139,92,246' : color === '#22d3ee' ? '34,211,238' : color === '#fbbf24' ? '251,191,36' : '59,130,246'},0.15)`}
                stroke={color}
                strokeWidth={strokeWidth}
                filter={isActive || isHighlighted ? 'url(#glow)' : undefined}
              />
              <text
                textAnchor="middle"
                dominantBaseline="middle"
                fill={color}
                fontSize="11"
                fontFamily="JetBrains Mono, monospace"
                fontWeight="700"
              >{id}</text>
              {/* DFA subset label */}
              {dfaSubsets?.[id] && (
                <text
                  y={NODE_R + 14}
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize="9"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {dfaSubsets[id].join(',')}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {automaton.states.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-slate-500 text-sm">No states defined. Add states using the builder.</p>
        </div>
      )}
    </div>
  );
};
