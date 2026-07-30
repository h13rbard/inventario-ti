'use strict';

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const DEFAULT_CATEGORIES = [
  { id: 'cat_1', name: 'Toners', icon: '🖨️', color: '#4f9cf9' },
  { id: 'cat_2', name: 'Celulares', icon: '📱', color: '#7c5cfc' },
  { id: 'cat_3', name: 'Laptops', icon: '💻', color: '#34d399' },
  { id: 'cat_4', name: 'Cables y Accesorios', icon: '🔌', color: '#f59e0b' },
  { id: 'cat_5', name: 'Otros', icon: '📦', color: '#94a3b8' },
  { id: 'cat_6', name: 'Salas de Juntas', icon: '👥', color: '#e83e8c' },
];

const BRANCHES = ['main', 'alberta', 'salto'];

async function main() {
  const passwordHash = await bcrypt.hash('demo123', 10);

  await prisma.user.upsert({
    where: { username: 'demo' },
    update: { passwordHash, role: 'admin' },
    create: { username: 'demo', passwordHash, role: 'admin' },
  });

  for (const branch of BRANCHES) {
    for (const cat of DEFAULT_CATEGORIES) {
      await prisma.category.upsert({
        where: { branch_id: { branch, id: cat.id } },
        update: { name: cat.name, icon: cat.icon, color: cat.color },
        create: { branch, ...cat },
      });
    }
  }

  console.log('✅ Seed completado: usuario demo / demo123 y categorías por sucursal');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
