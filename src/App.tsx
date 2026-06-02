import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Landing from "@/pages/Landing";
import PeriodTracker from "@/pages/tools/PeriodTracker";
import Journal from "@/pages/tools/Journal";
import BudgetTracker from "@/pages/tools/BudgetTracker";
import MoodTracker from "@/pages/tools/MoodTracker";
import HabitTracker from "@/pages/tools/HabitTracker";
import WaterTracker from "@/pages/tools/WaterTracker";
import Planner from "@/pages/tools/Planner";
import GoalPlanner from "@/pages/tools/GoalPlanner";

const TOOL_PAGES: Record<string, React.ComponentType> = {
  period: PeriodTracker,
  journal: Journal,
  budget: BudgetTracker,
  mood: MoodTracker,
  habits: HabitTracker,
  water: WaterTracker,
  planner: Planner,
  goals: GoalPlanner,
};

function ToolPage() {
  const { slug } = useParams<{ slug: string }>();
  const Page = slug ? TOOL_PAGES[slug] : undefined;
  if (!Page) return <Navigate to="/app" replace />;
  return <Page />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing page — home */}
        <Route path="/" element={<Landing />} />

        {/* App shell — dashboard + all tools */}
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="tools/:slug" element={<ToolPage />} />
        </Route>

        {/* Catch-all → landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
