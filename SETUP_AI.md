# AI Shopping Assistant Setup

The AI shopping assistant uses real AI models (OpenAI GPT-4 or Anthropic Claude) with tool calling capabilities.

## Environment Variables

Add these to your `.env.local` file:

```bash
# Choose your AI provider: 'openai' or 'anthropic'
AI_PROVIDER=openai

# OpenAI API Key (if using OpenAI)
OPENAI_API_KEY=your_openai_api_key_here

# Anthropic API Key (if using Anthropic/Claude)
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

## Getting API Keys

### OpenAI (Recommended)
1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Add it to your environment as `OPENAI_API_KEY`

### Anthropic (Alternative)
1. Go to https://console.anthropic.com/
2. Create an API key
3. Add it to your environment as `ANTHROPIC_API_KEY`
4. Set `AI_PROVIDER=anthropic`

## Features

The AI agent can:

- 🔍 **Discover Products**: Search and filter store inventory
- 💳 **Execute Purchases**: Actually buy products using user wallets
- 💰 **Check Wallets**: Verify balance and payment capability
- 🎯 **Recommendations**: Provide personalized suggestions

## Tool Capabilities

### `discover_products`
- Filter by category (tshirts, pants, accessories)
- Set price range (min/max)
- Search by keywords

### `execute_purchase`
- Real transaction execution
- Balance validation
- Purchase confirmation
- Transaction ID generation

### `check_wallet`
- Default wallet status
- Current balance
- Payment capability check

### `get_user_recommendations`
- Budget-based filtering
- Preference matching
- Popularity scoring

## Testing

Try these example prompts:

```
"Buy me a nice t-shirt under $35"
"Show me pants in my budget"
"Check my wallet balance"
"Get me something popular"
"Find workout clothes"
```

The AI will use the appropriate tools and execute real transactions!
