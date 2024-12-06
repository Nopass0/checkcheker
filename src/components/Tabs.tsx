import { createContext, useContext, ReactNode } from 'react';

type TabsContextType = {
  value: string;
  onChange: (value: string) => void;
};

const TabsContext = createContext<TabsContextType | undefined>(undefined);

export function Tabs({ 
  children, 
  value, 
  onChange 
}: { 
  children: ReactNode; 
  value: string; 
  onChange: (value: string) => void;
}) {
  return (
    <TabsContext.Provider value={{ value, onChange }}>
      <div className="w-full">{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`flex space-x-1 border-b ${className}`}>
      {children}
    </div>
  );
}

export function TabsTrigger({ children, value }: { children: ReactNode; value: string }) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsTrigger must be used within Tabs');

  const isActive = context.value === value;
  
  return (
    <button
      className={`px-4 py-2 text-sm font-medium transition-colors
        ${isActive 
          ? 'border-b-2 border-blue-500 text-blue-600' 
          : 'text-gray-600 hover:text-gray-900'
        }`}
      onClick={() => context.onChange(value)}
    >
      {children}
    </button>
  );
}

export function TabsContent({ children, value }: { children: ReactNode; value: string }) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsContent must be used within Tabs');

  if (context.value !== value) return null;

  return <div className="mt-4">{children}</div>;
}
