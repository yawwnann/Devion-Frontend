<script setup lang="ts">
import type { Category, PaymentMethod } from "./types";
import { useProjectColors } from "./composables/useProjectColors";

type Property = Category | PaymentMethod;

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

// Use shared color utilities
const { colorOptions, getSolidClass } = useProjectColors();

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
    class="w-72 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
    @click.stop
  >
    <div class="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
      <h4 class="text-sm font-semibold text-zinc-900 dark:text-white">
        Edit {{ type === "category" ? "Category" : "Payment" }}
      </h4>
      <UButton
        color="neutral"
        variant="ghost"
        icon="i-lucide-x"
        size="xs"
        class="-mr-2"
        @click="emit('close')"
      />
    </div>

    <div class="p-4 space-y-5">
      <!-- Name Input -->
      <div class="space-y-1.5">
        <label class="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
          Name
        </label>
        <UInput
          v-model="localName"
          placeholder="Enter name..."
          autofocus
          size="sm"
          @blur="handleBlur"
          @keyup.enter="saveChanges"
        />
      </div>

      <!-- Color Picker -->
      <div class="space-y-2">
        <label class="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
          Color
        </label>
        <div class="grid grid-cols-6 gap-2">
          <button
            v-for="color in colorOptions"
            :key="color.value"
            class="group relative size-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 focus:outline-none"
            :title="color.label"
            @click="localColor = color.value"
          >
            <span
              class="absolute inset-0 rounded-full bg-current opacity-20 dark:opacity-30 transition-opacity"
              :class="[localColor === color.value ? 'opacity-100 dark:opacity-100 ring-2 ring-offset-2 ring-offset-white dark:ring-offset-zinc-900 ring-zinc-900 dark:ring-white' : '', getSolidClass(color.value)]"
            ></span>
             <!-- Solid Circle -->
             <span class="size-full rounded-full" :class="getSolidClass(color.value)"></span>

             <!-- Checkmark -->
             <UIcon
               v-if="localColor === color.value"
               name="i-lucide-check"
               class="absolute text-white dark:text-zinc-900 size-4"
             />
          </button>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center justify-between pt-2">
         <UButton
           v-if="!showDeleteConfirm"
           color="error"
           variant="ghost"
           size="xs"
           icon="i-lucide-trash-2"
           @click="showDeleteConfirm = true"
         >
           Delete
         </UButton>

         <div v-else class="flex items-center gap-2">
           <UButton
             color="neutral"
             variant="ghost"
             size="xs"
             @click="showDeleteConfirm = false"
           >
             Cancel
           </UButton>
           <UButton
             color="error"
             size="xs"
             @click="handleDelete"
           >
             Confirm
           </UButton>
         </div>

         <UButton
           color="primary"
           size="xs"
           :disabled="!localName.trim()"
           @click="saveChanges"
         >
           Save Changes
         </UButton>
      </div>
    </div>
  </div>
</template>
