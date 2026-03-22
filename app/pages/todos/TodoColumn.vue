<script setup lang="ts">
import { ref, watch, nextTick, computed } from "vue";
import draggable from "vuedraggable";
import type { Todo, Column } from "./types";

interface Props {
  column: Column;
  todos: Todo[];
  addingToColumn: string | null;
  newColumnTaskTitle: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  "enable-add-task": [columnId: string];
  "cancel-add-task": [];
  "confirm-add-task": [columnId: string];
  "update:todo-status": [todo: Todo, newStatus: string];
  "update:todo-order": [todos: Todo[]];
  "update:newColumnTaskTitle": [value: string];
}>();

const taskInputRef = ref<HTMLTextAreaElement | null>(null);

// Priority badge colors
const getPriorityColor = (priority?: string) => {
  switch (priority) {
    case "HIGH":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    case "LOW":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    default:
      return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
  }
};

// Priority badge labels
const getPriorityLabel = (priority?: string) => {
  switch (priority) {
    case "HIGH":
      return "ASAP";
    case "LOW":
      return "Low";
    default:
      return "Medium";
  }
};

// Get ring color class for column dot
const getRingClass = (columnId: string) => {
  const colorMap: Record<string, string> = {
    TODO: "zinc",
    SCHEDULED: "blue",
    IN_PROGRESS: "orange",
    DONE: "green",
  };
  const color = colorMap[columnId] || "zinc";
  return `ring-${color}-500/20`;
};

// Create a local copy of todos for draggable to work with
const localTodos = computed({
  get: () => [...props.todos],
  set: (newTodos: Todo[]) => {
    // Emit the updated order to parent
    emit("update:todo-order", newTodos);
  },
});

// Watch for addingToColumn changes and focus input
watch(
  () => props.addingToColumn,
  async (newVal) => {
    if (newVal === props.column.id) {
      await nextTick();
      setTimeout(() => {
        taskInputRef.value?.focus();
      }, 0);
    }
  },
);

const enableAddTask = () => {
  emit("enable-add-task", props.column.id);
};

const handleDragEnd = (evt: any) => {
  // Drag End is mostly used for styling cleanups if needed
  // Actual data updates are handled in handleDragChange using evt.added / evt.moved
};

const handleDragChange = (evt: any) => {
  // Handle moving between columns
  if (evt.added) {
    const todo = evt.added.element;
    if (todo) {
      emit("update:todo-status", todo, props.column.id);
    }
  }

  // Handle reordering within same column
  if (evt.moved) {
    emit("update:todo-order", localTodos.value);
  }
};
</script>

<template>
  <div
    class="flex-1 flex flex-col min-w-75 h-full bg-zinc-100/50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50"
  >
    <!-- Column Header -->
    <div class="flex items-center justify-between p-3 pb-2">
      <div class="flex items-center gap-2">
        <div
          class="w-2 h-2 rounded-full ring-2 ring-opacity-50"
          :class="[column.dotClass, getRingClass(column.id)]"
        />
        <h3
          class="font-semibold text-sm"
          :class="column.headerClass"
        >
          {{ column.label }}
        </h3>
        <span
          class="px-1.5 py-0.5 rounded-full bg-white dark:bg-zinc-800 text-zinc-500 text-xs font-medium shadow-sm border border-zinc-200/50 dark:border-zinc-700/50"
        >
          {{ todos.length || 0 }}
        </span>
      </div>
      <div class="flex gap-1">
        <UButton
          icon="i-lucide-plus"
          size="xs"
          color="neutral"
          variant="ghost"
          @click="enableAddTask"
        />
      </div>
    </div>

    <!-- Draggable Todo List -->
    <draggable
      :list="localTodos"
      group="todos"
      item-key="id"
      class="flex-1 overflow-y-auto px-2 pb-2"
      :animation="200"
      ghost-class="opacity-50"
      drag-class="bg-white"
      @end="handleDragEnd"
      @change="handleDragChange"
    >
      <template #item="{ element: todo }">
        <div
          class="group bg-white dark:bg-zinc-900 rounded-lg p-3 mb-2 shadow-sm border border-zinc-200/50 dark:border-zinc-800/50 hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 transition cursor-move"
        >
          <div class="flex items-start gap-2">
            <input
              type="checkbox"
              :checked="todo.isCompleted"
              class="mt-1 size-4 rounded border-zinc-300 dark:border-zinc-700 text-emerald-600 focus:ring-emerald-500"
              @change="
                emit(
                  'update:todo-status',
                  todo,
                  todo.isCompleted ? 'TODO' : 'DONE',
                )
              "
            />
            <div class="flex-1 min-w-0">
              <p
                :class="[
                  'text-sm font-medium truncate transition',
                  todo.isCompleted
                    ? 'text-zinc-400 line-through'
                    : 'text-zinc-900 dark:text-zinc-100',
                ]"
              >
                {{ todo.title }}
              </p>

              <!-- GitHub Issue Link -->
              <a
                v-if="todo.githubIssueUrl"
                :href="todo.githubIssueUrl"
                target="_blank"
                class="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-primary-500 transition mt-1"
              >
                <UIcon name="i-lucide-github" class="size-3" />
                <span class="truncate max-w-50">
                  #{{ todo.githubIssueNumber }}
                  {{ todo.githubRepoName }}
                </span>
              </a>

              <!-- Metadata -->
              <div class="flex items-center gap-2 mt-2 flex-wrap">
                <!-- Priority Badge -->
                <span
                  v-if="todo.priority"
                  :class="[
                    'inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium',
                    getPriorityColor(todo.priority),
                  ]"
                >
                  {{ getPriorityLabel(todo.priority) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </template>
    </draggable>

    <!-- Add Task Input -->
    <div
      v-if="addingToColumn === column.id"
      class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 shadow-sm mx-2 mb-2"
    >
      <textarea
        ref="taskInputRef"
        :value="newColumnTaskTitle"
        @input="
          emit(
            'update:newColumnTaskTitle',
            ($event.target as HTMLTextAreaElement).value,
          )
        "
        rows="2"
        class="w-full bg-transparent border-none outline-none text-sm resize-none placeholder-zinc-400 font-medium"
        placeholder="What needs to be done?"
        @keydown.enter.exact.prevent="emit('confirm-add-task', column.id)"
        @keydown.esc="emit('cancel-add-task')"
      />
      <div class="flex justify-end gap-2 mt-2">
        <UButton
          size="xs"
          color="neutral"
          variant="ghost"
          @click="emit('cancel-add-task')"
        >
          Cancel
        </UButton>
        <UButton
          size="xs"
          color="primary"
          :disabled="!newColumnTaskTitle.trim()"
          @click="emit('confirm-add-task', column.id)"
        >
          Add
        </UButton>
      </div>
    </div>
  </div>
</template>
