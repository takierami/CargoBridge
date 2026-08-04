/** Shared responsive breakpoint recipe for CargoBridge UI.
 * - sm (640): form columns collapse → 2-up
 * - md (768): tables ↔ card lists
 * - lg (1024): sidebar drawer ↔ static rail
 */
export const FORM_GRID_2 = 'grid grid-cols-1 sm:grid-cols-2 gap-3'
export const FORM_GRID_3 = 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3'
export const MODAL_SHELL =
  'flex flex-col bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] shadow-2xl overflow-hidden'
export const MODAL_BODY = 'flex-1 overflow-y-auto overscroll-contain p-5 space-y-4 min-h-0'
export const MODAL_FOOTER =
  'shrink-0 flex flex-col-reverse gap-2 sm:flex-row p-5 border-t border-gray-200 dark:border-gray-700'
export const TOUCH_ICON_BTN =
  'inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg p-2.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
export const PAGE_TITLE = 'text-lg font-bold text-gray-900 dark:text-white sm:text-xl'
export const PRIMARY_CTA =
  'inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700'
/** 16px on mobile avoids iOS Safari focus zoom; shrinks at sm+ */
export const INPUT_TOUCH =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-base text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm'
export const SELECT_TOUCH = INPUT_TOUCH
export const FILTER_INPUT =
  'w-full rounded-lg border border-gray-300 bg-white ps-9 pe-3 py-2.5 text-base text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:border-gray-600 dark:bg-gray-800 dark:text-white sm:text-sm'
export const SAFE_BOTTOM = 'pb-[max(0.75rem,env(safe-area-inset-bottom))]'
export const SAFE_TOP = 'pt-[env(safe-area-inset-top)]'
