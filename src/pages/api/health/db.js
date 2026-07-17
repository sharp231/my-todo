import pool from '../../../lib/db';
import { ApiError, ERROR_CODES, handleError } from '../../../utils/errorHandler';

export const config = {
    maxDuration: 10,
};

export default async function handler(req, res) {
    res.setHeader('Allow', 'GET');
    res.setHeader('Cache-Control', 'no-store');

    if (req.method !== 'GET') {
        return handleError(res, new ApiError(ERROR_CODES.METHOD_NOT_ALLOWED,
            `Method ${req.method} Not Allowed`
        )
        );
    }

    try {
        await pool.query('SELECT 1 AS health');
        return res.status(200).json({ status: 'ok', checks: { database: 'ok' }, });
    } catch (cause) {
        return handleError(res, new ApiError(ERROR_CODES.SERVICE_UNAVAILABLE,
            'Database unavailable',
            { cause }
        )
        );
    }
}