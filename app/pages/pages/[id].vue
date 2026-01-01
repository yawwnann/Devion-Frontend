<script setup lang="ts">
const route = useRoute()
const api = useApi()
const pageId = route.params.id as string

interface Block {
  id: string
  type: string
  content: Record<string, unknown>
  order: number
}

interface Page {
  id: string
  title: string
  slug: string
  icon: string | null
  isPublished: boolean
}

const page = ref<Page | null>(null)
const blocks = ref<Block[]>([])
const loading = ref(true)
const saving = ref(false)

const updateTitle = async (newTitle: string) => {
  if (!page.value || newTitle === page.value.title) return
  saving.value = true
  try {
    await api.patch(`/pages/${pageId}`, { title: newTitle })
    page.value.title = newTitle
  } catch (e) {
    console.error('Failed to update title:', e)
  } finally {
    saving.value = false
  }
}

const addBlock = async (type = 'text') => {
  try {
    const newBlock = await api.post<Block>('/blocks', {
      pageId,
      type,
      content:
        type === 'text'
          ? { text: '' }
          : type === 'heading'
            ? { text: '', level: 1 }
            : type === 'todo'
              ? { text: '', checked: false }
              : type === 'code'
                ? { code: '' }
                : { text: '' },
      order: blocks.value.length
    })
    blocks.value.push(newBlock)
  } catch (e) {
    console.error('Failed to add block:', e)
  }
}

const updateBlock = async (
  blockId: string,
  content: Record<string, unknown>
) => {
  const block = blocks.value.find(b => b.id === blockId)
  if (!block) return

  block.content = content
  saving.value = true
  try {
    await api.patch(`/blocks/${blockId}`, { content })
  } catch (e) {
    console.error('Failed to update block:', e)
  } finally {
    saving.value = false
  }
}

const deleteBlock = async (blockId: string) => {
  try {
    await api.delete(`/blocks/${blockId}`)
    blocks.value = blocks.value.filter(b => b.id !== blockId)
  } catch (e) {
    console.error('Failed to delete block:', e)
  }
}

