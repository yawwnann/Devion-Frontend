<script setup lang="ts">
import { ref, computed, watch } from 'vue';

const props = defineProps<{
  modelValue?: string | null; // YYYY-MM-DD
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string | null];
}>();

const isOpen = ref(false);
const currentMonth = ref(new Date());

// Initialize current month from modelValue if exists
watch(() => props.modelValue, (val) => {
  if (val) {
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      currentMonth.value = d;
    }
  }
}, { immediate: true });

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const currentMonthName = computed(() => {
  return `${monthNames[currentMonth.value.getMonth()]} ${currentMonth.value.getFullYear()}`;
});

const calendarDays = computed(() => {
  const year = currentMonth.value.getFullYear();
  const month = currentMonth.value.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const days = [];

  // Previous month days
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    days.push({
      date: new Date(year, month - 1, prevMonthLastDay - i),
      day: prevMonthLastDay - i,
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    days.push({
      date: new Date(year, month, day),
      day,
      isCurrentMonth: true,
    });
  }

  // Next month days
  const remainingDays = 42 - days.length;
  for (let day = 1; day <= remainingDays; day++) {
    days.push({
      date: new Date(year, month + 1, day),
      day,
      isCurrentMonth: false,
    });
  }

  return days;
});

const isSelected = (date: Date) => {
  if (!props.modelValue) return false;
  const selected = new Date(props.modelValue);
  return date.toDateString() === selected.toDateString();
};

const isToday = (date: Date) => {
  return date.toDateString() === new Date().toDateString();
};

const selectDate = (date: Date) => {
  // Format YYYY-MM-DD
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  emit('update:modelValue', `${year}-${month}-${day}`);
  isOpen.value = false;
};

const prevMonth = () => {
  currentMonth.value = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() - 1, 1);
};

const nextMonth = () => {
  currentMonth.value = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() + 1, 1);
};
</script>

<template>
  <UPopover v-model:open="isOpen" :popper="{ placement: 'bottom-start' }">
    <template #default>
      <slot :model-value="modelValue">
        <!-- Default Trigger -->
        <button class="flex items-center gap-2 px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:border-primary-500 transition w-full text-left">
          <UIcon name="i-lucide-calendar" class="size-4 text-zinc-500" />
          <span v-if="modelValue" class="text-sm text-zinc-900 dark:text-zinc-100">{{ modelValue }}</span>
          <span v-else class="text-sm text-muted">Pick a date</span>
        </button>
      </slot>
    </template>

    <template #content>
      <div class="p-4 w-[320px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl">
        <!-- Header -->
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-semibold text-zinc-900 dark:text-white">{{ currentMonthName }}</h3>
          <div class="flex gap-1">
            <button @click="prevMonth" class="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition">
              <UIcon name="i-lucide-chevron-left" class="size-4 text-zinc-500" />
            </button>
            <button @click="nextMonth" class="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition">
              <UIcon name="i-lucide-chevron-right" class="size-4 text-zinc-500" />
            </button>
          </div>
        </div>

        <!-- Grid -->
        <div class="grid grid-cols-7 gap-1 mb-2">
           <div v-for="day in dayNames" :key="day" class="text-center text-xs font-medium text-muted py-1 uppercase">{{ day }}</div>
        </div>

        <div class="grid grid-cols-7 gap-1">
          <button
            v-for="(dayInfo, idx) in calendarDays"
            :key="idx"
            @click="selectDate(dayInfo.date)"
            class="h-8 w-8 rounded-full flex items-center justify-center text-sm transition-all"
            :class="[
              !dayInfo.isCurrentMonth ? 'text-zinc-300 dark:text-zinc-700' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800',
              isSelected(dayInfo.date) ? '!bg-primary-600 !text-white hover:!bg-primary-700' : '',
              isToday(dayInfo.date) && !isSelected(dayInfo.date) ? 'border border-primary-500 text-primary-600' : ''
            ]"
          >
            {{ dayInfo.day }}
          </button>
        </div>
        
        <div class="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
            <button @click="emit('update:modelValue', null); isOpen = false" class="text-xs text-muted hover:text-red-500 transition">Clear Date</button>
        </div>
      </div>
    </template>
  </UPopover>
</template>
