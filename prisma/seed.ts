import { PrismaClient } from '@prisma/client'
// import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Seeding TekCroft KPI CRM database...')

    const admins = [
        { name: 'Aziz Ur Rehman', email: 'aziz.ur.rehman@tekcroft.com', password: 'Admin@123' },
        { name: 'Ali Hammad', email: 'ali.hammad@tekcroft.com', password: 'Admin@123' },
        { name: 'Adnan Ashraf', email: 'adnan.ashraf@tekcroft.com', password: 'Admin@123' },
        { name: 'Adil Saleem', email: 'adil.saleem@tekcroft.com', password: 'Admin@123' },
        { name: 'Waqar Abbas', email: 'waqar.abbas@tekcroft.com', password: 'Admin@123' },
    ]

    for (const admin of admins) {
        // const hash = await bcrypt.hash(admin.password, 12)
        await prisma.user.upsert({
            where: { email: admin.email },
            update: { passwordHash: admin.password },
            create: {
                name: admin.name,
                email: admin.email,
                passwordHash: admin.password,
                role: 'admin',
                isActive: true,
            },
        })
        console.log(`  ✅ Admin: ${admin.email} / ${admin.password}`)
    }

    console.log('\n🎉 Database seeded successfully!')
    console.log('\n📋 Login credentials:')
    console.log('  Admin 1: aziz.ur.rehman@tekcroft.com / Admin@123')
    console.log('  Admin 2: ali.hammad@tekcroft.com     / Admin@123')
    console.log('  Admin 3: adnan.ashraf@tekcroft.com   / Admin@123')
    console.log('  Admin 4: adil.saleem@tekcroft.com    / Admin@123')
    console.log('  Admin 5: waqar.abbas@tekcroft.com    / Admin@123')
}

main()
    .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1) })
    .finally(() => prisma.$disconnect())
