import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowRight, Trash2 } from "lucide-react";
import type { Capability } from "../types";

// Update props to receive state and a setter function from the parent
interface Props {
  capabilities: Capability[];
  setCapabilities: React.Dispatch<React.SetStateAction<Capability[]>>;
  onNext: () => void;
  onSave?: () => void;
}

export function CapabilityInput({ capabilities, setCapabilities, onNext, onSave }: Props) {
  // The local state for the capabilities list has been removed.

  const handleTextChange = (id: number, newText: string) => {
    setCapabilities(prev => prev.map(cap => (cap.id === id ? { ...cap, text: newText } : cap)));
  };
  
  const addCapability = () => {
    setCapabilities(prev => [...prev, { id: Date.now(), text: "" }]);
  };

  const removeCapability = (id: number) => {
    setCapabilities(prev => prev.filter(cap => cap.id !== id));
  };

  const filledCapabilities = capabilities.filter(c => c.text.trim() !== '');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-gray-900">Find Your Strengths</CardTitle>
        <CardDescription className="text-lg">
          Start by listing skills or capabilities you want to evaluate. We suggest 8-10 for the best results.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {capabilities.map((capability, index) => (
            <div key={capability.id} className="flex items-center space-x-2">
              <Label htmlFor={`cap-${capability.id}`} className="w-8 text-right text-muted-foreground">{index + 1}.</Label>
              <Input
                id={`cap-${capability.id}`}
                type="text"
                placeholder={`Enter capability #${index + 1}...`}
                value={capability.text}
                onChange={(e) => handleTextChange(capability.id, e.target.value)}
              />
              <Button variant="ghost" size="icon" onClick={() => removeCapability(capability.id)} disabled={capabilities.length <= 1}>
                <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500"/>
              </Button>
            </div>
          ))}
        </div>
        <div className="flex gap-2 pt-4 w-full">
  <Button variant="secondary" onClick={addCapability}>Add Row</Button>
  {onSave && (
    <Button variant="secondary" onClick={onSave}>
      Save to your list
    </Button>
  )}
  <Button onClick={onNext} disabled={filledCapabilities.length === 0}>
    Rank <ArrowRight className="h-4 w-4 ml-2" />
  </Button>
</div>
        <p className="text-sm text-muted-foreground text-right">{capabilities.length} capabilities</p>
      </CardContent>
    </Card>
  );
}