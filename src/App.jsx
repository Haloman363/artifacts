import { Routes, Route } from "react-router-dom";
import Hub from "./hub/Hub.jsx";
import CruiseGuide from "./artifacts/CruiseGuide.jsx";
import LunchQuest from "./artifacts/LunchQuest.tsx";
import NickMeasurement from "./artifacts/NickMeasurement.jsx";
import BrainrotTranslator from "./artifacts/BrainrotTranslator.tsx";
import SubnetCalc from "./artifacts/SubnetCalc.tsx";
import Pomodoro from "./artifacts/Pomodoro.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Hub />} />
      <Route path="/cruise-guide" element={<CruiseGuide />} />
      <Route path="/lunch-quest" element={<LunchQuest />} />
      <Route path="/nick-measurement" element={<NickMeasurement />} />
      <Route path="/brainrot" element={<BrainrotTranslator />} />
      <Route path="/subnet-calc" element={<SubnetCalc />} />
      <Route path="/pomodoro" element={<Pomodoro />} />
    </Routes>
  );
}
