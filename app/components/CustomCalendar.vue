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

// Event type icons and colors
const eventTypeConfig: Record<
  string,
  { icon: string; bgClass: string; textClass: string }
> = {
  project: {
    icon: "i-lucide-folder",
    bgClass: "bg-blue-500/10 dark:bg-blue-500/20",
    textClass: "text-blue-700 dark:text-blue-400",
  },
  todo: {
    icon: "i-lucide-check-square",
    bgClass: "bg-orange-500/10 dark:bg-orange-500/20",
    textClass: "text-orange-700 dark:text-orange-400",
  },
  github: {
    icon: "i-lucide-github",
    bgClass: "bg-purple-500/10 dark:bg-purple-500/20",
    textClass: "text-purple-700 dark:text-purple-400",
  },
  custom: {
    icon: "i-lucide-calendar",
    bgClass: "bg-emerald-500/10 dark:bg-emerald-500/20",
    textClass: "text-emerald-700 dark:text-emerald-400",
  },
};

function getEventConfig(eventType: string): {
  icon: string;
  bgClass: string;
  textClass: string;
} {
  return eventTypeConfig[eventType] ?? eventTypeConfig.custom!;
}

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

// Truncate long titles
function truncateTitle(title: string, maxLength: number = 20): string {
  if (title.length <= maxLength) return title;
  return title.substring(0, maxLength) + "...";
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
          class="min-h-[140px] bg-white dark:bg-zinc-900 p-2 cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50 relative"
          :class="{
            'bg-emerald-50/50 dark:bg-emerald-950/20': dayInfo.isToday,
            'opacity-40': !dayInfo.isCurrentMonth,
          }"
          @click="handleDateClick(dayInfo.date)"
        >
          <!-- Day Number -->
          <div class="flex items-center justify-between mb-2">
            <span
              class="text-sm font-semibold"
              :class="{
                'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-full w-7 h-7 flex items-center justify-center shadow-md':
                  dayInfo.isToday,
                'text-zinc-900 dark:text-zinc-100':
                  dayInfo.isCurrentMonth && !dayInfo.isToday,
                'text-zinc-400 dark:text-zinc-600': !dayInfo.isCurrentMonth,
              }"
            >
              {{ dayInfo.day }}
            </span>

            <!-- Event Count Badge -->
            <span
              v-if="dayInfo.events.length > 0"
              class="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium"
            >
              {{ dayInfo.events.length }}
            </span>
          </div>

          <!-- Events - Compact Design -->
          <div class="space-y-1.5">
            <div
              v-for="event in dayInfo.events.slice(0, 3)"
              :key="event.id"
              class="group relative"
            >
              <div
                class="flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer transition-all hover:shadow-sm border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700"
                :class="getEventConfig(event.eventType).bgClass"
                @click.stop="handleEventClick(event)"
              >
                <!-- Event Type Icon -->
                <UIcon
                  :name="getEventConfig(event.eventType).icon"
                  class="size-3 flex-shrink-0"
                  :class="getEventConfig(event.eventType).textClass"
                />

                <!-- Event Title -->
                <span
                  class="text-xs font-medium truncate flex-1"
                  :class="getEventConfig(event.eventType).textClass"
                  :title="event.title"
                >
                  {{ truncateTitle(event.title, 18) }}
                </span>
              </div>

              <!-- Tooltip on Hover -->
              <div
                class="absolute left-0 top-full mt-1 z-50 hidden group-hover:block pointer-events-none"
              >
                <div
                  class="bg-zinc-900 dark:bg-zinc-800 text-white text-xs rounded-lg px-3 py-2 shadow-xl max-w-xs whitespace-normal"
                >
                  <div class="font-semibold mb-1">{{ event.title }}</div>
                  <div v-if="event.description" class="text-zinc-300 text-xs">
                    {{ event.description }}
                  </div>
                  <div class="text-zinc-400 text-xs mt-1 capitalize">
                    {{ event.eventType }}
                  </div>
                </div>
              </div>
            </div>

            <!-- More Events Indicator -->
            <div
              v-if="dayInfo.events.length > 3"
              class="text-xs text-zinc-500 dark:text-zinc-400 px-2 py-1 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors cursor-pointer font-medium"
              @click.stop="handleDateClick(dayInfo.date)"
            >
              +{{ dayInfo.events.length - 3 }} more events
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
