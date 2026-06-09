import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { Search, Send, Paperclip, Mic, Image, MoreHorizontal, X, Square, Check, Edit3, Trash2, ExternalLink, MapPin, Github, Twitter, Globe } from 'lucide-react';
import { messages as conversationList } from '../../data/mockData';
import { useApp } from '../../contexts/AppContext';

type ChatType = 'text' | 'image' | 'file' | 'voice';

interface ChatMsg {
  id: string;
  from: 'me' | 'them';
  text: string;
  time: string;
  date?: string;
  type?: ChatType;
  fileName?: string;
  fileUrl?: string;
  mimeType?: string;
  edited?: boolean;
}

const uid = () => Math.random().toString(36).slice(2, 10);
const INITIAL_CHATS: ChatMsg[] = [
  { id: '1', from: 'them', text: 'Hi! I reviewed your portfolio draft.', time: '10:02 AM', date: 'Today', type: 'text' },
  { id: '2', from: 'me', text: 'Thanks. Which part should I improve first?', time: '10:03 AM', type: 'text' },
  { id: '3', from: 'them', text: 'The case-study summary could be sharper.', time: '10:05 AM', type: 'text' },
];

const MAX_INPUT = 500;

function DateSeparator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
      <span className="text-[10px] text-zinc-700 px-2 flex-shrink-0">{label}</span>
      <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
    </div>
  );
}

