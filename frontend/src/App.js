import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { Sidebar } from "@/components/Sidebar";
import Analyzer from "@/pages/Analyzer";
import History from "@/pages/History";
import ResumeBullets from "@/pages/ResumeBullets";

function App() {
  return (
    <div className="App bg-white text-black min-h-screen">
      <BrowserRouter>
        <Sidebar />
        <main className="ml-[280px] min-h-screen bg-white p-8 md:p-12">
          <Routes>
            <Route path="/" element={<Analyzer />} />
            <Route path="/history" element={<History />} />
            <Route path="/resume" element={<ResumeBullets />} />
          </Routes>
        </main>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#000",
              color: "#fff",
              border: "1px solid #000",
              borderRadius: 0,
              fontFamily: "JetBrains Mono, monospace",
              fontSize: "12px",
            },
          }}
        />
      </BrowserRouter>
    </div>
  );
}

export default App;
