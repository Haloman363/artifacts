import { Routes, Route, Outlet } from "react-router-dom";
import Hub from "./hub/Hub.jsx";
import LunchQuest from "./artifacts/LunchQuest.tsx";
import NickMeasurement from "./artifacts/NickMeasurement.jsx";
import BrainrotTranslator from "./artifacts/BrainrotTranslator.tsx";
import SubnetCalc from "./artifacts/SubnetCalc.tsx";
import Pomodoro from "./artifacts/Pomodoro.jsx";
import ClaudeTamagotchi from "./artifacts/ClaudeTamagotchi.jsx";
import CarMaintenance from "./artifacts/CarMaintenance.jsx";
import Peptides from "./artifacts/Peptides.jsx";
import SavingsBuckets from "./artifacts/SavingsBuckets.jsx";
import BackButton from "./artifacts/BackButton.jsx";

function ArtifactLayout() {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <BackButton />
      <div style={{ flex: 1, minHeight: 0 }}>
        <Outlet />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Hub />} />
      <Route element={<ArtifactLayout />}>
        <Route path="/lunch-quest" element={<LunchQuest />} />
        <Route path="/nick-measurement" element={<NickMeasurement />} />
        <Route path="/brainrot" element={<BrainrotTranslator />} />
        <Route path="/subnet-calc" element={<SubnetCalc />} />
        <Route path="/pomodoro" element={<Pomodoro />} />
        <Route path="/tamagotchi" element={<ClaudeTamagotchi />} />
        <Route path="/car-maintenance" element={<CarMaintenance />} />
        <Route path="/peptides" element={<Peptides />} />
        <Route path="/savings" element={<SavingsBuckets />} />
      </Route>
    </Routes>
  );
}
