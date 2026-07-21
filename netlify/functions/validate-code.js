/**
 * Netlify Function: validate-code.js
 * 
 * FINAL SOLUTION: Direct Google Sheets API via fetch()
 * - NO npm dependencies (except google-spreadsheet which we DON'T use)
 * - Uses Node 18+ built-in fetch
 * - Uses Node crypto for JWT
 * - Direct API calls to Google Sheets
 */

const crypto = require('crypto');

function generateToken(expiresInSeconds = 72 * 60 * 60) {
    const secret = 'second-thought-secret-key-2024';
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + expiresInSeconds;
    
    const header = Buffer.from(JSON.stringify({
        alg: 'HS256',
        typ: 'JWT'
    })).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    
    const payload = Buffer.from(JSON.stringify({
        iat: now,
        exp: expiresAt,
        type: 'access'
    })).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    
    const signature = crypto
        .createHmac('sha256', secret)
        .update(`${header}.${payload}`)
        .digest('base64')
        .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    
    const token = `${header}.${payload}.${signature}`;

    return {
        token,
        expiresAt: expiresAt * 1000
    };
}

function isCodeExpired(firstUsedAt) {
    if (!firstUsedAt) return false;
    
    const firstUsedTime = new Date(firstUsedAt).getTime();
    const now = new Date().getTime();
    const seventyTwoHoursMs = 72 * 60 * 60 * 1000;
    
    return (now - firstUsedTime) > seventyTwoHoursMs;
}

// Get JWT token for Google API
async function getGoogleAccessToken(serviceAccountKey) {
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + 3600; // 1 hour

    const header = {
        alg: 'RS256',
        typ: 'JWT'
    };

    const payload = {
        iss: serviceAccountKey.client_email,
        scope: 'https://www.googleapis.com/auth/spreadsheets',
        aud: 'https://oauth2.googleapis.com/token',
        exp: expiresAt,
        iat: now
    };

    const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

    const signatureInput = `${headerB64}.${payloadB64}`;
    
    // Sign with private key
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(signatureInput);
    const signature = sign.sign(
        {
            key: serviceAccountKey.private_key,
            format: 'pem'
        },
        'base64'
    ).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

    const jwtToken = `${signatureInput}.${signature}`;

    // Exchange JWT for access token
    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwtToken}`
    });

    const data = await response.json();
    
    if (!response.ok || !data.access_token) {
        throw new Error(`Failed to get access token: ${data.error_description || data.error}`);
    }

    return data.access_token;
}

// Get all rows from Google Sheet
async function getSheetRows(spreadsheetId, accessToken) {
    const range = 'Sheet1!A:F'; // All columns from A to F
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;

    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch spreadsheet: ${response.statusText}`);
    }

    const data = await response.json();
    return data.values || [];
}

// Update a cell in Google Sheet
async function updateSheet(spreadsheetId, cell, value, accessToken) {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(cell)}?valueInputOption=USER_ENTERED`;

    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            values: [[value]]
        })
    });

    if (!response.ok) {
        throw new Error(`Failed to update spreadsheet: ${response.statusText}`);
    }

    return await response.json();
}

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ 
                valid: false, 
                message: 'Method not allowed' 
            })
        };
    }

    try {
        let body;
        try {
            body = JSON.parse(event.body);
        } catch {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    valid: false, 
                    message: 'Invalid JSON' 
                })
            };
        }

        const { code } = body;

        if (!code || typeof code !== 'string') {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    valid: false, 
                    message: 'Kod jest wymagany' 
                })
            };
        }

        if (code.length !== 8) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    valid: false, 
                    message: 'Kod musi mieć 8 znaków' 
                })
            };
        }

        let serviceAccountKey;
        try {
            serviceAccountKey = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
        } catch (error) {
            console.error('Error parsing service account key:', error);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ 
                    valid: false, 
                    message: 'Server configuration error' 
                })
            };
        }

        const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
        if (!SPREADSHEET_ID) {
            console.error('SPREADSHEET_ID not set');
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ 
                    valid: false, 
                    message: 'Server configuration error' 
                })
            };
        }

        // Get access token
        const accessToken = await getGoogleAccessToken(serviceAccountKey);

        // Get all rows
        const rows = await getSheetRows(SPREADSHEET_ID, accessToken);

        if (!rows || rows.length === 0) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    valid: false, 
                    message: 'Kod dostępu jest nieprawidłowy' 
                })
            };
        }

        // Find header row (first row)
        const headers_row = rows[0];
        const codeIndex = headers_row.indexOf('code');
        const usedIndex = headers_row.indexOf('used');
        const firstUsedAtIndex = headers_row.indexOf('first_used_at');
        const expiresAtIndex = headers_row.indexOf('expires_at');

        if (codeIndex === -1) {
            throw new Error('Missing "code" column in spreadsheet');
        }

        // Find code row
        let foundRowIndex = -1;
        let foundRow = null;

        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (row[codeIndex] && row[codeIndex].toUpperCase() === code.toUpperCase()) {
                foundRowIndex = i;
                foundRow = row;
                break;
            }
        }

        if (!foundRow) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    valid: false, 
                    message: 'Kod dostępu jest nieprawidłowy' 
                })
            };
        }

        // Check if already used
        const isUsed = foundRow[usedIndex] && foundRow[usedIndex].toUpperCase() === 'YES';
        if (isUsed) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    valid: false, 
                    message: 'Kod został już użyty' 
                })
            };
        }

        // Check if expired
        const firstUsedAt = foundRow[firstUsedAtIndex];
        if (firstUsedAt && isCodeExpired(firstUsedAt)) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    valid: false, 
                    message: 'Kod wygasł (72 godziny od pierwszego użycia)' 
                })
            };
        }

        // Update spreadsheet
        const now = new Date().toISOString();
        const expiresDate = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();

        // Row number in sheet (1-indexed, +1 for header)
        const rowNum = foundRowIndex + 1;

        // Update cells
        await Promise.all([
            updateSheet(SPREADSHEET_ID, `C${rowNum}`, now, accessToken), // first_used_at
            updateSheet(SPREADSHEET_ID, `D${rowNum}`, 'YES', accessToken), // used
            updateSheet(SPREADSHEET_ID, `E${rowNum}`, expiresDate, accessToken) // expires_at
        ]);

        // Generate token
        const tokenData = generateToken();

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                valid: true,
                message: 'Kod poprawny',
                token: tokenData.token,
                expiresAt: tokenData.expiresAt
            })
        };

    } catch (error) {
        console.error('Unexpected error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                valid: false, 
                message: 'Server error. Try again later.' 
            })
        };
    }
};