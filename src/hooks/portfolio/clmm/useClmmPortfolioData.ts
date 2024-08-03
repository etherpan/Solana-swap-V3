import { useMemo, useState, useEffect } from 'react'
import { ApiV3PoolInfoConcentratedItem, ApiV3Token } from '@raydium-io/raydium-sdk-v2'
import useClmmBalance, { ClmmDataMap, ClmmPosition } from '@/hooks/portfolio/clmm/useClmmBalance'
import { useAppStore } from '@/store'
import useFetchPoolById from '@/hooks/pool/useFetchPoolById'
import useTokenPrice from '@/hooks/token/useTokenPrice'
import Decimal from 'decimal.js'

export type { ClmmDataMap, ClmmPosition }

export default function useClmmPortfolioData<T>({ type }: { type: T }) {
  const { clmmBalanceInfo, getPriceAndAmount, reFetchBalance, isLoading, slot } = useClmmBalance({})
  const owner = useAppStore((s) => s.publicKey)
  const allClmmBalanceData = useMemo(() => Array.from(clmmBalanceInfo.entries()), [clmmBalanceInfo])
  const allPositions = useMemo(() => allClmmBalanceData.map((d) => d[1]).flat(), [allClmmBalanceData])
  const { formattedDataMap } = useFetchPoolById<ApiV3PoolInfoConcentratedItem>({
    idList: allClmmBalanceData.map((d) => d[0]),
    keepPreviousData: !!owner
  })
  const { data: tokenPrices } = useTokenPrice({
    mintList: Array.from(
      new Set(
        Object.values(formattedDataMap)
          .map((p) => [p.mintA.address, p.mintB.address])
          .flat()
      )
    )
  })

  const [clmmAll, setClmmAll] = useState(new Decimal(0))

  const [clmmPoolAssets, clmmPoolAssetsByMint] = useMemo(() => {
    if (!Object.keys(formattedDataMap).length) return [[], {}]
    let localClmmAll = new Decimal(0)
    const groupData: { [key: string]: ClmmPosition[] } = {}
    const groupDataByMint: {
      [key: string]: { mint: ApiV3Token; amount: string; usd: string }
    } = {}
    allClmmBalanceData.forEach(([poolId, positions]) => {
      const poolInfo = formattedDataMap[poolId]
      if (!poolInfo) return
      if (!groupData[poolInfo.poolName]) groupData[poolInfo.poolName] = positions
      else groupData[poolInfo.poolName] = groupData[poolInfo.poolName].concat(positions)
    })
    const allPositions = Object.keys(groupData).map((poolName) => {
      const positions = groupData[poolName]
      let poolAllValue = new Decimal(0)
      positions.forEach((position) => {
        const poolInfo = formattedDataMap[position.poolId.toBase58()]
        if (!poolInfo) return
        const { amountA, amountB } = getPriceAndAmount({ poolInfo, position })
        const usdValueA = amountA.mul(tokenPrices[poolInfo.mintA.address]?.value || 0)
        const usdValueB = amountB.mul(tokenPrices[poolInfo.mintB.address]?.value || 0)
        poolAllValue = poolAllValue
          .add(amountA.mul(tokenPrices[poolInfo.mintA.address]?.value || 0))
          .add(amountB.mul(tokenPrices[poolInfo.mintB.address]?.value || 0))
        groupDataByMint[poolInfo.mintA.address] = {
          mint: poolInfo.mintA,
          amount: new Decimal(groupDataByMint[poolInfo.mintA.address]?.amount || 0).add(amountA).toString(),
          usd: new Decimal(groupDataByMint[poolInfo.mintA.address]?.usd || 0).add(usdValueA).toString()
        }
        groupDataByMint[poolInfo.mintB.address] = {
          mint: poolInfo.mintB,
          amount: new Decimal(groupDataByMint[poolInfo.mintB.address]?.amount || 0).add(amountB).toString(),
          usd: new Decimal(groupDataByMint[poolInfo.mintB.address]?.usd || 0).add(usdValueB).toString()
        }
      })
      localClmmAll = localClmmAll.add(poolAllValue)
      return {
        key: poolName.replace(' - ', '/'),
        value: poolAllValue.toString(),
        type,
        percentage: 0
      }
    })
    setClmmAll(localClmmAll)
    return [allPositions, groupDataByMint]
  }, [formattedDataMap, tokenPrices, allClmmBalanceData, allPositions.length])

  clmmPoolAssets.forEach(
    (data) =>
      (data!.percentage = clmmAll.isZero() ? 100 : new Decimal(data!.value ?? 0).div(clmmAll).mul(100).toDecimalPlaces(2).toNumber())
  )

  useEffect(
    () => () => {
      setClmmAll(new Decimal(0))
    },
    [owner?.toBase58()]
  )

  return {
    isLoading,
    clmmBalanceInfo,
    totalUSD: clmmAll,
    clmmBalanceByMint: clmmPoolAssetsByMint,
    data: clmmPoolAssets,
    mutate: reFetchBalance,
    slot
  }
}
