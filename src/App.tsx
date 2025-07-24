import { useState, useEffect } from "react";
import { DndContext } from "@dnd-kit/core";
import { ConfirmModal } from "./components/ConfirmModal";
import { CapabilityInput } from "./components/CapabilityInput";
import { Button } from "./components/ui/button";
import { Accordion, AccordionItem } from "./components/ui/accordion";
import { Trash2 } from "lucide-react";
import { RankingStep } from "./components/RankingStep";
import { ResultsGrid } from "./components/ResultsGrid";
import type { Capability, ProcessedCapability } from "./typs";

type AppStep = "INPUT" | "RANK_ENJOYMENT" | "RANK_SKILL" | "RESULTS";

export default function App() {
  // Community filter for INPUT step
  const [selectedCommunityCategory, setSelectedCommunityCategory] = useState<string>("");

  // User entries state
  const [userEntries, setUserEntries] = useState<{ id: number; content: string }[]>([]);
  const [userEntriesLoading, setUserEntriesLoading] = useState(false);
  const [userEntriesError, setUserEntriesError] = useState<string | null>(null);
  const [appStep, setAppStep] = useState<AppStep>("INPUT");

  const [capabilities, setCapabilities] = useState<Capability[]>([
    { id: 1, text: "" }, { id: 2, text: "" }, { id: 3, text: "" },
  ]);

  const [enjoymentRanked, setEnjoymentRanked] = useState<Capability[]>([]);
  const [skillRanked, setSkillRanked] = useState<Capability[]>([]);
  const [finalResults, setFinalResults] = useState<ProcessedCapability[]>([]);
  const [lastRankedCapabilities, setLastRankedCapabilities] = useState<Capability[]>([]);

  // Community inspiration state
  const [communityEntries, setCommunityEntries] = useState<{id?: number, category: string, capability: string}[]>([]);
  const [entryToDelete, setEntryToDelete] = useState<{id: number, category?: string, capability?: string, content?: string} | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [userEntryToDelete, setUserEntryToDelete] = useState<{id: number, content: string} | null>(null);
  const [inputCategory, setInputCategory] = useState("");
  const [inputCapability, setInputCapability] = useState("");

const handleCommunitySubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (inputCategory.trim() && inputCapability.trim()) {
    // Send to backend
    await fetch('/community-entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: inputCategory.trim(),
        capability: inputCapability.trim(),
      })
    });
    // Fetch updated entries from backend and await it
    await fetchCommunityEntries();
    setInputCategory("");
    setInputCapability("");
  }
};

// Fetch user entries from backend on mount
useEffect(() => {
  setUserEntriesLoading(true);
  fetch('/entries')
    .then((res) => {
      if (!res.ok) throw new Error('Failed to fetch user entries');
      return res.json();
    })
    .then((data) => {
      setUserEntries(data);
      setUserEntriesError(null);
    })
    .catch((err) => setUserEntriesError(err.message))
    .finally(() => setUserEntriesLoading(false));
}, []);

