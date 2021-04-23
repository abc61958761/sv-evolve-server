import { bookshelf } from '../db';
import Sold from './sold';

const TABLE_NAME = 'sold_records';

/**
 * SoldRecord model.
 */
class SoldRecord extends bookshelf.Model {
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
   * Get sold information.
   */
  sold() {
    return this.belongsTo(Sold);
  }
}

export default SoldRecord;
