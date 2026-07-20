'use server'

import { redirect } from 'next/navigation'
import { auth, signOut } from '@/auth'
import { deleteUserAccount } from '@/lib/supabase'

export async function deleteOwnAccount() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Non autenticato')
  const userId = parseInt(session.user.id, 10)
  if (isNaN(userId)) throw new Error('Sessione non valida')
  await deleteUserAccount(userId)
  await signOut({ redirect: false })
  redirect('/?account=deleted')
}