// Fetch community entries from backend on mount
const fetchCommunityEntries = () => {
  fetch('/community-entries')
    .then(res => res.json())
    .then(data => setCommunityEntries(
      data.map((entry: any) => ({
        id: entry.id,
        category: entry.category,
        capability: entry.capability
      }))
    ));
};
useEffect(() => { fetchCommunityEntries(); }, []);

  const uniqueCategories = Array.from(new Set(communityEntries.map(entry => entry.category)));

  // For INPUT step Community filter
  const uniqueCommunityCategories = Array.from(new Set(communityEntries.map(entry => entry.category)));
  const filteredCommunityEntries = selectedCommunityCategory
    ? communityEntries.filter(e => e.category === selectedCommunityCategory)
    : communityEntries;

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
           <DndContext
             onDragEnd={({ active, over }) => {
               if (!over || !active) return;
               if (over.id === 'capability-input-dropzone') {
                 const [source, entryId] = String(active.id).split(':');
                 let text = '';
                 if (source === 'mylist') {
                   const entry = userEntries.find(e => String(e.id) === entryId);
                   if (entry) text = entry.content;
                 } else if (source === 'community') {
                   const entry = communityEntries.find(e => String(e.id) === entryId);
                   if (entry) text = entry.capability;
                 }
                 if (text.trim()) {
                   setCapabilities(prev => [...prev, { id: Date.now(), text }]);
                 }
               }
             }}
           >
             <div className="flex flex-col gap-6 md:flex-row md:gap-8">
               {/* My List and Capability Columns */}
                <div className="flex-1 w-full" style={{ maxWidth: '60%' }}>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg bg-white p-4 min-h-[260px] flex flex-row gap-8 overflow-x-auto">
                   {/* My List Column */}
                   <div className="flex-[0.6] flex flex-col min-w-0">
                     <h2 className="text-lg font-semibold mb-2">My List</h2>
                     <div className="grid gap-2 mb-4 flex-1">
                       {userEntries.map((entry) => (
                         <div
                           key={entry.id}
                           id={`mylist:${entry.id}`}
                           style={{ cursor: 'grab' }}
                           {...{ draggable: true, onDragStart: (e) => { e.dataTransfer.setData('text/plain', `mylist:${entry.id}`); } }}
                           className="border rounded px-2 py-1 bg-gray-50 flex items-center text-sm"
                         >
                           <span className="text-gray-800 flex-1">{entry.content}</span>
                           <button
                             className="ml-2 p-1 rounded hover:bg-red-100"
                             title="Delete"
                             onClick={() => setUserEntryToDelete(entry)}
                           >
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 hover:text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                             </svg>
                           </button>
                         </div>
                       ))}
                     </div>
                   </div>
                   {/* Capability Column */}
                   <div className="flex-[1.4] flex flex-col min-w-0">
                     <div className="flex items-center mb-2 gap-2">
                       <h2 className="text-lg font-semibold">Capability</h2>
                       <select
                         className="border rounded px-2 py-1 text-sm"
                         value={selectedCommunityCategory}
                         onChange={e => setSelectedCommunityCategory(e.target.value)}
                       >
                         <option value="">All Categories</option>
                         {uniqueCommunityCategories.map(cat => (
                           <option key={cat} value={cat}>{cat}</option>
                         ))}
                       </select>
                     </div>
                     <div className="grid gap-2 mb-4 flex-1">
                       {filteredCommunityEntries.map((entry, idx) => (
                         <div
                           key={entry.id ?? idx}
                           id={`community:${entry.id ?? idx}`}
                           style={{ cursor: 'grab' }}
                           {...{ draggable: true, onDragStart: (e) => { e.dataTransfer.setData('text/plain', `community:${entry.id ?? idx}`); } }}
                           className="border rounded px-2 py-1 bg-gray-50 flex items-center text-sm"
                         >
                           <span className="text-gray-800">{entry.capability}</span>
                         </div>
                       ))}
                     </div>
                   </div>
                 </div>
               </div>

               {/* Capability Input Dropzone */}
               <div className="flex-1 max-w-md mx-auto">
                 <div
  id="capability-input-dropzone"
  className="border-2 border-dashed border-gray-300 rounded-lg bg-white p-4 min-h-[260px] flex flex-col"
  onDragOver={e => e.preventDefault()}
  onDrop={e => {
    const id = e.dataTransfer.getData('text/plain');
    if (!id) return;
    const [source, entryId] = id.split(':');
    let text = '';
    if (source === 'mylist') {
      const entry = userEntries.find(e => String(e.id) === entryId);
      if (entry) text = entry.content;
    } else if (source === 'community') {
      const entry = communityEntries.find(e => String(e.id) === entryId);
      if (entry) text = entry.capability;
    }
    if (text.trim()) {
      setCapabilities(prev => [...prev, { id: Date.now(), text }]);
    }
  }}
