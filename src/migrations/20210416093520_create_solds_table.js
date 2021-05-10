/**
 * Create table `table_name`.
 *
 * @param   {object} knex
 * @returns {Promise}
 */
export function up(knex) {
  return knex.schema.createTable('solds', (table) => {
    table.uuid('id').primary();
    table.timestamp('created_at').notNull().defaultTo(knex.raw('now()'));
    table.timestamp('updated_at').notNull().defaultTo(knex.raw('now()'));
    table.enum('split', [true, false]).defaultTo(false);
    table.string('name').notNull();
    table.timestamp('date').notNull();
    table.string('sales_channel').notNull().defaultTo('蝦皮');
    table.enum('payee', ['Carol', 'Chad']).defaultTo('Carol');
    table.enum('status', ['active', 'inactive', 'archive']).notNull().defaultTo('active');
    table.boolean('settlement').notNull().defaultTo(false);
  });
}

/**
 * Drop `table_name`.
 *
 * @param   {object} knex
 * @returns {Promise}
 */
export function down(knex) {
  return knex.schema.dropTable('solds');
}
