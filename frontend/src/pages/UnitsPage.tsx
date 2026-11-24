import { CatalogMasterWorkspace } from '../components/catalog/CatalogMasterWorkspace'

/** AH-POS master-data workspace; existing catalog hooks own all behavior. */
export function UnitsPage() {
  return <CatalogMasterWorkspace kind="unit" />
}
