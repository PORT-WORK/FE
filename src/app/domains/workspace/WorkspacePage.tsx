import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { Send, Sparkles, ChevronDown, Copy, Check, RefreshCw, Zap, Plus, X } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

interface Msg { id: string; role: 'ai' | 'user'; text: string; code?: string; }
interface Session { id: string; title: string; time: string; msgs: Msg[]; }

const uid = () => Math.random().toString(36).slice(2, 10);

const PROJECTS = [
  { id: 'p1', label: 'Portfolio Revamp' },
  { id: 'p2', label: 'AI Recommendation System' },
];

const QUICK_PROMPTS = [
  'Write a strong hero section',
  'Summarize my project impact',
  'Explain the tech stack clearly',
  'Create a results section',
  'Draft a lesson learned section',
];

function initialSession(title: string, time: string): Session {
  return { id: uid(), title, time, msgs: [{ id: uid(), role: 'ai', text: 'Hi, I can help you build portfolio content. Ask me anything about sections, wording, or structure.' }] };
}

const INITIAL_SESSIONS: Session[] = [
  initialSession('Portfolio intro', 'Now'),
  initialSession('Results section', '1h ago'),
];

function getAIResponse(prompt: string): { text: string; code?: string } {
  return {
    text: `Draft for: ${prompt}`,
    code: `- Goal: ${prompt}\n- Add metrics, process, and outcome\n- Keep the tone concise and specific`,
  };
}

