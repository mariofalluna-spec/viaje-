import { pgTable, text, integer, boolean, doublePrecision, timestamp, uuid, primaryKey } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  username: text('username').unique().notNull(),
  password: text('password').notNull(),
  name: text('name').notNull(),
});

export const friends = pgTable('friends', {
  id: text('id').primaryKey(), // Using text to match existing u_1, u_2 etc or uuid
  name: text('name').notNull(),
  avatarColor: text('avatar_color').notNull(),
  avatarUrl: text('avatar_url'),
  avatarEmoji: text('avatar_emoji'),
  checkInCode: text('check_in_code'),
});

export const tripDays = pgTable('trip_days', {
  id: text('id').primaryKey(),
  dayNumber: integer('day_number').notNull(),
  date: text('date').notNull(), // ISO string
});

export const touristPlaces = pgTable('tourist_places', {
  id: text('id').primaryKey(),
  tripDayId: text('trip_day_id').references(() => tripDays.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  timeOfDay: text('time_of_day').notNull(),
  estimatedCost: doublePrecision('estimated_cost').notNull(),
  isVisited: boolean('is_visited').default(false).notNull(),
  locationName: text('location_name'),
  locationUrl: text('location_url'),
});

export const expenses = pgTable('expenses', {
  id: text('id').primaryKey(),
  tripDayId: text('trip_day_id'), // can be null for 'general'
  description: text('description').notNull(),
  amount: doublePrecision('amount').notNull(),
  payerId: text('payer_id').references(() => friends.id).notNull(),
  category: text('category').notNull(),
  isSettlement: boolean('is_settlement').default(false).notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const expenseSplits = pgTable('expense_splits', {
  id: uuid('id').defaultRandom().primaryKey(),
  expenseId: text('expense_id').references(() => expenses.id, { onDelete: 'cascade' }).notNull(),
  friendId: text('friend_id').references(() => friends.id).notNull(),
  amount: doublePrecision('amount').notNull(),
});

export const config = pgTable('config', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});
