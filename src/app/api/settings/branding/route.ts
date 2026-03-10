import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getBrandingSettings } from '@/lib/settings'

export async function GET() {
  const branding = await getBrandingSettings()
  return NextResponse.json(branding)
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { role, id } = session.user as any
  if (role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const companyName: string | undefined = body.companyName
  const logoDataUrl: string | null | undefined = body.logoDataUrl

  const data: any = {}
  if (typeof companyName === 'string' && companyName.trim()) {
    data.companyName = companyName.trim()
  }

  if (logoDataUrl !== undefined) {
    data.logoUrl = logoDataUrl && logoDataUrl.trim() ? logoDataUrl.trim() : null
  }

  const updated = await prisma.appSettings.upsert({
    where: { id: 1 },
    update: {
      ...data,
      updatedById: id,
    },
    create: {
      id: 1,
      companyName: data.companyName || (process.env.APP_NAME || 'TekCroft KPI CRM'),
      logoUrl: data.logoUrl ?? null,
      updatedById: id,
    },
  })

  return NextResponse.json({
    companyName: updated.companyName,
    logoUrl: updated.logoUrl,
  })
}

