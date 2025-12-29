export const mockUser = {
  id: "mock-user-123",
  email: "demo@devion.com",
  name: "Nanta",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=demo",
  githubUsername: "yawwnann",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const mockPages = [
  {
    id: "page-1",
    userId: "mock-user-123",
    slug: "my-portfolio",
    title: "My Portfolio",
    description: "Welcome to my developer portfolio",
    icon: "i-lucide-home",
    isPublished: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "page-2",
    userId: "mock-user-123",
    slug: "projects",
    title: "My Projects",
    description: "Check out my latest projects",
    icon: "i-lucide-folder",
    isPublished: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "page-3",
    userId: "mock-user-123",
    slug: "about-me",
    title: "About Me",
    description: "Learn more about me",
    icon: "i-lucide-user",
    isPublished: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

export const mockBlocks = [
  {
    id: "block-1",
    pageId: "page-1",
    type: "HERO",
    content: {
      title: "Hi, I'm Demo User",
      subtitle: "Full Stack Developer",
      description: "Building amazing web applications",
    },
    order: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "block-2",
    pageId: "page-1",
    type: "TEXT",
    content: {
      text: "I love creating beautiful and functional web experiences.",
    },
    order: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const mockGitHubRepos = [
  {
    id: "repo-1",
    userId: "mock-user-123",
    name: "awesome-project",
    fullName: "demouser/awesome-project",
    description: "An awesome project built with React and TypeScript",
    url: "https://github.com/yawwnann/awesome-project",
    stars: 42,
    forks: 8,
    language: "TypeScript",
    isPrivate: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "repo-2",
    userId: "mock-user-123",
    name: "cool-api",
    fullName: "demouser/cool-api",
    description: "RESTful API with NestJS",
    url: "https://github.com/demouser/cool-api",
    stars: 28,
    forks: 5,
    language: "JavaScript",
    isPrivate: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const mockAnalytics = [
  // Last 30 days data
  ...Array.from({ length: 30 }, (_, i) => ({
    id: `analytics-${i}`,
    pageId: "page-1",
    event: "PAGE_VIEW",
    metadata: {
      userAgent: "Mozilla/5.0",
      referrer: ["google.com", "twitter.com", "direct", "github.com"][
        Math.floor(Math.random() * 4)
      ],
      country: ["US", "ID", "SG", "JP"][Math.floor(Math.random() * 4)],
    },
    createdAt: new Date(Date.now() - i * 86400000).toISOString(),
  })),
];

export const mockStats = {
  totalViews: 1247,
  totalPages: 3,
  totalProjects: 8,
  githubStars: 156,
  viewsChange: 12.5,
  pagesChange: 0,
  projectsChange: 25,
  starsChange: 8.3,
  topPages: [
    { slug: "my-portfolio", views: 856, change: 15.2 },
    { slug: "projects", views: 234, change: -5.3 },
    { slug: "about", views: 157, change: 22.1 },
  ],
  viewsByDay: Array.from({ length: 7 }, (_, i) => ({
    date: new Date(Date.now() - (6 - i) * 86400000).toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric",
      }
    ),
    views: Math.floor(Math.random() * 100) + 50,
  })),
  viewsByCountry: [
    { country: "United States", code: "US", views: 456, percentage: 36.6 },
    { country: "Indonesia", code: "ID", views: 312, percentage: 25.0 },
    { country: "Singapore", code: "SG", views: 234, percentage: 18.8 },
    { country: "Japan", code: "JP", views: 156, percentage: 12.5 },
    { country: "Others", code: "XX", views: 89, percentage: 7.1 },
  ],
  referrers: [
    { source: "Google", visits: 523, percentage: 41.9 },
    { source: "Direct", visits: 312, percentage: 25.0 },
    { source: "Twitter", visits: 234, percentage: 18.8 },
    { source: "GitHub", visits: 178, percentage: 14.3 },
  ],
  devices: [
    { type: "Desktop", count: 687, percentage: 55.1 },
    { type: "Mobile", count: 436, percentage: 35.0 },
    { type: "Tablet", count: 124, percentage: 9.9 },
  ],
};

export const mockProjects = [
  {
    id: "proj-1",
    userId: "mock-user-123",
    name: "INFOGRAFIS",
    order: "ANAK PRIO",
    status: "DONE",
    payment: "BRIMO",
    information: "Instagram post design",
    orderNum: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "proj-2",
    userId: "mock-user-123",
    name: "POSTER",
    order: "ANAK PRIO",
    status: "DONE",
    payment: "BRIMO",
    information: "Event poster",
    orderNum: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "proj-3",
    userId: "mock-user-123",
    name: "DESAIN KAOS",
    order: "EVENT UKM TARI",
    status: "DONE",
    payment: "FREE",
    information: "T-shirt design for dance event",
    orderNum: 8,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
