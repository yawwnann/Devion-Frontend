import {
  mockUser,
  mockPages,
  mockBlocks,
  mockGitHubRepos,
  mockAnalytics,
  mockStats,
  mockProjects,
} from "./mockData";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const mockApi = {
  // Auth
  async login(email: string, password: string) {
    await delay(500);
    return { accessToken: "mock-jwt-token-123" };
  },

  async register(name: string, email: string, password: string) {
    await delay(500);
    return { accessToken: "mock-jwt-token-123" };
  },

  async getMe() {
    await delay(300);
    return mockUser;
  },

  // Pages
  async getPages() {
    await delay(300);
    return mockPages;
  },

  async getPage(id: string) {
    await delay(300);
    const page = mockPages.find((p) => p.id === id);
    if (!page) throw new Error("Page not found");
    return page;
  },

  async createPage(data: any) {
    await delay(500);
    const newPage = {
      id: `page-${Date.now()}`,
      userId: mockUser.id,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockPages.push(newPage);
    return newPage;
  },

  async updatePage(id: string, data: any) {
    await delay(500);
    const page = mockPages.find((p) => p.id === id);
    if (!page) throw new Error("Page not found");
    Object.assign(page, data, { updatedAt: new Date().toISOString() });
    return page;
  },

  async deletePage(id: string) {
    await delay(500);
    const index = mockPages.findIndex((p) => p.id === id);
    if (index === -1) throw new Error("Page not found");
    mockPages.splice(index, 1);
    return { success: true };
  },

  // Blocks
  async getBlocks(pageId: string) {
    await delay(300);
    return mockBlocks.filter((b) => b.pageId === pageId);
  },

  async createBlock(data: any) {
    await delay(500);
    const newBlock = {
      id: `block-${Date.now()}`,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockBlocks.push(newBlock);
    return newBlock;
  },

  async updateBlock(id: string, data: any) {
    await delay(500);
    const block = mockBlocks.find((b) => b.id === id);
    if (!block) throw new Error("Block not found");
    Object.assign(block, data, { updatedAt: new Date().toISOString() });
    return block;
  },

  async deleteBlock(id: string) {
    await delay(500);
    const index = mockBlocks.findIndex((b) => b.id === id);
    if (index === -1) throw new Error("Block not found");
    mockBlocks.splice(index, 1);
    return { success: true };
  },

  // GitHub
  async getGitHubRepos() {
    await delay(300);
    try {
      // Fetch real data from GitHub API using current user's username
      const username = mockUser.githubUsername || "yawwnann";
      const response = await fetch(
        `https://api.github.com/users/${username}/repos`
      );
      const repos = await response.json();

      // Transform to our format
      return repos.map((repo: any) => ({
        id: repo.id.toString(),
        userId: mockUser.id,
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        url: repo.html_url,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        language: repo.language,
        isPrivate: repo.private,
        createdAt: repo.created_at,
        updatedAt: repo.updated_at,
      }));
    } catch (error) {
      console.error("Failed to fetch GitHub repos:", error);
      // Fallback to mock data
      return mockGitHubRepos;
    }
  },

  async syncGitHubRepos() {
    await delay(1000);
    const repos = await this.getGitHubRepos();
    return { synced: repos.length };
  },

  async setGitHubUsername(username: string) {
    await delay(300);
    mockUser.githubUsername = username;
    return { success: true };
  },

  // Analytics
  async getAnalytics(pageId: string) {
    await delay(300);
    return mockAnalytics.filter((a) => a.pageId === pageId);
  },

  async getStats() {
    await delay(300);
    return mockStats;
  },

  async trackEvent(pageId: string, event: string, metadata: any) {
    await delay(200);
    const newEvent = {
      id: `analytics-${Date.now()}`,
      pageId,
      event,
      metadata,
      createdAt: new Date().toISOString(),
    };
    mockAnalytics.push(newEvent);
    return newEvent;
  },

  // Projects
  async getProjects() {
    await delay(300);
    return mockProjects;
  },

  async getProject(id: string) {
    await delay(300);
    const project = mockProjects.find((p) => p.id === id);
    if (!project) throw new Error("Project not found");
    return project;
  },

  async createProject(data: any) {
    await delay(500);
    const newProject = {
      id: `proj-${Date.now()}`,
      userId: mockUser.id,
      ...data,
      orderNum: mockProjects.length + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockProjects.push(newProject);
    return newProject;
  },

  async updateProject(id: string, data: any) {
    await delay(500);
    const project = mockProjects.find((p) => p.id === id);
    if (!project) throw new Error("Project not found");
    Object.assign(project, data, { updatedAt: new Date().toISOString() });
    return project;
  },

  async deleteProject(id: string) {
    await delay(500);
    const index = mockProjects.findIndex((p) => p.id === id);
    if (index === -1) throw new Error("Project not found");
    mockProjects.splice(index, 1);
    return { success: true };
  },

  async getProjectStats() {
    await delay(300);
    return {
      total: mockProjects.length,
      todo: mockProjects.filter((p) => p.status === "TODO").length,
      inProgress: mockProjects.filter((p) => p.status === "IN_PROGRESS").length,
      done: mockProjects.filter((p) => p.status === "DONE").length,
    };
  },
};
