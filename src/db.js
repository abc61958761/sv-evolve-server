import knexJs from 'knex';
import bookshelfJs from 'bookshelf';

import knexConfig from './knexfile';

/**
 * Database connection.
 */
const knex = knexJs(knexConfig);
const bookshelf = bookshelfJs(knex);

bookshelf.plugin(require('bookshelf-uuid'), {
  type: 'v4'
});

export { bookshelf, knex };
