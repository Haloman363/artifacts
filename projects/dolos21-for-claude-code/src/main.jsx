import React from "react";
import ReactDOM from "react-dom/client";
import Dolos21 from "./App.jsx";
import { installStorageShim } from "./storageShim.js";

installStorageShim();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Dolos21 />
  </React.StrictMode>
);