export default function MessagesPage() {
  const { t } = useApp();
  const navigate = useNavigate();
  const [active, setActive] = useState(conversationList[0].id);
  const [input, setInput] = useState('');
  const [chats, setChats] = useState<ChatMsg[]>(INITIAL_CHATS);
  const [showProfile, setShowProfile] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [menuMsgId, setMenuMsgId] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [recSec, setRecSec] = useState(0);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [selectedAudio, setSelectedAudio] = useState<string | null>(null);
  const conv = conversationList.find(item => item.id === active)!;
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const recTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const recSecRef = useRef(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chats]);

  useEffect(() => {
    if (!recording) {
      if (recTimer.current) clearInterval(recTimer.current);
      return;
    }
    setRecSec(0);
    recSecRef.current = 0;
    recTimer.current = setInterval(() => {
      recSecRef.current += 1;
      setRecSec(recSecRef.current);
    }, 1000);
    return () => {
      if (recTimer.current) clearInterval(recTimer.current);
    };
  }, [recording]);

  useEffect(() => () => {
    if (recTimer.current) clearInterval(recTimer.current);
    streamRef.current?.getTracks().forEach(track => track.stop());
  }, []);

  const send = () => {
    if (!input.trim()) return;
    setChats(prev => [...prev, { id: uid(), from: 'me', text: input, time: 'Just now', type: 'text' }]);
    setInput('');
  };

  const startRecording = async () => {
    try {
      setRecordingError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      streamRef.current = stream;
      chunksRef.current = [];

      recorder.ondataavailable = event => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        const fileUrl = URL.createObjectURL(blob);
        const duration = recSecRef.current;
        const min = Math.floor(duration / 60);
        const sec = duration % 60;
        setChats(prev => [...prev, {
          id: uid(),
          from: 'me',
          text: `Voice message ${min}:${String(sec).padStart(2, '0')}`,
          time: 'Just now',
          type: 'voice',
          fileName: `voice-${Date.now()}.webm`,
          fileUrl,
          mimeType: blob.type,
        }]);
        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        recorderRef.current = null;
        setRecSec(0);
        recSecRef.current = 0;
      };

      recorder.start();
      setRecording(true);
    } catch {
      setRecordingError('Microphone permission is required.');
      setRecording(false);
    }
  };

  const stopRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    } else {
      streamRef.current?.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setRecording(false);
  };

  const handleFile = (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'file') => {
    const file = event.target.files?.[0];
    if (!file) return;
    const fileUrl = URL.createObjectURL(file);
    setChats(prev => [...prev, {
      id: uid(),
      from: 'me',
      text: type === 'image' ? file.name : `File: ${file.name}`,
      time: 'Just now',
      type,
      fileName: file.name,
      fileUrl,
      mimeType: file.type,
    }]);
    event.target.value = '';
  };

  const saveEdit = () => {
    setChats(prev => prev.map(msg => (msg.id === editId ? { ...msg, text: editText, edited: true } : msg)));
    setEditId(null);
  };

  const deleteMsg = (id: string) => {
    setChats(prev => prev.filter(msg => msg.id !== id));
    setMenuMsgId(null);
  };

  const renderedChats: Array<ChatMsg | { _sep: string; id: string }> = [];
  let lastDate = '';
  chats.forEach(msg => {
    const date = msg.date || 'Today';
    if (date !== lastDate) {
      renderedChats.push({ _sep: date, id: `sep_${date}` });
      lastDate = date;
    }
    renderedChats.push(msg);
  });

  const charPct = (input.length / MAX_INPUT) * 100;

  return (
    <div className="flex h-full overflow-hidden relative" style={{ background: '#050505' }} onClick={() => setMenuMsgId(null)}>
      <div className="flex-shrink-0 flex flex-col" style={{ width: '260px', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="p-4">
          <h2 className="text-sm font-bold text-white mb-3">{t('msg_title')}</h2>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
            <input placeholder={t('msg_search')} className="w-full pl-8 pr-3 py-2 text-xs text-zinc-300 placeholder-zinc-700 rounded-xl focus:outline-none" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-2">
          {conversationList.map(item => (
            <button
              key={item.id}
              onClick={() => { setActive(item.id); setShowProfile(false); }}
              className="w-full flex items-start gap-3 px-3 py-3 rounded-xl mb-0.5 transition-all text-left relative overflow-hidden"
              style={{ background: active === item.id ? 'rgba(255,255,255,0.05)' : 'transparent' }}
            >
              {active === item.id && <div className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full" style={{ background: '#7c3aed' }} />}
              <div className="relative flex-shrink-0">
                {item.avatar
                  ? <img src={`https://images.unsplash.com/${item.avatar}?w=80&h=80&fit=crop&auto=format`} alt="" className="w-9 h-9 rounded-full object-cover" />
                  : <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}>{item.user[0]}</div>}
                {item.unread > 0 && <div className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-violet-600 flex items-center justify-center text-[9px] text-white font-bold">{item.unread}</div>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between mb-0.5">
                  <p className="text-xs font-semibold text-zinc-200 truncate">{item.user}</p>
                  <p className="text-[10px] text-zinc-700 flex-shrink-0 ml-2">{item.time}</p>
                </div>
                <p className="text-[10px] text-zinc-500 mb-0.5">{item.role}</p>
                <p className="text-[11px] text-zinc-600 truncate">{item.lastMsg}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <button className="flex items-center gap-3 hover:opacity-80 transition-opacity" onClick={() => setShowProfile(prev => !prev)}>
            {conv.avatar
              ? <img src={`https://images.unsplash.com/${conv.avatar}?w=80&h=80&fit=crop&auto=format`} alt="" className="w-8 h-8 rounded-full object-cover ring-2 ring-violet-500/30" />
              : <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ring-2 ring-violet-500/30" style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}>{conv.user[0]}</div>}
            <div className="text-left">
              <p className="text-sm font-semibold text-white">{conv.user}</p>
              <p className="text-xs text-zinc-600">{conv.role} <span className="text-violet-400 hover:underline cursor-pointer">View profile</span></p>
            </div>
          </button>
          <button className="p-2 text-zinc-600 hover:text-zinc-300 rounded-lg hover:bg-white/[0.04] transition-colors">
            <MoreHorizontal size={15} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2" onClick={() => setMenuMsgId(null)}>
          {renderedChats.map(item => {
            if ('_sep' in item) return <DateSeparator key={item.id} label={item._sep} />;
            const msg = item;
            return (
              <div key={msg.id} className={`flex ${msg.from === 'me' ? 'justify-end' : 'justify-start'} group/row`}>
                <div className={`max-w-[65%] ${msg.from === 'me' ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                  {editId === msg.id ? (
                    <div className="flex items-end gap-2" style={{ minWidth: '240px' }}>
                      <textarea
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            saveEdit();
                          }
                          if (e.key === 'Escape') setEditId(null);
                        }}
                        autoFocus
                        rows={2}
                        className="flex-1 bg-transparent text-sm text-zinc-200 outline-none resize-none px-3 py-2 rounded-xl"
                        style={{ border: '1px solid rgba(124,58,237,0.4)', background: 'rgba(124,58,237,0.07)' }}
                      />
                      <div className="flex flex-col gap-1">
                        <button onClick={saveEdit} className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10"><Check size={13} /></button>
                        <button onClick={() => setEditId(null)} className="p-1.5 rounded-lg text-zinc-600 hover:bg-white/[0.05]"><X size={13} /></button>
                      </div>
                    </div>
                  ) : (
                    <div className="relative flex items-end gap-1.5">
                      {msg.from === 'me' && (
                        <button onClick={e => { e.stopPropagation(); setMenuMsgId(menuMsgId === msg.id ? null : msg.id); }} className="opacity-0 group-hover/row:opacity-100 transition-opacity p-1 text-zinc-700 hover:text-zinc-400 rounded flex-shrink-0 self-center">
                          <MoreHorizontal size={13} />
                        </button>
                      )}
                      <div className="relative">
                        {msg.type === 'image' && msg.fileUrl ? (
                          <img src={msg.fileUrl} alt={msg.fileName} className="max-w-[240px] rounded-2xl object-cover" />
                        ) : msg.type === 'voice' && msg.fileUrl ? (
                          <div className="px-4 py-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.07)' }}>
                            <p className="text-xs text-zinc-400 mb-2">{msg.fileName || 'voice message'}</p>
                            <audio controls src={msg.fileUrl} className="w-64 max-w-full" />
                          </div>
                        ) : msg.type === 'file' && msg.fileUrl ? (
                          <a href={msg.fileUrl} download={msg.fileName} className="flex items-center gap-2 px-4 py-3 rounded-2xl text-sm text-zinc-200" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.07)' }}>
                            <Paperclip size={13} className="text-zinc-500" />
                            <span className="truncate max-w-[200px]">{msg.fileName || msg.text}</span>
                          </a>
                        ) : (
                          <div className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed" style={msg.from === 'me' ? { background: 'linear-gradient(135deg,#7c3aed,#2563eb)', color: 'white', borderRadius: '18px 18px 4px 18px' } : { background: 'rgba(255,255,255,0.06)', color: '#d4d4d4', borderRadius: '18px 18px 18px 4px', border: '1px solid rgba(255,255,255,0.07)' }}>
                            {msg.text}
                          </div>
                        )}
                        {menuMsgId === msg.id && (
                          <div className="absolute bottom-full right-0 mb-1 rounded-xl shadow-xl overflow-hidden z-50" style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', minWidth: '140px' }} onClick={e => e.stopPropagation()}>
                            {msg.type !== 'image' && msg.type !== 'file' && msg.type !== 'voice' && (
                              <button onClick={() => { setEditId(msg.id); setEditText(msg.text); setMenuMsgId(null); }} className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-xs text-zinc-300 hover:bg-white/[0.06]">
                                <Edit3 size={11} className="text-zinc-500" />Edit
                              </button>
                            )}
                            <button onClick={() => deleteMsg(msg.id)} className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-xs text-red-400 hover:bg-red-500/10">
                              <Trash2 size={11} />Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  <p className={`text-[10px] text-zinc-700 ${msg.from === 'me' ? 'text-right' : 'text-left'} px-1`}>
                    {msg.time}
                    {msg.edited && <span className="ml-1 text-zinc-800">(edited)</span>}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {recording && (
          <div className="flex-shrink-0 px-6 py-2">
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs text-red-400">Recording... {Math.floor(recSec / 60)}:{String(recSec % 60).padStart(2, '0')}</span>
              <button onClick={stopRecording} className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs text-white" style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}>
                <Send size={11} />Stop
              </button>
              <button onClick={stopRecording} className="p-1 text-zinc-600 hover:text-zinc-400 rounded">
                <Square size={11} />
              </button>
            </div>
          </div>
        )}

        {recordingError && <div className="px-6 pb-2 text-[10px] text-red-400">{recordingError}</div>}

        <div className="flex-shrink-0 p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <input ref={imgInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleFile(e, 'image')} />
          <input ref={fileInputRef} type="file" className="hidden" onChange={e => handleFile(e, 'file')} />
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center gap-0.5">
              <button onClick={() => fileInputRef.current?.click()} className="p-1.5 text-zinc-600 hover:text-zinc-300 rounded-lg transition-colors" title="Attach file"><Paperclip size={14} /></button>
              <button onClick={() => imgInputRef.current?.click()} className="p-1.5 text-zinc-600 hover:text-zinc-300 rounded-lg transition-colors" title="Attach image"><Image size={14} /></button>
              <button onClick={() => (recording ? stopRecording() : void startRecording())} className={`p-1.5 rounded-lg transition-colors ${recording ? 'text-red-400' : 'text-zinc-600 hover:text-zinc-300'}`} title="Voice note"><Mic size={14} /></button>
            </div>
            <div className="w-px h-4 mx-1" style={{ background: 'rgba(255,255,255,0.07)' }} />
            <input
              value={input}
              onChange={e => { if (e.target.value.length <= MAX_INPUT) setInput(e.target.value); }}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder={t('msg_placeholder')}
              className="flex-1 bg-transparent text-sm text-zinc-300 placeholder-zinc-700 focus:outline-none"
            />
            <span className="text-[10px] flex-shrink-0 ml-1" style={{ color: charPct >= 100 ? '#ef4444' : '#71717a' }}>{input.length}/{MAX_INPUT}</span>
            <button onClick={send} className="p-2 rounded-xl transition-all flex-shrink-0" style={{ background: input.trim() ? 'linear-gradient(135deg,#7c3aed,#2563eb)' : 'rgba(255,255,255,0.04)', color: input.trim() ? 'white' : '#52525b' }}>
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden transition-all duration-300 flex-shrink-0" style={{ width: showProfile ? '280px' : '0px' }}>
        <div className="w-[280px] flex flex-col h-full" style={{ borderLeft: '1px solid rgba(255,255,255,0.07)', background: '#0c0c0c' }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <span className="text-xs font-semibold text-zinc-400">{t('msg_profile')}</span>
            <button onClick={() => setShowProfile(false)} className="p-1.5 rounded-lg text-zinc-600 hover:text-white hover:bg-white/[0.06] transition-colors"><X size={14} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-5">
            <div className="text-center mb-5">
              {conv.avatar
                ? <img src={`https://images.unsplash.com/${conv.avatar}?w=160&h=160&fit=crop&crop=faces&auto=format`} alt="" className="w-20 h-20 rounded-2xl object-cover object-top mx-auto mb-3" style={{ boxShadow: '0 0 0 3px rgba(124,58,237,0.2)' }} />
                : <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white mx-auto mb-3" style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}>{conv.user[0]}</div>}
              <p className="text-sm font-bold text-white">{conv.user}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{conv.role}</p>
              <div className="flex items-center justify-center gap-1 mt-1.5 text-[10px] text-zinc-700">
                <MapPin size={9} /><span>Seoul, Korea</span>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-2">Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {['React', 'Figma', 'TypeScript', 'Motion', 'CSS'].map(skill => (
                  <span key={skill} className="px-2 py-1 text-[10px] text-zinc-500 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>{skill}</span>
                ))}
              </div>
            </div>

            <button onClick={() => navigate('/explore/e1')} className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-medium text-white transition-colors mb-4" style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)', boxShadow: '0 0 14px rgba(124,58,237,0.25)' }}>
              <ExternalLink size={12} />View portfolio
            </button>

            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { label: 'Posts', val: '1.2K' },
                { label: 'Likes', val: '348' },
                { label: 'Projects', val: '12' },
              ].map(stat => (
                <div key={stat.label} className="flex flex-col items-center py-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <p className="text-sm font-bold text-white">{stat.val}</p>
                  <p className="text-[10px] text-zinc-600 mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center gap-2">
              {[{ icon: <Github size={14} />, label: 'GitHub' }, { icon: <Twitter size={14} />, label: 'Twitter' }, { icon: <Globe size={14} />, label: 'Website' }].map(link => (
                <button key={link.label} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }} title={link.label}>
                  {link.icon}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
