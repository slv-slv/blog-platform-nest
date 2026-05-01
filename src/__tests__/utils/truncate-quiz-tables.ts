import type { DataSource } from 'typeorm';

export async function truncateQuizTables(dataSource: DataSource): Promise<void> {
  await dataSource.query(`
    TRUNCATE
      typeorm.player_answers,
      typeorm.game_questions,
      typeorm.games,
      typeorm.correct_answers,
      typeorm.questions,
      typeorm.devices,
      typeorm.users
    RESTART IDENTITY CASCADE
  `);
}
