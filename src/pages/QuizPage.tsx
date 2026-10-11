import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, RefreshCw, ChevronRight, Trophy } from 'lucide-react';
import { QUIZ_QUESTIONS } from '../data/quizQuestions';

export const QuizPage: React.FC = () => {
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [answers, setAnswers] = useState<(number | null)[]>(Array(QUIZ_QUESTIONS.length).fill(null));

  const question = QUIZ_QUESTIONS[currentQ];

  function choose(idx: number) {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    const newAnswers = [...answers];
    newAnswers[currentQ] = idx;
    setAnswers(newAnswers);
    if (idx === question.correctIndex) setScore(s => s + 1);
  }

  function next() {
    if (currentQ === QUIZ_QUESTIONS.length - 1) {
      setDone(true);
    } else {
      setCurrentQ(q => q + 1);
      setSelected(null);
      setAnswered(false);
    }
  }

  function restart() {
    setCurrentQ(0);
    setSelected(null);
    setAnswered(false);
    setScore(0);
    setDone(false);
    setAnswers(Array(QUIZ_QUESTIONS.length).fill(null));
  }

  if (done) {
    const pct = Math.round((score / QUIZ_QUESTIONS.length) * 100);
    return (
      <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', overflowY: 'auto', height: '100%' }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-card"
          style={{ padding: '2.5rem', maxWidth: 600, width: '100%', textAlign: 'center' }}
        >
          <Trophy size={48} color="#fbbf24" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#e2e8f0', marginBottom: '0.5rem' }}>Quiz Complete!</h2>
          <div style={{ fontSize: '3rem', fontWeight: 900 }} className="gradient-text">{pct}%</div>
          <div style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>
            {score} out of {QUIZ_QUESTIONS.length} correct
          </div>
          <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(59,130,246,0.08)', borderRadius: 8 }}>
            {pct >= 80 ? '🎉 Excellent! You have a strong understanding of automata theory.'
              : pct >= 60 ? '👍 Good work! Review the lessons for any concepts you missed.'
              : '📚 Keep studying! The Learning Mode lessons will help reinforce these concepts.'}
          </div>

          {/* Answer review */}
          <div style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
            {QUIZ_QUESTIONS.map((q, i) => {
              const userAns = answers[i];
              const correct = userAns === q.correctIndex;
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.4rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)'
                }}>
                  {correct ? <CheckCircle size={14} color="#10b981" /> : <XCircle size={14} color="#ef4444" />}
                  <span style={{ fontSize: '0.82rem', color: correct ? '#34d399' : '#f87171', flex: 1 }}>Q{i + 1}: {q.question.substring(0, 60)}...</span>
                </div>
              );
            })}
          </div>

          <button className="btn-primary" onClick={restart} style={{ width: '100%' }}>
            <RefreshCw size={16} /> Restart Quiz
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem', overflowY: 'auto', height: '100%' }}>
      {/* Progress */}
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Question {currentQ + 1} of {QUIZ_QUESTIONS.length}
          </div>
          <div style={{ display: 'flex', gap: '3px' }}>
            {QUIZ_QUESTIONS.map((_, i) => (
              <div key={i} style={{
                width: 20, height: 4, borderRadius: 2,
                background: i < currentQ
                  ? (answers[i] === QUIZ_QUESTIONS[i].correctIndex ? '#10b981' : '#ef4444')
                  : i === currentQ ? '#3b82f6'
                  : 'rgba(59,130,246,0.15)',
                transition: 'background 0.3s'
              }} />
            ))}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Score: {score}/{currentQ}</div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentQ}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
          >
            <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
              <div className="badge badge-blue" style={{ marginBottom: '0.75rem' }}>{question.category}</div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#e2e8f0', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                {question.question}
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {question.options.map((opt, i) => {
                  let bg = 'rgba(30,41,59,0.5)';
                  let border = '1px solid rgba(255,255,255,0.07)';
                  let color = '#94a3b8';

                  if (answered) {
                    if (i === question.correctIndex) { bg = 'rgba(16,185,129,0.12)'; border = '1px solid rgba(16,185,129,0.4)'; color = '#34d399'; }
                    else if (i === selected) { bg = 'rgba(239,68,68,0.12)'; border = '1px solid rgba(239,68,68,0.4)'; color = '#f87171'; }
                  } else if (i === selected) {
                    bg = 'rgba(59,130,246,0.12)'; border = '1px solid rgba(59,130,246,0.4)'; color = '#60a5fa';
                  }

                  return (
                    <motion.div
                      key={i}
                      onClick={() => choose(i)}
                      whileHover={!answered ? { x: 4 } : {}}
                      style={{
                        background: bg, border, borderRadius: 8, padding: '0.75rem 1rem',
                        cursor: answered ? 'default' : 'pointer', color,
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{
                        width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                        border: `1px solid ${color}`, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700
                      }}>
                        {answered && i === question.correctIndex ? '✓' : answered && i === selected && i !== question.correctIndex ? '✗' : String.fromCharCode(65 + i)}
                      </div>
                      <span style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>{opt}</span>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Explanation */}
            {answered && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  background: selected === question.correctIndex ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                  border: `1px solid ${selected === question.correctIndex ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                  borderRadius: 8, padding: '1rem', marginBottom: '1rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', fontWeight: 700, color: selected === question.correctIndex ? '#34d399' : '#f87171' }}>
                  {selected === question.correctIndex ? <CheckCircle size={15} /> : <XCircle size={15} />}
                  {selected === question.correctIndex ? 'Correct!' : 'Incorrect'}
                </div>
                <p style={{ fontSize: '0.88rem', color: '#94a3b8', lineHeight: 1.65 }}>{question.explanation}</p>
              </motion.div>
            )}

            {answered && (
              <button className="btn-primary" onClick={next} style={{ width: '100%' }}>
                {currentQ === QUIZ_QUESTIONS.length - 1 ? 'See Results' : 'Next Question'} <ChevronRight size={16} />
              </button>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
