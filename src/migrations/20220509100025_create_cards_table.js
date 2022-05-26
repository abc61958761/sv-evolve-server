/**
 * Create table `cards`.
 *
 * @param   {object} knex
 * @returns {Promise}
 */
export function up(knex) {
  return knex.schema.createTable('cards', table => {
    table.uuid('id').primary();
    table.timestamp('created_at').notNull().defaultTo(knex.raw('now()'));
    table.timestamp('updated_at').notNull().defaultTo(knex.raw('now()'));
    table.string('code').notNull();
    table.string('name').notNull();
    table.string('profession').notNull();
    table.string('type').notNull();
    table.string('consumption').notNull();
    table.string('level').notNull();
    table.string('chinese_name');
    table.string('version');
    table.string('describe');
  });
}

/**
 * Drop `cards`.
 *
 * @param   {object} knex
 * @returns {Promise}
 */
export function down(knex) {
  return knex.schema.dropTable('cards');
}
