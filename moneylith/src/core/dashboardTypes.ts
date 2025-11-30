export interface Transactie {
  id?: number;
  rekening: string;
  datum: string;
  bedrag: number;
  omschrijving: string;
  categorie?: string | null;
  bron?: string | null;
  ingevoerd_op?: string | null;
  vaste_last?: number | null;
}

export interface Schuld {
  id: number;
  naam: string;
  bedrag: number;
  rente?: number | null;
  maandbedrag?: number | null;
  looptijd?: string | null;
  status?: string | null;
}

export interface VasteLastIndex {
  id: number;
  naam: string;
  bedrag: number;
  rekening?: string | null;
  frequentie?: string | null;
  omschrijving?: string | null;
  actief: number;
}

export interface RegelPatroon {
  categorie: string;
  totaal: number;
  redenering: string;
}

export interface InstellingenOverzicht {
  regels: {
    totaal: number;
    actief: number;
    laatst_getriggerd_op: string | null;
  };
}
