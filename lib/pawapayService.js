import { randomUUID } from 'node:crypto';

const PAWAPAY_BASE_URL = process.env.PAWAPAY_BASE_URL || 'https://api.sandbox.pawapay.io/v2';
const PAWAPAY_API_TOKEN = process.env.PAWAPAY_API_TOKEN || '';

let configCache = null;
let configCacheTime = 0;
const CONFIG_CACHE_TTL = 10 * 60 * 1000;

function authHeaders() {
  if (!PAWAPAY_API_TOKEN) {
    throw new Error('PAWAPAY_API_TOKEN is not configured');
  }
  return {
    'Authorization': `Bearer ${PAWAPAY_API_TOKEN}`,
    'Content-Type': 'application/json',
  };
}

async function pawapayRequest(method, path, body) {
  const url = `${PAWAPAY_BASE_URL}${path}`;
  const options = {
    method,
    headers: authHeaders(),
    signal: AbortSignal.timeout(30000),
  };
  if (body) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url, options);
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const errMsg = data.message || data.error || data.raw || `PawaPay API error ${res.status}`;
    console.error('[PawaPay] API error:', res.status, errMsg);
    const err = new Error(errMsg);
    err.status = res.status;
    err.pawapayData = data;
    throw err;
  }

  return data;
}

export async function getActiveConfiguration() {
  const now = Date.now();
  if (configCache && (now - configCacheTime) < CONFIG_CACHE_TTL) {
    return configCache;
  }

  const data = await pawapayRequest('GET', '/active-conf');
  configCache = data;
  configCacheTime = now;
  return data;
}

export function extractCountries(config) {
  if (!config || !config.countries) return [];
  return config.countries.map((c) => ({
    code: c.code || c.countryCode || c.isoCode,
    name: c.name || c.countryName,
    flag: c.flag || c.flagEmoji || '',
    currency: c.currency || c.currencyCode || '',
    phonePrefix: c.phonePrefix || c.dialingCode || c.prefix || '',
    providers: (c.providers || c.correspondents || []).map((p) => ({
      code: p.code || p.correspondent || p.id,
      name: p.name || p.correspondentName || p.code,
      logo: p.logo || p.logoUrl || '',
    })),
  }));
}

export function extractProvidersForCountry(config, countryCode) {
  const countries = extractCountries(config);
  const country = countries.find((c) => c.code === countryCode);
  return country ? country.providers : [];
}

export async function createDeposit(params) {
  const {
    depositId,
    amount,
    currency,
    country,
    phoneNumber,
    provider,
    customerEmail,
    orderId,
    customerMessage,
  } = params;

  const body = {
    depositId: depositId || randomUUID(),
    amount: String(amount),
    currency,
    country,
    payer: {
      type: 'MMO',
      accountDetails: {
        phoneNumber,
        provider,
      },
    },
    metadata: {
      orderId,
      customerEmail,
    },
  };

  if (customerMessage) {
    body.customerMessage = customerMessage;
  }

  const data = await pawapayRequest('POST', '/deposits', body);
  return { depositId: body.depositId, response: data };
}

export async function getDepositStatus(depositId) {
  const data = await pawapayRequest('GET', `/deposits/${depositId}`);
  return data;
}

export function mapDepositStatus(pawapayStatus) {
  const s = String(pawapayStatus || '').toUpperCase();
  if (s === 'COMPLETED' || s === 'COMPLETED_FINAL') return 'paid';
  if (s === 'FAILED' || s === 'REJECTED') return 'failed';
  if (s === 'CANCELLED') return 'cancelled';
  if (s === 'EXPIRED' || s === 'TIMEOUT') return 'expired';
  if (s === 'PENDING' || s === 'PROCESSING' || s === 'ACCEPTED' || s === 'AUTHORIZED') return 'processing';
  return 'pending';
}

export function generateDepositId() {
  return randomUUID();
}
