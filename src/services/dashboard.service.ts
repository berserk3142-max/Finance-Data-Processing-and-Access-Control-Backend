import prisma from "../prisma/client";

export class DashboardService {
  static async getSummary() {
    const [incomeResult, expenseResult] = await Promise.all([
      prisma.record.aggregate({
        where: { type: "INCOME", deletedAt: null },
        _sum: { amount: true },
      }),
      prisma.record.aggregate({
        where: { type: "EXPENSE", deletedAt: null },
        _sum: { amount: true },
      }),
    ]);

    const totalIncome = incomeResult._sum.amount || 0;
    const totalExpense = expenseResult._sum.amount || 0;
    const netBalance = totalIncome - totalExpense;

    const categoryBreakdown = await prisma.record.groupBy({
      by: ["category", "type"],
      where: { deletedAt: null },
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
    });

    const categoryMap: Record<string, { income: number; expense: number; net: number }> = {};
    for (const item of categoryBreakdown) {
      if (!categoryMap[item.category]) {
        categoryMap[item.category] = { income: 0, expense: 0, net: 0 };
      }
      if (item.type === "INCOME") {
        categoryMap[item.category].income = item._sum.amount || 0;
      } else {
        categoryMap[item.category].expense = item._sum.amount || 0;
      }
      categoryMap[item.category].net =
        categoryMap[item.category].income - categoryMap[item.category].expense;
    }

    const monthlyTrends = await prisma.$queryRaw<
      Array<{ month: string; type: string; total: number }>
    >`
      SELECT 
        TO_CHAR(date, 'YYYY-MM') as month,
        type::text,
        SUM(amount) as total
      FROM records
      WHERE "deletedAt" IS NULL
      GROUP BY TO_CHAR(date, 'YYYY-MM'), type
      ORDER BY month DESC
      LIMIT 24
    `;

    const monthlyMap: Record<string, { income: number; expense: number; net: number }> = {};
    for (const item of monthlyTrends) {
      if (!monthlyMap[item.month]) {
        monthlyMap[item.month] = { income: 0, expense: 0, net: 0 };
      }
      if (item.type === "INCOME") {
        monthlyMap[item.month].income = Number(item.total);
      } else {
        monthlyMap[item.month].expense = Number(item.total);
      }
      monthlyMap[item.month].net =
        monthlyMap[item.month].income - monthlyMap[item.month].expense;
    }

    return {
      totalIncome,
      totalExpense,
      netBalance,
      categoryBreakdown: categoryMap,
      monthlyTrends: monthlyMap,
    };
  }
}
