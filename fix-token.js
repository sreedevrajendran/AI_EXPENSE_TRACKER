const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
    const deletedAcc = await p.account.deleteMany({ where: { provider: 'google' } });
    const deletedSess = await p.session.deleteMany({});
    console.log(`Deleted ${deletedAcc.count} Google accounts and ${deletedSess.count} sessions to reset identity state.`);
}
main().catch(console.error).finally(() => p.$disconnect());
