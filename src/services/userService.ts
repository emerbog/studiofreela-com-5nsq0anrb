import pb from '@/lib/pocketbase/client'
import { UserProfile } from '@/types'

export const getAvatarUrl = (user: UserProfile | null): string => {
  if (!user) return ''
  if (user.avatar && !user.avatar.startsWith('http')) {
    return pb.files.getURL(user as any, user.avatar)
  }
  return user.avatar || ''
}

export const userService = {
  async getCurrentProfile(): Promise<UserProfile | null> {
    const authModel = pb.authStore.model
    if (!authModel?.id) return null
    try {
      const record = await pb.collection('users').getOne<UserProfile>(authModel.id)
      return {
        id: record.id,
        email: record.email,
        name: record.name || '',
        avatar: record.avatar || '',
        phone: record.phone || '',
        profession: record.profession || '',
        address: record.address || '',
        plan_tier: record.plan_tier || 'economy',
        created: record.created,
        updated: record.updated,
      }
    } catch {
      return null
    }
  },

  async updateProfile(id: string, data: Partial<UserProfile> | FormData): Promise<UserProfile> {
    const updated = await pb.collection('users').update<UserProfile>(id, data)
    return {
      id: updated.id,
      email: updated.email,
      name: updated.name || '',
      avatar: updated.avatar || '',
      phone: updated.phone || '',
      profession: updated.profession || '',
      address: updated.address || '',
      plan_tier: updated.plan_tier || 'economy',
      created: updated.created,
      updated: updated.updated,
    }
  },

  async requestPasswordReset(email: string): Promise<boolean> {
    return await pb.collection('users').requestPasswordReset(email)
  },
}
