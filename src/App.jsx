import { Routes, Route } from "react-router-dom";
import Hub from "./hub/Hub.jsx";
import CruiseGuide from "./artifacts/CruiseGuide.jsx";
import LunchQuest from "./artifacts/LunchQuest.jsx";
import NickMeasurement from "./artifacts/NickMeasurement.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Hub />} />
      <Route path="/cruise-guide" element={<CruiseGuide />} />
      <Route path="/lunch-quest" element={<LunchQuest />} />
      <Route path="/nick-measurement" element={<NickMeasurement />} />
    </Routes>
  );
}
