import { create } from "zustand"

/**
 * Global UI store (Zustand).
 *
 * This is the first slice of the planned migration of high-churn UI state out of
 * the monolithic `AppContext` / `AppNavigator` god-component. Components read each
 * value with a selector (`useUIStore(s => s.x)`) so a change to one slice only
 * re-renders the components that actually use that slice — not every context
 * consumer the way the giant context value did.
 *
 * Migration policy: only move state here that is genuinely self-contained (its
 * consumers don't depend on AppNavigator's render closures). `chatbotHidden` is
 * the first such slice — it is read/written exclusively by ChatBotIcon. Modal /
 * navigation booleans should follow only once the modal host is extracted from
 * AppNavigator (otherwise moving them yields no re-render win).
 */
interface UIState {
  /** Whether the floating chatbot icon is hidden. Owned solely by ChatBotIcon. */
  chatbotHidden: boolean
  setChatbotHidden: (hidden: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  chatbotHidden: false,
  setChatbotHidden: (hidden) => set({ chatbotHidden: hidden }),
}))
