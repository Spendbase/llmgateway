# ElevenLabs Text-to-Speech Integration

This document explains how ElevenLabs TTS has been integrated into LLMGateway, providing an OpenAI-compatible `/v1/audio/speech` endpoint.

## Overview

The integration adds text-to-speech capabilities using ElevenLabs' AI voice synthesis, accessible through an OpenAI-compatible API endpoint. This allows users to generate high-quality speech audio from text using various voices and models.

## Architecture

### Components Added

1. **Provider Definition** (`packages/models/src/providers.ts`)
   - Added ElevenLabs to the providers list with configuration:
     - Provider ID: `elevenlabs`
     - Required env var: `LLM_ELEVENLABS_API_KEY`
     - Color: `#000000`
     - Website: https://elevenlabs.io

2. **Audio Type System** (`packages/models/src/audio-types.ts`)
   - `AudioModelDefinition`: Defines TTS models with pricing and capabilities
   - `AudioProviderMapping`: Maps models to provider-specific implementations
   - `VoiceMapping`: Maps OpenAI voice names to provider voice IDs
   - `AudioSpeechRequest`: OpenAI-compatible request format
   - `AudioFormat`: Supported audio output formats

3. **Audio Models** (`packages/models/src/audio-models/elevenlabs.ts`)
   - `eleven_multilingual_v2`: Stable, 29 languages, $0.30/1K chars
   - `eleven_turbo_v2_5`: Fast, 32 languages, $0.15/1K chars
   - `eleven_flash_v2_5`: Ultra-fast (75ms latency), $0.15/1K chars
   - `eleven_v3`: Most expressive, 70+ languages, $0.30/1K chars

4. **Voice Mapping** (`packages/models/src/audio-voices.ts`)
   - Maps OpenAI voice names to ElevenLabs pre-made voices:
     - `alloy` → Rachel (clear, versatile female)
     - `echo` → Josh (warm male)
     - `fable` → Arnold (strong male, British accent)
     - `onyx` → Adam (deep male)
     - `nova` → Elli (young female)
     - `shimmer` → Charlotte (professional female)
   - Supports direct ElevenLabs voice IDs as well

5. **Provider Configuration**
   - Endpoint: `https://api.elevenlabs.io` (`packages/models/src/get-provider-endpoint.ts`)
   - Headers: `xi-api-key` header for authentication (`packages/models/src/get-provider-headers.ts`)

6. **API Route** (`apps/gateway/src/audio/audio.ts`)
   - Endpoint: `POST /v1/audio/speech`
   - OpenAPI documented with Swagger
   - Supports authentication via Bearer token or x-api-key header
   - Validates API keys and project settings
   - Handles provider key management
   - Returns audio in requested format

## API Usage

### Endpoint

```
POST https://api.llmapi.ai/v1/audio/speech
```

### Request Headers

```
Authorization: Bearer YOUR_LLMGATEWAY_API_KEY
Content-Type: application/json
```

### Request Body

```json
{
  "model": "eleven_multilingual_v2",
  "input": "Hello world! This is a test of the ElevenLabs text-to-speech system.",
  "voice": "alloy",
  "response_format": "mp3",
  "speed": 1.0
}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `model` | string | Yes | TTS model ID (e.g., `eleven_multilingual_v2`) |
| `input` | string | Yes | Text to convert to speech (max length varies by model) |
| `voice` | string | Yes | Voice name (OpenAI names or ElevenLabs voice IDs) |
| `response_format` | string | No | Audio format (default: `mp3`) |
| `speed` | number | No | Playback speed 0.25-4.0 (default: 1.0) |

### Supported Formats

- `mp3` (default)
- `mp3_22050_32`, `mp3_44100_64`, `mp3_44100_128`
- `opus`, `aac`, `flac`, `wav`
- `pcm`, `pcm_16000`, `pcm_24000`
- `ulaw_8000`

### Response

Returns audio binary data with:
- Content-Type: `audio/mpeg` (or appropriate type)
- `x-character-count` header: Number of characters processed
- `x-request-id` header: Unique request identifier

### Example with cURL

```bash
curl -X POST https://api.llmapi.ai/v1/audio/speech \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "eleven_flash_v2_5",
    "input": "Welcome to LLMGateway text-to-speech!",
    "voice": "nova",
    "response_format": "mp3"
  }' \
  --output speech.mp3
```

### Example with Python

```python
import requests

url = "https://api.llmapi.ai/v1/audio/speech"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
}
data = {
    "model": "eleven_turbo_v2_5",
    "input": "Hello from Python!",
    "voice": "echo",
    "response_format": "mp3"
}

response = requests.post(url, headers=headers, json=data)
with open("output.mp3", "wb") as f:
    f.write(response.content)
