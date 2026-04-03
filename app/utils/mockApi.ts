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
  async login(_email: string, _password: string) {
    await delay(500);
    return {
      accessToken: "mock-jwt-token-123",
      refreshToken: "mock-refresh-token-456",
    };
  },

  async register(_name: string, _email: string, _password: string) {
    await delay(500);
    return {
      accessToken: "mock-jwt-token-123",
      refreshToken: "mock-refresh-token-456",
    };
  },

  async refresh(_refreshToken: string) {
    await delay(300);
    return {
      accessToken: "mock-jwt-token-refreshed-789",
      refreshToken: "mock-refresh-token-refreshed-012",
    };
  },

  async getMe() {
    await delay(300);
    return mockUser;
  },

  async getStatistics() {
    await delay(300);
    return {
      projects: mockProjects.length,
      todos: 0, // Mock data doesn't have todos yet
      pages: mockPages.length,
    };
  },

  // Pages
  async getPages() {
    await delay(300);
    return mockPages;
  },

  async getPublishedPages() {
    await delay(300);
    // Return only published pages with user info
    return mockPages
      .filter((p) => p.isPublished)
      .map((page) => ({
        ...page,
        user: {
          id: mockUser.id,
          name: mockUser.name,
          avatar: mockUser.avatar,
        },
        publishedAt: page.createdAt,
      }));
  },

  async getPage(id: string) {
    await delay(300);
    const page = mockPages.find((p) => p.id === id);
    if (!page) throw new Error("Page not found");
    return page;
  },

  async createPage(data: Record<string, unknown>) {
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

  async updatePage(id: string, data: Record<string, unknown>) {
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

  async createBlock(data: Record<string, unknown>) {
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

  async updateBlock(id: string, data: Record<string, unknown>) {
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
        `https://api.github.com/users/${username}/repos`,
      );
      const repos = await response.json();

      // Transform to our format
      return repos.map((repo: Record<string, unknown>) => ({
        id: String(repo.id),
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

  async trackEvent(
    pageId: string,
    event: string,
    metadata: Record<string, unknown>,
  ) {
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

  async createProject(data: Record<string, unknown>) {
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

  async updateProject(id: string, data: Record<string, unknown>) {
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

  async getProjectSettings() {
    await delay(200);
    return {
      id: "settings-1",
      cover: null,
      icon: null,
      title: "DATA PROJECT",
      description: null,
    };
  },

  async updateProjectSettings(data: Record<string, unknown>) {
    await delay(300);
    return {
      id: "settings-1",
      cover: null,
      icon: null,
      title: (data.title as string) || "DATA PROJECT",
      description: (data.description as string) || null,
    };
  },

  async deleteProjectCover() {
    await delay(200);
    return { success: true };
  },

  async uploadProjectCover() {
    await delay(500);
    return {
      id: "settings-1",
      cover: "/mock-cover.jpg",
      icon: null,
      title: "DATA PROJECT",
      description: null,
    };
  },

  async getProjectCategories() {
    await delay(300);
    return [
      { id: "cat-1", name: "Web Development", color: "blue" },
      { id: "cat-2", name: "Mobile App", color: "green" },
      { id: "cat-3", name: "API", color: "purple" },
    ];
  },

  async createProjectCategory(data: Record<string, unknown>) {
    await delay(300);
    return {
      id: `cat-${Date.now()}`,
      name: data.name,
      color: data.color || "zinc",
    };
  },

  async updateProjectCategory(id: string, data: Record<string, unknown>) {
    await delay(300);
    return { id, ...data };
  },

  async deleteProjectCategory(_id: string) {
    await delay(300);
    return { success: true };
  },

  async getPaymentMethods() {
    await delay(300);
    return [
      { id: "pm-1", name: "Bank Transfer", color: "blue" },
      { id: "pm-2", name: "PayPal", color: "green" },
      { id: "pm-3", name: "Cash", color: "yellow" },
    ];
  },

  async createPaymentMethod(data: Record<string, unknown>) {
    await delay(300);
    return {
      id: `pm-${Date.now()}`,
      name: data.name,
      color: data.color || "zinc",
    };
  },

  async updatePaymentMethod(id: string, data: Record<string, unknown>) {
    await delay(300);
    return { id, ...data };
  },

  async deletePaymentMethod(_id: string) {
    await delay(300);
    return { success: true };
  },

  async getCurrentWeek() {
    await delay(300);
    return {
      id: "week-1",
      userId: mockUser.id,
      weekStart: new Date(Date.now() - new Date().getDay() * 86400000).toISOString(),
      weekEnd: new Date(Date.now() + (6 - new Date().getDay()) * 86400000).toISOString(),
      todos: [],
    };
  },

  async createNewWeek() {
    await delay(500);
    return {
      id: `week-${Date.now()}`,
      userId: mockUser.id,
      weekStart: new Date().toISOString(),
      weekEnd: new Date(Date.now() + 6 * 86400000).toISOString(),
      todos: [],
    };
  },

  async getTodoSettings() {
    await delay(200);
    return {
      id: "todo-settings-1",
      icon: null,
      title: "Weekly To-do List",
      description: null,
      cover: null,
    };
  },

  async updateTodoSettings(data: Record<string, unknown>) {
    await delay(300);
    return {
      id: "todo-settings-1",
      icon: null,
      title: (data.title as string) || "Weekly To-do List",
      description: (data.description as string) || null,
      cover: null,
    };
  },

  async reorderTodos(_todoIds: string[]) {
    await delay(200);
    return { success: true };
  },

  async createTodo(data: Record<string, unknown>) {
    await delay(300);
    return {
      id: `todo-${Date.now()}`,
      userId: mockUser.id,
      ...data,
      order: 0,
      isCompleted: false,
      createdAt: new Date().toISOString(),
    };
  },

  async updateTodo(id: string, data: Record<string, unknown>) {
    await delay(300);
    return { id, ...data };
  },

  async deleteTodo(_id: string) {
    await delay(300);
    return { success: true };
  },

  async getPreferences() {
    await delay(200);
    return {
      theme: "system",
      language: "id",
    };
  },

  async updatePreferences(data: Record<string, unknown>) {
    await delay(300);
    return {
      theme: (data.theme as string) || "system",
      language: (data.language as string) || "id",
    };
  },

  async getNotifications() {
    await delay(300);
    return [];
  },

  async getUnreadCount() {
    await delay(200);
    return { count: 0 };
  },

  async markAllRead() {
    await delay(200);
    return { success: true };
  },

  async markNotificationRead(_id: string) {
    await delay(200);
    return { success: true };
  },

  async syncGitHubIssues(_projectId: string, _githubRepo: string) {
    await delay(1000);
    return { synced: 0 };
  },

  async linkGitHubRepo(_projectId: string, _githubRepo: string) {
    await delay(500);
    return { success: true };
  },
};
