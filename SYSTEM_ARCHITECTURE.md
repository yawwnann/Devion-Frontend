# 🏗️ Devion System Architecture

## System Overview

Devion adalah platform manajemen proyek dan produktivitas yang terintegrasi dengan GitHub, dilengkapi dengan AI chatbot menggunakan Ollama dan vector database untuk intelligent assistance.

---

## 📊 High-Level Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        A[🖥️ Nuxt 3 Frontend<br/>Vue 3 + TypeScript]
    end

    subgraph "API Layer"
        B[🚀 NestJS Backend<br/>REST API]
    end

    subgraph "Database Layer"
        C[(🗄️ PostgreSQL<br/>Prisma ORM)]
    end

    subgraph "External Services"
        D[<img src='https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png' width='20'/> GitHub API<br/>Repos, Issues, PRs]
        E[🔐 Google OAuth]
    end

    subgraph "AI Layer"
        F[🤖 Ollama<br/>Local LLM]
        G[📚 Vector DB<br/>ChromaDB/Pinecone]
    end

    A -->|HTTP/REST| B
    B -->|Prisma Client| C
    B -->|GitHub Integration| D
    B -->|OAuth 2.0| E
    B -->|AI Queries| F
    F -->|Embeddings| G
    B -->|Store/Retrieve| G

    style A fill:#10b981,stroke:#059669,color:#fff
    style B fill:#3b82f6,stroke:#2563eb,color:#fff
    style C fill:#8b5cf6,stroke:#7c3aed,color:#fff
    style D fill:#24292e,stroke:#000,color:#fff
    style E fill:#ea4335,stroke:#c5221f,color:#fff
    style F fill:#f97316,stroke:#ea580c,color:#fff
    style G fill:#06b6d4,stroke:#0891b2,color:#fff
```

---

## 🔄 Complete System Flow

```mermaid
flowchart TD
    Start([👤 User]) --> Auth{Authenticated?}

    Auth -->|No| Login[🔐 Login/Register]
    Auth -->|Yes| Dashboard[📊 Dashboard]

    Login --> GoogleAuth[Google OAuth]
    Login --> EmailAuth[Email/Password]

    GoogleAuth --> JWT[Generate JWT Token]
    EmailAuth --> JWT
    JWT --> Dashboard

    Dashboard --> Projects[📁 Projects]
    Dashboard --> Todos[✅ Todos]
    Dashboard --> Calendar[📅 Calendar]
    Dashboard --> GitHub[<img src='https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png' width='15'/> GitHub]
    Dashboard --> Docs[📝 Documentation]
    Dashboard --> AI[🤖 AI Assistant]

    Projects --> ProjectCRUD[Create/Read/Update/Delete]
    Projects --> Categories[🏷️ Categories]
    Projects --> Export[📤 Export CSV/XLSX]

    Todos --> TodoWeek[Weekly View]
    Todos --> TodoKanban[Kanban Board]
    Todos --> TodoGitHub[Link to GitHub Issues]

    Calendar --> CalendarEvents[Events Management]
    Calendar --> SyncProjects[Sync from Projects]
    Calendar --> SyncTodos[Sync from Todos]

    GitHub --> GitHubRepos[View Repositories]
    GitHub --> GitHubIssues[Manage Issues]
    GitHub --> GitHubPRs[Pull Requests]
    GitHub --> GitHubCommits[Track Commits]
    GitHub --> GitHubActions[GitHub Actions]

    Docs --> Pages[Create Pages]
    Docs --> Blocks[Block Editor]
    Docs --> Markdown[Markdown Support]

    AI --> ChatBot[💬 Chat Interface]
    ChatBot --> Ollama[🤖 Ollama LLM]
    Ollama --> VectorDB[📚 Vector Database]
    VectorDB --> Context[Retrieve Context]
    Context --> Response[Generate Response]
    Response --> ChatBot

    style Start fill:#10b981,stroke:#059669,color:#fff
    style Dashboard fill:#3b82f6,stroke:#2563eb,color:#fff
    style AI fill:#f97316,stroke:#ea580c,color:#fff
    style Ollama fill:#f97316,stroke:#ea580c,color:#fff
    style VectorDB fill:#06b6d4,stroke:#0891b2,color:#fff
