import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import { installStorageShim } from "./artifacts/dolos21/storageShim.js";

installStorageShim();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter basename="/artifacts">
      <App />
    </BrowserRouter>
  </StrictMode>
);
