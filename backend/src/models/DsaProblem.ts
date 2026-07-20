import { eq, asc, desc } from 'drizzle-orm';
import { getDb } from '../config/db';
import { dsaProblems, type DsaProblem as DsaProblemRow, type NewDsaProblem } from '../config/schema';

// ─── Interface ────────────────────────────────────────────────────────────────
export interface IDsaProblem {
  _id: string;
  pattern: string;
  number: number;
  title: string;
  link: string;
  difficulty: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Row mapper ───────────────────────────────────────────────────────────────
const rowToModel = (row: DsaProblemRow): IDsaProblem => ({
  _id:        row.id,
  pattern:    row.pattern,
  number:     row.number,
  title:      row.title,
  link:       row.link,
  difficulty: row.difficulty,
  notes:      row.notes ?? null,
  createdAt:  row.createdAt,
  updatedAt:  row.updatedAt,
});

// ─── Model ────────────────────────────────────────────────────────────────────
const DsaProblem = {
  async findAll(): Promise<IDsaProblem[]> {
    const db = getDb();
    const rows = await db
      .select()
      .from(dsaProblems)
      .orderBy(asc(dsaProblems.pattern), asc(dsaProblems.number));
    return rows.map(rowToModel);
  },

  async findRecent(limit: number): Promise<IDsaProblem[]> {
    const db = getDb();
    const rows = await db
      .select()
      .from(dsaProblems)
      .orderBy(desc(dsaProblems.createdAt))
      .limit(limit);
    return rows.map(rowToModel);
  },

  async findById(id: string): Promise<IDsaProblem | null> {
    const db = getDb();
    const [row] = await db
      .select()
      .from(dsaProblems)
      .where(eq(dsaProblems.id, id))
      .limit(1);
    return row ? rowToModel(row) : null;
  },

  async create(data: {
    pattern: string;
    number: number;
    title: string;
    link: string;
    difficulty?: string;
    notes?: string;
  }): Promise<IDsaProblem> {
    const db = getDb();
    const insert: NewDsaProblem = {
      pattern:    data.pattern,
      number:     data.number,
      title:      data.title,
      link:       data.link,
      difficulty: data.difficulty ?? 'Medium',
      notes:      data.notes ?? '',
    };
    const [row] = await db.insert(dsaProblems).values(insert).returning();
    return rowToModel(row);
  },

  async bulkCreate(items: {
    pattern: string; number: number; title: string; link: string;
    difficulty?: string; notes?: string;
  }[]): Promise<IDsaProblem[]> {
    const db = getDb();
    const inserts: NewDsaProblem[] = items.map((d) => ({
      pattern: d.pattern, number: d.number, title: d.title, link: d.link,
      difficulty: d.difficulty ?? 'Medium', notes: d.notes ?? '',
    }));
    const rows = await db.insert(dsaProblems).values(inserts).returning();
    return rows.map(rowToModel);
  },

  async update(id: string, data: Partial<{
    pattern: string; number: number; title: string;
    link: string; difficulty: string; notes: string;
  }>): Promise<IDsaProblem | null> {
    const db = getDb();
    const [row] = await db
      .update(dsaProblems)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(dsaProblems.id, id))
      .returning();
    return row ? rowToModel(row) : null;
  },

  async delete(id: string): Promise<boolean> {
    const db = getDb();
    const [row] = await db
      .delete(dsaProblems)
      .where(eq(dsaProblems.id, id))
      .returning();
    return !!row;
  },
};

export default DsaProblem;
