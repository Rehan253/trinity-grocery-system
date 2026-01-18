#!/usr/bin/env sh
set -eu

echo "[entrypoint] Booting Trinity Grocery API…"

# Load /app/.env if present
if [ -f "/app/.env" ]; then
  echo "[entrypoint] Loading /app/.env"
  set -a
  . /app/.env
  set +a
else
  echo "[entrypoint] /app/.env not found (ok if env vars come from docker-compose)."
fi

# Validate required environment variables
: "${DATABASE_URL:?DATABASE_URL is required}"
: "${SECRET_KEY:?SECRET_KEY is required}"
: "${JWT_SECRET_KEY:?JWT_SECRET_KEY is required}"
export PORT="${PORT:-5000}"

# Parse DATABASE_URL to extract PostgreSQL connection details
# Format: postgresql+psycopg2://user:password@host:port/database
# Extract PGHOST, PGPORT, PGUSER, PGDATABASE, PGPASSWORD
PGHOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\).*/\1/p')
PGPORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
PGUSER=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/\([^:]*\).*/\1/p')
PGDATABASE=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')

export PGHOST PGPORT PGUSER PGDATABASE

echo "[entrypoint] Database connection details extracted"
echo "  PGHOST: $PGHOST"
echo "  PGPORT: $PGPORT"
echo "  PGUSER: $PGUSER"
echo "  PGDATABASE: $PGDATABASE"

# Wait for PostgreSQL to be ready
#    pg_isready checks if database is accepting connections
PG_READY_MAX_ATTEMPTS="${PG_READY_MAX_ATTEMPTS:-30}"
PG_READY_SLEEP_SECS="${PG_READY_SLEEP_SECS:-1}"

echo "[entrypoint] Waiting for database to accept connections…"
attempt=0
until pg_isready -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" >/dev/null 2>&1; do
  attempt=$((attempt+1))
  if [ "$attempt" -ge "$PG_READY_MAX_ATTEMPTS" ]; then
    echo "[entrypoint] Database not ready after $PG_READY_MAX_ATTEMPTS attempts. Exiting."
    exit 1
  fi
  echo "[entrypoint] DB not ready yet (attempt $attempt). Sleeping ${PG_READY_SLEEP_SECS}s…"
  sleep "$PG_READY_SLEEP_SECS"
done
echo "[entrypoint] Database is ready."

# Run Alembic migrations (Flask-Migrate uses Alembic)
#    This updates the database schema to latest version
echo "[entrypoint] Running database migrations…"
cd /app
flask db upgrade
echo "[entrypoint] Migrations completed."

# Start the Flask application
#    Gunicorn is a production WSGI server (better than flask run)
echo "[entrypoint] Starting Flask application…"
exec gunicorn --bind 0.0.0.0:$PORT --workers 4 --worker-class sync --timeout 60 --access-logfile - --error-logfile - app:app
