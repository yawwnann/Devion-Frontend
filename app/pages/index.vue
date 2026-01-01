<script setup lang="ts">
definePageMeta({ layout: false });

const { user } = useAuth();

// Animation state
const isVisible = ref(false);

onMounted(() => {
  setTimeout(() => {
    isVisible.value = true;
  }, 100);
});
</script>

<template>
  <div class="min-h-screen bg-black text-white overflow-x-hidden">
    <!-- Navbar -->
    <nav
      class="fixed top-0 left-0 right-0 z-50 border-b border-gray-800/50 bg-black/80 backdrop-blur-md transition-all duration-500"
      :class="
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      "
    >
      <div
        class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between"
      >
        <!-- Logo -->
        <NuxtLink to="/" class="flex items-center gap-2">
          <img src="/logo.png" alt="Devion" class="h-8 w-auto" />
        </NuxtLink>

        <!-- Nav Links -->
        <div class="hidden md:flex items-center gap-8">
          <a
            href="#features"
            class="text-gray-400 hover:text-white transition-colors text-sm"
          >
            Features
          </a>
          <a
            href="#about"
            class="text-gray-400 hover:text-white transition-colors text-sm"
          >
            About
          </a>
          <a
            href="https://github.com"
            target="_blank"
            class="text-gray-400 hover:text-white transition-colors text-sm"
          >
            GitHub
          </a>
        </div>

        <!-- Auth Buttons -->
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
            class="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all duration-300 hover:scale-105"
          >
            Get Started
          </NuxtLink>
          <NuxtLink
            v-else
            to="/dashboard"
            class="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all duration-300 hover:scale-105"
          >
            Dashboard
          </NuxtLink>
        </div>
      </div>
    </nav>

    <!-- Hero Section -->
    <section class="relative pt-32 pb-20 px-6">
      <!-- Background Gradient -->
      <div
        class="absolute inset-0 bg-gradient-to-b from-emerald-950/20 via-transparent to-transparent pointer-events-none"
      />

      <!-- Animated Background Orbs -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          class="absolute top-20 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"
        />
        <div
          class="absolute top-40 right-1/4 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl animate-pulse delay-1000"
        />
      </div>

      <div class="max-w-4xl mx-auto text-center relative z-10">
        <!-- Badge -->
        <div
          class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-950/50 border border-emerald-800/50 mb-8 transition-all duration-700 delay-200"
          :class="
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          "
        >
          <span class="text-emerald-400 text-sm">What's new in v1.0</span>
          <Icon
            name="lucide:arrow-right"
            class="w-4 h-4 text-emerald-400 animate-bounce-x"
          />
        </div>

        <!-- Headline -->
        <h1
          class="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent leading-tight transition-all duration-700 delay-300"
          :class="
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          "
        >
          Supercharged<br />
          Project Management
        </h1>

        <!-- Subtitle -->
        <p
          class="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 transition-all duration-700 delay-400"
          :class="
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          "
        >
          Manage your projects, track orders, and organize your workflow in one
          place. Built for developers and freelancers who want to stay
          productive.
        </p>

        <!-- CTA Button -->
        <NuxtLink
          to="/register"
          class="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-100 text-black font-medium rounded-full transition-all duration-500 delay-500 hover:scale-105 hover:shadow-lg hover:shadow-white/20"
          :class="
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          "
        >
          <Icon name="lucide:rocket" class="w-5 h-5" />
          Get Started Free
        </NuxtLink>
      </div>
    </section>

    <!-- App Preview Section -->
    <section class="px-6 pb-20">
      <div
        class="max-w-6xl mx-auto transition-all duration-1000 delay-700"
        :class="
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'
        "
      >
        <div
          class="relative rounded-xl overflow-hidden border border-gray-800 shadow-2xl shadow-emerald-950/20 hover:shadow-emerald-900/30 transition-all duration-500 hover:-translate-y-2"
        >
          <!-- Browser Header -->
          <div
            class="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center gap-3"
          >
            <div class="flex gap-2">
              <div class="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <div
                class="w-3 h-3 rounded-full bg-yellow-500 animate-pulse delay-100"
              />
              <div
                class="w-3 h-3 rounded-full bg-green-500 animate-pulse delay-200"
              />
            </div>
            <div class="flex-1 flex justify-center">
              <div
                class="px-4 py-1 bg-gray-800 rounded-md text-gray-400 text-sm flex items-center gap-2"
              >
                <Icon name="lucide:lock" class="w-3 h-3" />
                devion.app
              </div>
            </div>
          </div>

          <!-- App Screenshot -->
          <img src="/devion.png" alt="Devion Dashboard" class="w-full" />
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="px-6 py-20 border-t border-gray-800/50">
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-16">
          <h2 class="text-3xl md:text-4xl font-bold mb-4 animate-fade-in">
            Everything you need
          </h2>
          <p class="text-gray-400 max-w-2xl mx-auto animate-fade-in delay-100">
            Powerful features to help you manage projects, track payments, and
            stay organized.
          </p>
        </div>

        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <!-- Feature Cards with staggered animation -->
          <div
            v-for="(feature, index) in [
              {
                icon: 'lucide:folder-kanban',
                title: 'Project Management',
                desc: 'Organize and track all your projects with status updates, categories, and payment tracking.',
              },
              {
                icon: 'lucide:credit-card',
                title: 'Payment Tracking',
                desc: 'Keep track of payments, deposits, and invoices. Never miss a payment again.',
              },
              {
                icon: 'lucide:check-square',
                title: 'Todo Lists',
                desc: 'Create and manage tasks with priorities, due dates, and progress tracking.',
              },
              {
                icon: 'lucide:github',
                title: 'GitHub Integration',
                desc: 'Connect your GitHub account to showcase repositories and track contributions.',
              },
              {
                icon: 'lucide:file-spreadsheet',
                title: 'Import & Export',
                desc: 'Import and export your data in CSV or Excel format for easy backup and migration.',
              },
              {
                icon: 'lucide:bar-chart-3',
                title: 'Analytics Dashboard',
                desc: 'Get insights into your projects with visual charts and statistics.',
              },
            ]"
            :key="index"
            class="group p-6 rounded-xl bg-gray-900/50 border border-gray-800 hover:border-emerald-800/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-lg hover:shadow-emerald-950/20"
            :style="{ animationDelay: `${index * 100}ms` }"
          >
            <div
              class="w-12 h-12 rounded-lg bg-emerald-950 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300"
            >
              <Icon :name="feature.icon" class="w-6 h-6 text-emerald-400" />
            </div>
            <h3 class="text-lg font-semibold mb-2">{{ feature.title }}</h3>
            <p class="text-gray-400 text-sm">{{ feature.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section id="about" class="px-6 py-20 border-t border-gray-800/50">
      <div class="max-w-4xl mx-auto text-center">
        <h2 class="text-3xl md:text-4xl font-bold mb-4">
          Ready to get started?
        </h2>
        <p class="text-gray-400 mb-8">
          Join developers and freelancers who use Devion to manage their
          projects.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <NuxtLink
            to="/register"
            class="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-emerald-600/30"
          >
            <Icon name="lucide:user-plus" class="w-5 h-5" />
            Create Account
          </NuxtLink>
          <NuxtLink
            to="/login"
            class="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg transition-all duration-300 hover:scale-105"
          >
            <Icon name="lucide:log-in" class="w-5 h-5" />
            Sign In
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
        <div class="flex items-center gap-6">
          <a
            href="#"
            class="text-gray-500 hover:text-white transition-colors text-sm"
            >Privacy</a
          >
          <a
            href="#"
            class="text-gray-500 hover:text-white transition-colors text-sm"
            >Terms</a
          >
          <a
            href="https://github.com"
            target="_blank"
            class="text-gray-500 hover:text-white transition-colors"
          >
            <Icon name="lucide:github" class="w-5 h-5" />
          </a>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
@keyframes bounce-x {
  0%,
  100% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(4px);
  }
}

.animate-bounce-x {
  animation: bounce-x 1s ease-in-out infinite;
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.6s ease-out forwards;
}

.delay-100 {
  animation-delay: 100ms;
}

.delay-200 {
  animation-delay: 200ms;
}

.delay-1000 {
  animation-delay: 1000ms;
}
</style>
