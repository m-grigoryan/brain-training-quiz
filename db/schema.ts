import {integer,sqliteTable,text} from 'drizzle-orm/sqlite-core';
export const accountProgress=sqliteTable('account_progress',{
 userId:text('user_id').primaryKey().notNull(),
 revision:integer('revision').notNull().default(0),
 payload:text('payload').notNull(),
 updatedAt:text('updated_at').notNull()
});
