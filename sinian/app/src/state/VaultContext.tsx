import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { emptyVault, loadVault, saveVault, type Vault } from "./vault";

interface Ctx {
  vault: Vault;
  /** Mutate a draft and persist it. */
  update: (fn: (draft: Vault) => void) => void;
  ready: boolean;
}

const VaultContext = createContext<Ctx | null>(null);

export function VaultProvider({ children }: { children: ReactNode }) {
  const [vault, setVault] = useState<Vault>(emptyVault);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadVault().then((v) => {
      setVault(v);
      setReady(true);
    });
  }, []);

  const update = useCallback((fn: (draft: Vault) => void) => {
    setVault((prev) => {
      const draft = structuredClone(prev);
      fn(draft);
      saveVault(draft);
      return draft;
    });
  }, []);

  return <VaultContext.Provider value={{ vault, update, ready }}>{children}</VaultContext.Provider>;
}

export function useVault(): Ctx {
  const c = useContext(VaultContext);
  if (!c) throw new Error("useVault outside VaultProvider");
  return c;
}
