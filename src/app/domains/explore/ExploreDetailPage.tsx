import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Bookmark, Heart, MessageSquare, Share2 } from 'lucide-react';
import { exploreUsers } from '../../data/mockData';
import { useApp } from '../../contexts/AppContext';

export default function ExploreDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useApp();

  const user = useMemo(() => exploreUsers.find(item => item.id === id) ?? exploreUsers[0], [id]);

  return (
    <div className="px-8 py-8" style={{ background: '#050505', minHeight: '100%' }}>
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate('/explore')} className="flex items-center gap-2 text-xs text-zinc-600 hover:text-zinc-400 transition-colors mb-5">
          <ArrowLeft size={12} />
          Back to explore
        </button>

        <div className="rounded-3xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="h-64 relative">
            <img src={`https://images.unsplash.com/${user.thumbnail}?w=1200&h=600&fit=crop&auto=format`} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(5,5,5,0.95), transparent 70%)' }} />
          </div>
          <div className="p-6 -mt-16 relative">
            <div className="flex items-end justify-between gap-4">
              <div className="flex items-end gap-4">
                <img src={`https://images.unsplash.com/${user.avatar}?w=200&h=200&fit=crop&crop=faces&auto=format`} alt="" className="w-24 h-24 rounded-2xl object-cover ring-4 ring-[#050505]" />
                <div>
                  <h1 className="text-2xl font-black text-white mb-1">{user.name}</h1>
                  <p className="text-sm text-zinc-500">{user.role}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2 rounded-xl text-xs text-zinc-300" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <Bookmark size={12} className="inline mr-1" />
                  Save
                </button>
                <button className="px-4 py-2 rounded-xl text-xs text-white" style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}>
                  <MessageSquare size={12} className="inline mr-1" />
                  {t('message_btn')}
                </button>
              </div>
            </div>

            <p className="text-sm text-zinc-400 mt-6 leading-relaxed">{user.bio}</p>

            <div className="flex flex-wrap gap-2 mt-5">
              {user.skills.map(skill => (
                <span key={skill} className="px-3 py-1.5 text-xs rounded-xl text-zinc-300" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  {skill}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3 mt-6">
              {[
                { label: 'Likes', value: user.likes },
                { label: 'Views', value: user.views },
                { label: 'Projects', value: 12 },
              ].map(stat => (
                <div key={stat.label} className="p-4 rounded-2xl text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <p className="text-xl font-black text-white">{stat.value}</p>
                  <p className="text-xs text-zinc-600 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            <button className="mt-6 px-4 py-2 rounded-xl text-xs text-zinc-300" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <Share2 size={12} className="inline mr-1" />
              Share profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
