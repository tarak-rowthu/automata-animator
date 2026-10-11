import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { LESSONS } from '../data/lessons';

export const LearningPage: React.FC = () => {
  const [lessonIndex, setLessonIndex] = useState(0);
  const lesson = LESSONS[lessonIndex];

  function sectionBg(type: string) {
    switch (type) {
      case 'math': return { bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.25)', color: '#93c5fd' };
      case 'example': return { bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.25)', color: '#34d399' };
      case 'warning': return { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)', color: '#f87171' };
      case 'tip': return { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)', color: '#fbbf24' };
      default: return { bg: 'transparent', border: 'transparent', color: '#94a3b8' };
    }
  }

  function sectionLabel(type: string) {
    switch (type) {
      case 'math': return '∑ Formula';
      case 'example': return '📋 Example';
      case 'warning': return '⚠ Common Mistake';
      case 'tip': return '💡 Tip';
      default: return '';
    }
  }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Lesson list sidebar */}
      <div style={{
        width: 200, minWidth: 200, padding: '1rem 0.75rem',
        borderRight: '1px solid rgba(59,130,246,0.12)', overflowY: 'auto'
      }}>
        <div style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
          Lessons
        </div>
        {LESSONS.map((l, i) => (
          <div
            key={l.id}
            onClick={() => setLessonIndex(i)}
            style={{
              padding: '0.6rem 0.75rem', borderRadius: 8, cursor: 'pointer', marginBottom: '0.25rem',
              background: i === lessonIndex ? 'rgba(37,99,235,0.15)' : 'transparent',
              border: `1px solid ${i === lessonIndex ? 'rgba(59,130,246,0.3)' : 'transparent'}`,
              color: i === lessonIndex ? '#60a5fa' : '#64748b',
              fontSize: '0.82rem', fontWeight: i === lessonIndex ? 600 : 400,
              transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: '0.4rem'
            }}
          >
            <div style={{
              width: 20, height: 20, borderRadius: '50%', flexShrink: 0, fontSize: '0.7rem',
              background: i === lessonIndex ? '#2563eb' : 'rgba(59,130,246,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: i === lessonIndex ? 'white' : '#64748b'
            }}>{i + 1}</div>
            {l.title}
          </div>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 2rem' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={lessonIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'linear-gradient(135deg,#2563eb,#7c3aed)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 800, fontSize: '0.9rem'
              }}>{lessonIndex + 1}</div>
              <div style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Lesson {lessonIndex + 1} of {LESSONS.length}
              </div>
            </div>

            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#e2e8f0', marginBottom: '1.5rem', lineHeight: 1.2 }}>
              {lesson.title}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 720 }}>
              {lesson.content.map((section, i) => {
                const style = sectionBg(section.type);
                const label = sectionLabel(section.type);
                const isSpecial = section.type !== 'text';

                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    style={{
                      background: style.bg,
                      border: `1px solid ${style.border}`,
                      borderLeft: isSpecial ? `3px solid ${style.border}` : '1px solid transparent',
                      borderRadius: 8,
                      padding: '1rem 1.25rem',
                    }}
                  >
                    {isSpecial && (
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: style.color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>
                        {label}
                      </div>
                    )}
                    {section.title && (
                      <h4 style={{ color: style.color || '#e2e8f0', fontWeight: 700, marginBottom: '0.4rem', fontSize: '1rem' }}>
                        {section.title}
                      </h4>
                    )}
                    <p style={{
                      color: section.type === 'text' ? '#94a3b8' : style.color,
                      fontSize: '0.9rem', lineHeight: 1.75,
                      fontFamily: section.type === 'math' ? 'JetBrains Mono, monospace' : 'inherit',
                      whiteSpace: section.type === 'math' ? 'pre-wrap' : 'normal'
                    }}>
                      {section.content}
                    </p>
                  </motion.div>
                );
              })}
            </div>

            {/* Navigation */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', alignItems: 'center' }}>
              <button
                className="btn-secondary"
                onClick={() => setLessonIndex(i => Math.max(0, i - 1))}
                disabled={lessonIndex === 0}
              >
                <ChevronLeft size={16} /> Previous
              </button>
              <div style={{ flex: 1, display: 'flex', gap: '4px', justifyContent: 'center' }}>
                {LESSONS.map((_, i) => (
                  <div
                    key={i}
                    onClick={() => setLessonIndex(i)}
                    style={{
                      width: 8, height: 8, borderRadius: '50%', cursor: 'pointer',
                      background: i === lessonIndex ? '#3b82f6' : i < lessonIndex ? '#10b981' : 'rgba(59,130,246,0.2)',
                      transition: 'background 0.2s'
                    }}
                  />
                ))}
              </div>
              <button
                className="btn-primary"
                onClick={() => setLessonIndex(i => Math.min(LESSONS.length - 1, i + 1))}
                disabled={lessonIndex === LESSONS.length - 1}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
