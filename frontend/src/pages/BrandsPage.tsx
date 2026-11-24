import { CatalogMasterWorkspace } from '../components/catalog/CatalogMasterWorkspace'

/** AH-POS master-data workspace; existing catalog hooks own all behavior. */
export function BrandsPage() {
  return <CatalogMasterWorkspace kind="brand" />
}
