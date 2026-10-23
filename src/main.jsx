import React from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/manrope";
import "@fontsource/ibm-plex-mono/latin-400.css";
import "lenis/dist/lenis.css";
import "./styles.css";
import "./mobile.css";
import App from "./App.jsx";
const GalleryPage = React.lazy(() => import("./GalleryPage.jsx"));
const isGallery = /^\/gallery\/?$/.test(window.location.pathname);

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {isGallery ? <React.Suspense fallback={<p style={{padding:32}}>Opening gallery…</p>}><GalleryPage /></React.Suspense> : <App />}
  </React.StrictMode>,
);
