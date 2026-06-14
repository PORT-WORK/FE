import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import {
  Edit3,
  ExternalLink,
  Github,
  Globe,
  Image,
  Mic,
  MoreHorizontal,
  Paperclip,
  Search,
  Send,
  Square,
  Trash2,
  Twitter,
  X,
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import EmptyStatePanel from '../../components/EmptyStatePanel';
import { getCurrentUserId, subscribeRealtime } from '../../api/client';
import { fetchPublicProfile, listMessages, markMessageRead, sendMessage, type ConversationCard, type MessageItem } from '../../api/contentApi';

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

function formatDateKey(value?: string | null) {
  if (!value) return 'Today';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Today';
  return date.toLocaleDateString();
}

function DateSeparator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
      <span className="text-[10px] text-zinc-700 px-2 flex-shrink-0">{label}</span>
      <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
    </div>
  );
}

function buildInitialChats(card?: ConversationCard | null): ChatMsg[] {
  if (!card) return [];
  return [
    {
      id: `seed-${card.id}`,
      from: 'them',
      text: card.lastMsg,
      time: card.time || 'Now',
      date: formatDateKey(card.createdAt),
      type: 'text',
    },
  ];
}

export default function MessagesPage() {
  const { t, language } = useApp();
  const ko = language === 'ko';
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const targetUserId = Number(searchParams.get('userId') || 0);
  const [conversations, setConversations] = useState<ConversationCard[]>([]);
  const [active, setActive] = useState<string>('');
  const [input, setInput] = useState('');
  const [chats, setChats] = useState<ChatMsg[]>([]);
  const [showProfile, setShowProfile] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [recording, setRecording] = useState(false);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const activeConversationIdRef = useRef<string>('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const recTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const recSecRef = useRef(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const reloadConversations = async (keepActive = true) => {
    const data = await listMessages();
    setConversations(data);
    setLoadError(null);
    if (!keepActive) {
      setActive(data[0]?.id ?? '');
    }
  };

  useEffect(() => {
    let alive = true;
    void listMessages()
      .then(async data => {
        if (!alive) return;
        let nextData = data;
        if (targetUserId > 0 && !data.some(item => item.userId === targetUserId)) {
          const profile = await fetchPublicProfile(targetUserId);
          nextData = [{
            id: String(targetUserId),
            latestMessageId: 0,
            userId: targetUserId,
            user: profile.name,
            role: profile.location || 'Portfolio contact',
            lastMsg: ko ? '새 대화를 시작하세요.' : 'Start a new conversation.',
            time: '',
            createdAt: new Date().toISOString(),
            unread: 0,
            avatar: profile.profileImageUrl || '',
          }, ...data];
        }
        setConversations(nextData);
        setLoadError(null);
        setActive(targetUserId > 0 ? String(targetUserId) : nextData[0]?.id ?? '');
      })
      .catch(() => {
        if (!alive) return;
        setConversations([]);
        setActive('');
        setChats([]);
        setLoadError('메시지를 불러오지 못했습니다.');
      });

    return () => {
      alive = false;
    };
  }, [ko, targetUserId]);

  const activeCard = useMemo(
    () => conversations.find(item => item.id === active) || null,
    [active, conversations],
  );

  useEffect(() => {
    if (!activeCard) {
      setChats([]);
      activeConversationIdRef.current = '';
      return;
    }

    if (activeConversationIdRef.current !== activeCard.id) {
      activeConversationIdRef.current = activeCard.id;
      setChats(buildInitialChats(activeCard));
    }
  }, [activeCard]);

  useEffect(() => {
    const unsubscribe = subscribeRealtime(event => {
      if (event.type !== 'message' && event.type !== 'notification') return;
      if (event.type === 'notification') {
        void reloadConversations(true).catch(() => undefined);
        return;
      }
      const payload = event.data as MessageItem;
      if (!payload || typeof payload !== 'object' || !('senderId' in payload)) return;

      void reloadConversations(true).catch(() => undefined);

      const currentUserId = getCurrentUserId();

      if (activeCard && payload.senderId === currentUserId && payload.receiverId === activeCard.userId) {
        setChats(prev => {
          if (prev.some(msg => msg.id === String(payload.id))) return prev;
          return [...prev, {
            id: String(payload.id),
            from: 'me',
            text: payload.content,
            time: 'Just now',
            type: 'text',
          }];
        });
        return;
      }

      if (activeCard && payload.senderId === activeCard.userId && payload.receiverId === currentUserId) {
        setChats(prev => {
          if (prev.some(msg => msg.id === String(payload.id))) return prev;
          return [...prev, {
            id: String(payload.id),
            from: 'them',
            text: payload.content,
            time: 'Just now',
            type: 'text',
          }];
        });
        void markMessageRead(payload.id).catch(() => undefined);
      }
    });

    return unsubscribe;
  }, [activeCard]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats]);

  useEffect(() => {
    if (!recording) {
      if (recTimer.current) clearInterval(recTimer.current);
      return;
    }
    recSecRef.current = 0;
    recTimer.current = setInterval(() => {
      recSecRef.current += 1;
    }, 1000);
    return () => {
      if (recTimer.current) clearInterval(recTimer.current);
    };
  }, [recording]);

  useEffect(() => () => {
    if (recTimer.current) clearInterval(recTimer.current);
    streamRef.current?.getTracks().forEach(track => track.stop());
  }, []);

  useEffect(() => {
    if (activeCard) {
      void markMessageRead(activeCard.latestMessageId).catch(() => undefined);
    }
  }, [activeCard?.latestMessageId]);

  const send = async () => {
    if (!input.trim() || !activeCard) return;
    const text = input.trim();
    setInput('');
    try {
      await sendMessage(activeCard.userId, text);
      setLoadError(null);
    } catch {
      setLoadError('메시지를 전송하지 못했습니다.');
    }
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
        recSecRef.current = 0;
      };

      recorder.start();
      setRecording(true);
    } catch {
      setRecordingError('마이크 권한이 필요합니다.');
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

  const handleFile = (event: ChangeEvent<HTMLInputElement>, type: 'image' | 'file') => {
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

  if (conversations.length === 0 && !targetUserId) {
    return (
      <div className="flex h-full items-center justify-center px-6" style={{ background: '#050505' }}>
        <div className="w-full max-w-2xl">
          <EmptyStatePanel
            emoji="💬"
            title={ko ? '대화를 시작할 사람이 없습니다' : 'No one to start a conversation with'}
            description={ko ? '연결된 사람이 없으면 메시지 목록이 비어 보입니다.' : 'When there are no connections, the inbox stays empty.'}
            accent="violet"
          />
          <div className="mt-4 flex justify-center">
            <button
              onClick={() => navigate('/explore')}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}
            >
              {ko ? '탐색으로 이동' : 'Go to explore'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden relative" style={{ background: '#050505' }}>
      <div className="flex-shrink-0 flex flex-col" style={{ width: '260px', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="p-4">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
            <input
              placeholder={t('msg_search')}
              className="w-full pl-8 pr-3 py-2 text-xs text-zinc-300 placeholder-zinc-700 rounded-xl focus:outline-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-2">
          {loadError && (
            <div className="px-3 pb-2">
              <div className="rounded-2xl px-3 py-2 text-xs text-red-300" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)' }}>
                {loadError}
              </div>
            </div>
          )}
          {conversations.map(item => (
            <button
              key={item.id}
              onClick={() => { setActive(item.id); setShowProfile(false); }}
              className="w-full flex items-start gap-3 px-3 py-3 rounded-xl mb-0.5 transition-all text-left relative overflow-hidden"
              style={{ background: active === item.id ? 'rgba(255,255,255,0.05)' : 'transparent' }}
            >
              {active === item.id && <div className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full" style={{ background: '#7c3aed' }} />}
              <div className="relative flex-shrink-0">
                {item.avatar
                  ? <img src={item.avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
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
        {activeCard && (
          <div className="flex-shrink-0 flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <button className="flex items-center gap-3 hover:opacity-80 transition-opacity" onClick={() => setShowProfile(prev => !prev)}>
              {activeCard.avatar
                ? <img src={activeCard.avatar} alt="" className="w-8 h-8 rounded-full object-cover ring-2 ring-violet-500/30" />
                : <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ring-2 ring-violet-500/30" style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}>{activeCard.user[0] || '?'}</div>}
              <div className="text-left">
                <p className="text-sm font-semibold text-white">{activeCard.user}</p>
                <p className="text-xs text-zinc-600">{activeCard.role}</p>
              </div>
            </button>
            <button className="p-2 text-zinc-600 hover:text-zinc-300 rounded-lg hover:bg-white/[0.04] transition-colors">
              <MoreHorizontal size={15} />
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
          {!activeCard ? (
            <div className="h-full min-h-[420px] flex items-center justify-center">
              <div className="max-w-sm w-full rounded-[28px] p-8 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-lg font-bold text-white">??붾? ?쒖옉???щ엺???놁뒿?덈떎</p>
                <p className="text-sm text-zinc-600 mt-2">?곌껐???щ엺???놁쑝硫?諛붾줈 硫붿떆吏瑜?蹂대궪 ???놁뒿?덈떎.</p>
              </div>
            </div>
          ) : renderedChats.map(item => {
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
                        className="w-full px-3 py-2 rounded-2xl text-sm text-zinc-200 outline-none resize-none"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                      />
                      <button onClick={saveEdit} className="px-3 py-2 rounded-xl text-xs text-violet-400" style={{ border: '1px solid rgba(124,58,237,0.3)' }}>
                        Save
                      </button>
                    </div>
                  ) : (
                    <div className={`relative rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${msg.from === 'me' ? 'rounded-tr-sm' : 'rounded-tl-sm'}`} style={{ background: msg.from === 'me' ? 'linear-gradient(135deg,rgba(124,58,237,0.25),rgba(37,99,235,0.25))' : 'rgba(255,255,255,0.04)', border: `1px solid ${msg.from === 'me' ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.06)'}`, color: '#e4e4e7' }}>
                      {msg.text}
                      {msg.edited && <span className="ml-2 text-[10px] text-zinc-600">(edited)</span>}
                      {msg.from === 'me' && (
                        <div className="absolute -top-2 right-2 flex items-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                          <button onClick={() => { setEditId(msg.id); setEditText(msg.text); }} className="p-1 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.05]">
                            <Edit3 size={11} />
                          </button>
                          <button onClick={() => deleteMsg(msg.id)} className="p-1 rounded-md text-zinc-500 hover:text-red-400 hover:bg-red-500/10">
                            <Trash2 size={11} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  {msg.type === 'voice' && msg.fileUrl && <audio controls src={msg.fileUrl} className="mt-2 w-full max-w-[280px]" />}
                  {msg.type === 'image' && msg.fileUrl && <img src={msg.fileUrl} alt={msg.fileName || ''} className="mt-2 rounded-2xl max-w-[280px]" />}
                </div>
              </div>
            );
          })}
          {recording && (
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}>
                <Mic size={14} className="text-white" />
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

        <div className="flex-shrink-0 px-6 pb-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-3 p-3 rounded-2xl transition-all" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <button onClick={() => imgInputRef.current?.click()} className="flex-shrink-0 p-2 rounded-xl text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.04] transition-colors">
                <Image size={14} />
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="flex-shrink-0 p-2 rounded-xl text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.04] transition-colors">
                <Paperclip size={14} />
              </button>
              <button onClick={recording ? stopRecording : startRecording} className={`flex-shrink-0 p-2 rounded-xl transition-colors ${recording ? 'text-red-400 hover:bg-red-500/10' : 'text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.04]'}`}>
                {recording ? <Square size={14} /> : <Mic size={14} />}
              </button>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
                placeholder={t('msg_placeholder')}
                rows={3}
                className="flex-1 min-h-[76px] bg-transparent text-sm text-zinc-300 placeholder-zinc-700 outline-none resize-none"
                onInput={e => {
                  const el = e.target as HTMLTextAreaElement;
                  el.style.height = 'auto';
                  el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
                }}
              />
              <button onClick={() => void send()} disabled={!input.trim()} className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all" style={{ background: input.trim() ? 'linear-gradient(135deg,#7c3aed,#2563eb)' : 'rgba(255,255,255,0.05)', boxShadow: input.trim() ? '0 0 14px rgba(124,58,237,0.4)' : 'none' }}>
                <Send size={13} className={input.trim() ? 'text-white' : 'text-zinc-700'} />
              </button>
              <input ref={imgInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleFile(e, 'image')} />
              <input ref={fileInputRef} type="file" className="hidden" onChange={e => handleFile(e, 'file')} />
            </div>
            {recordingError && <p className="mt-2 text-xs text-red-400">{recordingError}</p>}
          </div>
        </div>
      </div>

      {showProfile && activeCard && (
        <div className="fixed inset-0 z-[200] flex items-center justify-end" onClick={() => setShowProfile(false)} style={{ background: 'rgba(0,0,0,0.35)' }}>
          <div className="h-full w-[320px] p-5" style={{ background: '#0b0b0b', borderLeft: '1px solid rgba(255,255,255,0.06)' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-zinc-400">{t('msg_profile')}</span>
              <button onClick={() => setShowProfile(false)} className="text-zinc-600 hover:text-zinc-300"><X size={14} /></button>
            </div>
            <div className="flex flex-col items-center text-center">
              {activeCard.avatar ? <img src={activeCard.avatar} alt="" className="w-20 h-20 rounded-2xl object-cover mb-4" /> : <div className="w-20 h-20 rounded-2xl mb-4 flex items-center justify-center text-white font-black" style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}>{activeCard.user[0]}</div>}
              <h3 className="text-lg font-bold text-white">{activeCard.user}</h3>
              <p className="text-xs text-zinc-600 mt-1">{activeCard.role}</p>
              <button onClick={() => navigate(`/explore/${activeCard.userId}`)} className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-medium text-white transition-colors mb-4 mt-4" style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)', boxShadow: '0 0 14px rgba(124,58,237,0.25)' }}>
                <ExternalLink size={13} />
                View profile
              </button>
              <div className="w-full space-y-2.5 text-left">
                {[
                  { icon: <Github size={14} />, label: 'GitHub' },
                  { icon: <Twitter size={14} />, label: 'Twitter' },
                  { icon: <Globe size={14} />, label: 'Website' },
                ].map(link => (
                  <div key={link.label} className="flex items-center gap-2.5 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="text-zinc-600">{link.icon}</div>
                    <span className="text-xs text-zinc-400">{link.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


