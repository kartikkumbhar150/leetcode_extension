// web-main.tsx — Entry point for the Vercel / standalone web build.
// Seeds demo data then mounts the dashboard app.
import React from "react";
import ReactDOM from "react-dom/client";
import { seedDemoData } from "./services/demo-data";
import App from "./dashboard/App";
import "./index.css";

seedDemoData().then(() => {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