const togglePublish = async () => {
  if (!page.value) return
  saving.value = true
  try {
    await api.patch(`/pages/${pageId}`, {
      isPublished: !page.value.isPublished
    })
    page.value.isPublished = !page.value.isPublished
  } catch (e) {
    console.error('Failed to toggle publish:', e)
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  try {
    const [pageData, blocksData] = await Promise.all([
      api.get<Page>(`/pages/${pageId}`),
      api.get<Block[]>(`/blocks/page/${pageId}`)
    ])
    page.value = pageData
    blocks.value = blocksData.sort((a, b) => a.order - b.order)
  } catch (e) {
    console.error('Failed to load page:', e)
    navigateTo('/pages')
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <UDashboardPanel id="page-editor">
    <template #header>
      <UDashboardNavbar>
        <template #leading>
          <UDashboardSidebarCollapse />
          <UButton
            to="/pages"
            variant="ghost"
            color="neutral"
            icon="i-lucide-arrow-left"
            size="sm"
          >
            Back
          </UButton>
        </template>
        <template #right>
          <div class="flex items-center gap-2">
            <UIcon
              v-if="saving"
              name="i-lucide-loader-2"
              class="size-4 animate-spin text-muted"
            />
            <span v-else class="text-xs text-muted">Saved</span>
            <UButton
              :color="page?.isPublished ? 'green' : 'gray'"
              size="sm"
              @click="togglePublish"
            >
              {{ page?.isPublished ? "Published" : "Publish" }}
            </UButton>
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Loading -->
      <div v-if="loading" class="max-w-3xl mx-auto p-6 space-y-4">
        <USkeleton class="h-12 w-64" />
        <USkeleton class="h-6 w-full" />
        <USkeleton class="h-6 w-3/4" />
      </div>

      <!-- Page Content -->
      <div v-else-if="page" class="max-w-3xl mx-auto p-6 pb-32">
        <!-- Page Header -->
        <div class="mb-8">
          <input
            :value="page.title"
            class="text-4xl font-bold bg-transparent border-none outline-none w-full placeholder-gray-400"
            placeholder="Untitled"
            @blur="(e) => updateTitle((e.target as HTMLInputElement).value)"
          >
        </div>

        <!-- Blocks -->
        <div class="space-y-1">
          <div v-for="block in blocks" :key="block.id" class="group relative">
            <!-- Delete Button -->
            <div
              class="absolute -left-8 top-2 opacity-0 group-hover:opacity-100 transition"
            >
              <UButton
                icon="i-lucide-trash-2"
                variant="ghost"
                size="xs"
                color="red"
                @click="deleteBlock(block.id)"
              />
            </div>

            <!-- Text Block -->
            <div v-if="block.type === 'text'" class="py-1">
              <textarea
                :value="(block.content as any).text"
                class="w-full bg-transparent border-none outline-none resize-none text-base leading-relaxed placeholder-gray-400"
                placeholder="Type something..."
                rows="1"
                @input="(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = target.scrollHeight + 'px';
                  updateBlock(block.id, { text: target.value });
                }"
              />
            </div>

            <!-- Heading Block -->
            <div v-else-if="block.type === 'heading'" class="py-2">
              <input
                :value="(block.content as any).text"
                class="w-full bg-transparent border-none outline-none font-bold text-3xl placeholder-gray-400"
                placeholder="Heading"
                @input="(e) => updateBlock(block.id, { text: (e.target as HTMLInputElement).value, level: 1 })"
              >
            </div>

            <!-- Bullet List Block -->
            <div
              v-else-if="block.type === 'bullet'"
              class="flex items-start gap-2 py-1"
            >
              <span class="text-lg mt-1">•</span>
              <input
                :value="(block.content as any).text"
                class="flex-1 bg-transparent border-none outline-none text-base placeholder-gray-400"
                placeholder="List item"
                @input="(e) => updateBlock(block.id, { text: (e.target as HTMLInputElement).value })"
              >
            </div>

            <!-- Todo Block -->
            <div
              v-else-if="block.type === 'todo'"
              class="flex items-start gap-3 py-1"
            >
              <UCheckbox
                :model-value="(block.content as any).checked"
                class="mt-1"
                @update:model-value="(val) => updateBlock(block.id, { text: (block.content as any).text, checked: val })"
              />
              <input
                :value="(block.content as any).text"
                :class="[
                  'flex-1 bg-transparent border-none outline-none text-base placeholder-gray-400',
                  (block.content as any).checked ? 'line-through text-muted' : ''
                ]"
                placeholder="To-do"
                @input="(e) => updateBlock(block.id, { text: (e.target as HTMLInputElement).value, checked: (block.content as any).checked })"
              >
            </div>

            <!-- Quote Block -->
            <div
              v-else-if="block.type === 'quote'"
              class="border-l-4 border-gray-300 dark:border-gray-700 pl-4 py-2"
            >
              <textarea
                :value="(block.content as any).text"
                class="w-full bg-transparent border-none outline-none resize-none text-base italic leading-relaxed placeholder-gray-400"
                placeholder="Quote..."
                rows="1"
                @input="(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = target.scrollHeight + 'px';
                  updateBlock(block.id, { text: target.value });
                }"
              />
            </div>

            <!-- Code Block -->
            <div v-else-if="block.type === 'code'" class="py-2">
              <textarea
                :value="(block.content as any).code"
                class="w-full bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 font-mono text-sm resize-none placeholder-gray-400"
                placeholder="// Code here..."
                rows="3"
                @input="(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = target.scrollHeight + 'px';
                  updateBlock(block.id, { code: target.value });
                }"
              />
            </div>
          </div>

          <!-- Empty State -->
          <div v-if="blocks.length === 0" class="text-center py-12">
            <UIcon
              name="i-lucide-file-text"
              class="size-12 text-muted mx-auto mb-3"
            />
            <p class="text-muted mb-4">
              Start writing your content
            </p>
          </div>
        </div>

        <!-- Add Block Buttons -->
        <div class="mt-6 flex flex-wrap gap-2">
          <UButton
            variant="ghost"
            color="gray"
            icon="i-lucide-type"
            size="sm"
            @click="addBlock('text')"
          >
            Text
          </UButton>
          <UButton
            variant="ghost"
            color="gray"
            icon="i-lucide-heading"
            size="sm"
            @click="addBlock('heading')"
          >
            Heading
          </UButton>
          <UButton
            variant="ghost"
            color="gray"
            icon="i-lucide-list"
            size="sm"
            @click="addBlock('bullet')"
          >
            List
          </UButton>
          <UButton
            variant="ghost"
            color="gray"
            icon="i-lucide-check-square"
            size="sm"
            @click="addBlock('todo')"
          >
            To-do
          </UButton>
          <UButton
            variant="ghost"
            color="gray"
            icon="i-lucide-quote"
            size="sm"
            @click="addBlock('quote')"
          >
            Quote
          </UButton>
          <UButton
            variant="ghost"
            color="gray"
            icon="i-lucide-code"
            size="sm"
            @click="addBlock('code')"
          >
            Code
          </UButton>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