export default function WorkspacePage() {
  const { t } = useApp();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>(INITIAL_SESSIONS);
  const [activeSessionId, setActiveSessionId] = useState(INITIAL_SESSIONS[0].id);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeProject, setActiveProject] = useState(PROJECTS[0]);
  const [projOpen, setProjOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const activeSession = sessions.find(session => session.id === activeSessionId) || sessions[0];
  const msgs = activeSession?.msgs || [];

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, activeSessionId]);

  const updateMsgs = (sessionId: string, updater: (messages: Msg[]) => Msg[]) => {
    setSessions(prev => prev.map(session => (session.id === sessionId ? { ...session, msgs: updater(session.msgs) } : session)));
  };

  const send = (text?: string) => {
    const q = (text || input).trim();
    if (!q || loading) return;
    setInput('');
    updateMsgs(activeSession.id, messages => [...messages, { id: uid(), role: 'user', text: q }]);
    if (activeSession.msgs.length === 1) {
      setSessions(prev => prev.map(session => (session.id === activeSession.id ? { ...session, title: q.slice(0, 20) + (q.length > 20 ? '...' : '') } : session)));
    }
    setLoading(true);
    setTimeout(() => {
      const response = getAIResponse(q);
      updateMsgs(activeSession.id, messages => [...messages, { id: uid(), role: 'ai', text: response.text, code: response.code }]);
      setLoading(false);
    }, 900);
  };

  const addSession = () => {
    const session = initialSession('New chat', 'Now');
    setSessions(prev => [session, ...prev]);
    setActiveSessionId(session.id);
    setInput('');
  };

  const removeSession = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setSessions(prev => {
      const next = prev.filter(session => session.id !== id);
      if (activeSessionId === id && next.length > 0) setActiveSessionId(next[0].id);
      return next.length > 0 ? next : [initialSession('New chat', 'Now')];
    });
  };

  const copyCode = (msgId: string, code: string) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const regenerate = () => {
    const lastUser = [...msgs].reverse().find(message => message.role === 'user');
    if (!lastUser) return;
    updateMsgs(activeSession.id, messages => messages.slice(0, -1));
    setLoading(true);
    setTimeout(() => {
      const response = getAIResponse(lastUser.text);
      updateMsgs(activeSession.id, messages => [...messages, { id: uid(), role: 'ai', text: response.text, code: response.code }]);
      setLoading(false);
    }, 900);
  };

  return (
    <div className="flex h-full overflow-hidden" style={{ background: '#050505' }}>
      <div className="flex-shrink-0 flex flex-col overflow-hidden" style={{ width: '220px', borderRight: '1px solid rgba(255,255,255,0.06)', background: '#080808' }}>
        <div className="flex-shrink-0 flex items-center justify-between px-3 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <span className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">Sessions</span>
          <button onClick={addSession} className="w-6 h-6 rounded-lg flex items-center justify-center text-zinc-600 hover:text-violet-400 hover:bg-violet-500/10 transition-all" title="New chat">
            <Plus size={12} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-2 px-1.5 space-y-0.5">
          {sessions.map(session => (
            <button
              key={session.id}
              onClick={() => setActiveSessionId(session.id)}
              className="w-full flex items-start justify-between gap-2 px-2.5 py-2.5 rounded-xl text-left transition-all group/sess"
              style={{ background: activeSessionId === session.id ? 'rgba(124,58,237,0.12)' : 'transparent', border: `1px solid ${activeSessionId === session.id ? 'rgba(124,58,237,0.2)' : 'transparent'}` }}
            >
              <div className="min-w-0 flex-1">
                <p className={`text-xs truncate ${activeSessionId === session.id ? 'text-violet-300 font-medium' : 'text-zinc-400'}`}>{session.title}</p>
                <p className="text-[10px] text-zinc-700 mt-0.5">{session.time}</p>
              </div>
              <button onClick={event => removeSession(session.id, event)} className="opacity-0 group-hover/sess:opacity-100 flex-shrink-0 p-0.5 rounded text-zinc-700 hover:text-zinc-400 transition-all mt-0.5">
                <X size={10} />
              </button>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-2 py-1 rounded-xl" style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)' }}>
              <Sparkles size={13} className="text-violet-400" />
              <span className="text-xs font-semibold text-violet-300">AI Workspace</span>
            </div>
            <div className="relative" onClick={e => e.stopPropagation()}>
              <button onClick={() => setProjOpen(prev => !prev)} className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs text-zinc-400 hover:text-white transition-colors" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                {activeProject.label}<ChevronDown size={11} className="text-zinc-600" />
              </button>
              {projOpen && (
                <div className="absolute top-full left-0 mt-1 rounded-xl shadow-xl z-50 overflow-hidden" style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', minWidth: '200px' }}>
                  {PROJECTS.map(project => (
                    <button key={project.id} onClick={() => { setActiveProject(project); setProjOpen(false); }} className="w-full text-left px-3 py-2.5 text-xs text-zinc-300 hover:bg-white/[0.06] transition-colors flex items-center gap-2">
                      <span>{project.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 overflow-x-auto max-w-[340px]">
            {sessions.slice(0, 4).map(session => (
              <div key={session.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg flex-shrink-0 cursor-pointer transition-all" style={{ background: activeSessionId === session.id ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${activeSessionId === session.id ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.06)'}` }} onClick={() => setActiveSessionId(session.id)}>
                <span className={`text-[10px] max-w-[80px] truncate ${activeSessionId === session.id ? 'text-violet-300' : 'text-zinc-500'}`}>{session.title}</span>
                <button onClick={event => removeSession(session.id, event)} className="text-zinc-700 hover:text-zinc-400 transition-colors"><X size={9} /></button>
              </div>
            ))}
            <button onClick={addSession} className="p-1.5 rounded-lg text-zinc-700 hover:text-violet-400 hover:bg-violet-500/10 transition-all flex-shrink-0">
              <Plus size={11} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6" onClick={() => setProjOpen(false)}>
          <div className="max-w-3xl mx-auto space-y-6">
            {msgs.map((msg, idx) => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                {msg.role === 'ai' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)', boxShadow: '0 0 12px rgba(124,58,237,0.4)' }}>
                    <Sparkles size={14} className="text-white" />
                  </div>
                )}
                <div className={`flex-1 space-y-2 ${msg.role === 'user' ? 'flex flex-col items-end' : ''}`}>
                  <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${msg.role === 'ai' ? 'text-zinc-300 rounded-tl-sm' : 'text-white rounded-tr-sm'}`} style={{ background: msg.role === 'ai' ? 'rgba(255,255,255,0.04)' : 'linear-gradient(135deg,rgba(124,58,237,0.3),rgba(37,99,235,0.3))', border: `1px solid ${msg.role === 'ai' ? 'rgba(255,255,255,0.06)' : 'rgba(124,58,237,0.3)'}`, maxWidth: '85%', display: 'inline-block' }}>
                    {msg.text}
                  </div>
                  {msg.code && (
                    <div className="rounded-2xl overflow-hidden w-full" style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                        <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Generated notes</span>
                        <div className="flex items-center gap-2">
                          {idx === msgs.length - 1 && msg.role === 'ai' && (
                            <button onClick={regenerate} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] text-zinc-600 hover:text-zinc-300 transition-colors">
                              <RefreshCw size={10} />Regenerate
                            </button>
                          )}
                          <button onClick={() => copyCode(msg.id, msg.code!)} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] transition-all" style={{ background: copiedId === msg.id ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.04)', color: copiedId === msg.id ? '#34d399' : '#71717a' }}>
                            {copiedId === msg.id ? <><Check size={10} />Copied</> : <><Copy size={10} />Copy</>}
                          </button>
                        </div>
                      </div>
                      <pre className="px-4 py-4 text-xs text-zinc-400 leading-relaxed overflow-x-auto whitespace-pre-wrap font-mono">{msg.code}</pre>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}>
                  <Sparkles size={14} className="text-white" />
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-tl-sm" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center gap-1.5">
                    {[0, 1, 2].map(item => <div key={item} className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: `${item * 0.15}s` }} />)}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        <div className="flex-shrink-0 px-6 pt-2 pb-1" onClick={() => setProjOpen(false)}>
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {QUICK_PROMPTS.map(prompt => (
                <button key={prompt} onClick={() => send(prompt)} className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-zinc-500 hover:text-white transition-all" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(124,58,237,0.2)' }}>
                  <span>AI</span>{prompt}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 px-6 pb-4" onClick={() => setProjOpen(false)}>
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-3 p-3 rounded-2xl transition-all" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <Zap size={14} className="text-zinc-700 flex-shrink-0 mb-2.5 ml-1" />
              <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder={t('workspace_placeholder')} rows={1} className="flex-1 bg-transparent text-sm text-zinc-300 placeholder-zinc-700 outline-none resize-none" onInput={e => { const el = e.target as HTMLTextAreaElement; el.style.height = 'auto'; el.style.height = `${Math.min(el.scrollHeight, 120)}px`; }} />
              <button onClick={() => send()} disabled={!input.trim() || loading} className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all" style={{ background: input.trim() && !loading ? 'linear-gradient(135deg,#7c3aed,#2563eb)' : 'rgba(255,255,255,0.05)', boxShadow: input.trim() && !loading ? '0 0 14px rgba(124,58,237,0.4)' : 'none' }}>
                <Send size={13} className={input.trim() && !loading ? 'text-white' : 'text-zinc-700'} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
