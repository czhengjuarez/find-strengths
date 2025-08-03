import { useState, useEffect } from "react";
import { DndContext } from "@dnd-kit/core";
import { ConfirmModal } from "./components/ConfirmModal";
import { CapabilityInput } from "./components/CapabilityInput";
import { Button } from "./components/ui/button";
import { Accordion, AccordionItem } from "./components/ui/accordion";
import { Trash2, Edit2, Check, X } from "lucide-react";
import { RankingStep } from "./components/RankingStep";
import { ResultsGrid } from "./components/ResultsGrid";
import { Header } from "./components/Header";
import { LoginModal } from "./components/LoginModal";
import { GoogleOAuthCallback } from "./components/GoogleOAuthCallback";
import { GuestSaveModal } from "./components/GuestSaveModal";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import type { Capability, ProcessedCapability } from "./typs";

type AppStep = "INPUT" | "RANK_ENJOYMENT" | "RANK_SKILL" | "RESULTS";

function AppContent() {
  const { login, user, token, isAuthenticated } = useAuth();
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
  const [categoryToEdit, setCategoryToEdit] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");
  const [forceOpenAccordion, setForceOpenAccordion] = useState<string | null>(null);

  // Capability editing state
  const [capabilityToEdit, setCapabilityToEdit] = useState<number | null>(null);
  const [editingCapabilityText, setEditingCapabilityText] = useState("");
  const [userEntryToDelete, setUserEntryToDelete] = useState<{id: number, content: string} | null>(null);
  const [inputCategory, setInputCategory] = useState("");
  const [inputCapability, setInputCapability] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showGuestSaveModal, setShowGuestSaveModal] = useState(false);
  const [pendingCapabilities, setPendingCapabilities] = useState<Capability[]>([]);
  const [saveNotification, setSaveNotification] = useState<string | null>(null);

// Normalize category input: capitalize first letter, check for existing case-insensitive match
const normalizeCategory = (input: string): string => {
  const trimmed = input.trim();
  if (!trimmed) return trimmed;
  
  // Convert to proper Title Case (capitalize major words, keep minor words lowercase)
  const minorWords = ['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'if', 'in', 'nor', 'of', 'on', 'or', 'so', 'the', 'to', 'up', 'yet'];
  
  const titleCase = trimmed.toLowerCase().split(' ').map((word, index) => {
    // Always capitalize the first word, or if it's not a minor word
    if (index === 0 || !minorWords.includes(word)) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }
    return word; // Keep minor words lowercase (except first word)
  }).join(' ');
  
  // Check if a category with same name (case-insensitive) already exists
  const existingCategory = communityEntries.find(entry => 
    entry.category.toLowerCase() === trimmed.toLowerCase()
  );
  
  // If existing category found, return it with proper Title Case formatting
  // If no existing category, return the new Title Case version
  if (existingCategory) {
    // Apply Title Case to existing category to ensure consistency
    const existingTitleCase = existingCategory.category.toLowerCase().split(' ').map((word, index) => {
      if (index === 0 || !minorWords.includes(word)) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      return word;
    }).join(' ');
    return existingTitleCase;
  }
  
  return titleCase;
};

const normalizeCapability = (input: string): string => {
  const trimmed = input.trim();
  if (!trimmed) return trimmed;
  
  // Convert to title case (first letter of each word capitalized)
  const titleCase = trimmed.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  
  // Check if a capability with same name (case-insensitive) already exists
  const existingCapability = communityEntries.find(entry => 
    entry.capability.toLowerCase() === trimmed.toLowerCase()
  );
  
  // If existing capability found, ensure it's properly formatted in title case
  // If no existing capability, return the new title case version
  if (existingCapability) {
    // Return the existing capability but ensure proper title case formatting
    const existingTitleCase = existingCapability.capability.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    return existingTitleCase;
  }
  
  return titleCase;
};

const handleCommunitySubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (inputCategory.trim() && inputCapability.trim()) {
    const normalizedCategory = normalizeCategory(inputCategory);
    const normalizedCapability = normalizeCapability(inputCapability);
    
    // Check if this capability already exists in the same category
    const duplicateInCategory = communityEntries.find(entry => 
      entry.category.toLowerCase() === normalizedCategory.toLowerCase() &&
      entry.capability.toLowerCase() === normalizedCapability.toLowerCase()
    );
    
    if (duplicateInCategory) {
      // Capability already exists in this category, don't add duplicate
      setInputCategory("");
      setInputCapability("");
      return;
    }
    
    // Send to backend
    await fetch('/community-entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: normalizedCategory,
        capability: normalizedCapability,
      })
    });
    // Fetch updated entries from backend and await it
    await fetchCommunityEntries();
    setInputCategory("");
    setInputCapability("");
  }
};

// Handle category editing
const handleCategoryEdit = async (oldCategory: string, newCategory: string) => {
  const normalizedNewCategory = normalizeCategory(newCategory);
  
  if (!normalizedNewCategory.trim() || normalizedNewCategory === oldCategory) {
    setCategoryToEdit(null);
    setEditingCategoryName("");
    setForceOpenAccordion(null); // Fix: Clear force-open state when saving without changes
    return;
  }
  
  try {
    // Update all entries with the old category to use the new category
    const response = await fetch('/community-entries/update-category', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        oldCategory,
        newCategory: normalizedNewCategory,
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // Refresh the entries
    await fetchCommunityEntries();
    
    // Reset editing state and accordion auto-open
    setCategoryToEdit(null);
    setEditingCategoryName("");
    setForceOpenAccordion(null);
  } catch (error) {
    console.error('Error updating category:', error);
  }
};

// Start editing a category and auto-open accordion
const startEditingCategory = (category: string) => {
  setCategoryToEdit(category);
  setEditingCategoryName(category);
  setForceOpenAccordion(category); // Auto-open accordion for this category
};

// Cancel editing and reset accordion state
const cancelEditingCategory = () => {
  setCategoryToEdit(null);
  setEditingCategoryName("");
  setForceOpenAccordion(null); // Reset accordion auto-open state
};

// Start editing a capability
const startEditingCapability = (entryId: number, currentText: string) => {
  setCapabilityToEdit(entryId);
  setEditingCapabilityText(currentText);
};

// Handle capability edit submission
const handleCapabilityEdit = async (entryId: number, newText: string) => {
  const trimmedText = newText.trim();
  if (!trimmedText) {
    cancelEditingCapability();
    return;
  }
  
  const normalizedCapability = normalizeCapability(trimmedText);
  
  // Find the current entry being edited to get its category
  const currentEntry = communityEntries.find(entry => entry.id === entryId);
  if (!currentEntry) {
    cancelEditingCapability();
    return;
  }
  
  // Check if this capability already exists in the same category (excluding the current entry)
  const duplicateInCategory = communityEntries.find(entry => 
    entry.id !== entryId && // Exclude the current entry being edited
    entry.category.toLowerCase() === currentEntry.category.toLowerCase() &&
    entry.capability.toLowerCase() === normalizedCapability.toLowerCase()
  );
  
  if (duplicateInCategory) {
    // Capability already exists in this category, cancel edit
    cancelEditingCapability();
    return;
  }
  
  try {
    const response = await fetch(`/community-entries/${entryId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ capability: normalizedCapability })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // Refresh the entries
    await fetchCommunityEntries();
    
    // Reset editing state
    cancelEditingCapability();
  } catch (error) {
    console.error('Error updating capability:', error);
  }
};

// Cancel capability editing
const cancelEditingCapability = () => {
  setCapabilityToEdit(null);
  setEditingCapabilityText("");
};

// Fetch user entries - user-specific for logged-in users, empty for guests
const fetchUserEntries = async () => {
  setUserEntriesLoading(true);
  setUserEntriesError(null);
  
  try {
    if (!isAuthenticated || !token) {
      // Clear entries for guest users
      setUserEntries([]);
      return;
    }
    
    // Fetch user-specific entries for logged-in users
    const response = await fetch('/entries', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch user entries');
    }
    
    const data = await response.json();
    setUserEntries(data);
  } catch (err: any) {
    setUserEntriesError(err.message);
    setUserEntries([]);
  } finally {
    setUserEntriesLoading(false);
  }
};

// Load user entries when authentication state changes
useEffect(() => {
  fetchUserEntries();
}, [isAuthenticated, token]);

// Helper function to save capabilities to authenticated user's account
const saveCapabilitiesToAccount = async (caps: Capability[]) => {
  if (!token) return;
  
  // First, deduplicate the capabilities being saved (case-insensitive)
  const uniqueCapabilities = caps
    .filter(cap => cap.text.trim())
    .reduce((unique: Capability[], cap) => {
      const content = cap.text.trim();
      const isDuplicateInBatch = unique.some(existingCap => 
        existingCap.text.trim().toLowerCase() === content.toLowerCase()
      );
      if (!isDuplicateInBatch) {
        unique.push({ ...cap, text: content });
      }
      return unique;
    }, []);
  
  let newEntriesCount = 0;
  
  for (const cap of uniqueCapabilities) {
    const content = cap.text;
    // Check if this content already exists in user's list
    const isDuplicate = userEntries.some(entry => 
      entry.content.toLowerCase() === content.toLowerCase()
    );
    
    if (!isDuplicate) {
      await fetch('/entries', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content }),
      });
      newEntriesCount++;
    }
  }
  
  // Show notification if no new entries were added
  if (newEntriesCount === 0 && caps.some(cap => cap.text.trim())) {
    setSaveNotification('No new entries to add');
    setTimeout(() => setSaveNotification(null), 3000);
  }
  
  // Refresh user entries after saving
  await fetchUserEntries();
};

// Handle guest save modal actions
const handleGuestSignIn = () => {
  setShowGuestSaveModal(false);
  setShowLoginModal(true);
};

const handleGuestProceed = () => {
  // For guest users, save pending capabilities to local "My List" for the session
  
  // First, deduplicate the capabilities being saved (case-insensitive)
  const uniqueCapabilities = pendingCapabilities
    .filter(cap => cap.text.trim())
    .reduce((unique: Capability[], cap) => {
      const content = cap.text.trim();
      const isDuplicateInBatch = unique.some(existingCap => 
        existingCap.text.trim().toLowerCase() === content.toLowerCase()
      );
      if (!isDuplicateInBatch) {
        unique.push({ ...cap, text: content });
      }
      return unique;
    }, []);
  
  const newEntries = uniqueCapabilities
    .filter(cap => {
      // Check if this content already exists in user's list (case-insensitive)
      const content = cap.text;
      return !userEntries.some(entry => 
        entry.content.toLowerCase() === content.toLowerCase()
      );
    })
    .map((cap, index) => ({
      id: Date.now() + index, // Generate temporary integer ID for guest entries
      content: cap.text
    }));
  
  // Show notification if no new entries were added
  if (newEntries.length === 0 && uniqueCapabilities.length > 0) {
    setSaveNotification('No new entries to add');
    setTimeout(() => setSaveNotification(null), 3000);
  }
  
  // Add to existing user entries (for session-based storage)
  setUserEntries(prevEntries => [...prevEntries, ...newEntries]);
  
  // Clear pending capabilities and close modal
  setPendingCapabilities([]);
  setShowGuestSaveModal(false);
};

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
  const uniqueCommunityCategories = Array.from(new Set(communityEntries.map(entry => entry.category))).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  const filteredCommunityEntries = selectedCommunityCategory === "all"
    ? (() => {
        // For "All Categories" view, deduplicate capabilities and sort alphabetically
        const uniqueCapabilities = new Map();
        communityEntries.forEach(entry => {
          const capabilityKey = entry.capability.toLowerCase();
          if (!uniqueCapabilities.has(capabilityKey)) {
            uniqueCapabilities.set(capabilityKey, entry);
          }
        });
        return Array.from(uniqueCapabilities.values())
          .sort((a, b) => a.capability.toLowerCase().localeCompare(b.capability.toLowerCase()));
      })()
    : selectedCommunityCategory
    ? communityEntries.filter(e => e.category === selectedCommunityCategory)
    : [];

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

  const handleSignInClick = () => {
    setShowLoginModal(true);
  };

  const handleLoginSuccess = (user: any, token: string) => {
    login(user, token);
    setShowLoginModal(false);
  };

  // Check if this is a Google OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('token') && urlParams.get('user')) {
      // This is a Google OAuth callback, render the callback component
      return;
    }
  }, []);

  // Handle Google OAuth callback
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('token') && urlParams.get('user')) {
    return <GoogleOAuthCallback />;
  }

  return (
    <div className="min-h-screen bg-gray-50 text-slate-800">
      <Header onSignInClick={handleSignInClick} />
      <div className="flex items-center justify-center p-4 pt-8">
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
                <div className="flex-1 w-full md:w-1/2">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg bg-white p-4 min-h-[260px] flex flex-row gap-8 overflow-x-auto">
                   {/* My List Column */}
                   <div className="w-2/5 flex flex-col min-w-0">
                     <h2 className="text-lg font-semibold mb-2">My List</h2>
                     <div className="grid gap-2 mb-4 flex-1">
                        {userEntries.map((entry) => (
                          <div
                            key={entry.id}
                            id={`mylist:${entry.id}`}
                            style={{ cursor: 'grab' }}
                            {...{ draggable: true, onDragStart: (e) => { e.dataTransfer.setData('text/plain', `mylist:${entry.id}`); } }}
                            className="border rounded px-2 py-1 bg-gray-50 flex items-center text-sm w-full max-w-full overflow-hidden"
                          >
                            <span className="text-gray-800 flex-1 break-words-with-hyphens">{entry.content}</span>
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
                   <div className="w-3/5 flex flex-col min-w-0">
                     <div className="flex items-center mb-2 gap-2">
                       <h2 className="text-lg font-semibold">Capability</h2>
                       <select
                         className="border rounded px-2 py-1 text-sm max-w-40 truncate"
                         value={selectedCommunityCategory}
                         onChange={e => setSelectedCommunityCategory(e.target.value)}
                         title={selectedCommunityCategory || "Select a Category"}
                       >
                         <option value="" disabled>Select a Category</option>
                         <option value="all">All Categories</option>
                         {uniqueCommunityCategories.map(cat => (
                           <option key={cat} value={cat} title={cat}>
                             {cat.length > 20 ? `${cat.substring(0, 20)}...` : cat}
                           </option>
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
                       if (!isAuthenticated || !token) {
                         // Show guest save modal instead of alert
                         setPendingCapabilities(capabilities.filter(cap => cap.text.trim()));
                         setShowGuestSaveModal(true);
                         return;
                       }
                       
                       // Save for authenticated users
                       await saveCapabilitiesToAccount(capabilities);
                     }}
                    />
                    {saveNotification && (
                      <div className="mt-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-700 animate-fade-in">
                        {saveNotification}
                      </div>
                    )}
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
              if (token) {
                // Authenticated user - delete from backend
                await fetch(`/entries/${userEntryToDelete.id}`, { 
                  method: 'DELETE',
                  headers: {
                    'Authorization': `Bearer ${token}`
                  }
                });
                await fetchUserEntries();
              } else {
                // Guest user - delete from local state
                setUserEntries(prevEntries => 
                  prevEntries.filter(entry => entry.id !== userEntryToDelete.id)
                );
              }
              setUserEntryToDelete(null);
            }
          }}
          onCancel={() => setUserEntryToDelete(null)}
        />

           {/* Community Inspiration Section */}
           <section className="mt-12 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-3">Share & Explore Capabilities</h2>
            <p className="text-gray-600 text-sm mb-4">Contribute your unique capabilities and discover what others have shared. This is a community space where everyone's strengths help inspire and guide each other.</p>
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
              <Accordion 
                allowMultiple={true}
                forceOpenItems={forceOpenAccordion ? new Set([uniqueCommunityCategories.indexOf(forceOpenAccordion)]) : undefined}
                onForceOpenClear={(index) => {
                  // Clear force-open state when user manually tries to close - ACCORDION FIX v3 2025-08-03
                  setForceOpenAccordion(null);
                }}
              >
                {uniqueCommunityCategories.map(category => {
                  const categoryEntries = communityEntries.filter(entry => entry.category === category);
                  return (
                    <AccordionItem
                      key={category}
                      title={categoryToEdit === category ? "Editing Category" : `${category} (${categoryEntries.length})`}
                      actions={categoryToEdit === category ? null : (
                        <div className="flex gap-1">
                          <button
                            className="p-1 rounded hover:bg-blue-100"
                            onClick={() => startEditingCategory(category)}
                            title="Edit category name"
                          >
                            <Edit2 className="h-4 w-4 text-gray-400 hover:text-blue-500" />
                          </button>
                          <button
                            className="p-1 rounded hover:bg-red-100"
                            onClick={() => setCategoryToDelete(category)}
                            title="Delete entire category"
                          >
                            <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                          </button>
                        </div>
                      )}
                    >
                      {categoryToEdit === category ? (
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                          <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-blue-800">Edit category name:</label>
                            <input
                              type="text"
                              value={editingCategoryName}
                              onChange={(e) => setEditingCategoryName(e.target.value)}
                              className="border rounded px-2 py-1 text-sm flex-1"
                              placeholder="Category name"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleCategoryEdit(category, editingCategoryName);
                                } else if (e.key === 'Escape') {
                                  cancelEditingCategory();
                                }
                              }}
                            />
                            <button
                              onClick={() => handleCategoryEdit(category, editingCategoryName)}
                              className="px-3 py-1 text-white rounded hover:opacity-90 text-sm flex items-center gap-1"
                              style={{ backgroundColor: '#8F1F57' }}
                              title="Save changes"
                            >
                              <Check className="h-3 w-3" />
                              Save
                            </button>
                            <button
                              onClick={cancelEditingCategory}
                              className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm flex items-center gap-1"
                              title="Cancel editing"
                            >
                              <X className="h-3 w-3" />
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : null}
                      <div className="space-y-2">
                        {categoryEntries.map((entry, idx) => (
                          <div key={entry.id ?? idx} className="border rounded px-3 py-2 flex items-center justify-between bg-gray-50">
                            {capabilityToEdit === entry.id ? (
                              // Editing mode
                              <div className="flex items-center gap-2 flex-1">
                                <input
                                  type="text"
                                  value={editingCapabilityText}
                                  onChange={(e) => setEditingCapabilityText(e.target.value)}
                                  className="flex-1 px-2 py-1 border rounded text-sm"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleCapabilityEdit(entry.id!, editingCapabilityText);
                                    } else if (e.key === 'Escape') {
                                      cancelEditingCapability();
                                    }
                                  }}
                                />
                                <button
                                  onClick={() => handleCapabilityEdit(entry.id!, editingCapabilityText)}
                                  className="px-2 py-1 text-white rounded hover:opacity-90 text-sm flex items-center gap-1"
                                  style={{ backgroundColor: '#8F1F57' }}
                                  title="Save changes"
                                >
                                  <Check className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={cancelEditingCapability}
                                  className="px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm flex items-center gap-1"
                                  title="Cancel editing"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ) : (
                              // Display mode
                              <>
                                <span className="text-gray-800">{entry.capability}</span>
                                {entry.id && (
                                  <div className="flex gap-1">
                                    <button
                                      className="p-1 rounded hover:bg-blue-100"
                                      onClick={() => startEditingCapability(entry.id!, entry.capability)}
                                      title="Edit capability"
                                    >
                                      <Edit2 className="h-4 w-4 text-gray-400 hover:text-blue-500" />
                                    </button>
                                    <button
                                      className="p-1 rounded hover:bg-red-100"
                                      title="Delete capability"
                                      onClick={() => setEntryToDelete(entry as any)}
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 hover:text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                  </div>
                                )}
                              </>
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
      
      <LoginModal 
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={handleLoginSuccess}
      />
      
      <GuestSaveModal
        isOpen={showGuestSaveModal}
        onClose={() => setShowGuestSaveModal(false)}
        onSignIn={handleGuestSignIn}
        onProceedAsGuest={handleGuestProceed}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}