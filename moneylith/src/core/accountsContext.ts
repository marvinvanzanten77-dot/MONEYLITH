import { createContext } from "react";
import type { Account } from "./types";

export interface AccountsContextValue {
  accounts: Account[];
  addAccount: (payload: Omit<Account, "id">) => void;
  updateAccount: (payload: Account) => void;
  removeAccount: (id: string) => void;
}

export const AccountsContext = createContext<AccountsContextValue | null>(null);
