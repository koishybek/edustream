import { createBrowserRouter } from "react-router-dom";
import PlaceholderScreen from "../features/home/PlaceholderScreen";

/**
 * App routes. Phase 0 has a single themed route; Phase 1 adds the auth gate
 * plus login / register / onboarding / catalog / course / learning / profile.
 */
export const router = createBrowserRouter([
  { path: "/", element: <PlaceholderScreen /> },
]);
