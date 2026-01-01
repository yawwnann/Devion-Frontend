const API_URL = 'http://localhost:3000/api'

export const useApi = () => {
  const config = useRuntimeConfig()
  const useMock = config.public.useMock === 'true'

  const getToken = () => {
    const token = useCookie('auth_token')
    return token.value
  }

  const fetchApi = async <T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> => {
    // Mock mode
    if (useMock) {
      // @ts-expect-error - Dynamic import supported in Nuxt
      const mockApi = (await import('~/utils/mockApi')).mockApi
      console.log('🎭 Mock API:')

      // Parse endpoint and method
      const method = options.method || 'GET'
      const parts = endpoint.split('/').filter(Boolean)

      // Auth endpoints
      if (parts[0] === 'auth') {
        if (parts[1] === 'login' && method === 'POST') {
          const body = JSON.parse(options.body as string)
          return mockApi.login(body.email, body.password) as Promise<T>
        }
        if (parts[1] === 'register' && method === 'POST') {
          const body = JSON.parse(options.body as string)
          return mockApi.register(
            body.name,
            body.email,
            body.password
          ) as Promise<T>
        }
        if (parts[1] === 'me') {
          return mockApi.getMe() as Promise<T>
        }
      }

      // Pages endpoints
      if (parts[0] === 'pages') {
        if (!parts[1] && method === 'GET')
          return mockApi.getPages() as Promise<T>
        if (parts[1] && method === 'GET')
          return mockApi.getPage(parts[1]) as Promise<T>
        if (!parts[1] && method === 'POST') {
          const body = JSON.parse(options.body as string)
          return mockApi.createPage(body) as Promise<T>
        }
        if (parts[1] && method === 'PATCH') {
          const body = JSON.parse(options.body as string)
          return mockApi.updatePage(parts[1], body) as Promise<T>
        }
        if (parts[1] && method === 'DELETE') {
          return mockApi.deletePage(parts[1]) as Promise<T>
        }
      }

      // Blocks endpoints
      if (parts[0] === 'blocks') {
        if (parts[1] === 'page' && parts[2] && method === 'GET') {
          return mockApi.getBlocks(parts[2]) as Promise<T>
        }
        if (!parts[1] && method === 'POST') {
          const body = JSON.parse(options.body as string)
          return mockApi.createBlock(body) as Promise<T>
        }
        if (parts[1] && method === 'PATCH') {
          const body = JSON.parse(options.body as string)
          return mockApi.updateBlock(parts[1], body) as Promise<T>
        }
        if (parts[1] && method === 'DELETE') {
          return mockApi.deleteBlock(parts[1]) as Promise<T>
        }
      }

      // GitHub endpoints
      if (parts[0] === 'github') {
        if (parts[1] === 'repos' && method === 'GET') {
          return mockApi.getGitHubRepos() as Promise<T>
        }
        if (parts[1] === 'sync' && method === 'POST') {
          return mockApi.syncGitHubRepos() as Promise<T>
        }
        if (parts[1] === 'username' && method === 'POST') {
          const body = JSON.parse(options.body as string)
          return mockApi.setGitHubUsername(body.username) as Promise<T>
        }
      }

      // Analytics endpoints
      if (parts[0] === 'analytics') {
        if (parts[1] === 'stats' && method === 'GET') {
          return mockApi.getStats() as Promise<T>
        }
        const pageId = new URL(`http://dummy${endpoint}`).searchParams.get(
          'pageId'
        )
        if (method === 'GET') {
          return mockApi.getAnalytics(pageId!) as Promise<T>
        }
        if (method === 'POST') {
          const body = JSON.parse(options.body as string)
          return mockApi.trackEvent(
            pageId!,
            body.event,
            body.metadata
          ) as Promise<T>
        }
      }

      // Projects endpoints
      if (parts[0] === 'projects') {
        if (!parts[1] && method === 'GET')
          return mockApi.getProjects() as Promise<T>
        if (parts[1] === 'stats' && method === 'GET')
          return mockApi.getProjectStats() as Promise<T>
        if (parts[1] && method === 'GET')
          return mockApi.getProject(parts[1]) as Promise<T>
        if (!parts[1] && method === 'POST') {
          const body = JSON.parse(options.body as string)
          return mockApi.createProject(body) as Promise<T>
        }
        if (parts[1] && method === 'PATCH') {
          const body = JSON.parse(options.body as string)
          return mockApi.updateProject(parts[1], body) as Promise<T>
        }
        if (parts[1] && method === 'DELETE') {
          return mockApi.deleteProject(parts[1]) as Promise<T>
        }
      }

      throw new Error(`Mock endpoint not implemented: ${method} ${endpoint}`)
    }

    // Real API mode
    const tokenValue = getToken()
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(tokenValue ? { Authorization: `Bearer ${tokenValue}` } : {}),
      ...options.headers
    }

    console.log('🔑 Token:', tokenValue ? 'Present' : 'Missing')
    console.log('📡 Request:', `${API_URL}${endpoint}`)
    console.log('📋 Headers:', headers)

    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers
    })

    if (!res.ok) {
      if (res.status === 401) {
        const token = useCookie('auth_token')
        token.value = null
        navigateTo('/login')
      }
      throw new Error(`API Error: ${res.status}`)
    }

    return res.json()
  }

  return {
    get: <T>(endpoint: string) => fetchApi<T>(endpoint),
    post: <T>(endpoint: string, body?: unknown) =>
      fetchApi<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }),
    patch: <T>(endpoint: string, body?: unknown) =>
      fetchApi<T>(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: <T>(endpoint: string) =>
      fetchApi<T>(endpoint, { method: 'DELETE' }),
    upload: async <T>(endpoint: string, formData: FormData): Promise<T> => {
      const tokenValue = getToken()
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          ...(tokenValue ? { Authorization: `Bearer ${tokenValue}` } : {})
        },
        body: formData
      })
      if (!res.ok) {
        if (res.status === 401) {
          const token = useCookie('auth_token')
          token.value = null
          navigateTo('/login')
        }
        throw new Error(`API Error: ${res.status}`)
      }
      return res.json()
    }
  }
}
