export const currentUser = {
  id: 'u1',
  name: 'Minjun Kim',
  role: 'Frontend Developer',
  bio: 'Frontend developer focused on clean UX, performance, and maintainable code.',
  avatar: '',
  location: 'Seoul, Korea',
  career: '3 years',
  email: 'minjun@example.com',
  skills: ['React', 'TypeScript', 'Vite', 'Zustand', 'Tailwind CSS', 'Figma'],
  links: {
    github: 'github.com/minjun',
    notion: 'notion.so/minjun',
    blog: 'tistory.com/@minjun',
    figma: 'figma.com/@minjun',
  },
};

export const projects = [
  {
    id: 'p1',
    title: 'Portfolio Revamp',
    role: 'Frontend Lead',
    year: '2024',
    desc: 'Rebuilt a legacy portfolio app with a modern React architecture and improved performance.',
    stack: ['React', 'TypeScript', 'Zustand', 'Tailwind CSS'],
    thumbnail: 'photo-1460925895917-afdab827c52f',
    categories: [
      { id: 'c1', name: 'Overview', icon: 'W', count: 3 },
      { id: 'c2', name: 'Lessons', icon: 'L', count: 2 },
      { id: 'c3', name: 'Skills', icon: 'S', count: 1 },
      { id: 'c4', name: 'Process', icon: 'P', count: 4 },
      { id: 'c5', name: 'Results', icon: 'R', count: 2 },
      { id: 'c6', name: 'Links', icon: 'K', count: 1 },
    ],
  },
  {
    id: 'p2',
    title: 'AI Recommendation System',
    role: 'Full Stack Developer',
    year: '2023',
    desc: 'Built a personalized recommendation pipeline with an AI-assisted UI.',
    stack: ['Python', 'FastAPI', 'React', 'Redis', 'PostgreSQL'],
    thumbnail: 'photo-1551288049-bebda4e38f71',
    categories: [
      { id: 'c7', name: 'Overview', icon: 'W', count: 2 },
      { id: 'c8', name: 'Skills', icon: 'S', count: 3 },
      { id: 'c9', name: 'Results', icon: 'R', count: 1 },
    ],
  },
];

export const articles = [
  { id: 'a1', categoryId: 'c1', title: 'Performance tuning with React.memo and useMemo', date: '2024-03-15', readTime: '8 min', preview: 'Notes on memoization and when it helps.', },
  { id: 'a2', categoryId: 'c1', title: 'Cache strategy: SWR vs React Query', date: '2024-03-10', readTime: '6 min', preview: 'Comparing data cache strategies.', },
  { id: 'a3', categoryId: 'c1', title: 'Memory leak cleanup patterns', date: '2024-03-05', readTime: '5 min', preview: 'A quick cleanup checklist for effects.', },
];

export const exploreUsers = [
  { id: 'e1', name: 'Sarah Lee', role: 'UI/UX Designer', bio: 'Designing clean interfaces for product teams.', skills: ['Figma', 'Framer', 'React', 'CSS'], likes: 234, views: 1840, avatar: 'photo-1494790108377-be9c29b29330', thumbnail: 'photo-1558618666-fcd25c85cd64' },
  { id: 'e2', name: 'David Park', role: 'Backend Developer', bio: 'Building reliable APIs and scalable services.', skills: ['Node.js', 'Go', 'PostgreSQL', 'AWS'], likes: 189, views: 2100, avatar: 'photo-1507003211169-0a1dd7228f2d', thumbnail: 'photo-1460925895917-afdab827c52f' },
  { id: 'e3', name: 'Alice Choi', role: 'Data Scientist', bio: 'Turning data into decisions.', skills: ['Python', 'TensorFlow', 'SQL', 'Tableau'], likes: 312, views: 2780, avatar: 'photo-1438761681033-6461ffad8d80', thumbnail: 'photo-1551288049-bebda4e38f71' },
  { id: 'e4', name: 'Jisoo Park', role: 'Product Manager', bio: 'Connecting user value with product strategy.', skills: ['Notion', 'Figma', 'SQL', 'Analytics'], likes: 156, views: 1320, avatar: 'photo-1500648767791-00dcc994a43e', thumbnail: 'photo-1611532736597-de2d4265fba3' },
  { id: 'e5', name: 'Mina Kim', role: 'Motion Designer', bio: 'Crafting motion systems and brand identity.', skills: ['After Effects', 'Framer', 'Figma', 'GSAP'], likes: 421, views: 3200, avatar: 'photo-1534528741775-53994a69daeb', thumbnail: 'photo-1574169208507-84376144848b' },
  { id: 'e6', name: 'Ryan Seo', role: 'DevOps Engineer', bio: 'Making deployment boring and reliable.', skills: ['AWS', 'Docker', 'K8s', 'Terraform'], likes: 98, views: 890, avatar: 'photo-1472099645785-5658abf4ff4e', thumbnail: 'photo-1555421689-491a97ff2040' },
];

export const messages = [
  { id: 'm1', user: 'Sarah Lee', role: 'UI/UX Designer', lastMsg: 'The new layout looks great.', time: 'Now', unread: 2, avatar: 'photo-1494790108377-be9c29b29330' },
  { id: 'm2', user: 'Studio Team', role: 'Project partner', lastMsg: 'Can we review the AI flow later?', time: '1h ago', unread: 1, avatar: '' },
  { id: 'm3', user: 'David Park', role: 'Backend Developer', lastMsg: 'API schema looks good.', time: 'Yesterday', unread: 0, avatar: 'photo-1507003211169-0a1dd7228f2d' },
  { id: 'm4', user: 'Alice Choi', role: 'Data Scientist', lastMsg: 'Do you want the chart version?', time: '2d ago', unread: 0, avatar: 'photo-1438761681033-6461ffad8d80' },
];

export const chatMessages = [
  { id: 'cm1', from: 'other', text: 'Hi! I reviewed your portfolio draft.', time: '2:30 PM' },
  { id: 'cm2', from: 'other', text: 'The performance section is especially strong.', time: '2:31 PM' },
  { id: 'cm3', from: 'me', text: 'Thanks! I will polish the process section next.', time: '2:35 PM' },
  { id: 'cm4', from: 'me', text: 'I also want to improve the timeline hierarchy.', time: '2:35 PM' },
  { id: 'cm5', from: 'other', text: 'Great, let’s keep the visual language consistent.', time: '2:40 PM' },
];
