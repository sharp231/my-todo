/**
* @type {import('node-pg-migrate').ColumnDefinitions | undefined}
*/
const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {void}
 */
const up = (pgm) => {
  pgm.sql(`
    -- 既存のtimezoneなしtimestampはUTCとして解釈する。
    SET LOCAL TIME ZONE 'UTC';

    DO $migration$
    BEGIN
      IF to_regclass('public.todos') IS NULL THEN
        CREATE TABLE public.todos (
          id BIGSERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          date DATE NOT NULL,
          priority TEXT NOT NULL,
          completed BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

          CONSTRAINT todos_title_check
            CHECK (char_length(btrim(title)) BETWEEN 1 AND 100),

          CONSTRAINT todos_priority_check
            CHECK (priority IN ('low', 'medium', 'high'))
        );
      ELSE
        -- 現行productionに存在する必要がある列を検査する。
        IF EXISTS (
          SELECT required.column_name
          FROM (
            VALUES
              ('id'),
              ('title'),
              ('date'),
              ('priority'),
              ('created_at')
          ) AS required(column_name)
          WHERE NOT EXISTS (
            SELECT 1
            FROM information_schema.columns AS columns
            WHERE columns.table_schema = 'public'
              AND columns.table_name = 'todos'
              AND columns.column_name = required.column_name
          )
        ) THEN
          RAISE EXCEPTION
            'todos has missing required columns';
        END IF;

        -- 未把握の列を消したり変更したりしない。
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'todos'
            AND column_name NOT IN (
              'id',
              'title',
              'date',
              'priority',
              'completed',
              'created_at',
              'updated_at'
            )
        ) THEN
          RAISE EXCEPTION
            'todos has unexpected columns';
        END IF;

        -- id以外のPRIMARY KEYなら自動修正しない。
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conrelid = 'public.todos'::regclass
            AND contype = 'p'
            AND pg_get_constraintdef(oid) = 'PRIMARY KEY (id)'
        ) THEN
          RAISE EXCEPTION
            'todos must have a primary key on id';
        END IF;

        ALTER TABLE public.todos
          ADD COLUMN IF NOT EXISTS completed BOOLEAN,
          ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

        -- productionの現在形をcanonical schemaへ揃える。
        ALTER TABLE public.todos
          ALTER COLUMN id TYPE BIGINT USING id::BIGINT,
          ALTER COLUMN title TYPE TEXT USING title::TEXT,
          ALTER COLUMN date TYPE DATE
            USING (date AT TIME ZONE 'UTC')::DATE,
          ALTER COLUMN priority TYPE TEXT USING priority::TEXT,
          ALTER COLUMN created_at TYPE TIMESTAMPTZ
            USING created_at AT TIME ZONE 'UTC',
          ALTER COLUMN updated_at TYPE TIMESTAMPTZ
            USING updated_at AT TIME ZONE 'UTC';

        -- completedのNULLは既存defaultの意味に合わせてfalseへ補正する。
        UPDATE public.todos
        SET completed = FALSE
        WHERE completed IS NULL;

        -- 既存行では作成日時を初期updated_atとして使用する。
        UPDATE public.todos
        SET updated_at = created_at
        WHERE updated_at IS NULL;

        -- 意味を推測できない不正データは自動補正しない。
        IF EXISTS (
          SELECT 1
          FROM public.todos
          WHERE title IS NULL
            OR char_length(btrim(title)) NOT BETWEEN 1 AND 100
        ) THEN
          RAISE EXCEPTION
            'todos contains invalid title values';
        END IF;

        IF EXISTS (
          SELECT 1
          FROM public.todos
          WHERE date IS NULL
        ) THEN
          RAISE EXCEPTION
            'todos contains null date values';
        END IF;

        IF EXISTS (
          SELECT 1
          FROM public.todos
          WHERE priority IS NULL
            OR priority NOT IN ('low', 'medium', 'high')
        ) THEN
          RAISE EXCEPTION
            'todos contains invalid priority values';
        END IF;

        IF EXISTS (
          SELECT 1
          FROM public.todos
          WHERE created_at IS NULL
        ) THEN
          RAISE EXCEPTION
            'todos contains null created_at values';
        END IF;

        ALTER TABLE public.todos
          ALTER COLUMN title SET NOT NULL,
          ALTER COLUMN date SET NOT NULL,
          ALTER COLUMN priority SET NOT NULL,
          ALTER COLUMN completed SET DEFAULT FALSE,
          ALTER COLUMN completed SET NOT NULL,
          ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
          ALTER COLUMN created_at SET NOT NULL,
          ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP,
          ALTER COLUMN updated_at SET NOT NULL;

        ALTER TABLE public.todos
          DROP CONSTRAINT IF EXISTS todos_title_check,
          DROP CONSTRAINT IF EXISTS todos_priority_check;

        ALTER TABLE public.todos
          ADD CONSTRAINT todos_title_check
            CHECK (char_length(btrim(title)) BETWEEN 1 AND 100),
          ADD CONSTRAINT todos_priority_check
            CHECK (priority IN ('low', 'medium', 'high'));
      END IF;
    END
    $migration$;

    CREATE INDEX IF NOT EXISTS idx_todos_created_at
      ON public.todos (created_at DESC);

    CREATE OR REPLACE FUNCTION public.set_todos_updated_at()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    AS $function$
    BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
    END;
    $function$;

    DROP TRIGGER IF EXISTS todos_set_updated_at
      ON public.todos;

    CREATE TRIGGER todos_set_updated_at
      BEFORE UPDATE ON public.todos
      FOR EACH ROW
      EXECUTE FUNCTION public.set_todos_updated_at();
  `);
};

const down = () => {
  throw new Error(
    'The baseline migration cannot be rolled back automatically'
  );
};

module.exports = {
  shorthands,
  up,
  down,
};
