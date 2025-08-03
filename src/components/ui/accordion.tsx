import React, { useState } from 'react';

interface AccordionItemProps {
  title: string;
  children: React.ReactNode;
  isOpen?: boolean;
  onToggle?: () => void;
  actions?: React.ReactNode;
}

export const AccordionItem: React.FC<AccordionItemProps> = ({
  title,
  children,
  isOpen = false,
  onToggle,
  actions
}) => {
  return (
    <div className="border border-gray-200 rounded-lg mb-2 overflow-hidden">
      <div 
        className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          {isOpen ? (
            <svg className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          ) : (
            <svg className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
          <h3 className="font-semibold text-gray-900">{title}</h3>
        </div>
        {actions && (
          <div onClick={(e) => e.stopPropagation()}>
            {actions}
          </div>
        )}
      </div>
      {isOpen && (
        <div className="p-4 bg-white border-t border-gray-200">
          {children}
        </div>
      )}
    </div>
  );
};

interface AccordionProps {
  children: React.ReactNode;
  allowMultiple?: boolean;
  forceOpenItems?: Set<number>; // External control for forcing items open
  onForceOpenClear?: (index: number) => void; // Callback when user tries to close a force-opened item - FIXED v2
}

export const Accordion: React.FC<AccordionProps> = ({ 
  children, 
  allowMultiple = false,
  forceOpenItems,
  onForceOpenClear
}) => {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());

  const handleToggle = (index: number) => {
    const isForceOpen = forceOpenItems?.has(index) || false;
    
    // If this item is force-opened and user is trying to close it, call the callback
    if (isForceOpen && onForceOpenClear) {
      onForceOpenClear(index);
      return;
    }
    
    if (allowMultiple) {
      const newOpenItems = new Set(openItems);
      if (newOpenItems.has(index)) {
        newOpenItems.delete(index);
      } else {
        newOpenItems.add(index);
      }
      setOpenItems(newOpenItems);
    } else {
      setOpenItems(openItems.has(index) ? new Set() : new Set([index]));
    }
  };

  return (
    <div className="space-y-2">
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement<AccordionItemProps>(child) && child.type === AccordionItem) {
          const isForceOpen = forceOpenItems?.has(index) || false;
          const isNormallyOpen = openItems.has(index);
          return React.cloneElement(child, {
            ...child.props,
            isOpen: isForceOpen || isNormallyOpen,
            onToggle: () => handleToggle(index),
          });
        }
        return child;
      })}
    </div>
  );
};
