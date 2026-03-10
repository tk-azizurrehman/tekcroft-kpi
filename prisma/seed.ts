import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Seeding TekCroft KPI CRM database...')

    // Create departments
    const deptData = [
        { name: 'Pinterest Dept.', colorHex: '#E60023' },
        { name: 'SEO Dept.', colorHex: '#3B82F6' },
        { name: 'YT Automation Dept.', colorHex: '#FF0000' },
        { name: 'Vibe Coding Dept.', colorHex: '#8B5CF6' },
        { name: 'Website Developers Dept.', colorHex: '#10B981' },
        { name: 'Others', colorHex: '#6B7280' },
    ]

    const departments: Record<string, any> = {}
    for (const d of deptData) {
        const dept = await prisma.department.upsert({
            where: { id: (await prisma.department.findFirst({ where: { name: d.name } }))?.id || '00000000-0000-0000-0000-000000000000' },
            update: {},
            create: d,
        })
        departments[d.name] = dept
        console.log(`  ✅ Department: ${d.name}`)
    }

    // Create admin user
    const adminHash = await bcrypt.hash('Admin@123', 12)
    const admin = await prisma.user.upsert({
        where: { email: 'admin@tekcroft.com' },
        update: {},
        create: {
            name: 'TekCroft Admin',
            email: 'admin@tekcroft.com',
            passwordHash: adminHash,
            role: 'admin',
            isActive: true,
        },
    })
    console.log(`  ✅ Admin: admin@tekcroft.com / Admin@123`)

    // Create demo manager
    const managerHash = await bcrypt.hash('Manager@123', 12)
    const manager = await prisma.user.upsert({
        where: { email: 'manager.seo@tekcroft.com' },
        update: {},
        create: {
            name: 'John Manager',
            email: 'manager.seo@tekcroft.com',
            passwordHash: managerHash,
            role: 'manager',
            departmentId: departments['SEO Dept.'].id,
            createdById: admin.id,
            isActive: true,
        },
    })
    console.log(`  ✅ Manager: manager.seo@tekcroft.com / Manager@123`)

    // Create demo team lead
    const leadHash = await bcrypt.hash('TeamLead@123', 12)
    const teamLead = await prisma.user.upsert({
        where: { email: 'lead.seo@tekcroft.com' },
        update: {},
        create: {
            name: 'Sara Lead',
            email: 'lead.seo@tekcroft.com',
            passwordHash: leadHash,
            role: 'team_lead',
            departmentId: departments['SEO Dept.'].id,
            createdById: manager.id,
            isActive: true,
        },
    })
    console.log(`  ✅ Team Lead: lead.seo@tekcroft.com / TeamLead@123`)

    // Create demo team member
    const memberHash = await bcrypt.hash('Member@123', 12)
    const member = await prisma.user.upsert({
        where: { email: 'ali@tekcroft.com' },
        update: {},
        create: {
            name: 'Ali Hassan',
            email: 'ali@tekcroft.com',
            passwordHash: memberHash,
            role: 'team_member',
            departmentId: departments['SEO Dept.'].id,
            createdById: teamLead.id,
            isActive: true,
        },
    })
    console.log(`  ✅ Member: ali@tekcroft.com / Member@123`)

    // Assign team lead → member
    await prisma.teamAssignment.upsert({
        where: { id: (await prisma.teamAssignment.findFirst({ where: { leaderId: teamLead.id, memberId: member.id } }))?.id || '00000000-0000-0000-0000-000000000001' },
        update: {},
        create: { leaderId: teamLead.id, memberId: member.id },
    })

    // Create KPI criteria for SEO dept
    const seoTasks = [
        { taskName: 'On-Page SEO', dailyLimit: 3, isLocked: true },
        { taskName: 'KW Research', dailyLimit: 10, isLocked: true },
        { taskName: 'Niche Research', dailyLimit: 2, isLocked: true },
        { taskName: 'Competitor Res.', dailyLimit: 5, isLocked: false },
    ]

    for (const task of seoTasks) {
        const existing = await prisma.kpiCriteria.findFirst({
            where: { departmentId: departments['SEO Dept.'].id, taskName: task.taskName },
        })
        if (!existing) {
            await prisma.kpiCriteria.create({
                data: {
                    departmentId: departments['SEO Dept.'].id,
                    taskName: task.taskName,
                    dailyLimit: task.dailyLimit,
                    isLocked: task.isLocked,
                    createdById: manager.id,
                },
            })
        }
        console.log(`  ✅ KPI Criteria: ${task.taskName} (limit: ${task.dailyLimit})`)
    }

    console.log('\n🎉 Database seeded successfully!')
    console.log('\n📋 Login credentials:')
    console.log('  Admin:     admin@tekcroft.com         / Admin@123')
    console.log('  Manager:   manager.seo@tekcroft.com   / Manager@123')
    console.log('  Team Lead: lead.seo@tekcroft.com      / TeamLead@123')
    console.log('  Member:    ali@tekcroft.com            / Member@123')
}

main()
    .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1) })
    .finally(() => prisma.$disconnect())