```

---

## 🔐 Authentication Flow

```mermaid
sequenceDiagram
    participant U as 👤 User
    participant F as 🖥️ Frontend
    participant B as 🚀 Backend
    participant DB as 🗄️ Database
    participant G as 🔐 Google OAuth

    U->>F: Access Application
    F->>B: Check Authentication

    alt Not Authenticated
        U->>F: Click Login
        F->>U: Show Login Options

        alt Google OAuth
            U->>F: Select Google Login
            F->>G: Redirect to Google
            G->>U: Google Login Page
            U->>G: Enter Credentials
            G->>B: OAuth Callback
            B->>DB: Find/Create User
            DB->>B: User Data
        else Email/Password
            U->>F: Enter Email/Password
            F->>B: POST /auth/login
            B->>DB: Verify Credentials
            DB->>B: User Data
        end

        B->>B: Generate JWT Tokens
        B->>F: Return Access & Refresh Tokens
        F->>F: Store Tokens
        F->>U: Redirect to Dashboard
    else Authenticated
        F->>B: GET /auth/me (with JWT)
        B->>B: Verify JWT
        B->>DB: Get User Data
        DB->>B: User Data
        B->>F: User Profile
        F->>U: Show Dashboard
    end
```

---

## 🤖 AI Chatbot Architecture

```mermaid
graph TB
    subgraph "User Interface"
        A[💬 Chat Interface]
    end

    subgraph "Backend Processing"
        B[🎯 Chat Controller]
        C[🧠 Chat Service]
        D[📝 Context Builder]
    end

    subgraph "AI Infrastructure"
        E[🤖 Ollama Server<br/>Local LLM]
        F[🔢 Embedding Model<br/>text-embedding-ada-002]
    end

    subgraph "Vector Storage"
        G[📚 ChromaDB/Pinecone<br/>Vector Database]
        H[💾 Document Store<br/>User Context]
    end

    subgraph "Data Sources"
        I[(🗄️ PostgreSQL<br/>User Data)]
        J[<img src='https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png' width='15'/> GitHub API<br/>Code Context]
    end

    A -->|User Query| B
    B --> C
    C --> D

    D -->|Fetch User Data| I
    D -->|Fetch Code Context| J
    D -->|Build Context| H

    H -->|Generate Embeddings| F
    F -->|Store Vectors| G

    C -->|Query with Context| E
    G -->|Retrieve Similar| C

    E -->|AI Response| C
    C -->|Format Response| B
    B -->|Display| A

    style A fill:#10b981,stroke:#059669,color:#fff
    style E fill:#f97316,stroke:#ea580c,color:#fff
    style F fill:#f59e0b,stroke:#d97706,color:#fff
    style G fill:#06b6d4,stroke:#0891b2,color:#fff
    style H fill:#8b5cf6,stroke:#7c3aed,color:#fff
    style I fill:#3b82f6,stroke:#2563eb,color:#fff
    style J fill:#24292e,stroke:#000,color:#fff
```

---

## 🔄 AI Chat Flow (Detailed)

```mermaid
sequenceDiagram
    participant U as 👤 User
    participant UI as 💬 Chat UI
    participant API as 🚀 Backend API
    participant CTX as 📝 Context Builder
    participant VDB as 📚 Vector DB
    participant EMB as 🔢 Embeddings
    participant LLM as 🤖 Ollama
    participant DB as 🗄️ PostgreSQL
    participant GH as <img src='https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png' width='12'/> GitHub

    U->>UI: Type Message
    UI->>API: POST /chatbot/chat

    API->>CTX: Build Context

    par Gather Context
        CTX->>DB: Get User Projects
        DB-->>CTX: Projects Data

        CTX->>DB: Get User Todos
        DB-->>CTX: Todos Data

        CTX->>GH: Get Recent Commits
        GH-->>CTX: Commits Data
    end

    CTX->>EMB: Generate Query Embedding
    EMB-->>CTX: Query Vector

    CTX->>VDB: Search Similar Context
    VDB-->>CTX: Relevant Documents

    CTX->>API: Compiled Context

    API->>LLM: Send Prompt + Context

    LLM->>LLM: Process with Local Model
    LLM-->>API: Generated Response

    API->>DB: Store Chat History
    DB-->>API: Saved

    API->>VDB: Store Response Embedding
    VDB-->>API: Stored

    API-->>UI: Return Response
    UI-->>U: Display AI Response
