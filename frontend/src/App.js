import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import Dashboard from "@/pages/Dashboard";

function App() {
  return (
    <div className="App min-h-screen bg-zinc-950 text-zinc-100">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
        </Routes>
      </BrowserRouter>
      <Toaster
        theme="dark"
        position="top-right"
        toastOptions={{
          style: { background: "#18181b", border: "1px solid #27272a", color: "#f4f4f5" },
        }}
      />
    </div>
  );
}

export default App;
