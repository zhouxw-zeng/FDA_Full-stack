USE mysqldb;

SET NAMES utf8mb4;

START TRANSACTION;

DELETE FROM forum_activity_notifications;
DELETE FROM forum_interaction_events;
DELETE FROM forum_comments;
DELETE FROM forum_dynamic_likes;
DELETE FROM forum_dynamic_favorites;
DELETE FROM forum_dynamic_share_events;

UPDATE forum_dynamics
SET
  like_count = 0,
  comment_count = 0,
  favorite_count = 0,
  share_count = 0;

COMMIT;

SELECT
  COUNT(*) AS comment_rows
FROM forum_comments;

SELECT
  COUNT(*) AS like_rows
FROM forum_dynamic_likes;

SELECT
  COUNT(*) AS favorite_rows
FROM forum_dynamic_favorites;

SELECT
  COUNT(*) AS share_rows
FROM forum_dynamic_share_events;

SELECT
  COUNT(*) AS interaction_event_rows
FROM forum_interaction_events;

SELECT
  COUNT(*) AS notification_rows
FROM forum_activity_notifications;

SELECT
  COALESCE(SUM(like_count), 0) AS total_likes,
  COALESCE(SUM(comment_count), 0) AS total_comments,
  COALESCE(SUM(favorite_count), 0) AS total_favorites,
  COALESCE(SUM(share_count), 0) AS total_shares
FROM forum_dynamics;
