export const colorOptions = [
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

export const statusOptions = [
  { label: "Todo", value: "TODO", color: "zinc" },
  { label: "Done", value: "DONE", color: "emerald" },
];

export const getBadgeClasses = (color: string): string => {
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
  return (color in map ? map[color] : map.zinc) as string;
};

export const getSolidClass = (color: string): string => {
  const map: Record<string, string> = {
    zinc: "bg-zinc-500 dark:bg-zinc-400",
    red: "bg-red-500 dark:bg-red-400",
    orange: "bg-orange-500 dark:bg-orange-400",
    amber: "bg-amber-500 dark:bg-amber-400",
    yellow: "bg-yellow-500 dark:bg-yellow-400",
    green: "bg-green-500 dark:bg-green-400",
    teal: "bg-teal-500 dark:bg-teal-400",
    sky: "bg-sky-500 dark:bg-sky-400",
    blue: "bg-blue-500 dark:bg-blue-400",
    indigo: "bg-indigo-500 dark:bg-indigo-400",
    violet: "bg-violet-500 dark:bg-violet-400",
    purple: "bg-purple-500 dark:bg-purple-400",
    fuchsia: "bg-fuchsia-500 dark:bg-fuchsia-400",
    pink: "bg-pink-500 dark:bg-pink-400",
    rose: "bg-rose-500 dark:bg-rose-400",
    emerald: "bg-emerald-500 dark:bg-emerald-400",
  };
  return (color in map ? map[color] : map.zinc) as string;
};

export const getStatusColor = (status: string): string => {
  const found = statusOptions.find((s) => s.value === status);
  return found ? found.color : "zinc";
};

export const useProjectColors = () => {
  return {
    colorOptions,
    statusOptions,
    getBadgeClasses,
    getSolidClass,
    getStatusColor,
  };
};
