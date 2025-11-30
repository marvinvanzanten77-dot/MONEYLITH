export type MoneylithRoute =
  | "dashboard"
  | "monthly-plan"
  | "subscriptions"
  | "debts"
  | "automations"
  | "accounts"
  | "instellingen";

export interface RouteDefinition {
  id: MoneylithRoute;
  label: string;
  description: string;
}

export const routeDefinitions: RouteDefinition[] = [
  { id: "dashboard", label: "Dashboard", description: "Helder overzicht van inkomsten, plannen en alerts." },
  { id: "monthly-plan", label: "Maandplan", description: "Wat komt binnen en wat gaat er automatisch weg?" },
  { id: "subscriptions", label: "Abonnementen", description: "Automatische vaste lasten in beeld." },
  { id: "debts", label: "Schulden", description: "Duur en prioriteit van lopende aflossingen." },
  { id: "automations", label: "Automatiseringen", description: "Regels voor alerts en maandplannen." },
  { id: "accounts", label: "Rekeningen", description: "Beheer je bankkaarten en rekeningen." },
  { id: "instellingen", label: "Instellingen", description: "Beheer van regels en alerts." },
];