```

---

## 🔗 GitHub Integration Flow

```mermaid
flowchart TD
    Start([User Action]) --> GitHubFeature{Select Feature}

    GitHubFeature -->|Repos| SyncRepos[🔄 Sync Repositories]
    GitHubFeature -->|Issues| ManageIssues[🐛 Manage Issues]
    GitHubFeature -->|PRs| ReviewPRs[👀 Review Pull Requests]
    GitHubFeature -->|Commits| TrackCommits[📊 Track Commits]
    GitHubFeature -->|Actions| MonitorActions[⚙️ Monitor Actions]

    SyncRepos --> FetchRepos[Fetch from GitHub API]
    FetchRepos --> StoreDB[(Store in Database)]
    StoreDB --> DisplayRepos[Display in UI]

    ManageIssues --> CreateIssue[Create Issue]
    ManageIssues --> LinkTodo[Link to Todo]
    CreateIssue --> GitHubAPI[<img src='https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png' width='15'/> GitHub API]
    LinkTodo --> UpdateTodo[Update Todo with Issue #]

    ReviewPRs --> FetchPRs[Fetch Pull Requests]
    FetchPRs --> ShowFiles[Show Changed Files]
    ShowFiles --> SubmitReview[Submit Review]
    SubmitReview --> GitHubAPI

    TrackCommits --> FetchCommits[Fetch Commits by Issue]
    FetchCommits --> ParseCommits[Parse Commit Messages]
    ParseCommits --> LinkToTodo[Link to Related Todo]

    MonitorActions --> FetchWorkflows[Fetch Workflows]
    FetchWorkflows --> ShowRuns[Show Workflow Runs]
    ShowRuns --> TriggerWorkflow[Trigger Workflow]
    TriggerWorkflow --> GitHubAPI

    style Start fill:#10b981,stroke:#059669,color:#fff
    style GitHubAPI fill:#24292e,stroke:#000,color:#fff
    style StoreDB fill:#8b5cf6,stroke:#7c3aed,color:#fff
```

---

## 📊 Data Flow Architecture

```mermaid
graph LR
    subgraph "Frontend State"
        A[Pinia Store]
        B[Composables]
        C[Components]
    end

    subgraph "API Communication"
        D[Axios Client]
        E[JWT Interceptor]
        F[Error Handler]
    end

    subgraph "Backend Services"
        G[Controllers]
        H[Services]
        I[Repositories]
    end

    subgraph "Data Persistence"
        J[(PostgreSQL)]
        K[File Storage]
        L[Cache Redis]
    end

    C --> B
    B --> A
    A --> D
    D --> E
    E --> F
    F --> G
    G --> H
    H --> I
    I --> J
    I --> K
    I --> L

    style A fill:#10b981,stroke:#059669,color:#fff
    style D fill:#3b82f6,stroke:#2563eb,color:#fff
    style G fill:#f59e0b,stroke:#d97706,color:#fff
    style J fill:#8b5cf6,stroke:#7c3aed,color:#fff
```

---

## 🗄️ Database Schema Overview

```mermaid
erDiagram
    USER ||--o{ PROJECT : creates
    USER ||--o{ TODO : creates
    USER ||--o{ PAGE : creates
    USER ||--o{ CALENDAR_EVENT : creates
    USER ||--o{ GITHUB_REPO : syncs
    USER ||--o{ CHAT_MESSAGE : sends

    PROJECT ||--o{ PROJECT_CATEGORY : belongs_to
    PROJECT ||--o{ PAYMENT_METHOD : uses
    PROJECT }o--|| GITHUB_REPO : linked_to

    TODO ||--o{ TODO_WEEK : belongs_to
    TODO }o--|| GITHUB_ISSUE : linked_to

    PAGE ||--o{ BLOCK : contains

    GITHUB_REPO ||--o{ GITHUB_COMMIT : has
    GITHUB_REPO ||--o{ GITHUB_ISSUE : has
    GITHUB_REPO ||--o{ PULL_REQUEST : has

    CHAT_MESSAGE }o--|| CHAT_SESSION : belongs_to
    CHAT_SESSION }o--|| USER : owned_by

    USER {
        string id PK
        string email UK
        string name
        string avatar
        string cover
        string bio
        string githubUsername
        string githubToken
        datetime createdAt
    }

    PROJECT {
        string id PK
        string userId FK
        string name
        string status
        string information
        string categoryId FK
        string paymentId FK
        string githubRepo
        datetime createdAt
    }

    TODO {
        string id PK
        string userId FK
        string weekId FK
        string title
        boolean isCompleted
        string day
        string status
        string priority
        int githubIssueNumber
        datetime createdAt
    }

    GITHUB_REPO {
        string id PK
        string userId FK
        string name
        string description
        string language
        int stars
        int forks
        string url
        datetime githubUpdatedAt
    }

    CHAT_MESSAGE {
        string id PK
        string sessionId FK
        string role
        string content
        json metadata
        datetime createdAt
    }
```

---

## 🚀 Deployment Architecture

```mermaid
graph TB
    subgraph "Production Environment"
        subgraph "Frontend"
            A[Vercel/Netlify<br/>Nuxt 3 SSR]
        end

        subgraph "Backend"
            B[Railway/Render<br/>NestJS API]
        end

        subgraph "Database"
            C[(Supabase/Neon<br/>PostgreSQL)]
        end

        subgraph "AI Services"
            D[Self-Hosted Server<br/>Ollama + ChromaDB]
        end

        subgraph "Storage"
            E[Cloudinary/S3<br/>File Storage]
        end

        subgraph "Monitoring"
            F[Sentry<br/>Error Tracking]
            G[Vercel Analytics<br/>Performance]
        end
    end

    A -->|API Calls| B
    B -->|Prisma| C
    B -->|AI Queries| D
    B -->|Upload Files| E
    A --> F
    A --> G
    B --> F

    style A fill:#10b981,stroke:#059669,color:#fff
    style B fill:#3b82f6,stroke:#2563eb,color:#fff
    style C fill:#8b5cf6,stroke:#7c3aed,color:#fff
    style D fill:#f97316,stroke:#ea580c,color:#fff
    style E fill:#06b6d4,stroke:#0891b2,color:#fff
```

---

## 🔧 Technology Stack

### Frontend

- **Framework**: Nuxt 3 (Vue 3 + TypeScript)
- **UI Library**: Nuxt UI (Tailwind CSS)
- **State Management**: Pinia
- **HTTP Client**: Axios
- **Charts**: Chart.js, Vue-ChartJS
- **Icons**: Lucide Icons

### Backend

- **Framework**: NestJS (Node.js + TypeScript)
- **ORM**: Prisma
- **Authentication**: JWT, Passport.js
- **Validation**: class-validator
- **File Upload**: Multer
- **API Documentation**: Swagger (optional)

### Database

- **Primary**: PostgreSQL
- **ORM**: Prisma
- **Migrations**: Prisma Migrate

### AI & ML

- **LLM**: Ollama (Local)
- **Vector DB**: ChromaDB / Pinecone
- **Embeddings**: OpenAI / Local Models

### External Services

- **GitHub API**: Repos, Issues, PRs, Actions
- **Google OAuth**: Authentication
- **File Storage**: Cloudinary / AWS S3

---

## 📝 API Endpoints Summary

### Authentication

- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/refresh` - Refresh access token
- `GET /auth/me` - Get current user
- `PATCH /auth/profile` - Update profile

### Projects

- `GET /projects` - Get all projects
- `POST /projects` - Create project
- `PATCH /projects/:id` - Update project
- `DELETE /projects/:id` - Delete project
- `GET /projects/export/csv` - Export to CSV

### Todos

- `GET /todos/current-week` - Get current week todos
- `POST /todos` - Create todo
- `PATCH /todos/:id` - Update todo
- `POST /todos/reorder` - Reorder todos

### GitHub

- `GET /github/repos` - Get repositories
- `POST /github/sync` - Sync repositories
- `GET /github/recent-commits` - Get recent commits
- `POST /github/repos/:owner/:repo/issues` - Create issue

### AI Chatbot

- `POST /chatbot/chat` - Send message to AI
- `GET /chatbot/history` - Get chat history
- `DELETE /chatbot/session/:id` - Clear session

### Calendar

- `GET /calendar` - Get events
- `POST /calendar` - Create event
- `GET /calendar/sync/projects` - Sync from projects
- `GET /calendar/sync/todos` - Sync from todos

---

## 🔒 Security Features

```mermaid
mindmap
  root((🔒 Security))
    Authentication
      JWT Tokens
      Refresh Tokens
      OAuth 2.0
      Password Hashing
    Authorization
      Role-Based Access
      Resource Ownership
      API Guards
    Data Protection
      SQL Injection Prevention
      XSS Protection
      CSRF Protection
      Rate Limiting
    API Security
      CORS Configuration
      Helmet.js
      Input Validation
      Sanitization
```

---

## 📈 Performance Optimization

- **Frontend**: Code splitting, lazy loading, image optimization
- **Backend**: Database indexing, query optimization, caching
- **API**: Response compression, pagination, rate limiting
- **AI**: Vector search optimization, context caching

---

## 🎯 Future Enhancements

1. **Real-time Collaboration** - WebSocket integration
2. **Mobile App** - React Native / Flutter
3. **Advanced Analytics** - Custom dashboards
4. **Team Features** - Multi-user workspaces
5. **AI Improvements** - Fine-tuned models, better context

---

**Last Updated**: 2024
**Version**: 1.0.0
