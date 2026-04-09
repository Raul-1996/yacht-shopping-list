import type { HouseholdItem, PackingItem, EsimProvider } from '../types'
import data from './household.json'

interface HouseholdData {
  household_supplies: Omit<HouseholdItem, 'checked'>[]
  packing_checklist: Omit<PackingItem, 'checked'>[]
  esim_recommendations: EsimProvider[]
}

export const household = data as unknown as HouseholdData
