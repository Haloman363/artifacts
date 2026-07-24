import { Routes, Route, Outlet } from "react-router-dom";
import Hub from "./hub/Hub.jsx";
import LunchQuest from "./artifacts/lunch-quest/LunchQuest.tsx";
import NickMeasurement from "./artifacts/nick-measurement/NickMeasurement.jsx";
import BrainrotTranslator from "./artifacts/brainrot/BrainrotTranslator.tsx";
import SubnetCalc from "./artifacts/subnet-calc/SubnetCalc.tsx";
import Pomodoro from "./artifacts/pomodoro/Pomodoro.jsx";
import ClaudeTamagotchi from "./artifacts/tamagotchi/ClaudeTamagotchi.jsx";
import CarMaintenance from "./artifacts/car-maintenance/CarMaintenance.jsx";
import Peptides from "./artifacts/peptides/Peptides.jsx";
import SavingsBuckets from "./artifacts/savings-buckets/SavingsBuckets.jsx";
import HamsterShaker from "./artifacts/hamstershaker/HamsterShaker.jsx";
import Dolos21 from "./dolos21/Dolos21.jsx";
import ZombiesEEManual from "./artifacts/zombies-ee-manual/ZombiesEEManual.jsx";
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
        <Route path="/hamstershaker" element={<HamsterShaker />} />
        <Route path="/dolos21" element={<Dolos21 />} />
        <Route path="/zombies-ee-manual" element={<ZombiesEEManual />} />
      </Route>
    </Routes>
  );
}
