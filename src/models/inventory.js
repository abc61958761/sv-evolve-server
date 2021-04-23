import { bookshelf } from '../db';
import Pokemon from './pokemon';

const TABLE_NAME = 'inventories';

/**
 * Inventory model.
 */
class Inventory extends bookshelf.Model {
  /**
   * Get table name.
   */
  get tableName() {
    return TABLE_NAME;
  }

  /**
   * Table has timestamps.
   */
  get hasTimestamps() {
    return true;
  }

  /**
   * Get uuid.
   */
  get uuid() {
    return true;
  }

  /**
   * Get Pokemon information.
   */
  pokemon() {
    return this.belongsTo(Pokemon);
  }
}

export default Inventory;
