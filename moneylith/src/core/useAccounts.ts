import { useContext } from "react";
import { AccountsContext } from "./accountsContext";

export function useAccounts() {
  const context = useContext(AccountsContext);
  if (!context) {
    throw new Error("Accounts must be used within AccountsProvider");
  }
  return context;
}
