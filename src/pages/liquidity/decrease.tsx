import dynamic from 'next/dynamic'
const Decrease = dynamic(() => import('@/features/Liquidity/Decrease'))

function DecreasePage() {
  return <Decrease />
}

export default DecreasePage

export async function getStaticProps() {
  return {
    props: { title: 'Liquidity Decrease' }
  }
}
