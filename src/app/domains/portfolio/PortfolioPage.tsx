import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Plus, ChevronRight, Hash, FileText, Search, X, Check, Edit2, Trash2 } from 'lucide-react';
import { articles as MOCK_ARTICLES, projects as MOCK_PROJECTS } from '../../data/mockData';
import { useApp } from '../../contexts/AppContext';

type View = 'projects' | 'categories' | 'articles';

const STORAGE_KEY = 'port_articles';
const PROJ_KEY = 'port_projects';

const TEMPLATE_CATS = ['Overview', 'Lessons', 'Skills', 'Process', 'Results', 'Links'];

function NewProjectModal({ onClose, onSave }: { onClose: () => void; onSave: (p: any) => void }) {
  const [title, setTitle] = useState('');
  const [role, setRole] = useState('');
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [desc, setDesc] = useState('');
  const [stack, setStack] = useState('');

  const save = () => {
    if (!title.trim()) return;
    onSave({
      id: `p-${Date.now()}`,
      title: title.trim(),
      role: role.trim() || 'Developer',
      year: year.trim(),
      desc: desc.trim(),
      stack: stack.split(',').map(item => item.trim()).filter(Boolean),
      thumbnail: 'photo-1517180102446-f3ece451e9d8',
      categories: TEMPLATE_CATS.map((name, idx) => ({ id: `c-${idx}`, name, icon: name[0], count: 0 })),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }} onClick={onClose}>
      <div className="w-full max-w-md mx-4 rounded-3xl overflow-hidden shadow-2xl" style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.1)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div>
            <p className="text-sm font-bold text-white">New project</p>
            <p className="text-xs text-zinc-600 mt-0.5">Create a new portfolio workspace.</p>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-700 hover:text-zinc-400 rounded-xl transition-colors"><X size={15} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Project title" className="w-full px-3 py-2.5 rounded-xl text-sm text-zinc-200 placeholder-zinc-700 outline-none" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
          <div className="grid grid-cols-2 gap-3">
            <input value={role} onChange={e => setRole(e.target.value)} placeholder="Role" className="w-full px-3 py-2.5 rounded-xl text-sm text-zinc-200 placeholder-zinc-700 outline-none" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
            <input value={year} onChange={e => setYear(e.target.value)} placeholder="Year" className="w-full px-3 py-2.5 rounded-xl text-sm text-zinc-200 placeholder-zinc-700 outline-none" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
          </div>
          <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Description" rows={2} className="w-full px-3 py-2.5 rounded-xl text-sm text-zinc-200 placeholder-zinc-700 outline-none resize-none" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
          <input value={stack} onChange={e => setStack(e.target.value)} placeholder="React, TypeScript, Node.js" className="w-full px-3 py-2.5 rounded-xl text-sm text-zinc-200 placeholder-zinc-700 outline-none" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
        </div>
        <div className="px-6 pb-6 flex items-center gap-2.5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm text-zinc-500 transition-colors hover:text-zinc-300" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>Cancel</button>
          <button onClick={save} disabled={!title.trim()} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40" style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}>Create</button>
        </div>
      </div>
    </div>
  );
}

