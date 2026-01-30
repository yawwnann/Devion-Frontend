<script setup lang="ts">
interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  allDay: boolean;
  color: string;
  eventType: string;
}

interface Props {
  events: CalendarEvent[];
  currentDate?: Date;
}

const props = withDefaults(defineProps<Props>(), {
  currentDate: () => new Date(),
});

const emit = defineEmits<{
  eventClick: [event: CalendarEvent];
  dateClick: [date: Date];
  prevMonth: [];
  nextMonth: [];
}>();

const currentMonth = ref(new Date(props.currentDate));
const viewMode = ref<"month" | "week" | "day">("month");

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const currentMonthName = computed(
  () =>
    `${monthNames[currentMonth.value.getMonth()]} ${currentMonth.value.getFullYear()}`,
);

const calendarDays = computed(() => {
  const year = currentMonth.value.getFullYear();
  const month = currentMonth.value.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const days: Array<{
    date: Date;
    day: number;
    isCurrentMonth: boolean;
    isToday: boolean;
    events: CalendarEvent[];
  }> = [];

  // Previous month days
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(year, month - 1, prevMonthLastDay - i);
    days.push({
      date,
      day: prevMonthLastDay - i,
      isCurrentMonth: false,
      isToday: false,
      events: getEventsForDate(date),
    });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const today = new Date();
    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();

    days.push({
      date,
      day,
      isCurrentMonth: true,
      isToday,
      events: getEventsForDate(date),
    });
  }

  // Next month days
  const remainingDays = 42 - days.length; // 6 weeks * 7 days
  for (let day = 1; day <= remainingDays; day++) {
    const date = new Date(year, month + 1, day);
    days.push({
      date,
      day,
      isCurrentMonth: false,
      isToday: false,
      events: getEventsForDate(date),
    });
  }

  return days;
});

function getEventsForDate(date: Date): CalendarEvent[] {
  return props.events.filter((event) => {
    const eventStart = new Date(event.startDate);
    const eventEnd = new Date(event.endDate);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    eventStart.setHours(0, 0, 0, 0);
    eventEnd.setHours(0, 0, 0, 0);

    return checkDate >= eventStart && checkDate <= eventEnd;
  });
}

function prevMonth() {
  currentMonth.value = new Date(
    currentMonth.value.getFullYear(),
    currentMonth.value.getMonth() - 1,
    1,
  );
  emit("prevMonth");
}

function nextMonth() {
  currentMonth.value = new Date(
    currentMonth.value.getFullYear(),
    currentMonth.value.getMonth() + 1,
    1,
  );
  emit("nextMonth");
}

function goToToday() {
  currentMonth.value = new Date();
}

function handleDateClick(date: Date) {
  emit("dateClick", date);
}

function handleEventClick(event: CalendarEvent) {
  emit("eventClick", event);
}
</script>

<template>
  <div class="custom-calendar">
    <!-- Calendar Header -->
    <div
      class="flex items-center justify-between px-6 py-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800"
    >
      <h2
        class="text-2xl font-bold bg-gradient-to-r from-emerald-500 to-emerald-600 bg-clip-text text-transparent"
      >
        {{ currentMonthName }}
      </h2>

      <div class="flex items-center gap-2">
        <UButton
          variant="ghost"
          size="sm"
          icon="i-lucide-chevron-left"
          @click="prevMonth"
        />
        <UButton variant="ghost" size="sm" @click="goToToday"> Today </UButton>
        <UButton
          variant="ghost"
          size="sm"
          icon="i-lucide-chevron-right"
          @click="nextMonth"
        />
      </div>
    </div>

    <!-- Calendar Grid -->
    <div class="p-6">
      <!-- Day Names -->
      <div class="grid grid-cols-7 gap-px mb-px bg-zinc-200 dark:bg-zinc-800">
        <div
          v-for="day in dayNames"
          :key="day"
          class="bg-zinc-100 dark:bg-zinc-800 py-3 text-center text-sm font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider"
        >
          {{ day }}
        </div>
      </div>

      <!-- Calendar Days -->
      <div class="grid grid-cols-7 gap-px bg-zinc-200 dark:bg-zinc-800">
        <div
          v-for="(dayInfo, index) in calendarDays"
          :key="index"
          class="min-h-[120px] bg-white dark:bg-zinc-900 p-2 cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800"
          :class="{
            'bg-emerald-50/50 dark:bg-emerald-950/20': dayInfo.isToday,
            'opacity-40': !dayInfo.isCurrentMonth,
          }"
          @click="handleDateClick(dayInfo.date)"
        >
          <!-- Day Number -->
          <div class="flex items-center justify-between mb-2">
            <span
              class="text-sm font-medium"
              :class="{
                'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-full w-7 h-7 flex items-center justify-center':
                  dayInfo.isToday,
                'text-zinc-900 dark:text-zinc-100': dayInfo.isCurrentMonth && !dayInfo.isToday,
                'text-zinc-400 dark:text-zinc-600': !dayInfo.isCurrentMonth,
              }"
            >
              {{ dayInfo.day }}
            </span>
          </div>

          <!-- Events -->
          <div class="space-y-1">
            <div
              v-for="event in dayInfo.events.slice(0, 3)"
              :key="event.id"
              class="text-xs px-2 py-1 rounded truncate cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5"
              :style="{ backgroundColor: event.color, color: 'white' }"
              @click.stop="handleEventClick(event)"
            >
              {{ event.title }}
            </div>
            <div
              v-if="dayInfo.events.length > 3"
              class="text-xs text-zinc-500 dark:text-zinc-400 px-2"
            >
              +{{ dayInfo.events.length - 3 }} more
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
