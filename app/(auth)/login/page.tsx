import { LoginForm } from './LoginForm'
import { sanitizeCallbackUrl } from '@/lib/security/request'

export default function LoginPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string }
}) {
  const callbackUrl = sanitizeCallbackUrl(searchParams?.callbackUrl || '/admin/dashboard')
  return <LoginForm callbackUrl={callbackUrl} />
}