export default function PortfolioPage() {
  const navigate = useNavigate();
  const { t } = useApp();
  const [view, setView] = useState<View>('projects');
  const [allProjects, setAllProjects] = useState<any[]>(() => MOCK_PROJECTS);
  const [activeProject, setActiveProject] = useState(allProjects[0]);
  const [activeCategory, setActiveCategory] = useState('');
  const [articles, setArticles] = useState<any[]>(() => MOCK_ARTICLES);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [newProjModal, setNewProjModal] = useState(false);

  useEffect(() => {
    try {
      const storedArticles = localStorage.getItem(STORAGE_KEY);
      if (storedArticles) setArticles(prev => [...prev, ...JSON.parse(storedArticles)]);
      const storedProjects = localStorage.getItem(PROJ_KEY);
      if (storedProjects) setAllProjects(prev => [...prev, ...JSON.parse(storedProjects)]);
    } catch {
      // ignore
    }
  }, []);

  const dynamicCategories = useMemo(() => {
    const base = activeProject?.categories ?? [];
    return base;
  }, [activeProject]);

  const filteredArticles = articles.filter(article => (!activeCategory || article.category === activeCategory) && (!search || article.title.toLowerCase().includes(search.toLowerCase())));

  const deleteArticle = (id: string) => {
    const next = articles.filter(article => article.id !== id);
    setArticles(next);
    setDeleteConfirm(null);
  };

  const handleNewProject = (project: any) => {
    setAllProjects(prev => [...prev, project]);
    setActiveProject(project);
    setView('categories');
  };

  const goToEditor = (category?: string) => navigate('/portfolio/editor', { state: { fromCat: category || activeCategory } });

  return (
    <div className="h-full flex" style={{ background: '#050505' }}>
      <div className="flex-1 px-8 py-8 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-600 mb-1">
              <span>Portfolio</span>
              {view !== 'projects' && <><ChevronRight size={10} /><span className="text-zinc-400 cursor-pointer hover:text-zinc-200" onClick={() => setView('categories')}>{activeProject?.title}</span></>}
              {view === 'articles' && <><ChevronRight size={10} /><span className="text-zinc-300">{activeCategory || 'All articles'}</span></>}
            </div>
            <h2 className="text-xl font-bold text-white">{view === 'projects' ? 'Projects' : view === 'categories' ? activeProject?.title : activeCategory || 'All articles'}</h2>
          </div>
          <div className="flex items-center gap-2">
            {view === 'articles' && <button onClick={() => goToEditor(activeCategory)} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-xl" style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}><Plus size={14} />{t('portfolio_new_article')}</button>}
            {view === 'projects' && <button onClick={() => setNewProjModal(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-xl" style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}><Plus size={14} />{t('portfolio_new_project')}</button>}
          </div>
        </div>

        {view === 'projects' && (
          <div className="grid grid-cols-2 gap-4">
            {allProjects.map(project => (
              <div key={project.id} onClick={() => { setActiveProject(project); setActiveCategory(''); setView('categories'); }} className="rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-0.5 group" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="h-32 overflow-hidden"><img src={`https://images.unsplash.com/${project.thumbnail}?w=600&h=200&fit=crop&auto=format`} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /></div>
                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold text-white mb-0.5">{project.title}</p>
                      <p className="text-xs text-zinc-500">{project.role} • {project.year}</p>
                    </div>
                    <span className="text-[10px] text-zinc-600 mt-0.5">{project.categories.length} categories</span>
                  </div>
                  <p className="text-xs text-zinc-600 mb-3 line-clamp-2 leading-relaxed">{project.desc}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {project.stack.slice(0, 4).map((skill: string) => <span key={skill} className="px-2 py-0.5 text-[10px] text-zinc-500 rounded-md" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>{skill}</span>)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {view === 'categories' && (
          <div>
            <button onClick={() => setView('projects')} className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-400 transition-colors mb-5">{t('portfolio_back_projects')}</button>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {dynamicCategories.map((category: any) => (
                <button key={category.id} onClick={() => { setActiveCategory(category.name); setView('articles'); }} className="p-5 rounded-2xl text-left transition-all duration-300 hover:-translate-y-0.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 text-zinc-400" style={{ background: 'rgba(255,255,255,0.06)' }}>{category.icon}</div>
                  <p className="text-sm font-semibold text-white mb-0.5">{category.name}</p>
                  <p className="text-xs text-zinc-600">{articles.filter(article => article.category === category.name).length} articles</p>
                </button>
              ))}
              <button onClick={() => { setActiveCategory(''); setView('articles'); }} className="p-5 rounded-2xl text-left transition-all hover:bg-white/[0.02]" style={{ border: '1px dashed rgba(255,255,255,0.07)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: 'rgba(255,255,255,0.04)' }}><Hash size={18} className="text-zinc-600" /></div>
                <p className="text-sm font-semibold text-zinc-500">{t('portfolio_all')}</p>
                <p className="text-xs text-zinc-700">{articles.length} articles</p>
              </button>
            </div>
          </div>
        )}

        {view === 'articles' && (
          <div>
            <div className="flex items-center gap-3 mb-5">
              <button onClick={() => setView('categories')} className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">{t('portfolio_back_categories')}</button>
              <div className="relative flex-1 max-w-xs">
                <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('portfolio_search')} className="w-full pl-8 pr-3 py-1.5 text-xs text-zinc-300 placeholder-zinc-700 rounded-xl focus:outline-none" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }} />
              </div>
            </div>
            <div className="space-y-2">
              {filteredArticles.map(article => (
                <div key={article.id} className="flex items-center gap-4 p-4 rounded-xl transition-all group" style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(124,58,237,0.1)' }}>
                    <FileText size={14} className="text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => goToEditor(article.category)}>
                    <p className="text-sm font-medium text-white mb-0.5 truncate">{article.title}</p>
                    <p className="text-xs text-zinc-600">{article.category} • {article.date} • {article.readTime}</p>
                    {article.preview && <p className="text-xs text-zinc-700 mt-0.5 truncate">{article.preview}</p>}
                  </div>
                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => goToEditor(article.category)} className="p-2 rounded-lg text-zinc-600 hover:text-violet-400 hover:bg-violet-500/10 transition-all"><Edit2 size={13} /></button>
                    {deleteConfirm === article.id ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => deleteArticle(article.id)} className="px-2 py-1 rounded-lg text-[10px] text-red-400 hover:bg-red-500/10 transition-all">{t('delete')}</button>
                        <button onClick={() => setDeleteConfirm(null)} className="px-2 py-1 rounded-lg text-[10px] text-zinc-600 hover:bg-white/[0.05] transition-all">{t('cancel')}</button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteConfirm(article.id)} className="p-2 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-all"><Trash2 size={13} /></button>
                    )}
                  </div>
                  <ChevronRight size={14} className="text-zinc-700 flex-shrink-0 group-hover:text-zinc-500 transition-colors" />
                </div>
              ))}
              {filteredArticles.length === 0 && (
                <div className="text-center py-12 text-zinc-700">
                  <FileText size={32} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">{t('portfolio_empty')}</p>
                  <button onClick={() => goToEditor(activeCategory)} className="mt-3 text-xs text-violet-500 hover:text-violet-400 transition-colors">{t('portfolio_first')}</button>
                </div>
              )}
              <button onClick={() => goToEditor(activeCategory)} className="flex items-center gap-2 p-4 rounded-xl text-xs text-zinc-700 hover:text-zinc-500 transition-colors w-full" style={{ border: '1px dashed rgba(255,255,255,0.06)' }}>
                <Plus size={13} />{t('portfolio_new_article')}
              </button>
            </div>
          </div>
        )}
      </div>

      {newProjModal && <NewProjectModal onClose={() => setNewProjModal(false)} onSave={handleNewProject} />}
    </div>
  );
}
