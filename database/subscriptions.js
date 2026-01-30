// Subscriptions CRUD operations
const db = require('./db');

const SubscriptionsDB = {
  getAll() {
    return db.query(`
      SELECT * FROM subscriptions
      ORDER BY next_billing_date ASC
    `);
  },

  getById(id) {
    return db.queryOne('SELECT * FROM subscriptions WHERE id = ?', [id]);
  },

  create(data) {
    const result = db.run(`
      INSERT INTO subscriptions (name, amount, currency, billing_cycle, next_billing_date, category, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      data.name,
      data.amount,
      data.currency || 'USD',
      data.billingCycle || 'monthly',
      data.nextBillingDate || null,
      data.category || null,
      data.notes || null
    ]);

    return this.getById(result.lastInsertRowid);
  },

  update(id, data) {
    const updates = [];
    const params = [];

    const fieldMap = {
      name: 'name',
      amount: 'amount',
      currency: 'currency',
      billingCycle: 'billing_cycle',
      nextBillingDate: 'next_billing_date',
      category: 'category',
      notes: 'notes'
    };

    Object.entries(fieldMap).forEach(([jsKey, dbKey]) => {
      if (data[jsKey] !== undefined) {
        updates.push(`${dbKey} = ?`);
        params.push(data[jsKey]);
      }
    });

    if (updates.length === 0) return this.getById(id);

    updates.push("updated_at = datetime('now')");
    params.push(id);

    db.run(`
      UPDATE subscriptions SET ${updates.join(', ')} WHERE id = ?
    `, params);

    return this.getById(id);
  },

  delete(id) {
    const result = db.run('DELETE FROM subscriptions WHERE id = ?', [id]);
    return { success: result.changes > 0, id };
  },

  getMonthlyTotal() {
    const result = db.queryOne(`
      SELECT SUM(
        CASE billing_cycle
          WHEN 'monthly' THEN amount
          WHEN 'yearly' THEN amount / 12.0
          WHEN 'weekly' THEN amount * 4.33
          ELSE amount
        END
      ) as total
      FROM subscriptions
    `);
    return result?.total || 0;
  },

  getByCategory(category) {
    return db.query(
      'SELECT * FROM subscriptions WHERE category = ? ORDER BY amount DESC',
      [category]
    );
  },

  getUpcoming(days = 7) {
    return db.query(`
      SELECT * FROM subscriptions
      WHERE next_billing_date IS NOT NULL
        AND date(next_billing_date) <= date('now', '+' || ? || ' days')
      ORDER BY next_billing_date ASC
    `, [days]);
  }
};

module.exports = SubscriptionsDB;
