import { createDiscreteApi } from "naive-ui";
import { theme, themeOverrides } from '@/theme.js';
export const { message } = createDiscreteApi(['message'], { configProviderProps: { theme, themeOverrides } });