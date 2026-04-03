import { ref } from "vue";

export type Locale = 'id' | 'en';

export interface UserPreferences {
  theme: string;
  language: Locale;
}

export const usePreferences = () => {
  const api = useApi();

  const preferences = useState<UserPreferences | null>(
    "user_preferences",
    () => null,
  );

  const isLoading = ref(false);

  const fetchPreferences = async () => {
    isLoading.value = true;
    try {
      const data = await api.get<UserPreferences>("/preferences");
      if (data) {
        preferences.value = { theme: data.theme, language: data.language };
      }
      return data;
    } catch (error) {
      console.error("[PREFERENCES] Failed to fetch preferences:", error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  const updatePreferences = async (payload: Partial<UserPreferences>) => {
    isLoading.value = true;
    try {
      const updateData = await api.patch<UserPreferences>(
        "/preferences",
        payload,
      );

      if (preferences.value) {
        preferences.value = { ...preferences.value, ...payload };
      } else {
        preferences.value = updateData;
      }

      return updateData;
    } catch (error) {
      console.error("[PREFERENCES] Failed to update preferences:", error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    preferences,
    isLoading,
    fetchPreferences,
    updatePreferences,
  };
};
