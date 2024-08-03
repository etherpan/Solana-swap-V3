import { useCallback } from 'react'
import { Box, Button } from '@chakra-ui/react'
import { Wallet, useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { useEvent } from '@/hooks/useEvent'
import SelectWalletModal from './SelectWalletModal'
import { colors } from '@/theme/cssVariables'
import { useTranslation } from 'react-i18next'
import { MoonpayBuy } from '@/components/Moonpay'
import MoonPayIcon from '@/icons/misc/MoonPayIcon'

export default function WalletOnramp() {
  const { wallets, select, connected, connecting } = useWallet()
  const { t } = useTranslation()
  const { setVisible, visible } = useWalletModal()

  const handleClose = useCallback(() => setVisible(false), [setVisible])
  const handleOpen = useCallback(() => setVisible(true), [setVisible])

  const handleSelectWallet = useEvent((wallet: Wallet) => {
    select(wallet.adapter.name)
    handleClose()
  })

  if (connected)
    return (
      <>
        <MoonpayBuy>
          <Box className="p-mp__submit" maxW="320px" w="100%" m="auto">
            <Button
              width="full"
              variant="solid"
              size="md"
              height="52px"
              px="40px"
              borderRadius="50em"
              border="2px solid transparent"
              color={colors.text02}
              leftIcon={<MoonPayIcon width="16px" height="16px" color={colors.text02} />}
            >
              {t('button.deposit')}
            </Button>
          </Box>
        </MoonpayBuy>
      </>
    )
  return (
    <Box>
      <Button isLoading={connecting} loadingText="Connecting.." onClick={handleOpen}>
        {t('button.connect_wallet')}
      </Button>
      <SelectWalletModal wallets={wallets} isOpen={visible} onClose={handleClose} onSelectWallet={handleSelectWallet} />
    </Box>
  )
}
