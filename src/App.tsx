import { useState } from "react";
import { CapabilityInput } from "./components/CapabilityInput";
import { RankingStep } from "./components/RankingStep";
import { ResultsGrid } from "./components/ResultsGrid";
import type { Capability, ProcessedCapability } from "./types";

type AppStep = "INPUT" | "RANK_ENJOYMENT" | "RANK_SKILL" | "RESULTS";

export default function App() { // <-- The 'default' keyword is added here
  const [appStep, setAppStep] = useState<AppStep>("INPUT");
  
  const [capabilities, setCapabilities] = useState<Capability[]>([
    { id: 1, text: "" }, { id: 2, text: "" }, { id: 3, text: "" },
  ]);

  const [enjoymentRanked, setEnjoymentRanked] = useState<Capability[]>([]);
  const [skillRanked, setSkillRanked] = useState<Capability[]>([]);
  const [finalResults, setFinalResults] = useState<ProcessedCapability[]>([]);
  const [lastRankedCapabilities, setLastRankedCapabilities] = useState<Capability[]>([]);
  
  const handleStartRanking = () => {
    const currentFilled = capabilities.filter(c => c.text.trim() !== '');
    const currentIds = new Set(currentFilled.map(c => c.id));
    const lastRankedIds = new Set(lastRankedCapabilities.map(c => c.id));
    
    const hasListChanged = currentIds.size !== lastRankedIds.size || 
                           [...currentIds].some(id => !lastRankedIds.has(id));

    if (hasListChanged) {
      setEnjoymentRanked([]);
      setSkillRanked([]);
    }
    
    setAppStep("RANK_ENJOYMENT");
  };

  const handleEnjoymentRanked = (rankedCapabilities: Capability[]) => {
    setEnjoymentRanked(rankedCapabilities);
    setAppStep("RANK_SKILL");
  };

  const handleSkillRanked = (skillRankedCapabilities: Capability[]) => {
    setSkillRanked(skillRankedCapabilities);
    const filledCapabilities = capabilities.filter(c => c.text.trim() !== '');
    setLastRankedCapabilities(filledCapabilities);

    const results: ProcessedCapability[] = filledCapabilities.map(cap => {
      const enjoymentList = enjoymentRanked.length > 0 ? enjoymentRanked : filledCapabilities;
      const enjoymentRank = enjoymentList.findIndex(item => item.id === cap.id);
      const skillRank = skillRankedCapabilities.findIndex(item => item.id === cap.id);
      return { ...cap, enjoymentRank, skillRank };
    });
    setFinalResults(results);
    setAppStep("RESULTS");
  };

  const handleEdit = () => {
    setAppStep("INPUT");
  };

  return (
    <div className="min-h-screen bg-gray-50 text-slate-800 flex items-center justify-center p-4">
      <main className="container mx-auto max-w-5xl">
        <div className="mb-6">
          <p style={{ fontSize: '1.08em', textAlign: 'center' }}>
            Use this template to find your strength. To understand the method and reason behind this interactive activity,{' '}
            <a href="https://changying.substack.com/p/performance-and-growth-a-smarter" target="_blank" rel="noopener noreferrer"><b>READ HERE</b></a>.
          </p>
        </div>
        {appStep === "INPUT" && (
          <CapabilityInput 
            capabilities={capabilities}
            setCapabilities={setCapabilities}
            onNext={handleStartRanking} 
          />
        )}
        
        {appStep === "RANK_ENJOYMENT" && (
          <RankingStep 
            capabilities={enjoymentRanked.length > 0 ? enjoymentRanked : capabilities.filter(c => c.text.trim() !== '')} 
            onNext={handleEnjoymentRanked} 
            title="Rank by Enjoyment" 
            highLabel="Most Enjoy" 
            lowLabel="Least Enjoy" 
            direction="vertical" 
          />
        )}

        {appStep === "RANK_SKILL" && (
          <RankingStep 
            capabilities={skillRanked.length > 0 ? skillRanked : capabilities.filter(c => c.text.trim() !== '')} 
            onNext={handleSkillRanked} 
            title="Rank by Skill" 
            highLabel="You are good at" 
            lowLabel="You are not good at" 
            direction="horizontal" 
          />
        )}
        
        {appStep === "RESULTS" && <ResultsGrid results={finalResults} onEdit={handleEdit} />}
      </main>
    </div>
  );
}