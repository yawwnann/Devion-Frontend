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
  status: "DRAFT" | "PRIVATE" | "PUBLISHED";
  publishedAt?: string;
  createdAt: string;
  isPublished: boolean;
}

const page = ref<Page | null>(null);
const pages = ref<Page[]>([]);
const loading = ref(true);
const saving = ref(false);
const markdownContent = ref("");
const markdownBlockId = ref<string | null>(null);
const isEditing = ref(false);
const blocks = ref<Block[]>([]);

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
    }
  } catch (e) {
    console.error("Failed to update markdown:", e);
  } finally {
    saving.value = false;
  }
}, 500);

const updateStatus = async (newStatus: "DRAFT" | "PRIVATE" | "PUBLISHED") => {
  if (!page.value || newStatus === page.value.status) return;
  saving.value = true;
  try {
    await api.patch(`/documentation/${pageId}`, { status: newStatus });
    page.value.status = newStatus;
  } catch (e) {
    console.error("Failed to update status:", e);
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
    pages.value = pagesData;
    blocks.value = blocksData;

    // Load existing markdown content if exists
    const markdownBlock = blocksData.find((b) => b.type === "markdown");
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
</script>

<template>
  <UDashboardPanel id="page-editor">
    <template #header>
      <DocHeader
        :saving="saving"
        :status="page?.status"
        :is-editing="isEditing"
        @update:status="updateStatus"
        @save="manualSave"
        @toggle-edit="toggleEdit"
      />
    </template>

    <template #body>
      <div
        class="grid grid-cols-[280px_1fr] h-[calc(100vh-4rem)] overflow-hidden"
      >
        <!-- Sidebar -->
        <DocSidebar :pages="pages" :active-page="pageId" />

        <!-- Main Content -->
        <DocEditor
          :title="page?.title || ''"
          :markdown="markdownContent"
          :loading="loading"
          :is-editing="isEditing"
          @update:title="updateTitle"
          @update:markdown="updateMarkdown"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>
