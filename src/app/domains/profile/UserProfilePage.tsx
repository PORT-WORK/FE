import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { exploreUsers } from '../../data/mockData';

export default function UserProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useMemo(() => exploreUsers.find(item => item.id === id) ?? exploreUsers[0], [id]);

  return (
    <div className="px-8 py-8 overflow-y-auto" style={{ background: '#050505', minHeight: '100%' }}>
      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate('/explore')} className="flex items-center gap-2 text-xs text-zinc-600 hover:text-zinc-400 transition-colors mb-5">
          <ArrowLeft size={12} />
          Back
        </button>

        <div className="rounded-3xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="h-48">
            <img src={`https://images.unsplash.com/${user.thumbnail}?w=1200&h=500&fit=crop&auto=format`} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="p-6 -mt-12 relative">
            <img src={`https://images.unsplash.com/${user.avatar}?w=200&h=200&fit=crop&crop=faces&auto=format`} alt="" className="w-24 h-24 rounded-2xl object-cover ring-4 ring-[#050505]" />
            <h1 className="text-2xl font-black text-white mt-4">{user.name}</h1>
            <p className="text-sm text-zinc-500">{user.role}</p>
            <p className="text-sm text-zinc-400 mt-4 leading-relaxed">{user.bio}</p>
            <div className="flex flex-wrap gap-2 mt-5">
              {user.skills.map(skill => <span key={skill} className="px-3 py-1.5 rounded-xl text-xs text-zinc-300" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>{skill}</span>)}
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
