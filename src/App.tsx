// src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";


import Navbar from "./components/Navbar";
import Footer from "./components/Footer"; 

import Home from "./pages/Home";
import Swap from "./pages/Swap";
import Liquidity from "./pages/Liquidity";
import Earn from "./pages/Earn";



import ManageLiquidity from "./pages/ManageLiquidity";


import LiquidityStats from "./pages/LiquidityStats";

export default function App() {
  return (
    <>
      <Navbar />

      
      <main>
        <Routes>
          
          <Route path="/" element={<Home />} />
          <Route path="/swap" element={<Swap />} />
          <Route path="/liquidity" element={<Liquidity />} />
          <Route path="/earn" element={<Earn />} />


          
          <Route path="/manage-liquidity" element={<ManageLiquidity />} />
          
          <Route path="/ManageLiquidity" element={<Navigate to="/manage-liquidity" replace />} />

          
          <Route path="/liquidity-stats" element={<LiquidityStats />} />
          
          <Route path="/LiquidityStats" element={<Navigate to="/liquidity-stats" replace />} />

          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      
      <Footer />
    </>
  );
}
