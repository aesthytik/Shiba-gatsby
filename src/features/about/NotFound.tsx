import { ButtonLink } from '../../components/ui/Button'
import { PageHeader } from '../../components/ui/PageHeader'

export function NotFound() {
  return (
    <>
      <PageHeader title="Page not found" subtitle="That page doesn't exist. It may have moved." />
      <ButtonLink to="/">Go home</ButtonLink>
    </>
  )
}
