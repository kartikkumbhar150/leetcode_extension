import { Request, Response } from 'express';
import DsaProblem from '../models/DsaProblem';

// ── Public: get all problems (grouped by pattern) ─────────────
export const getAllProblems = async (req: Request, res: Response) => {
  try {
    const problems = await DsaProblem.findAll();

    // Group by pattern
    const grouped: Record<string, typeof problems> = {};
    for (const p of problems) {
      if (!grouped[p.pattern]) grouped[p.pattern] = [];
      grouped[p.pattern].push(p);
    }

    return res.json({ problems, grouped });
  } catch (err) {
    console.error('getAllProblems error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ── Public: get recently added problems ───────────────────────
export const getNewProblems = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const problems = await DsaProblem.findRecent(limit);
    return res.json({ problems });
  } catch (err) {
    console.error('getNewProblems error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ── Admin: create a single problem ────────────────────────────
export const createProblem = async (req: Request, res: Response) => {
  try {
    const { pattern, number, title, link, difficulty, notes } = req.body;

    if (!pattern || !number || !title || !link) {
      return res.status(400).json({ message: 'pattern, number, title and link are required' });
    }

    const problem = await DsaProblem.create({
      pattern: pattern.trim(),
      number: Number(number),
      title: title.trim(),
      link: link.trim(),
      difficulty: difficulty || 'Medium',
      notes: notes || '',
    });

    return res.status(201).json({ problem });
  } catch (err: any) {
    console.error('createProblem error:', err);
    return res.status(500).json({ message: err.message || 'Server error' });
  }
};

// ── Admin: bulk create problems ───────────────────────────────
export const bulkCreateProblems = async (req: Request, res: Response) => {
  try {
    const { problems } = req.body;
    if (!Array.isArray(problems) || problems.length === 0) {
      return res.status(400).json({ message: 'problems array required' });
    }

    const created = await DsaProblem.bulkCreate(
      problems.map((p: any) => ({
        pattern:    p.pattern?.trim(),
        number:     Number(p.number),
        title:      p.title?.trim(),
        link:       p.link?.trim(),
        difficulty: p.difficulty || 'Medium',
        notes:      p.notes || '',
      }))
    );

    return res.status(201).json({ created: created.length, problems: created });
  } catch (err: any) {
    console.error('bulkCreateProblems error:', err);
    return res.status(500).json({ message: err.message || 'Server error' });
  }
};

// ── Admin: update a problem ───────────────────────────────────
export const updateProblem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { pattern, number, title, link, difficulty, notes } = req.body;

    const problem = await DsaProblem.update(id, {
      ...(pattern    !== undefined && { pattern:    pattern.trim() }),
      ...(number     !== undefined && { number:     Number(number) }),
      ...(title      !== undefined && { title:      title.trim() }),
      ...(link       !== undefined && { link:       link.trim() }),
      ...(difficulty !== undefined && { difficulty }),
      ...(notes      !== undefined && { notes }),
    });

    if (!problem) return res.status(404).json({ message: 'Problem not found' });
    return res.json({ problem });
  } catch (err: any) {
    console.error('updateProblem error:', err);
    return res.status(500).json({ message: err.message || 'Server error' });
  }
};

// ── Admin: delete a problem ───────────────────────────────────
export const deleteProblem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await DsaProblem.delete(id);
    if (!deleted) return res.status(404).json({ message: 'Problem not found' });
    return res.json({ message: 'Problem deleted' });
  } catch (err) {
    console.error('deleteProblem error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
