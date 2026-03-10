import prisma from '@/lib/prisma'

export type BrandingSettings = {
  companyName: string
  logoUrl: string | null
}

const DEFAULT_COMPANY_NAME =
  process.env.APP_NAME || 'TekCroft KPI CRM'

export async function getBrandingSettings(): Promise<BrandingSettings> {
  const settings = await prisma.appSettings.findFirst()

  return {
    companyName: settings?.companyName || DEFAULT_COMPANY_NAME,
    logoUrl: settings?.logoUrl ?? null,
  }
}

