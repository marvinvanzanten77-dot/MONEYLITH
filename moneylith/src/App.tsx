import { DashboardLayout } from "./components/dashboard/DashboardLayout";
import { DashboardSummary } from "./components/dashboard/DashboardSummary";
import { TransactiesCard } from "./components/dashboard/TransactiesCard";
import { RekeningenCard } from "./components/dashboard/RekeningenCard";
import { SchuldenCard } from "./components/dashboard/SchuldenCard";
import { AbonnementenCard } from "./components/dashboard/AbonnementenCard";
import { InkomstenCard } from "./components/dashboard/InkomstenCard";
import { AnalyseCard } from "./components/dashboard/AnalyseCard";
import { TransactieUploadAnalyseCard } from "./components/dashboard/TransactieUploadAnalyseCard";
import { MainNavCards } from "./components/dashboard/MainNavCards";

function App() {
  const monthLabel = new Intl.DateTimeFormat("nl-NL", { month: "long", year: "numeric" }).format(new Date());

  return (
    <DashboardLayout title="Dashboard" subtitle={monthLabel}>
      <MainNavCards />

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <DashboardSummary />
        <TransactiesCard />
        <RekeningenCard />
        <SchuldenCard />
        <AbonnementenCard />
        <InkomstenCard />
        <AnalyseCard />
      </section>

      <section>
        <TransactieUploadAnalyseCard />
      </section>
    </DashboardLayout>
  );
}

export default App;
