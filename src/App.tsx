import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import { AdminLayout } from "./components/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import CoursesPage from "./pages/admin/Courses";
import LessonsPage from "./pages/admin/Lessons";
import MaterialsPage from "./pages/admin/Materials";
import UsersPage from "./pages/admin/Users";
import LiveSessionsPage from "./pages/admin/LiveSessions";
import CommunityPage from "./pages/admin/Community";
import ToolsPage from "./pages/admin/Tools";
import SettingsPage from "./pages/admin/Settings";
import FinancePage from "./pages/admin/Finance";
import CategoriesPage from "./pages/admin/Categories";
import CampaignsPage from "./pages/admin/campaigns";
import CheckoutSettingsPage from "./pages/admin/CheckoutSettings";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path="/admin">
        {() => (
          <AdminLayout>
            <AdminDashboard />
          </AdminLayout>
        )}
      </Route>
      <Route path="/admin/courses">
        {() => (
          <AdminLayout>
            <CoursesPage />
          </AdminLayout>
        )}
      </Route>
      <Route path="/admin/lessons">
        {() => (
          <AdminLayout>
            <LessonsPage />
          </AdminLayout>
        )}
      </Route>
      <Route path="/admin/materials">
        {() => (
          <AdminLayout>
            <MaterialsPage />
          </AdminLayout>
        )}
      </Route>
      <Route path="/admin/categories">
        {() => (
          <AdminLayout>
            <CategoriesPage />
          </AdminLayout>
        )}
      </Route>
      <Route path="/admin/users">
        {() => (
          <AdminLayout>
            <UsersPage />
          </AdminLayout>
        )}
      </Route>
      <Route path="/admin/live-sessions">
        {() => (
          <AdminLayout>
            <LiveSessionsPage />
          </AdminLayout>
        )}
      </Route>
      <Route path="/admin/community">
        {() => (
          <AdminLayout>
            <CommunityPage />
          </AdminLayout>
        )}
      </Route>
      <Route path="/admin/tools">
        {() => (
          <AdminLayout>
            <ToolsPage />
          </AdminLayout>
        )}
      </Route>
      <Route path="/admin/finance">
        {() => (
          <AdminLayout>
            <FinancePage />
          </AdminLayout>
        )}
      </Route>
      <Route path="/admin/settings">
        {() => (
          <AdminLayout>
            <SettingsPage />
          </AdminLayout>
        )}
      </Route>
      <Route path="/admin/campaigns">
        {() => (
          <AdminLayout>
            <CampaignsPage />
          </AdminLayout>
        )}
      </Route>
      <Route path="/admin/checkout-settings">
        {() => (
          <AdminLayout>
            <CheckoutSettingsPage />
          </AdminLayout>
        )}
      </Route>
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
      // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
