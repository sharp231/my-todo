const SUPPORTED_NODE_ENVS = new Set(['production', 'development', 'test',]);

const LOCAL_DATABASE_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]',]);

const MAX_POOL_SIZE_BY_ENV = Object.freeze({
    production: 5,
    development: 5,
    test: 2,
});
// PostgreSQL接続プールを作成
const COMMON_POOL_CONFIG = Object.freeze({
    idleTimeoutMillis: 5_000,
    connectionTimeoutMillis: 5_000,
    statement_timeout: 5_000,
});

export class DatabaseConfigError extends Error {
    constructor(message) {
        super(message);
        this.name = 'DatabaseConfigError';
    }
}

const validateNodeEnv = (nodeEnv) => {
    if (!SUPPORTED_NODE_ENVS.has(nodeEnv)) {
        throw new DatabaseConfigError('NODE_ENV must be production,development, or test');
    }
    return nodeEnv;
};

const getDatabaseUrlVariableName = (nodeEnv) =>
    nodeEnv === 'test' ? 'TEST_DATABASE_URL' : 'DATABASE_URL';

const parseDatabaseUrl = (value, variableName) => {
    if (typeof value !== 'string' || value.trim() === '') {
        throw new DatabaseConfigError(`${variableName} is required`);
    }

    let databaseUrl;

    try {
        databaseUrl = new URL(value);
    } catch {
        throw new DatabaseConfigError(`${variableName} must be a valid PostgreSQL URL`);
    }
    if (!['postgres:', 'postgresql:'].includes(databaseUrl.protocol)) {
        throw new DatabaseConfigError(`${variableName} must use the postgres or postgresql protocol`);
    }
    if (!databaseUrl.hostname) {
        throw new DatabaseConfigError(`${variableName} must include a database host`);
    }
    if (databaseUrl.pathname === '/' || databaseUrl.pathname === '') {
        throw new DatabaseConfigError(`${variableName} must include a database name`);
    }
    return databaseUrl;
};

const validateSslMode = (databaseUrl, nodeEnv, variableName) => {
    const sslModes = databaseUrl.searchParams.getAll('sslmode').map((sslMode) => sslMode.toLowerCase());

    if (sslModes.length !== 1) {
        throw new DatabaseConfigError(
            `${variableName} must define exactly one sslmode`);
    }

    const [sslMode] = sslModes;

    if (nodeEnv === 'production') {
        if (sslMode !== 'verify-full') {
            throw new DatabaseConfigError(
                'DATABASE_URL must use sslmode=verify-full in production');
        }
        return;
    }

    const isLocalDatabase = LOCAL_DATABASE_HOSTS.has(databaseUrl.hostname);

    if (isLocalDatabase && sslMode === 'disable') {
        return;
    }
    if (sslMode !== 'verify-full') {
        throw new DatabaseConfigError(
            `${variableName} must use sslmode=verify-full for remote databases`);
    }
};

export const createPoolConfig = (env = process.env) => {
    const nodeEnv = validateNodeEnv(env.NODE_ENV);
    const variableName = getDatabaseUrlVariableName(nodeEnv);
    const databaseUrl = parseDatabaseUrl(env[variableName], variableName);
    validateSslMode(databaseUrl, nodeEnv, variableName);

    return {
        connectionString: databaseUrl.toString(),
        max: MAX_POOL_SIZE_BY_ENV[nodeEnv],
        ...COMMON_POOL_CONFIG,
    };
};