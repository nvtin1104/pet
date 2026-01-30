// Todos CRUD operations
const db = require('./db');

const TodosDB = {
  getAll() {
    return db.query(`
      SELECT * FROM todos
      ORDER BY completed ASC, priority DESC, created_at DESC
    `);
  },

  getById(id) {
    return db.queryOne('SELECT * FROM todos WHERE id = ?', [id]);
  },

  create(data) {
    const result = db.run(`
      INSERT INTO todos (title, priority, due_date)
      VALUES (?, ?, ?)
    `, [
      data.title,
      data.priority || 0,
      data.dueDate || null
    ]);

    return this.getById(result.lastInsertRowid);
  },

  update(id, data) {
    const updates = [];
    const params = [];

    if (data.title !== undefined) {
      updates.push('title = ?');
      params.push(data.title);
    }
    if (data.completed !== undefined) {
      updates.push('completed = ?');
      params.push(data.completed ? 1 : 0);
    }
    if (data.priority !== undefined) {
      updates.push('priority = ?');
      params.push(data.priority);
    }
    if (data.dueDate !== undefined) {
      updates.push('due_date = ?');
      params.push(data.dueDate);
    }

    if (updates.length === 0) return this.getById(id);

    updates.push("updated_at = datetime('now')");
    params.push(id);

    db.run(`
      UPDATE todos SET ${updates.join(', ')} WHERE id = ?
    `, params);

    return this.getById(id);
  },

  delete(id) {
    const result = db.run('DELETE FROM todos WHERE id = ?', [id]);
    return { success: result.changes > 0, id };
  },

  toggleComplete(id) {
    db.run(`
      UPDATE todos
      SET completed = CASE WHEN completed = 0 THEN 1 ELSE 0 END,
          updated_at = datetime('now')
      WHERE id = ?
    `, [id]);

    return this.getById(id);
  },

  clearCompleted() {
    const result = db.run('DELETE FROM todos WHERE completed = 1');
    return { deleted: result.changes };
  }
};

module.exports = TodosDB;
