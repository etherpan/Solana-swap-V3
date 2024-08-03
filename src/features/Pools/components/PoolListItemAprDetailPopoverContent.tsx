import { useTranslation } from 'react-i18next'
import TokenAvatar from '@/components/TokenAvatar'
import { colors, sizes } from '@/theme/cssVariables'
import { Badge, Box, Flex, Grid, HStack, VStack } from '@chakra-ui/react'
import { WeeklyRewardData } from '@/hooks/pool/type'
import { AprData } from '@/features/Clmm/utils/calApr'
import useTokenPrice from '@/hooks/token/useTokenPrice'
import { aprColors } from './PoolListItemAprLine'
import { PoolListItemAprPie } from './PoolListItemAprPie'
import { wSolToSolString } from '@/utils/token'
import { toAPRPercent } from '../util'
import { formatCurrency, formatToRawLocaleStr } from '@/utils/numberish/formatter'
import Decimal from 'decimal.js'
import dayjs from 'dayjs'

export default function PoolListItemAprDetailPopoverContent({
  aprData,
  rewardType,
  weeklyRewards
}: {
  aprData: AprData
  rewardType: string
  weeklyRewards: WeeklyRewardData
}) {
  const { t } = useTranslation()
  const { data: tokenPrices } = useTokenPrice({
    mintList: weeklyRewards.map((r) => r.token.address)
  })

  const haveWeeklyRewards = weeklyRewards.length > 0 && weeklyRewards.some((reward) => Number(reward.amount) !== 0)

  return (
    <Flex flexDir="column" p={2} gap={4}>
      <Box>
        <Flex mb={2} alignItems="center" justifyContent="space-between">
          <Box fontSize={sizes.textSM} color={colors.textSecondary}>
            {t('field.total_apr')}
          </Box>
          <Box fontSize={sizes.textLG} fontWeight="medium" color={colors.textPrimary}>
            {formatToRawLocaleStr(parseFloat(aprData.apr.toFixed(2)))}%
          </Box>
        </Flex>
        {/* total apr */}
        <Grid templateColumns="auto 1fr" gap={8}>
          <PoolListItemAprPie aprs={aprData} />
          <Flex flexGrow={2} justify="space-between" align="center">
            <VStack flex={3}>
              <Flex w="full" gap={4} justify="space-between" align="center">
                <Flex fontSize={sizes.textXS} fontWeight="normal" color={colors.textSecondary} justify="flex-start" align="center">
                  <Box rounded="full" bg={aprColors[0]} w="7px" h="7px" mr="8px"></Box>
                  {t('field.trade_fees')}
                </Flex>
                <Box fontSize={sizes.textXS} color={colors.textPrimary}>
                  {formatToRawLocaleStr(toAPRPercent(aprData.fee.apr))}
                </Box>
              </Flex>
              {aprData.rewards.map(({ apr, mint }, idx) => {
                if (weeklyRewards[idx].amount === '0') return null
                return (
                  <Flex w="full" gap={4} key={`reward-${mint?.symbol}-${idx}`} justify="space-between" align="center">
                    <Flex fontSize={sizes.textXS} fontWeight="normal" color={colors.textSecondary} justify="flex-start" align="center">
                      <Box rounded="full" bg={aprColors[idx + 1]} w="7px" h="7px" mr="8px"></Box>
                      {wSolToSolString(mint?.symbol)}
                    </Flex>
                    <Box fontSize={sizes.textXS} color={colors.textPrimary}>
                      {formatToRawLocaleStr(toAPRPercent(apr))}
                    </Box>
                  </Flex>
                )
              })}
            </VStack>
          </Flex>
        </Grid>
      </Box>

      {haveWeeklyRewards && (
        <Box>
          <Flex mb={2} alignItems="center" justifyContent="space-between">
            <Box fontSize={sizes.textSM} color={colors.textSecondary}>
              {t('field.weekly_rewards')}
            </Box>
            <Box fontSize="14px" fontWeight="normal" color={colors.textPrimary}>
              {rewardType && <Badge variant="crooked">{rewardType}</Badge>}
            </Box>
          </Flex>
          {/* total apr */}
          {weeklyRewards.map((reward) => {
            if (reward.amount === '0') return null
            const isRewardEnded = reward.endTime ? reward.endTime * 1000 < Date.now() : true
            return (
              <Flex gap={4} w="full" key={String(reward.token?.address)} justify="space-between" align="center" fontSize="12px" mt="8px">
                <HStack fontWeight="normal" color={colors.textSecondary} spacing="5px">
                  <TokenAvatar size="xs" token={reward.token} />
                  <Box color={colors.textPrimary}>{formatCurrency(reward.amount, { decimalPlaces: 1, abbreviated: true })}</Box>
                  <Box>{wSolToSolString(reward.token?.symbol)}</Box>
                  <Box color={colors.textPrimary}>
                    (
                    {formatCurrency(new Decimal(tokenPrices[reward.token.address]?.value || 0).mul(reward.amount).toString(), {
                      symbol: '$',
                      abbreviated: true,
                      decimalPlaces: 2
                    })}
                    )
                  </Box>
                </HStack>
                {reward.endTime ? (
                  <Box fontSize="10px" fontWeight="normal" color={colors.textSecondary}>
                    {isRewardEnded ? t('liquidity.rewards_ended') : t('liquidity.rewards_ends')}{' '}
                    {dayjs(reward.endTime * 1000).format('MM/DD/YY')}
                  </Box>
                ) : null}
              </Flex>
            )
          })}
        </Box>
      )}
    </Flex>
  )
}
