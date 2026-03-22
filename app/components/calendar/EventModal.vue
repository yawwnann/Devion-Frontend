<script setup lang="ts">
import type {
  EventFormData,
  EventTypeOption,
  ColorOption,
} from "~/types/calendar";

const props = defineProps<{
  modelValue: boolean;
  eventForm: EventFormData;
  isEditing: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  save: [];
  delete: [];
}>();

const eventTypeOptions: EventTypeOption[] = [
  { label: "Custom Event", value: "custom", icon: "i-lucide-calendar" },
  { label: "Project", value: "project", icon: "i-lucide-folder" },
  { label: "Todo", value: "todo", icon: "i-lucide-check-square" },
  { label: "GitHub Issue", value: "github", icon: "i-lucide-github" },
];

const colorOptions: ColorOption[] = [
  { label: "Emerald", value: "#10b981" },
  { label: "Teal", value: "#14b8a6" },
  { label: "Purple", value: "#a855f7" },
  { label: "Orange", value: "#f97316" },
  { label: "Red", value: "#ef4444" },
  { label: "Pink", value: "#ec4899" },
];
</script>

<template>
  <UModal
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template #content>
      <div class="p-6">
        <h2 class="text-xl font-bold text-zinc-900 dark:text-white mb-6">
          {{ isEditing ? "Edit Event" : "New Event" }}
        </h2>

        <div class="space-y-4">
          <!-- Title -->
          <div>
            <label
              class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
            >
              Title
            </label>
            <input
              v-model="eventForm.title"
              type="text"
              placeholder="Event title"
              class="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
            />
          </div>

          <!-- Description -->
          <div>
            <label
              class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
            >
              Description
            </label>
            <textarea
              v-model="eventForm.description"
              rows="3"
              placeholder="Event description"
              class="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition resize-none"
            />
          </div>

          <!-- Event Type -->
          <div>
            <label
              class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
            >
              Event Type
            </label>
            <select
              v-model="eventForm.eventType"
              class="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
            >
              <option
                v-for="type in eventTypeOptions"
                :key="type.value"
                :value="type.value"
              >
                {{ type.label }}
              </option>
            </select>
          </div>

          <!-- Dates -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label
                class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
              >
                Start Date
              </label>
              <input
                v-model="eventForm.startDate"
                type="date"
                class="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
              />
            </div>

            <div>
              <label
                class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
              >
                End Date
              </label>
              <input
                v-model="eventForm.endDate"
                type="date"
                class="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
              />
            </div>
          </div>

          <!-- Color -->
          <div>
            <label
              class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
            >
              Color
            </label>
            <select
              v-model="eventForm.color"
              class="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
            >
              <option
                v-for="color in colorOptions"
                :key="color.value"
                :value="color.value"
              >
                {{ color.label }}
              </option>
            </select>
          </div>

          <!-- All Day -->
          <div
            class="flex items-center justify-between px-4 py-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-gradient-to-r from-zinc-50 to-white dark:from-zinc-800 dark:to-zinc-800/50"
          >
            <label
              class="text-sm font-semibold text-zinc-900 dark:text-white cursor-pointer"
            >
              All Day Event
            </label>
            <input
              v-model="eventForm.allDay"
              type="checkbox"
              class="w-5 h-5 text-emerald-600 bg-zinc-100 border-zinc-300 rounded focus:ring-emerald-500 dark:focus:ring-emerald-600 dark:ring-offset-zinc-800 focus:ring-2 dark:bg-zinc-700 dark:border-zinc-600"
            />
          </div>
        </div>

        <!-- Actions -->
        <div
          class="flex flex-col sm:flex-row justify-between gap-3 mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800"
        >
          <button
            v-if="isEditing"
            type="button"
            class="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
            @click="emit('delete')"
          >
            Delete Event
          </button>
          <div v-else />
          <div class="flex gap-3">
            <button
              type="button"
              class="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
              @click="emit('update:modelValue', false)"
            >
              Cancel
            </button>
            <button
              type="button"
              class="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition"
              @click="emit('save')"
            >
              {{ isEditing ? "Update" : "Create" }}
            </button>
          </div>
        </div>
      </div>
    </template>
  </UModal>
</template>
