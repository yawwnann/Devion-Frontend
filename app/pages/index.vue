<script setup lang="ts">
definePageMeta({ layout: false });
</script>

<template>
  <div
    class="min-h-screen bg-white dark:bg-zinc-950 text-gray-900 dark:text-white overflow-x-hidden transition-colors duration-300"
  >
    <!-- Navbar -->
    <LandingNavbar />

    <!-- Hero Section -->
    <LandingHero />

    <!-- App Preview Section -->
    <LandingPreview />

    <!-- Features Section -->
    <LandingFeatures />

    <!-- Articles Section -->
    <LandingArticles :limit="6" />

    <!-- CTA Section -->
    <LandingCTA />

    <!-- Footer -->
    <LandingFooter />
  </div>
</template>
