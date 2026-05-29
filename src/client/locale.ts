import { useTranslation } from 'react-i18next';

export const NAMESPACE = 'action-carbone-print';

export const tStr = (key: string, options?: any) => `{{t("${key}", ${JSON.stringify({ ns: NAMESPACE, ...options })})}}`;

export function useCarbonePrintTranslation() {
  return useTranslation(NAMESPACE);
}
