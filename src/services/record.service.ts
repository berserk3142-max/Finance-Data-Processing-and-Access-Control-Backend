import prisma from "../prisma/client";
import { AppError } from "../middleware/error.middleware";
import { RecordType, Prisma } from "@prisma/client";

interface RecordFilters {
  type?: RecordType;
  category?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: string;
  limit?: string;
}

export class RecordService {
  static async create(data: {
    amount: number;
    type: RecordType;
    category: string;
    date: string;
    notes?: string;
    createdById: string;
  }) {
    return prisma.record.create({
      data: {
        amount: data.amount,
        type: data.type,
        category: data.category,
        date: new Date(data.date),
        notes: data.notes,
        createdById: data.createdById,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  static async getAll(filters: RecordFilters) {
    const page = parseInt(filters.page || "1");
    const limit = parseInt(filters.limit || "10");
    const skip = (page - 1) * limit;

    const where: Prisma.RecordWhereInput = {
      deletedAt: null,
    };

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.category) {
      where.category = { contains: filters.category, mode: "insensitive" };
    }

    if (filters.search) {
      where.OR = [
        { category: { contains: filters.search, mode: "insensitive" } },
        { notes: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    if (filters.startDate || filters.endDate) {
      where.date = {};
      if (filters.startDate) {
        where.date.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.date.lte = new Date(filters.endDate);
      }
    }

    const [records, total] = await Promise.all([
      prisma.record.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: "desc" },
        include: {
          createdBy: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      prisma.record.count({ where }),
    ]);

    return {
      records,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getById(id: string) {
    const record = await prisma.record.findFirst({
      where: { id, deletedAt: null },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!record) {
      throw new AppError("Record not found", 404);
    }

    return record;
  }

  static async update(
    id: string,
    data: {
      amount?: number;
      type?: RecordType;
      category?: string;
      date?: string;
      notes?: string;
    }
  ) {
    const record = await prisma.record.findFirst({
      where: { id, deletedAt: null },
    });

    if (!record) {
      throw new AppError("Record not found", 404);
    }

    const updateData: Prisma.RecordUpdateInput = {};
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.date !== undefined) updateData.date = new Date(data.date);
    if (data.notes !== undefined) updateData.notes = data.notes;

    return prisma.record.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  static async softDelete(id: string) {
    const record = await prisma.record.findFirst({
      where: { id, deletedAt: null },
    });

    if (!record) {
      throw new AppError("Record not found", 404);
    }

    return prisma.record.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
