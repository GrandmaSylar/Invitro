import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { MainDashboard } from "./components/MainDashboard";
import { DashboardAlpha } from "./components/DashboardAlpha";
import { TestRegister } from "./components/TestRegister";
import { HospitalRecords } from "./components/HospitalRecords";
import { NotFound } from "./components/NotFound";
import { ResultsEntry } from "./components/ResultsEntry";
import { Profile } from "./components/Profile";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: MainDashboard },
      { path: "patients", Component: DashboardAlpha },
      { path: "test-register", Component: TestRegister },
      { path: "hospital-records", Component: HospitalRecords },
      { path: "results-entry", Component: ResultsEntry },
      { path: "profile", Component: Profile },
      { path: "*", Component: NotFound },
    ],
  },
]);