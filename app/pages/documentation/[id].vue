<script setup lang="ts">
import DocHeader from "~/components/documentation/DocHeader.vue";
import DocEditor from "~/components/documentation/DocEditor.vue";
import DocSidebar from "~/components/documentation/DocSidebar.vue";

const route = useRoute();
const api = useApi();
const pageId = route.params.id as string;

interface Block {
  id: string;
  type: string;
  content: Record<string, unknown>;
  order: number;
}

interface Page {
  id: string;
  title: string;
  slug: string;
  icon: string | null;
  isPublished: boolean;
  createdAt: string;
}

const page = ref<Page | null>(null);
const pages = ref<Page[]>([]);
const blocks = ref<Block[]>([]);
const loading = ref(true);
const saving = ref(false);
const markdownContent = ref("");
const markdownBlockId = ref<string | null>(null);
const isEditing = ref(false);

const updateTitle = async (newTitle: string) => {
  if (!page.value || newTitle === page.value.title) return;
  saving.value = true;
  try {
    await api.patch(`/documentation/${pageId}`, { title: newTitle });
    page.value.title = newTitle;
  } catch (e) {
    console.error("Failed to update title:", e);
  } finally {
    saving.value = false;
  }
};

const addBlock = async (type = "text") => {
  try {
    const newBlock = await api.post<Block>("/blocks", {
      pageId,
      type,
      content:
        type === "text"
          ? { text: "" }
          : type === "heading"
            ? { text: "", level: 1 }
            : type === "todo"
              ? { text: "", checked: false }
              : type === "code"
                ? { code: "" }
                : { text: "" },
      order: blocks.value.length,
    });
    blocks.value.push(newBlock);
  } catch (e) {
    console.error("Failed to add block:", e);
  }
};

const updateBlock = async (
  blockId: string,
  content: Record<string, unknown>,
) => {
  const block = blocks.value.find((b) => b.id === blockId);
  if (!block) return;

  block.content = content;
  saving.value = true;
  try {
    await api.patch(`/blocks/${blockId}`, { content });
  } catch (e) {
    console.error("Failed to update block:", e);
  } finally {
    saving.value = false;
  }
};

const deleteBlock = async (blockId: string) => {
  try {
    await api.delete(`/blocks/${blockId}`);
    blocks.value = blocks.value.filter((b) => b.id !== blockId);
  } catch (e) {
    console.error("Failed to delete block:", e);
  }
};

const updateMarkdown = useDebounceFn(async (content: string) => {
  markdownContent.value = content;
  saving.value = true;
  try {
    // If markdown block exists, update it
    if (markdownBlockId.value) {
      await api.patch(`/blocks/${markdownBlockId.value}`, {
        content: { markdown: content },
      });
    } else {
      // Create new markdown block
      const newBlock = await api.post<Block>("/blocks", {
        pageId,
        type: "markdown",
        content: { markdown: content },
        order: 0,
      });
      markdownBlockId.value = newBlock.id;
      blocks.value.unshift(newBlock);
    }
  } catch (e) {
    console.error("Failed to update markdown:", e);
  } finally {
    saving.value = false;
  }
}, 500);

const togglePublish = async () => {
  if (!page.value) return;
  saving.value = true;
  try {
    await api.patch(`/documentation/${pageId}`, {
      isPublished: !page.value.isPublished,
    });
    page.value.isPublished = !page.value.isPublished;
  } catch (e) {
    console.error("Failed to toggle publish:", e);
  } finally {
    saving.value = false;
  }
};

const manualSave = async () => {
  if (!markdownContent.value) return;
  saving.value = true;
  try {
    if (markdownBlockId.value) {
      await api.patch(`/blocks/${markdownBlockId.value}`, {
        content: { markdown: markdownContent.value },
      });
    } else {
      const newBlock = await api.post<Block>("/blocks", {
        pageId,
        type: "markdown",
        content: { markdown: markdownContent.value },
        order: 0,
      });
      markdownBlockId.value = newBlock.id;
      blocks.value.unshift(newBlock);
    }
  } catch (e) {
    console.error("Failed to save:", e);
  } finally {
    saving.value = false;
  }
};

const toggleEdit = () => {
  isEditing.value = !isEditing.value;
};

onMounted(async () => {
  try {
    const [pageData, blocksData, pagesData] = await Promise.all([
      api.get<Page>(`/documentation/${pageId}`),
      api.get<Block[]>(`/blocks/page/${pageId}`),
      api.get<Page[]>("/documentation"),
    ]);
    page.value = pageData;
    blocks.value = blocksData.sort((a, b) => a.order - b.order);
    pages.value = pagesData;

    // Load existing markdown content if exists
    const markdownBlock = blocks.value.find((b) => b.type === "markdown");
    if (markdownBlock) {
      markdownBlockId.value = markdownBlock.id;
      markdownContent.value = (markdownBlock.content as any).markdown || "";
    }
  } catch (e) {
    console.error("Failed to load page:", e);
    navigateTo("/documentation");
  } finally {
    loading.value = false;
  }
});

// Filter out markdown blocks from regular blocks
const regularBlocks = computed(() =>
  blocks.value.filter((b) => b.type !== "markdown"),
);
</script>

<template>
  <UDashboardPanel id="page-editor">
    <template #header>
      <DocHeader
        :saving="saving"
        :is-published="page?.isPublished"
        :is-editing="isEditing"
        @toggle-publish="togglePublish"
        @save="manualSave"
        @toggle-edit="toggleEdit"
      />
    </template>

    <template #body>
      <div class="grid grid-cols-[280px_1fr] h-full">
        <!-- Sidebar -->
        <DocSidebar :pages="pages" :active-page="pageId" />

        <!-- Main Content -->
        <DocEditor
          :title="page?.title || ''"
          :blocks="regularBlocks"
          :markdown="markdownContent"
          :loading="loading"
          :is-editing="isEditing"
          @update:title="updateTitle"
          @update:block="updateBlock"
          @delete:block="deleteBlock"
          @add:block="addBlock"
          @update:markdown="updateMarkdown"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>
