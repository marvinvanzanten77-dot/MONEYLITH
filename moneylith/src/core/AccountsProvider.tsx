import type { ReactNode } from "react";
import { useCallback, useMemo, useState } from "react";
import { loadAccounts, persistAccounts } from "./storage";
import type { Account } from "./types";
import { randomId } from "./randomId";
import { AccountsContext } from "./accountsContext";

export function AccountsProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>(() => loadAccounts());

  const addAccount = useCallback(
    (payload: Omit<Account, "id">) => {
      setAccounts((prev) => {
        const next = [...prev, { id: randomId(), ...payload }];
        persistAccounts(next);
        return next;
      });
    },
    []
  );

  const updateAccount = useCallback((payload: Account) => {
    setAccounts((prev) => {
      const next = prev.map((account) => (account.id === payload.id ? payload : account));
      persistAccounts(next);
      return next;
    });
  }, []);

  const removeAccount = useCallback((id: string) => {
    setAccounts((prev) => {
      const next = prev.filter((account) => account.id !== id);
      persistAccounts(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      accounts,
      addAccount,
      updateAccount,
      removeAccount,
    }),
    [accounts, addAccount, updateAccount, removeAccount]
  );

  return <AccountsContext.Provider value={value}>{children}</AccountsContext.Provider>;
}
