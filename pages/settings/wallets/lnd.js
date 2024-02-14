import { getGetServerSideProps } from '../../../api/ssrApollo'
import { Form, Input } from '../../../components/form'
import { CenterLayout } from '../../../components/layout'
import { useMe } from '../../../components/me'
import { WalletButtonBar, WalletCard } from '../../../components/wallet-card'
import { useMutation } from '@apollo/client'
import { useToast } from '../../../components/toast'
import { LNDAutowithdrawSchema } from '../../../lib/validate'
import { useRouter } from 'next/router'
import { AutowithdrawSettings, autowithdrawInitial } from '../../../components/autowithdraw-shared'
import { REMOVE_WALLET, UPSERT_WALLET_LND, WALLET_BY_TYPE } from '../../../fragments/wallet'

const variables = { type: 'LND' }
export const getServerSideProps = getGetServerSideProps({ query: WALLET_BY_TYPE, variables, authRequired: true })

export default function LND ({ ssrData }) {
  const me = useMe()
  const toaster = useToast()
  const router = useRouter()
  const [upsertWalletLND] = useMutation(UPSERT_WALLET_LND)
  const [removeWallet] = useMutation(REMOVE_WALLET)

  const { walletByType: wallet } = ssrData || {}

  return (
    <CenterLayout>
      <h2 className='pb-2'>LND</h2>
      <h6 className='text-muted text-center pb-3'>autowithdraw to your Lightning Labs node</h6>
      <Form
        initial={{
          socket: wallet?.wallet?.socket || '',
          macaroon: wallet?.wallet?.macaroon || '',
          cert: wallet?.wallet?.cert || '',
          ...autowithdrawInitial({ me, priority: wallet?.priority })
        }}
        schema={LNDAutowithdrawSchema({ me })}
        onSubmit={async ({ socket, cert, macaroon, ...settings }) => {
          try {
            await upsertWalletLND({
              variables: {
                id: wallet?.id,
                socket,
                macaroon,
                cert,
                settings: {
                  ...settings,
                  autoWithdrawThreshold: Number(settings.autoWithdrawThreshold),
                  autoWithdrawMaxFeePercent: Number(settings.autoWithdrawMaxFeePercent)
                }
              }
            })
            toaster.success('saved settings')
            router.push('/settings/wallets')
          } catch (err) {
            console.error(err)
            toaster.danger('failed to attach: ' + err.message || err.toString?.())
          }
        }}
      >
        <Input
          label='grpc host and port'
          name='socket'
          hint='tor or clearnet'
          placeholder='55.5.555.55:10001'
          required
          autoFocus
        />
        <Input
          label='invoice macaroon'
          name='macaroon'
          hint='hex or base64 encoded'
          placeholder='AgEDbG5kAlgDChCn7YgfWX7uTkQQgXZ2uahNEgEwGhYKB2FkZHJlc3MSBHJlYWQSBXdyaXRlGhcKCGludm9pY2VzEgRyZWFkEgV3cml0ZRoPCgdvbmNoYWluEgRyZWFkAAAGIJkMBrrDV0npU90JV0TGNJPrqUD8m2QYoTDjolaL6eBs'
          required
        />
        <Input
          label={<>cert <small className='text-muted ms-2'>optional if from CA (e.g. voltage)</small></>}
          name='cert'
          hint='hex or base64 encoded'
          placeholder='LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUNNVENDQWRpZ0F3SUJBZ0lRSHBFdFdrcGJwZHV4RVF2eVBPc3NWVEFLQmdncWhrak9QUVFEQWpBdk1SOHcKSFFZRFZRUUtFeFpzYm1RZ1lYVjBiMmRsYm1WeVlYUmxaQ0JqWlhKME1Rd3dDZ1lEVlFRREV3TmliMkl3SGhjTgpNalF3TVRBM01qQXhORE0wV2hjTk1qVXdNekF6TWpBeE5ETTBXakF2TVI4d0hRWURWUVFLRXhac2JtUWdZWFYwCmIyZGxibVZ5WVhSbFpDQmpaWEowTVF3d0NnWURWUVFERXdOaWIySXdXVEFUQmdjcWhrak9QUUlCQmdncWhrak8KUFFNQkJ3TkNBQVJUS3NMVk5oZnhqb1FLVDlkVVdDbzUzSmQwTnBuL1BtYi9LUE02M1JxbU52dFYvdFk4NjJJZwpSbE41cmNHRnBEajhUeFc2OVhIK0pTcHpjWDdlN3N0Um80SFZNSUhTTUE0R0ExVWREd0VCL3dRRUF3SUNwREFUCkJnTlZIU1VFRERBS0JnZ3JCZ0VGQlFjREFUQVBCZ05WSFJNQkFmOEVCVEFEQVFIL01CMEdBMVVkRGdRV0JCVDAKMnh3V25GeHRUNzI0MWxwZlNoNm9FWi9UMWpCN0JnTlZIUkVFZERCeWdnTmliMktDQ1d4dlkyRnNhRzl6ZElJRApZbTlpZ2d4d2IyeGhjaTF1TVMxaWIyS0NGR2h2YzNRdVpHOWphMlZ5TG1sdWRHVnlibUZzZ2dSMWJtbDRnZ3AxCmJtbDRjR0ZqYTJWMGdnZGlkV1pqYjI1dWh3Ui9BQUFCaHhBQUFBQUFBQUFBQUFBQUFBQUFBQUFCaHdTc0VnQUQKTUFvR0NDcUdTTTQ5QkFNQ0EwY0FNRVFDSUEwUTlkRXdoNXpPRnpwL3hYeHNpemh5SkxNVG5yazU1VWx1NHJPRwo4WW52QWlBVGt4U3p3Y3hZZnFscGx0UlNIbmd0NUJFcDBzcXlHL05nenBzb2pmMGNqQT09Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0K'
        />
        <AutowithdrawSettings />
        <WalletButtonBar
          enabled={!!wallet} onDelete={async () => {
            try {
              await removeWallet({ variables: { id: wallet?.id } })
              toaster.success('saved settings')
              router.push('/settings/wallets')
            } catch (err) {
              console.error(err)
              toaster.danger('failed to unattach:' + err.message || err.toString?.())
            }
          }}
        />
      </Form>
    </CenterLayout>
  )
}

export function LNDCard ({ wallet }) {
  return (
    <WalletCard
      title='LND'
      badges={['receive only', 'non-custodial']}
      provider='lnd'
      enabled={wallet !== undefined || undefined}
    />
  )
}