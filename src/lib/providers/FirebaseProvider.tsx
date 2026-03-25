"use client";

import { createContext, useContext, type ReactNode } from "react";
import { app } from "@/lib/firebase";

// Create a simple context
const FirebaseContext = createContext<{ app: typeof app } | null>(null);

export function FirebaseProvider({ children }: { children: ReactNode }) {
  return (
    <FirebaseContext.Provider value={{ app }}>
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error("useFirebase must be used within FirebaseProvider");
  }
  return context;
}
