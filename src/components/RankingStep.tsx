import { useState } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SortableItem } from "./ui/SortableItem";
import type { Capability } from "../types";
import { ArrowRight } from "lucide-react";

interface Props {
  capabilities: Capability[];
  onNext: (rankedCapabilities: Capability[]) => void;
  title: string;
  highLabel: string;
  lowLabel: string;
  direction: 'vertical' | 'horizontal';
}

export function RankingStep({ capabilities, onNext, title, highLabel, lowLabel, direction }: Props) {
  const [items, setItems] = useState<Capability[]>(capabilities);
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const strategy = direction === 'vertical' ? verticalListSortingStrategy : horizontalListSortingStrategy;

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setItems((currentItems) => {
        const oldIndex = currentItems.findIndex((item) => item.id === active.id);
        const newIndex = currentItems.findIndex((item) => item.id === over.id);
        return arrayMove(currentItems, oldIndex, newIndex);
      });
    }
  };
  
  const containerClasses = direction === 'vertical' 
    ? "w-full max-w-md relative pl-8 pr-4 py-4" 
    : "w-full relative pt-8 pb-4";
  
  const listContainerClasses = direction === 'vertical' 
    ? "space-y-3" 
    : "flex items-center space-x-3 overflow-x-auto pb-4";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-gray-900">{title}</CardTitle>
        <CardDescription className="text-lg">
          Drag and drop the items to rank them.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center">
            <div className={containerClasses}>
                {/* Labels */}
                {direction === 'vertical' ? (
                  <>
                    <div className="absolute top-0 left-0 text-sm font-bold text-gray-900 transform -rotate-90 -translate-x-4 translate-y-12">{highLabel}</div>
                    <div className="absolute bottom-0 left-0 text-sm font-bold text-gray-900 transform -rotate-90 -translate-x-4 -translate-y-12">{lowLabel}</div>
                  </>
                ) : (
                  <>
                    <div className="absolute top-0 left-0 text-sm font-bold text-gray-900">{highLabel}</div>
                    <div className="absolute top-0 right-0 text-sm font-bold text-gray-900">{lowLabel}</div>
                  </>
                )}
                
                {/* Draggable Area */}
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={items} strategy={strategy}>
                        <div className={listContainerClasses}>
                            {items.map(item => <SortableItem key={item.id} id={item.id} text={item.text} />)}
                        </div>
                    </SortableContext>
                </DndContext>
            </div>
        </div>
        <div className="flex justify-end pt-6">
          <Button onClick={() => onNext(items)}>
            {direction === 'vertical' ? 'Next: Rank Skill' : 'Show Results'} <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}