-- Tiger Luck Slot (jogo proprio, original — sem assets de terceiros)
-- Como usar: com o banco `casino` ja importado de install/database.sql,
-- execute este arquivo uma vez no MySQL/MariaDB.
--
--   mysql -u root casino < install/tiger_slot.sql
--
-- Ou importe pelo phpMyAdmin com o banco `casino` selecionado.
-- Reexecutar e seguro: apaga a linha anterior do mesmo alias antes de inserir.

DELETE FROM `games` WHERE `alias` = 'tiger_slot';

INSERT INTO `games`
  (`name`, `alias`, `image`, `status`, `win`, `max_limit`, `min_limit`,
   `invest_back`, `probable_win`, `type`, `level`, `instruction`)
VALUES
  ('Tiger Luck Slot', 'tiger_slot', 'tiger_luck_slot.svg', 1, NULL,
   '100.00000000', '1.00000000', 0,
   '["50","40","6","4"]', NULL, '["100","150","200"]',
   '<div><h2>How to play: Tiger Luck Slot (original game)</h2><p>Choose a lucky number from 0 to 9 and set your stake between the minimum and maximum limits. Three reels spin: 3 different numbers pays nothing, 1 matching number pays level 1, 2 matching numbers pays level 2, 3 matching numbers pays level 3. Percentages for each level are configured in the game settings.</p></div>'
  );