>

                   <CapabilityInput 
                     capabilities={capabilities}
                     setCapabilities={setCapabilities}
                     onNext={handleStartRanking}
                     onSave={async () => {
                       for (const cap of capabilities) {
                         if (cap.text.trim()) {
                           await fetch('/entries', {
                             method: 'POST',
                             headers: { 'Content-Type': 'application/json' },
                             body: JSON.stringify({ content: cap.text.trim() }),
                           });
                         }
                       }
                       // Refresh user entries after saving
                       setUserEntriesLoading(true);
                       fetch('/entries')
                         .then((res) => res.json())
                         .then((data) => setUserEntries(data))
                         .finally(() => setUserEntriesLoading(false));
                     }}
                   />
                   <div className="text-xs text-gray-400 mt-2">Drag from My list or Capability list to add here</div>
                 </div>
               </div>
             </div>
           </DndContext>
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
        {/* Confirm delete user entry modal (still needed for the top My List area) */}
        <ConfirmModal
          open={!!userEntryToDelete}
          title="Delete Entry"
          message={
            userEntryToDelete
              ? `Are you sure you want to delete "${userEntryToDelete.content}" from your list?`
              : ""
          }
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={async () => {
            if (userEntryToDelete) {
              await fetch(`/entries/${userEntryToDelete.id}`, { method: 'DELETE' });
              setUserEntryToDelete(null);
              setUserEntriesLoading(true);
              fetch('/entries')
                .then((res) => res.json())
                .then((data) => setUserEntries(data))
                .finally(() => setUserEntriesLoading(false));
            }
          }}
          onCancel={() => setUserEntryToDelete(null)}
        />

           {/* Community Inspiration Section */}
           <section className="mt-12 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-3">Share & Explore Capabilities</h2>
            <form onSubmit={handleCommunitySubmit} className="flex flex-col md:flex-row gap-2 mb-6">
              <input
                type="text"
                placeholder="Category (e.g. Product Design)"
                className="border rounded px-3 py-2 flex-1"
                value={inputCategory}
                onChange={e => setInputCategory(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Capability (e.g. User Interviewing)"
                className="border rounded px-3 py-2 flex-1"
                value={inputCapability}
                onChange={e => setInputCapability(e.target.value)}
                required
              />
              <Button type="submit" variant="default">Add</Button>
            </form>
            {uniqueCategories.length === 0 ? (
              <p className="text-gray-500 italic">No capabilities shared yet. Add some above to get started!</p>
            ) : (
              <Accordion allowMultiple={true}>
                {uniqueCategories.map(category => {
                  const categoryEntries = communityEntries.filter(entry => entry.category === category);
                  return (
                    <AccordionItem
                      key={category}
                      title={`${category} (${categoryEntries.length})`}
                      actions={
                        <button
                          className="p-1 rounded hover:bg-red-100"
                          onClick={() => setCategoryToDelete(category)}
                          title="Delete entire category"
                        >
                          <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                        </button>
                      }
                    >
                      <div className="space-y-2">
                        {categoryEntries.map((entry, idx) => (
                          <div key={entry.id ?? idx} className="border rounded px-3 py-2 flex items-center justify-between bg-gray-50">
                            <span className="text-gray-800">{entry.capability}</span>
                            {entry.id && (
                              <button
                                className="p-1 rounded hover:bg-red-100"
                                title="Delete capability"
                                onClick={() => setEntryToDelete(entry as any)}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 hover:text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}

            {/* Confirm delete entry modal */}
            <ConfirmModal
              open={!!entryToDelete}
              title="Delete Entry"
              message={
                entryToDelete
                  ? `Are you sure you want to delete the capability "${entryToDelete.capability}" in category "${entryToDelete.category}"?`
                  : ""
              }
              confirmLabel="Delete"
              cancelLabel="Cancel"
              onConfirm={async () => {
                if (entryToDelete) {
                  await fetch(`/community-entries/${entryToDelete.id}`, { method: 'DELETE' });
                  setEntryToDelete(null);
                  fetchCommunityEntries();
                }
              }}
              onCancel={() => setEntryToDelete(null)}
            />

            {/* Confirm delete category modal */}
            <ConfirmModal
              open={!!categoryToDelete}
              title="Delete Category"
              message={
                categoryToDelete
                  ? `Are you sure you want to delete the category "${categoryToDelete}" and all its capabilities? This cannot be undone.`
                  : ""
              }
              confirmLabel="Delete All"
              cancelLabel="Cancel"
              onConfirm={async () => {
                if (categoryToDelete) {
                  await fetch(`/community-entries/category/${encodeURIComponent(categoryToDelete)}`, { method: 'DELETE' });
                  setCategoryToDelete(null);
                  fetchCommunityEntries();

                }
              }}
              onCancel={() => setCategoryToDelete(null)}
            />
          </section>
        </main>
      </div>
  );
}