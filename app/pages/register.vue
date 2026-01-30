<script setup lang="ts">
definePageMeta({ layout: false });

const api = useApi();
const { setToken, fetchUser } = useAuth();

const apiUrl = "http://localhost:3000/api";
const name = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const agreeTerms = ref(false);
const loading = ref(false);
const error = ref("");

const handleRegister = async () => {
  error.value = "";

  if (
    !name.value ||
    !email.value ||
    !password.value ||
    !confirmPassword.value
  ) {
    error.value = "Please fill in all fields";
    return;
  }

  if (password.value !== confirmPassword.value) {
    error.value = "Passwords do not match";
    return;
  }

  if (password.value.length < 6) {
    error.value = "Password must be at least 6 characters";
    return;
  }

  if (!agreeTerms.value) {
    error.value = "Please agree to the Terms of Service";
    return;
  }

  loading.value = true;

  try {
    const response = await api.post<{ accessToken: string }>("/auth/register", {
      name: name.value,
      email: email.value,
      password: password.value,
    });

    setToken(response.accessToken);
    await nextTick(); // Wait for cookie to be set
    await fetchUser();
    navigateTo("/dashboard");
  } catch {
    error.value = "Registration failed. Email may already be registered.";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen flex bg-black">
    <!-- Left Panel - Form -->
    <div class="w-full lg:w-1/2 flex flex-col min-h-screen">
      <!-- Header -->
      <div class="p-6">
        <img src="/logo.png" alt="Devion" class="h-8 w-auto" />
      </div>

      <!-- Form Container -->
      <div class="flex-1 flex items-center justify-center px-6 py-8">
        <div class="w-full max-w-sm space-y-6">
          <!-- Title -->
          <h1 class="text-3xl font-medium text-white text-center">
            Create your account
          </h1>

          <!-- Google Button -->
          <a
            :href="`${apiUrl}/auth/google`"
            class="flex items-center justify-center gap-3 w-full px-4 py-3 bg-white hover:bg-gray-100 text-black font-medium rounded-full transition-colors"
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign up with Google
          </a>

          <!-- Divider -->
          <div class="flex items-center gap-4">
            <div class="flex-1 h-px bg-gray-800" />
            <span class="text-gray-500 text-sm">or</span>
            <div class="flex-1 h-px bg-gray-800" />
          </div>

          <!-- Email Form -->
          <form class="space-y-4" @submit.prevent="handleRegister">
            <input
              v-model="name"
              type="text"
              placeholder="Full Name"
              required
              class="w-full px-4 py-3 bg-transparent text-white rounded-full border border-gray-700 focus:border-white focus:outline-none transition-colors placeholder-gray-500"
            />
            <input
              v-model="email"
              type="email"
              placeholder="Email"
              required
              class="w-full px-4 py-3 bg-transparent text-white rounded-full border border-gray-700 focus:border-white focus:outline-none transition-colors placeholder-gray-500"
            />
            <div class="relative">
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Password"
                required
                class="w-full px-4 py-3 pr-12 bg-transparent text-white rounded-full border border-gray-700 focus:border-white focus:outline-none transition-colors placeholder-gray-500"
              />
              <button
                type="button"
                class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                @click="showPassword = !showPassword"
              >
                <Icon
                  :name="showPassword ? 'lucide:eye-off' : 'lucide:eye'"
                  class="w-5 h-5"
                />
              </button>
            </div>
            <div class="relative">
              <input
                v-model="confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                placeholder="Confirm Password"
                required
                class="w-full px-4 py-3 pr-12 bg-transparent text-white rounded-full border border-gray-700 focus:border-white focus:outline-none transition-colors placeholder-gray-500"
              />
              <button
                type="button"
                class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                @click="showConfirmPassword = !showConfirmPassword"
              >
                <Icon
                  :name="showConfirmPassword ? 'lucide:eye-off' : 'lucide:eye'"
                  class="w-5 h-5"
                />
              </button>
            </div>

            <!-- Terms -->
            <label
              class="flex items-center gap-3 text-gray-500 text-sm cursor-pointer"
            >
              <input
                v-model="agreeTerms"
                type="checkbox"
                class="w-4 h-4 rounded border-gray-700 bg-transparent checked:bg-white focus:ring-0"
              />
              <span>
                I agree to the
                <span class="text-white">Terms</span>
                and
                <span class="text-white">Privacy Policy</span>
              </span>
            </label>

            <!-- Error -->
            <div v-if="error" class="text-red-500 text-sm text-center">
              {{ error }}
            </div>

            <button
              type="submit"
              :disabled="loading"
              class="w-full px-4 py-3 bg-white hover:bg-gray-100 disabled:bg-gray-300 text-black font-medium rounded-full transition-colors"
            >
              {{ loading ? "Creating account..." : "Create Account" }}
            </button>
          </form>

          <!-- Sign In Link -->
          <p class="text-center text-gray-500">
            Already have an account?
            <NuxtLink to="/login" class="text-white hover:underline">
              Sign in
            </NuxtLink>
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div class="p-6 text-center">
        <p class="text-gray-600 text-sm">
          By continuing, you agree to Devion's
          <span class="underline cursor-pointer">Terms of Service</span>
          and
          <span class="underline cursor-pointer">Privacy Policy</span>.
        </p>
      </div>
    </div>

    <!-- Right Panel - Visual -->
    <div class="hidden lg:block lg:w-1/2 relative overflow-hidden bg-black">
      <!-- Plasma Background -->
      <ClientOnly>
        <Plasma
          color="#22c55e"
          :speed="0.6"
          direction="forward"
          :scale="1.1"
          :opacity="0.8"
          :mouse-interactive="true"
          class="absolute inset-0"
        />
      </ClientOnly>

      <!-- Content Overlay -->
      <div
        class="absolute inset-0 flex flex-col items-center justify-center p-12 z-10"
      >
        <div class="text-center space-y-4">
          <h2 class="text-4xl font-bold text-white">Join Devion</h2>
          <p class="text-lg text-gray-300 max-w-md">
            Create your developer portfolio in minutes. Showcase your projects
            and connect with the community.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
