import ConsultarClient from './ConsultarClient'

export default async function ConsultarPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code } = await searchParams
  return <ConsultarClient initialCode={code ?? ''} />
}
