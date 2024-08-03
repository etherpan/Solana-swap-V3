import { useEffect, useMemo } from 'react'
import { ApiV3PoolInfoStandardItem, FetchPoolParams } from '@raydium-io/raydium-sdk-v2'
import useSWR, { KeyedMutator } from 'swr'
import shallow from 'zustand/shallow'
import { AxiosResponse } from 'axios'
import axios from '@/api/axios'
import { isValidPublicKey } from '@/utils/publicKey'
import { MINUTE_MILLISECONDS } from '@/utils/date'

import { FormattedPoolInfoStandardItem } from './type'
import { useAppStore } from '@/store'
import { formatPoolData, poolInfoCache, formatAprData } from './formatter'

const fetcher = ([url]: [url: string]) => axios.get<ApiV3PoolInfoStandardItem[]>(url, { skipError: true })

export default function useFetchPoolByLpMint(
  props: {
    shouldFetch?: boolean
    lpMintList?: (string | undefined)[]
    refreshInterval?: number
    refreshTag?: number
    keepPreviousData?: boolean
  } & FetchPoolParams
): {
  data?: ApiV3PoolInfoStandardItem[]
  dataMap: { [key: string]: ApiV3PoolInfoStandardItem }
  formattedData?: FormattedPoolInfoStandardItem[]
  formattedDataMap: { [key: string]: FormattedPoolInfoStandardItem }
  isLoading: boolean
  error?: any
  isEmptyResult: boolean
  isValidating: boolean
  mutate: KeyedMutator<AxiosResponse<ApiV3PoolInfoStandardItem[], any>>
} {
  const { shouldFetch = true, lpMintList = [], refreshInterval = MINUTE_MILLISECONDS * 3, refreshTag, keepPreviousData } = props || {}
  const readyIdList = lpMintList.filter((i) => i && isValidPublicKey(i)) as string[]
  const [host, searchLpUrl] = useAppStore((s) => [s.urlConfigs.BASE_HOST, s.urlConfigs.POOL_SEARCH_LP], shallow)
  const url = !lpMintList || !shouldFetch || !readyIdList.length ? null : host + searchLpUrl

  const { data, isLoading, error, ...rest } = useSWR(url ? [url + `?lps=${lpMintList.join(',')}`, refreshTag] : url, fetcher, {
    dedupingInterval: refreshInterval,
    focusThrottleInterval: refreshInterval,
    refreshInterval,
    keepPreviousData
  })

  const resData = useMemo(() => data?.data.filter((d) => !!d).map(formatAprData) || [], [data]) as ApiV3PoolInfoStandardItem[]
  const dataMap = useMemo(() => resData.reduce((acc, cur) => ({ ...acc, [cur.id]: cur }), {}), [resData]) as {
    [key: string]: ApiV3PoolInfoStandardItem
  }
  const formattedData = useMemo(() => resData.map(formatPoolData), [resData]) as FormattedPoolInfoStandardItem[]
  const formattedDataMap = useMemo(() => formattedData.reduce((acc, cur) => ({ ...acc, [cur.id]: cur }), {}), []) as {
    [key: string]: FormattedPoolInfoStandardItem
  }
  const isEmptyResult = !!lpMintList && !isLoading && !(data && !error)

  useEffect(() => {
    if (data)
      data.data.forEach((d) => {
        if (d) poolInfoCache.set(d.id, d)
      })
  }, [data])

  return {
    data: data?.data.filter((d) => !!d).map(formatAprData) as ApiV3PoolInfoStandardItem[],
    dataMap,
    formattedData,
    formattedDataMap,
    isLoading,
    error,
    isEmptyResult,
    ...rest
  }
}
