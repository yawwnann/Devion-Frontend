<script setup lang="ts">
definePageMeta({
  layout: false,
});

useHead({
  title: "Articles - Devion",
  meta: [
    {
      name: "description",
      content:
        "Explore guides, tutorials, and best practices from our community.",
    },
  ],
});

interface Article {
  id: string;
  title: string;
  icon?: string | null;
  excerpt?: string;
  publishedAt: string;
  user?: {
    name: string | null;
    avatar?: string | null;
  };
}

const api = useApi();
const { user } = useAuth();
const articles = ref<Article[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

const fetchArticles = async () => {
  try {
    loading.value = true;
    error.value = null;
    const data = await api.get<Article[]>("/documentation/published");
    articles.value = data;
  } catch (err: any) {
    console.error("[Articles Page] Failed to fetch articles:", err);
    error.value = err.message || "Failed to load articles";
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchArticles();
});
</script>

<template>
  <div class="min-h-screen bg-black text-white">
    <!-- Navbar -->
    <nav
      class="fixed top-0 left-0 right-0 z-50 border-b border-gray-800/50 bg-black/80 backdrop-blur-md"
    >
      <div
        class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between"
      >
        <NuxtLink to="/" class="flex items-center gap-2">
          <img src="/logo.png" alt="Devion" class="h-8 w-auto" />
        </NuxtLink>

        <div class="flex items-center gap-4">
          <NuxtLink
            v-if="!user"
            to="/login"
            class="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
          >
            Sign in
          </NuxtLink>
          <NuxtLink
            v-if="!user"
            to="/register"
            class="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all"
          >
            Get Started
          </NuxtLink>
          <NuxtLink
            v-else
            to="/dashboard"
            class="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all"
          >
            Dashboard
          </NuxtLink>
        </div>
      </div>
    </nav>

    <!-- Header -->
    <section class="px-6 pt-24 pb-12 border-b border-gray-800/50">
      <div class="max-w-6xl mx-auto">
        <div class="text-center">
          <h1
            class="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent"
          >
            Articles
          </h1>
          <p class="text-gray-400 max-w-2xl mx-auto text-lg">
            Explore guides, tutorials, and best practices from our community.
          </p>
        </div>
      </div>
    </section>

    <!-- Content -->
    <section class="px-6 py-12">
      <div class="max-w-6xl mx-auto">
        <!-- Loading State -->
        <div v-if="loading" class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="i in 6"
            :key="i"
            class="h-48 bg-gray-900/50 border border-gray-800 rounded-xl animate-pulse"
          />
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="text-center py-12">
          <div
            class="w-16 h-16 rounded-2xl bg-red-950/50 border border-red-800 flex items-center justify-center mx-auto mb-4"
          >
            <Icon name="lucide:alert-circle" class="w-8 h-8 text-red-400" />
          </div>
          <h3 class="font-semibold mb-2 text-white">Failed to load articles</h3>
          <p class="text-sm text-gray-400 mb-4">{{ error }}</p>
          <button
            @click="fetchArticles"
            class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>

        <!-- Empty State -->
        <div v-else-if="articles.length === 0" class="text-center py-12">
          <div
            class="w-16 h-16 rounded-2xl bg-gray-900/50 border border-gray-800 flex items-center justify-center mx-auto mb-4"
          >
            <Icon name="lucide:book-open" class="w-8 h-8 text-gray-500" />
          </div>
          <h3 class="font-semibold mb-2 text-white">No articles yet</h3>
          <p class="text-sm text-gray-400">
            Published articles will appear here
          </p>
        </div>

        <!-- Articles Grid -->
        <div v-else class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <NuxtLink
            v-for="article in articles"
            :key="article.id"
            :to="`/articles/${article.id}`"
            class="block group"
          >
            <div
              class="h-full p-6 rounded-xl bg-gray-900/50 border border-gray-800 hover:border-emerald-800/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-lg hover:shadow-emerald-950/20"
            >
              <div class="flex items-start gap-4 mb-4">
                <!-- Icon -->
                <div
                  class="shrink-0 w-12 h-12 rounded-xl bg-emerald-950 flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
                >
                  <Icon
                    :name="article.icon || 'lucide:file-text'"
                    class="w-6 h-6 text-emerald-400"
                  />
                </div>

                <!-- Title -->
                <h3
                  class="flex-1 font-semibold text-lg text-white group-hover:text-emerald-400 transition-colors line-clamp-2"
                >
                  {{ article.title }}
                </h3>
              </div>

              <!-- Excerpt -->
              <p
                v-if="article.excerpt"
                class="text-sm text-gray-400 line-clamp-3 mb-4"
              >
                {{ article.excerpt }}
              </p>

              <!-- Meta -->
              <div class="flex items-center gap-3 text-xs text-gray-500">
                <div v-if="article.user" class="flex items-center gap-2">
                  <img
                    v-if="article.user.avatar"
                    :src="article.user.avatar"
                    :alt="article.user.name || 'Author'"
                    class="w-6 h-6 rounded-full"
                  />
                  <div
                    v-else
                    class="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-medium"
                  >
                    {{ article.user.name?.[0]?.toUpperCase() || "A" }}
                  </div>
                  <span v-if="article.user.name" class="text-gray-400">
                    {{ article.user.name }}
                  </span>
                </div>
                <span>•</span>
                <time :datetime="article.publishedAt" class="text-gray-400">
                  {{
                    new Date(article.publishedAt).toLocaleDateString("id-ID", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  }}
                </time>
              </div>
            </div>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="px-6 py-8 border-t border-gray-800/50">
      <div
        class="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4"
      >
        <div class="flex items-center gap-2">
          <img src="/logo.png" alt="Devion" class="h-6 w-auto" />
          <span class="text-gray-500 text-sm"
            >© 2026 Devion. All rights reserved.</span
          >
        </div>
      </div>
    </footer>
  </div>
</template>
