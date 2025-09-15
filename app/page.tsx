"use client"
import useCachedUser from "./hooks/useCachedUser"
import Wrapper from "./components/Wrapper"
import ProductOverview from "./components/ProductOverview"
import CategoryChart from "./components/CategoryChart"
import RecentTransactions from "./components/RecentTransactions"
import StockSummaryTable from "./components/StockSummaryTable"

export default function Home() {
  const cachedUser = useCachedUser() // c'est un objet MinimalUser | null

  if (!cachedUser) {
    return <div>Chargement...</div>
  }

  return (
    <Wrapper>
      <div className="flex flex-col md:flex-row">
        <div className="md:w-2/3">
          <ProductOverview email={cachedUser.email} />
          <CategoryChart email={cachedUser.email} />
          <RecentTransactions email={cachedUser.email} />
        </div>
        <div className="md:ml-4 md:mt-0 mt-4 md:w-1/3">
          <StockSummaryTable email={cachedUser.email} />
        </div>
      </div>
    </Wrapper>
  )
}
