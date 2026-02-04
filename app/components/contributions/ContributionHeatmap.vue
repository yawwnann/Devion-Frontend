<script setup lang="ts">
interface Contribution {
  date: string;
  count: number;
  level: number;
}

interface Props {
  contributions: Contribution[];
}

const props = defineProps<Props>();

const contributionWeeks = computed(() => {
  const weeks: { weekStart: string; days: Contribution[] }[] = [];
  const today = new Date();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const contribMap = new Map<string, Contribution>();
  props.contributions.forEach((c) => contribMap.set(c.date, c));

  const startDate = new Date(oneYearAgo);
  startDate.setDate(startDate.getDate() - startDate.getDay());

  const currentDate = new Date(startDate);
  let currentWeek: Contribution[] = [];

  while (currentDate <= today) {
    const dateStr = currentDate.toISOString().split("T")[0] || "";
    const fallback: Contribution = {
      date: dateStr,
      count: 0,
      level: 0,
    };
    const contrib = contribMap.get(dateStr) || fallback;
    currentWeek.push(contrib);

    if (currentDate.getDay() === 6) {
      if (currentWeek.length > 0 && currentWeek[0]) {
        weeks.push({ weekStart: currentWeek[0].date, days: [...currentWeek] });
      }
      currentWeek = [];
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  if (currentWeek.length > 0 && currentWeek[0]) {
    weeks.push({ weekStart: currentWeek[0].date, days: currentWeek });
  }
  return weeks;
});

const monthLabels = computed(() => {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const result: { name: string; index: number }[] = [];
  let lastMonth = -1;

  contributionWeeks.value.forEach((week, idx) => {
    const weekStartStr = week.weekStart || "";
    if (!weekStartStr) return;

    const d = new Date(weekStartStr);
    const m = d.getMonth();
    if (m !== lastMonth) {
      result.push({ name: months[m] || "", index: idx });
      lastMonth = m;
    }
  });
  return result;
});
</script>

<template>
  <div
    class="border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 bg-white dark:bg-zinc-900"
  >
    <div class="overflow-x-auto">
      <div class="inline-block min-w-max">
        <!-- Month labels -->
        <div class="flex text-xs font-medium text-zinc-400 mb-3 pl-10">
          <template v-for="(m, i) in monthLabels" :key="i">
            <span
              :style="{
                width: `${
                  ((monthLabels[i + 1]?.index || contributionWeeks.length) -
                    m.index) *
                  16
                }px`,
              }"
            >
              {{ m.name }}
            </span>
          </template>
        </div>

        <!-- Grid with day labels -->
        <div class="flex items-start">
          <!-- Day labels -->
          <div
            class="flex flex-col justify-between text-xs font-medium text-zinc-400 pr-3 pt-[14px] h-[110px]"
          >
            <span class="leading-none">Mon</span>
            <span class="leading-none">Wed</span>
            <span class="leading-none">Fri</span>
          </div>

          <!-- Contribution grid -->
          <div class="flex gap-1">
            <div
              v-for="week in contributionWeeks"
              :key="week.weekStart"
              class="flex flex-col gap-1"
            >
              <div
                v-for="day in week.days"
                :key="day.date"
                v-tooltip="{
                  content: `${day.count} contributions on ${day.date}`,
                }"
                class="w-3.5 h-3.5 rounded transition-all hover:scale-110 hover:z-10 cursor-help"
                :class="[
                  day.level === 0 && 'bg-zinc-100 dark:bg-zinc-800',
                  day.level === 1 && 'bg-emerald-200 dark:bg-emerald-900',
                  day.level === 2 && 'bg-emerald-400 dark:bg-emerald-700',
                  day.level === 3 && 'bg-emerald-500 dark:bg-emerald-500',
                  day.level === 4 && 'bg-emerald-600 dark:bg-emerald-400',
                ]"
              />
            </div>
          </div>
        </div>

        <!-- Legend -->
        <div
          class="flex items-center justify-end gap-2 mt-4 text-xs text-zinc-500"
        >
          <span class="text-xs uppercase font-medium">Less</span>
          <div class="flex gap-1">
            <div class="w-3 h-3 rounded bg-zinc-100 dark:bg-zinc-800" />
            <div class="w-3 h-3 rounded bg-emerald-200 dark:bg-emerald-900" />
            <div class="w-3 h-3 rounded bg-emerald-400 dark:bg-emerald-700" />
            <div class="w-3 h-3 rounded bg-emerald-500 dark:bg-emerald-500" />
            <div class="w-3 h-3 rounded bg-emerald-600 dark:bg-emerald-400" />
          </div>
          <span class="text-xs uppercase font-medium">More</span>
        </div>
      </div>
    </div>
  </div>
</template>
