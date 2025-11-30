import { useMemo, useState, type FormEvent } from "react";
import type { Account } from "../core/types";
import { useAccounts } from "../core/useAccounts";

interface FormState {
  id?: string;
  name: string;
  iban: string;
  bank: string;
  type: Account["type"];
  active: boolean;
}

const emptyForm: FormState = {
  name: "",
  iban: "",
  bank: "ING",
  type: "Persoonlijk",
  active: true,
};

export function Accounts() {
  const { accounts, addAccount, updateAccount, removeAccount } = useAccounts();
  const [formState, setFormState] = useState<FormState | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmAccount, setConfirmAccount] = useState<Account | null>(null);

  const isEditing = formState?.id != null;

  const cancelForm = () => {
    setFormState(null);
    setFormError(null);
  };

  const openEditor = (account?: Account) => {
    setFormError(null);
    if (account) {
      setFormState({
        id: account.id,
        name: account.name,
        iban: account.iban,
        bank: account.bank,
        type: account.type,
        active: account.active,
      });
    } else {
      setFormState({ ...emptyForm });
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formState) return;

    if (formState.name.trim() === "" || formState.iban.trim() === "") {
      setFormError("Naam en IBAN zijn verplicht.");
      return;
    }

    const payload = {
      name: formState.name.trim(),
      iban: formState.iban.trim(),
      bank: formState.bank.trim(),
      type: formState.type,
      active: formState.active,
    };

    if (isEditing && formState.id) {
      updateAccount({ id: formState.id, ...payload });
    } else {
      addAccount(payload);
    }

    cancelForm();
  };

  const handleDelete = () => {
    if (!confirmAccount) return;
    removeAccount(confirmAccount.id);
    setConfirmAccount(null);
  };

  const banks = useMemo(() => ["ING", "bunq", "Overig"], []);
  const types: Account["type"][] = ["Persoonlijk", "Zakelijk", "Virtuele kaart", "Overig"];

  return (
    <section className="accounts-page moneylith-card">
      <header className="accounts-header">
        <div>
          <p className="section-label">Rekeningen</p>
          <h2 className="section-title">Beheer je bankrekeningen en virtuele kaarten.</h2>
          <p className="section-subtitle">
            Alles wordt lokaal opgeslagen. Wijzigingen zijn meteen zichtbaar en blijven binnen Moneylith.
          </p>
        </div>
        <button className="moneylith-pill moneylith-pill--primary" type="button" onClick={() => openEditor()}>
          Rekening toevoegen
        </button>
      </header>

      <div className="accounts-grid">
        {accounts.map((account) => (
          <article key={account.id} className="account-card">
            <div className="account-card-main">
              <div>
                <h3>{account.name}</h3>
                <p className="iban">{account.iban}</p>
                <p className="meta">
                  {account.type} • {account.bank}
                </p>
              </div>
              {account.active && <span className="badge">Actief</span>}
            </div>
            <div className="account-actions">
              <button className="ghost-button" onClick={() => openEditor(account)} type="button">
                Bewerken
              </button>
              <button className="ghost-button ghost-button--alert" onClick={() => setConfirmAccount(account)} type="button">
                Verwijderen
              </button>
            </div>
          </article>
        ))}
      </div>

      {formState && (
        <div className="account-form-backdrop">
          <form className="account-form" onSubmit={handleSubmit}>
            <div className="form-header">
              <h3>{isEditing ? "Rekening bewerken" : "Rekening toevoegen"}</h3>
              <p className="section-subtitle">
                Vul de gegevens in en bewaar de rekening. Alles blijft lokaal.
              </p>
            </div>
            <label>
              Naam
              <input
                value={formState.name}
                onChange={(event) => setFormState({ ...formState, name: event.target.value })}
                placeholder="Bijv. Spaarrekening ING"
                required
              />
            </label>
            <label>
              IBAN
              <input
                value={formState.iban}
                onChange={(event) => setFormState({ ...formState, iban: event.target.value })}
                placeholder="NL00 BANK 0000 0000 00"
                required
              />
            </label>
            <label>
              Bank
              <select value={formState.bank} onChange={(event) => setFormState({ ...formState, bank: event.target.value })}>
                {banks.map((bank) => (
                  <option key={bank} value={bank}>
                    {bank}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Type
              <select value={formState.type} onChange={(event) => setFormState({ ...formState, type: event.target.value as Account["type"] })}>
                {types.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={formState.active}
                onChange={(event) => setFormState({ ...formState, active: event.target.checked })}
              />
              Rekening actief
            </label>
            {formError && <p className="form-error">{formError}</p>}
            <div className="form-actions">
              <button className="moneylith-pill" type="submit">
                {isEditing ? "Wijzigingen opslaan" : "Opslaan"}
              </button>
              <button className="ghost-button" type="button" onClick={cancelForm}>
                Annuleren
              </button>
            </div>
          </form>
        </div>
      )}

      {confirmAccount && (
        <div className="account-form-backdrop">
          <div className="account-form account-form--confirm">
            <p className="form-error">Weet je zeker dat je deze rekening uit Moneylith wilt verwijderen?</p>
            <p className="section-subtitle">
              Dit verwijdert géén echte bankrekening, alleen de weergave in deze app.
            </p>
            <div className="form-actions">
              <button className="ghost-button ghost-button--alert" type="button" onClick={handleDelete}>
                Ja, verwijderen
              </button>
              <button className="ghost-button" type="button" onClick={() => setConfirmAccount(null)}>
                Annuleren
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
