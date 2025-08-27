# VibePay API Examples

## Authentication

All API requests require a Bearer token in the Authorization header:

```bash
curl -H "Authorization: Bearer vp_your_api_key_here" \
     https://your-domain.com/api/v1/wallets
```

## Available Endpoints

### 1. List Wallets

Get all wallets associated with your account:

```bash
curl -H "Authorization: Bearer vp_your_api_key_here" \
     https://your-domain.com/api/v1/wallets
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "clxxxxxxxx",
      "agentName": "My Trading Bot",
      "agentType": "TRADING_BOT",
      "ethereumAddress": "0x1234...",
      "balance": 150.75,
      "currency": "VPT",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### 2. Send Tokens

Send tokens from one of your wallets to any address:

```bash
curl -X POST \
     -H "Authorization: Bearer vp_your_api_key_here" \
     -H "Content-Type: application/json" \
     -d '{
       "fromWalletId": "clxxxxxxxx",
       "toAddress": "0x1234567890123456789012345678901234567890",
       "amount": "10.5",
       "memo": "Payment for AI services"
     }' \
     https://your-domain.com/api/v1/transactions
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transactionId": "clxxxxxxxx",
    "blockchainHash": "0xabcd1234...",
    "status": "COMPLETED",
    "amount": "10.5",
    "toAddress": "0x1234567890123456789012345678901234567890"
  }
}
```

### 3. Get Transactions

List recent transactions for your wallets:

```bash
curl -H "Authorization: Bearer vp_your_api_key_here" \
     https://your-domain.com/api/v1/transactions
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "clxxxxxxxx",
      "fromWalletId": "clxxxxxxxx",
      "toWalletId": "external",
      "amount": 10.5,
      "currency": "VPT",
      "status": "COMPLETED",
      "type": "TRANSFER",
      "memo": "Payment for AI services",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "fromWallet": {
        "id": "clxxxxxxxx",
        "agentName": "My Trading Bot"
      }
    }
  ]
}
```

## SDK Examples

### JavaScript/Node.js

```javascript
const API_KEY = 'vp_your_api_key_here';
const BASE_URL = 'https://your-domain.com/api/v1';

class VibePayAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };
  }

  async getWallets() {
    const response = await fetch(`${BASE_URL}/wallets`, {
      headers: this.headers
    });
    return response.json();
  }

  async sendTokens(fromWalletId, toAddress, amount, memo = '') {
    const response = await fetch(`${BASE_URL}/transactions`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        fromWalletId,
        toAddress,
        amount: amount.toString(),
        memo
      })
    });
    return response.json();
  }

  async getTransactions() {
    const response = await fetch(`${BASE_URL}/transactions`, {
      headers: this.headers
    });
    return response.json();
  }
}

// Usage
const api = new VibePayAPI(API_KEY);

// Get wallets
const wallets = await api.getWallets();
console.log('My wallets:', wallets.data);

// Send tokens
const transaction = await api.sendTokens(
  'clxxxxxxxx',
  '0x1234567890123456789012345678901234567890',
  10.5,
  'Payment for AI services'
);
console.log('Transaction:', transaction.data);
```

### Python

```python
import requests
import json

class VibePayAPI:
    def __init__(self, api_key):
        self.api_key = api_key
        self.base_url = 'https://your-domain.com/api/v1'
        self.headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
    
    def get_wallets(self):
        response = requests.get(f'{self.base_url}/wallets', headers=self.headers)
        return response.json()
    
    def send_tokens(self, from_wallet_id, to_address, amount, memo=''):
        data = {
            'fromWalletId': from_wallet_id,
            'toAddress': to_address,
            'amount': str(amount),
            'memo': memo
        }
        response = requests.post(
            f'{self.base_url}/transactions',
            headers=self.headers,
            json=data
        )
        return response.json()
    
    def get_transactions(self):
        response = requests.get(f'{self.base_url}/transactions', headers=self.headers)
        return response.json()

# Usage
api = VibePayAPI('vp_your_api_key_here')

# Get wallets
wallets = api.get_wallets()
print('My wallets:', wallets['data'])

# Send tokens
transaction = api.send_tokens(
    'clxxxxxxxx',
    '0x1234567890123456789012345678901234567890',
    10.5,
    'Payment for AI services'
)
print('Transaction:', transaction['data'])
```

## Error Handling

The API returns standard HTTP status codes:

- `200` - Success
- `400` - Bad Request (missing/invalid parameters)
- `401` - Unauthorized (invalid API key)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

Error responses include a message:

```json
{
  "error": "Wallet not found or unauthorized"
}
```

## Rate Limits

- 100 requests per minute per API key
- 1000 requests per hour per API key

## Support

For questions about the API, please contact support or check the documentation at `/dashboard/api-keys`.
