'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import {
  moderateComment,
  bulkModerateComments,
  setUserRole,
} from '@/lib/supabase'

async function requireAdmin(): Promise<number> {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'admin') {
    throw new Error('Accesso non autorizzato.')
  }
  return parseInt(session.user.id, 10)
}

export async function approveComment(formData: FormData) {
  const moderatorId = await requireAdmin()
  const id = parseInt(formData.get('id') as string, 10)
  await moderateComment({ id, status: 'approved', moderatorId })
  revalidatePath('/admin/comments')
}

export async function rejectComment(formData: FormData) {
  const moderatorId = await requireAdmin()
  const id = parseInt(formData.get('id') as string, 10)
  await moderateComment({ id, status: 'rejected', moderatorId })
  revalidatePath('/admin/comments')
}

export async function bulkApprove(formData: FormData) {
  const moderatorId = await requireAdmin()
  const ids = formData.getAll('ids').map(v => parseInt(v as string, 10)).filter(n => !isNaN(n))
  await bulkModerateComments({ ids, status: 'approved', moderatorId })
  revalidatePath('/admin/comments')
}

export async function bulkReject(formData: FormData) {
  const moderatorId = await requireAdmin()
  const ids = formData.getAll('ids').map(v => parseInt(v as string, 10)).filter(n => !isNaN(n))
  await bulkModerateComments({ ids, status: 'rejected', moderatorId })
  revalidatePath('/admin/comments')
}

export async function changeUserRole(formData: FormData) {
  await requireAdmin()
  const userId = parseInt(formData.get('user_id') as string, 10)
  const role   = formData.get('role') as 'user' | 'trusted' | 'admin' | 'banned'
  if (!['user','trusted','admin','banned'].includes(role)) throw new Error('Ruolo non valido')
  await setUserRole(userId, role)
  revalidatePath('/admin/comments')
}
