import { useState } from "react";
import { Header } from "./components/Header";
import { HeroSection } from "./components/HeroSection";
import { CategoriesGrid } from "./components/CategoriesGrid";
import { CapabilitiesAccordion } from "./components/CapabilitiesAccordion";
import { Footer } from "./components/Footer";
import type { ClassificationResult } from "./types";
import { api } from "./services/api";

function App() {
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleScrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSelectSample = async (text: string) => {
    handleScrollToSection("analyzer");
    setLoading(true);
    try {
      const res = await api.classifyEmail(text, { includeShap: true, includeExplanation: true });
      setResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfbf9] text-[#171717] selection:bg-indigo-600 selection:text-white">
      {/* Fixed Header with Mix-Blend-Difference */}
      <Header onScrollToSection={handleScrollToSection} />

      {/* Hero Section with Spam Analyzer & Wave Container */}
      <HeroSection
        onAnalyzeStart={() => setLoading(true)}
        onAnalysisResult={(res) => {
          setResult(res);
          setLoading(false);
        }}
        result={result}
        loading={loading}
      />

      {/* Analysis History / Spam Categories Staggered Grid */}
      <CategoriesGrid onSelectSample={handleSelectSample} />

      {/* Service Accordion (How the Model Works) */}
      <CapabilitiesAccordion onExploreApi={() => handleScrollToSection("architecture")} />

      {/* High-Contrast 5rem Radius Footer */}
      <Footer />
    </div>
  );
}

export default App;
