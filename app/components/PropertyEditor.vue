<script setup lang="ts">
interface Property {
  id: string;
  name: string;
  color: string;
}

interface Props {
  property: Property;
  type: 'category' | 'payment';
}

const props = defineProps<Props>();
const emit = defineEmits<{
  update: [property: Property];
  delete: [id: string];
  close: [];
}>();

const localName = ref(props.property.name);
const localColor = ref(props.property.color);
const showDeleteConfirm = ref(false);

const colorOptions = [
  { label: "Zinc", value: "zinc" },
  { label: "Red", value: "red" },
  { label: "Orange", value: "orange" },
  { label: "Amber", value: "amber" },
  { label: "Yellow", value: "yellow" },
  { label: "Green", value: "green" },
  { label: "Teal", value: "teal" },
  { label: "Sky", value: "sky" },
  { label: "Blue", value: "blue" },
  { label: "Indigo", value: "indigo" },
  { label: "Violet", value: "violet" },
  { label: "Purple", value: "purple" },
  { label: "Fuchsia", value: "fuchsia" },
  { label: "Pink", value: "pink" },
  { label: "Rose", value: "rose" },
];

const getBadgeClasses = (color: string) => {
  const map: Record<string, string> = {
    zinc: "bg-zinc-200 text-zinc-900 dark:bg-zinc-700 dark:text-zinc-100",
    red: "bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100",
    orange: "bg-orange-200 text-orange-900 dark:bg-orange-800 dark:text-orange-100",
    amber: "bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100",
    yellow: "bg-yellow-200 text-yellow-900 dark:bg-yellow-800 dark:text-yellow-100",
    green: "bg-green-200 text-green-900 dark:bg-green-800 dark:text-green-100",
    teal: "bg-teal-200 text-teal-900 dark:bg-teal-800 dark:text-teal-100",
    sky: "bg-sky-200 text-sky-900 dark:bg-sky-800 dark:text-sky-100",
    blue: "bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100",
    indigo: "bg-indigo-200 text-indigo-900 dark:bg-indigo-800 dark:text-indigo-100",
    violet: "bg-violet-200 text-violet-900 dark:bg-violet-800 dark:text-violet-100",
    purple: "bg-purple-200 text-purple-900 dark:bg-purple-800 dark:text-purple-100",
    fuchsia: "bg-fuchsia-200 text-fuchsia-900 dark:bg-fuchsia-800 dark:text-fuchsia-100",
    pink: "bg-pink-200 text-pink-900 dark:bg-pink-800 dark:text-pink-100",
    rose: "bg-rose-200 text-rose-900 dark:bg-rose-800 dark:text-rose-100",
    emerald: "bg-emerald-200 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100",
  };
  return map[color] || map.zinc;
};

const saveChanges = () => {
  if (!localName.value.trim()) return;

  emit("update", {
    id: props.property.id,
    name: localName.value.trim(),
    color: localColor.value,
  });
  emit("close");
};

const handleDelete = () => {
  emit("delete", props.property.id);
  emit("close");
};

// Auto-save on blur or enter
const handleBlur = () => {
  if (localName.value !== props.property.name || localColor.value !== props.property.color) {
    saveChanges();
  }
};
</script>

<template>
  <div
    class="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-zinc-900 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-800 z-50"
    @click.stop
  >
    <div class="p-4 space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <h4 class="text-sm font-semibold text-zinc-900 dark:text-white">
          Edit {{ type === "category" ? "Category" : "Payment Method" }}
        </h4>
        <button
          class="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition"
          @click="emit('close')"
        >
          <UIcon name="i-lucide-x" class="size-4" />
        </button>
      </div>

      <!-- Name Input -->
      <div>
        <label class="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-2">
          Name
        </label>
        <input
          v-model="localName"
          type="text"
          class="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 transition"
          @blur="handleBlur"
          @keyup.enter="saveChanges"
        />
      </div>

      <!-- Color Picker -->
      <div>
        <label class="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-2">
          Color
        </label>
        <div class="grid grid-cols-5 gap-2">
          <button
            v-for="color in colorOptions"
            :key="color.value"
            class="relative px-3 py-2 rounded-lg border-2 transition hover:scale-105"
            :class="[
              localColor === color.value
                ? 'border-primary-500'
                : 'border-transparent hover:border-zinc-300 dark:hover:border-zinc-600',
              getBadgeClasses(color.value),
            ]"
            @click="localColor = color.value"
          >
            <span class="text-xs font-medium">{{ color.label }}</span>
            <UIcon
              v-if="localColor === color.value"
              name="i-lucide-check"
              class="size-3 absolute top-1 right-1"
            />
          </button>
        </div>
      </div>

      <!-- Preview -->
      <div>
        <label class="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-2">
          Preview
        </label>
        <span
          :class="[
            'inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold',
            getBadgeClasses(localColor),
          ]"
        >
          {{ localName || "Property Name" }}
        </span>
      </div>

      <!-- Actions -->
      <div class="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <button
          v-if="!showDeleteConfirm"
          class="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
          @click="showDeleteConfirm = true"
        >
          <UIcon name="i-lucide-trash-2" class="size-4" />
          Delete
        </button>
        <div v-else class="flex items-center gap-2">
          <span class="text-xs text-zinc-600 dark:text-zinc-400">Delete this property?</span>
          <button
            class="px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition"
            @click="showDeleteConfirm = false"
          >
            Cancel
          </button>
          <button
            class="px-2 py-1 text-xs text-white bg-red-600 hover:bg-red-700 rounded transition"
            @click="handleDelete"
          >
            Confirm
          </button>
        </div>

        <button
          :disabled="!localName.trim()"
          class="px-4 py-1.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition"
          @click="saveChanges"
        >
          Save
        </button>
      </div>
    </div>
  </div>
</template>
