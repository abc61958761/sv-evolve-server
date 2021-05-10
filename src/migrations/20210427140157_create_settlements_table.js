/**
 * Create table settlements.
 *
 * @param   {object} knex
 * @returns {Promise}
 */
export function up(knex) {
  return knex.schema.createTable('settlements', (table) => {
    table.uuid('id').primary();
    table.timestamp('created_at').notNull().defaultTo(knex.raw('now()'));
    table.timestamp('updated_at').notNull().defaultTo(knex.raw('now()'));
    table.integer('year').notNull();
    table.integer('month').notNull();
    table.integer('chad_purchase_price').notNull();
    table.integer('chad_sold_price').notNull();
    table.integer('carol_purchase_price').notNull();
    table.integer('carol_sold_price').notNull();
  });
}

/**
 * Drop `table_name`.
 *
 * @param   {object} knex
 * @returns {Promise}
 */
export function down(knex) {
  return knex.schema.dropTable('settlements');
}
