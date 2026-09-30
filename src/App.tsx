import { Route, Routes } from "react-router-dom";
import { useSarvamEnvBootstrap } from "@/hooks/use-sarvam-env";
import { LandingPage } from "@/pages/LandingPage";
import { SetupPage } from "@/pages/SetupPage";
import { RoomPage } from "@/pages/RoomPage";
import { ReportPage } from "@/pages/ReportPage";

export function App() {
  useSarvamEnvBootstrap();
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/setup" element={<SetupPage />} />
      <Route path="/room/:id" element={<RoomPage />} />
      <Route path="/report/:id" element={<ReportPage />} />
    </Routes>
  );
}
