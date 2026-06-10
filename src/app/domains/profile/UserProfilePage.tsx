import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { fetchPublicProfile, type PublicUserProfile } from '../../api/contentApi';

export default function UserProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<PublicUserProfile | null>(null);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    fetchPublicProfile(Number(id)).then(profile => {
      if (alive) setUser(profile);
    });
    return () => {
      alive = false;
    };
  }, [id]);

  return (
    <div className="px-8 py-8 overflow-y-auto" style={{ background: '#050505', minHeight: '100%' }}>
      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate('/explore')} className="flex items-center gap-2 text-xs text-zinc-600 hover:text-zinc-400 transition-colors mb-5">
          <ArrowLeft size={12} />
          Back
        </button>

        <div className="rounded-3xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="h-48" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(37,99,235,0.2))' }} />
          <div className="p-6 -mt-12 relative">
            <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-black text-white ring-4 ring-[#050505]" style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}>
              {(user?.name || 'U').slice(0, 1).toUpperCase()}
            </div>
            <h1 className="text-2xl font-black text-white mt-4">{user?.name || 'Loading...'}</h1>
            <p className="text-sm text-zinc-500">{user?.location || 'Location not set'}</p>
            <p className="text-sm text-zinc-400 mt-4 leading-relaxed">{user?.bio || 'No bio available.'}</p>
            <div className="flex flex-wrap gap-2 mt-5">
              {['React', 'TypeScript', 'Notion'].map(skill => <span key={skill} className="px-3 py-1.5 rounded-xl text-xs text-zinc-300" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>{skill}</span>)}
            </div>
            <button className="mt-6 px-4 py-2 rounded-xl text-xs text-white" style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}>
              <MessageSquare size={12} className="inline mr-1" />
              Message
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