```

## Setup Instructions

### 1. Add ElevenLabs API Key

For API keys mode:
1. Sign up at [ElevenLabs](https://elevenlabs.io)
2. Get your API key from the ElevenLabs dashboard
3. Add it to LLMGateway:
   - UI: Settings → Provider Keys → Add Provider Key → Select ElevenLabs
   - Or set environment variable: `LLM_ELEVENLABS_API_KEY=your_key_here`

### 2. Create LLMGateway API Key

In the LLMGateway dashboard:
1. Navigate to your project
2. Create a new API key
3. Use this key in the `Authorization` header

### 3. Make Requests

Use the API key to make requests to `/v1/audio/speech` as shown in the examples above.

## Models & Pricing

| Model | Languages | Latency | Price per 1K chars | Max Characters |
|-------|-----------|---------|-------------------|----------------|
| `eleven_multilingual_v2` | 29 | 400ms | $0.30 | 10,000 |
| `eleven_turbo_v2_5` | 32 | 250ms | $0.15 | 40,000 |
| `eleven_flash_v2_5` | 32 | 75ms | $0.15 | 40,000 |
| `eleven_v3` | 70+ | 300ms | $0.30 | 5,000 |

### Model Selection Guide

- **Best Quality**: `eleven_multilingual_v2` - Most stable for long-form content
- **Best Value**: `eleven_turbo_v2_5` or `eleven_flash_v2_5` - 50% cheaper
- **Lowest Latency**: `eleven_flash_v2_5` - ~75ms for real-time applications
- **Most Expressive**: `eleven_v3` - Dramatic delivery with emotion

## Voice Options

### OpenAI-Compatible Voices

These work the same as OpenAI's TTS API:
- `alloy` - Clear, versatile female voice (Rachel)
- `echo` - Warm male voice (Josh)
- `fable` - Strong male voice with British accent (Arnold)
- `onyx` - Deep male voice (Adam)
- `nova` - Young female voice (Elli)
- `shimmer` - Professional female voice (Charlotte)

### Custom ElevenLabs Voices

You can also use ElevenLabs voice IDs directly:
- Pre-made voices from ElevenLabs library
- Your own cloned voices

## Implementation Details

### File Structure

```
packages/models/src/
├── audio-types.ts              # Type definitions
├── audio-models.ts             # Model registry
├── audio-voices.ts             # Voice mappings
├── audio-models/
│   └── elevenlabs.ts          # ElevenLabs models
├── providers.ts               # Provider definitions
├── get-provider-endpoint.ts   # Endpoint configuration
├── get-provider-headers.ts    # Header configuration
└── index.ts                   # Exports

apps/gateway/src/
├── audio/
│   ├── audio.ts               # Route handler
│   └── index.ts               # Exports
└── app.ts                     # Route mounting
```

### How It Works

1. **Request Validation**
   - Authenticates the LLMGateway API key
   - Validates the project and organization
   - Checks model availability and input length

2. **Provider Key Lookup**
   - Retrieves ElevenLabs API key for the organization
   - Supports both API keys mode and credits mode (credits mode not yet implemented)

3. **Voice Mapping**
   - Maps OpenAI voice names to ElevenLabs voice IDs
   - Falls back to direct voice ID if not in mapping

4. **Request Transformation**
   - Builds ElevenLabs-specific request body
   - Sets voice settings (stability: 0.5, similarity_boost: 0.75)
   - Appends output format to URL query

5. **Response Handling**
   - Streams audio binary data to client
   - Sets appropriate Content-Type header
   - Includes character count for billing/tracking

## Error Handling

The API returns standard HTTP error codes:

- `400 Bad Request`: Invalid model, voice, or input too long
- `401 Unauthorized`: Missing or invalid API key
- `402 Payment Required`: Insufficient credits
- `410 Gone`: Project has been archived
- `500 Internal Server Error`: Server-side issues
- `501 Not Implemented`: Credits mode not yet supported

## Future Enhancements

Potential improvements for the TTS integration:

1. **Credits Mode Support**: Implement usage tracking and billing for credits mode
2. **More Providers**: Add OpenAI TTS, Google TTS, Azure TTS
3. **Audio Logging**: Database table for tracking audio generation requests
4. **Custom Voice Settings**: Allow users to customize stability, similarity_boost
5. **Streaming Support**: Real-time audio streaming for lower latency
6. **Voice Cloning**: Support for custom voice creation and management
7. **Rate Limiting**: Per-project rate limits for audio generation
8. **Caching**: Cache generated audio for repeated text

## Testing

Test the integration with:

```bash
# Start the gateway
pnpm dev

# Make a test request
curl -X POST http://localhost:4001/v1/audio/speech \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "eleven_flash_v2_5",
    "input": "Testing the audio endpoint",
    "voice": "alloy"
  }' \
  --output test.mp3
```

## OpenAPI Documentation

The endpoint is fully documented in the OpenAPI spec and available in Swagger UI at:

```
http://localhost:4001/docs
```

Navigate to the `/v1/audio/speech` endpoint to see:
- Full request/response schemas
- Example requests
- Parameter descriptions
- Error responses

## References

- [ElevenLabs API Documentation](https://elevenlabs.io/docs)
- [ElevenLabs Pricing](https://elevenlabs.io/pricing)
- [OpenAI TTS API Reference](https://platform.openai.com/docs/api-reference/audio/createSpeech)
