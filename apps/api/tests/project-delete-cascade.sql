-- Reproduce the existing project/column/parent foreign keys in session-local tables.
-- Never reads or modifies application tables. Rollback and connection close remove all fixtures.
\set ON_ERROR_STOP on
BEGIN;
CREATE TEMP TABLE settings_test_projects (id integer PRIMARY KEY);
CREATE TEMP TABLE settings_test_columns (
    id integer PRIMARY KEY,
    project_id integer REFERENCES settings_test_projects(id) ON DELETE CASCADE
);
CREATE TEMP TABLE settings_test_issues (
    id integer PRIMARY KEY,
    project_id integer REFERENCES settings_test_projects(id) ON DELETE CASCADE,
    column_id integer REFERENCES settings_test_columns(id) ON DELETE CASCADE,
    parent_issue_id integer REFERENCES settings_test_issues(id) ON DELETE RESTRICT
);
INSERT INTO settings_test_projects VALUES (1), (2);
INSERT INTO settings_test_columns VALUES (1, 1), (2, 1), (3, 2);
INSERT INTO settings_test_issues VALUES (1, 1, 1, NULL), (2, 1, 2, 1), (3, 2, 3, NULL);
DELETE FROM settings_test_projects WHERE id = 1;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM settings_test_issues WHERE project_id = 1) THEN
        RAISE EXCEPTION 'Deleted project still has issues';
    END IF;
    IF (SELECT count(*) FROM settings_test_issues WHERE project_id = 2) <> 1 THEN
        RAISE EXCEPTION 'Deletion affected another project';
    END IF;
END $$;
ROLLBACK;
