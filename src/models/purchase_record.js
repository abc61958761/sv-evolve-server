import { bookshelf } from '../db';
import Purchase from './purchase';

const TABLE_NAME = 'purchase_records';

/**
 * PurchaseRecord model.
 */
class PurchaseRecord extends bookshelf.Model {
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
   * Get purchase information.
   */
  purchase() {
    return this.belongsTo(Purchase);
  }
}

export default PurchaseRecord;
