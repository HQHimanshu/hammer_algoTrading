# PROJECT HAMMER — Algorithmic Trading Platform for Delta Exchange Testnet

[![Python 3.10+](https://img.shields.io/badge/python-3.10%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115%2B-009688.svg)](https://fastapi.tiangolo.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28.svg?logo=firebase)](https://firebase.google.com/)
[![Tests](https://img.shields.io/badge/tests-90%20passed-brightgreen.svg)]()
[![Environment](https://img.shields.io/badge/Exchange-Delta%20Testnet-orange.svg)](https://testnet.delta.exchange)
[![AI Copilot](https://img.shields.io/badge/TradeMind%20AI-Groq%20%2F%20Grok%20%2B%20RAG-blueviolet.svg)]()

**Project Hammer** (also referenced as **AlgoPilot**) is a production-grade algorithmic trading backend engineered for the **Algorithmic Trading Hackathon**. Built with FastAPI, Pydantic, HTTPX, and Firebase Cloud Firestore (with local SQLite support), it connects programmatically to the **Delta Exchange Testnet**, ingests live market data, detects deterministic indicator crossover signals with RSI filtering, enforces pre-trade risk controls, and executes programmatic testnet orders with complete audit persistence.

It includes **TradeMind AI**, a production-quality, explainable RAG-based AI Trading Copilot powered by the official **Groq API** (`llama-3.3-70b-versatile`) and **xAI Grok API** (`grok-2-latest`) with vector document retrieval and deterministic trade ledger grounding. It is designed to provide auditable, grounded natural-language explanations of trading signals, orders, risk check decisions, and performance metrics without hallucinations or trading side-effects.

---

## Table of Contents

1. [Hackathon Objective & Architecture Overview](#1-hackathon-objective--architecture-overview)
2. [Technology Stack](#2-technology-stack)
3. [Project Structure](#3-project-structure)
4. [Trading Strategy Logic & Semantics](#4-trading-strategy-logic--semantics)
5. [Risk Management & Safety Engine](#5-risk-management--safety-engine)
6. [Order Execution Workflow](#6-order-execution-workflow)
7. [Firebase Cloud Firestore Integration (`hammer-algotrading`)](#7-firebase-cloud-firestore-integration-hammer-algotrading)
8. [Installation & Setup](#8-installation--setup)
9. [Configuration & Environment Variables](#9-configuration--environment-variables)
10. [Delta Exchange Testnet API Setup](#10-delta-exchange-testnet-api-setup)
11. [API Reference & Example Requests](#11-api-reference--example-requests)
12. [Running the Application](#12-running-the-application)
13. [Running Automated Tests](#13-running-automated-tests)
14. [Live Demonstration Guide](#14-live-demonstration-guide)
15. [TradeMind AI — Explainable Algorithmic Trading Copilot](#15-trademind-ai--explainable-algorithmic-trading-copilot)
16. [Known Limitations & Future Roadmap](#16-known-limitations--future-roadmap)
17. [Team Understanding & AI Transparency](#17-team-understanding--ai-transparency)

---

## 1. Hackathon Objective & Architecture Overview

The objective of this project is to implement an automated trading system that safely executes strategy decisions on the official **Delta Exchange Testnet** matching engine.

### Architectural Principles

```
   ┌────────────────────────────────────────────────────────┐
   │                     FastAPI Layer                      │
   │   (/health, /api/v1/market, /api/v1/trading, docs)     │
   └───────────▲─────────────────────────────▲──────────────┘
               │                             │
   ┌───────────▼────────────┐    ┌───────────▼──────────────┐
   │      MarketService     │    │       TradingEngine      │
   │  (Catalog Cache & Ticks)│    │(Evaluation Loop, Cron)  │
   └───────────▲────────────┘    └───────────▲──────────────┘
               │                             │
   ┌───────────▼────────────┐    ┌───────────▼──────────────┐
   │   MovingAverageRsi     │    │       RiskService        │
   │ (Deterministic Signals)│───►│ (10 Pre-trade Controls)  │
   └────────────────────────┘    └───────────▲──────────────┘
                                             │ (Approved only)
                                 ┌───────────▼──────────────┐
                                 │     ExecutionService     │
                                 │ (Position Reconciliation)│
                                 └───────────▲──────────────┘
                                             │
               ┌─────────────────────────────┴─────────────────────────────┐
               │                                                           │
   ┌───────────▼────────────┐                   ┌──────────────────────────▼──────────────────────────┐
   │      DeltaClient       │                   │                  Database Layer                     │
   │(HMAC-SHA256 Signing)   │                   │  - Cloud Firestore: `hammer-algotrading`            │
   │   Delta Testnet REST   │                   │  - Local / Fallback: SQLite (`algopilot.db`)        │
   │                        │                   │  Collections: signals, orders, trades, risk_events, │
   │                        │                   │               system_status                         │
   └────────────────────────┘                   └─────────────────────────────────────────────────────┘
```

- **Safety First (`TRADING_ENABLED=false` by default)**: Order submission is gated by configuration and risk validation. No orders can be placed accidentally.
- **Fail-Closed Risk Management**: If market data is stale, the exchange is unreachable, or credentials are invalid, order execution fails closed.
- **Decoupled Exchange & DB Health**: The application health endpoint (`/health`) checks system health and measures real exchange round-trip latency and database connectivity independently.
- **Audit Persistence**: Every evaluated signal, rejected risk event, submitted order, and filled trade is recorded in Cloud Firestore (or SQLite) for post-trade reconciliation.

---

## 2. Technology Stack

- **Core Runtime**: Python 3.10+ (Tested on Python 3.14)
- **Web Framework**: FastAPI with Starlette & Uvicorn
- **Data Validation & Settings**: Pydantic v2 and Pydantic-Settings
- **Cloud Database**: Google Cloud Firestore via the official `firebase-admin` Python SDK (Project: `hammer-algotrading`)
- **HTTP Engine**: HTTPX (Asynchronous HTTP/1.1 and HTTP/2 client)
- **AI & RAG Engine**:
  - Official **Groq API** (`https://api.groq.com/openai/v1`, Model: `llama-3.3-70b-versatile`)
  - Official **xAI Grok API** (`https://api.x.ai/v1`, Model: `grok-2-latest`)
  - Vector Embedding Service with Cosine Similarity Ranking & Sentence Chunking
  - Dual-Path Evidence Retrieval (Deterministic Ledger + Knowledge Documents)
- **Ledger & Analytics**: Deterministic Event Ledger (`SIG-`, `RISK-`, `ORD-`, `FILL-`, `TRD-`) and Risk/P&L calculations
- **Local Persistence / Fallback**: SQLite with `aiosqlite`
- **Testing**: Pytest & `pytest-asyncio` (90 passed tests with 100% mocked exchange & Firestore fixtures)
- **Cryptographic Signing**: Standard library `hmac` and `hashlib` (HMAC-SHA256)

---

## 3. Project Structure

```
hammer_algoTrading/
├── app/
│   ├── __init__.py                # Package root
│   ├── main.py                    # FastAPI application, lifespan & router mounting
│   ├── config.py                  # Pydantic Settings & environment validation
│   ├── database.py                # Async SQLite persistence (signals, orders, trades, risk)
│   ├── firebase_config.py         # Firebase Admin SDK initialization for hammer-algotrading
│   ├── api/
│   │   ├── __init__.py
│   │   ├── health.py              # Health check with exchange latency probe & DB status
│   │   ├── market.py              # Public market endpoints (instruments, tickers, candles)
│   │   ├── trading.py             # Strategy evaluation, control loops, order submission
│   │   ├── trades.py              # Trade history and single trade query (/api/v1/trades)
│   │   ├── risk.py                # Risk audit event queries (/api/v1/risk/events)
│   │   ├── analytics.py           # Deterministic metrics (/api/v1/analytics/summary)
│   │   └── ai.py                  # TradeMind AI Copilot and conversation history
│   ├── exchange/
│   │   ├── __init__.py
│   │   └── delta_client.py        # Delta Exchange Testnet REST client with HMAC signing
│   ├── strategies/
│   │   ├── __init__.py
│   │   └── moving_average.py      # Deterministic MA Crossover + RSI Strategy
│   ├── repositories/
│   │   ├── __init__.py
│   │   └── firestore_repo.py      # Firestore Repository for hammer-algotrading
│   ├── services/
│   │   ├── __init__.py
│   │   ├── market_service.py      # Instrument caching and candle normalization
│   │   ├── risk_service.py        # Pre-trade risk controls and emergency stop
│   │   ├── execution_service.py   # Order submission & position reconciliation
│   │   ├── trading_engine.py      # Background evaluation loop coordinator
│   │   ├── event_service.py       # Deterministic Trade Event Ledger & Analytics Engine
│   │   └── ai/
│   │       ├── __init__.py
│   │       ├── groq_client.py     # Official GroqCloud API Client (llama-3.3-70b-versatile)
│   │       ├── grok_client.py     # Official xAI Grok API Client (grok-2-latest)
│   │       ├── llm_provider.py    # LLM Provider abstraction (Groq, Grok, Gemini, Mock)
│   │       ├── embedding_service.py # Vector embedding and cosine similarity ranking
│   │       ├── document_ingestion.py # Knowledge ingestion with vector indexing
│   │       ├── retrieval_service.py # Dual-path evidence retrieval (ledger + docs)
│   │       └── copilot_service.py # TradeMind AI conversation and explanation engine
│   └── schemas/
│       ├── __init__.py
│       ├── trading.py             # Pydantic models for orders, signals, and ledger events
│       └── ai.py                  # Pydantic models for TradeMind AI chat & history
├── tests/
│   ├── __init__.py
│   ├── conftest.py                # Test fixtures and MockDeltaClient
│   ├── test_ai_copilot.py         # TradeMind AI copilot and explanation tests
│   ├── test_api_endpoints.py      # Endpoints: trades, risk, analytics, strategy explain
│   ├── test_embedding_service.py  # Vector embedding & similarity ranking tests
│   ├── test_event_service.py      # Event ledger & deterministic analytics tests
│   ├── test_exchange.py           # HMAC signature & error handling unit tests
│   ├── test_firestore.py          # Cloud Firestore repository unit tests
│   ├── test_grok_client.py        # xAI Grok client & error handling tests
│   ├── test_groq_client.py        # Groq client & error handling tests
│   ├── test_health.py             # Health endpoint tests
│   ├── test_risk.py               # Pre-trade risk rule unit tests
│   ├── test_strategy.py           # Indicator & crossover unit tests
│   └── test_trading.py            # API routing and execution integration tests
├── scripts/
│   └── verify_environment.py      # Diagnostic script for environment, API keys & dependencies
├── main.py                        # Root compatibility wrapper
├── strategy.py                    # Root compatibility wrapper
├── delta_client.py                # Root compatibility wrapper
├── .env.example                   # Environment template with safe defaults
├── .gitignore                     # Git ignore rules (secrets, venvs, DBs)
├── requirements.txt               # Locked production dependencies
├── pytest.ini                     # Pytest configuration
├── ruff.toml                      # Ruff linter and formatter rules
└── README.md                      # Complete system documentation
```

---

## 4. Trading Strategy Logic & Semantics

The baseline strategy is implemented in [`app/strategies/moving_average.py`](file:///c:/Users/Ashutosh%20Pandey/Downloads/hammer_algoTrading/app/strategies/moving_average.py).

### Indicators
1. **Fast Simple Moving Average (SMA)**: Mean of the last $N_{fast}$ candle closes (default: 5).
2. **Slow Simple Moving Average (SMA)**: Mean of the last $N_{slow}$ candle closes (default: 15).
3. **Relative Strength Index (RSI)**: Computed over $N_{rsi}$ periods (default: 14) using average gain/loss ratios.

### Deterministic Crossover Detection
Rather than treating every tick where Fast MA > Slow MA as a trigger, the engine requires a **strict crossover boundary event**:
- **Golden Cross (`BUY`)**:
  $$\text{FastMA}_{t-1} \le \text{SlowMA}_{t-1} \quad \text{AND} \quad \text{FastMA}_t > \text{SlowMA}_t$$
  **RSI Confirmation Filter**: $\text{RSI}_t < 70.0$.
  *If RSI $\ge 70.0$, the Golden Cross is vetoed to `HOLD` to avoid buying into an overextended price spike.*

- **Death Cross (`SELL`)**:
  $$\text{FastMA}_{t-1} \ge \text{SlowMA}_{t-1} \quad \text{AND} \quad \text{FastMA}_t < \text{SlowMA}_t$$
  **RSI Confirmation Filter**: $\text{RSI}_t > 30.0$.
  *If RSI $\le 30.0$, the Death Cross is vetoed to `HOLD` to avoid selling at an oversold capitulation bottom.*

- **No Crossover (`HOLD`)**:
  If the moving averages maintain their position without crossing, or if insufficient history is provided, the strategy outputs `HOLD`.

### Position Policy & Order Semantics
- **`BUY`**: Enter a long position if currently flat. If already in a long position, ignore signal (no duplicate stack entries).
- **`SELL`**: Close an existing long position. If currently flat, ignore signal (conservative long-only baseline to prevent naked shorting in volatile crypto testnets).
- **`HOLD`**: Take no order action.

---

## 5. Risk Management & Safety Engine

Implemented in [`app/services/risk_service.py`](file:///c:/Users/Ashutosh%20Pandey/Downloads/hammer_algoTrading/app/services/risk_service.py). **No order can bypass this engine.**

| # | Check Name | Rule Description | Rejection Outcome |
|---|---|---|---|
| 1 | **Emergency Stop** | Checks if operator emergency stop is engaged | `Rejected: Emergency stop is currently active.` |
| 2 | **Trading Enabled Switch** | Checks `TRADING_ENABLED` flag | `Rejected: Trading is disabled in configuration.` |
| 3 | **Credential Verification** | Checks that API Key & Secret are configured | `Rejected: Delta Exchange API credentials missing.` |
| 4 | **Testnet Endpoint Guard** | Ensures `DELTA_BASE_URL` contains `testnet` | `Rejected: Live trading base URL detected.` |
| 5 | **Daily Loss Threshold** | Realized daily loss < `MAX_DAILY_LOSS` | `Rejected: Maximum daily loss limit reached ($X >= $Y).` |
| 6 | **Order Size Check** | Size must be $> 0$ and $\le$ `MAX_POSITION_SIZE` | `Rejected: Order size exceeds max position size limit.` |
| 7 | **Aggregate Position Limit**| Current position + order size $\le$ `MAX_POSITION_SIZE` | `Rejected: Cumulative position size would exceed limit.` |
| 8 | **Max Open Positions** | Number of active positions < `MAX_OPEN_POSITIONS` | `Rejected: Maximum simultaneous open positions reached.` |
| 9 | **Cooldown Safeguard** | Enforces minimum 10 seconds between orders on same symbol | `Rejected: Duplicate order safeguard. Cooldown active.` |
| 10 | **Exchange Ping Health** | Probes exchange connectivity before submission | `Rejected: Delta Exchange Testnet is unreachable.` |

---

## 6. Order Execution Workflow

```
   Fresh Market Candles
           │
           ▼
   Strategy.evaluate() ───► Signal: BUY / SELL / HOLD
                                 │
                 ┌───────────────┴──────────────┐
                 │ (HOLD)                       │ (BUY / SELL)
                 ▼                              ▼
          Persist Signal             Reconcile Open Positions
          in SQLite Audit                       │
                                                ▼
                                     Pre-Trade Risk Checks
                                     (10 Critical Rules)
                                                │
                                ┌───────────────┴───────────────┐
                                │ (Approved)                    │ (Rejected)
                                ▼                               ▼
                     Generate Client Order ID          Persist Rejection Event
                     Submit via DeltaClient (HMAC)     Return Rejection Result
                                │
                                ▼
                     Delta Testnet Response
                     (Pending / Open / Filled)
                                │
                                ▼
                     Persist in 'orders' table
                     Persist in 'trades' table (if filled)
```

---

## 7. Firebase Cloud Firestore Integration (`hammer-algotrading`)

The system integrates with **Google Cloud Firestore** using the official `firebase-admin` Python SDK. The primary trading logic remains strictly in Python and FastAPI; Firestore serves as a real-time, cloud-synchronized persistence and audit layer.

### Firestore Collections & Document Architecture

| Collection | Document ID | Fields / Purpose |
|---|---|---|
| `signals` | Auto-generated (`{symbol}_{timestamp}`) | Evaluated strategy signals: `timestamp` (ISO UTC), `symbol`, `signal` (BUY/SELL/HOLD), `price`, `fast_ma`, `slow_ma`, `rsi`, `reason`. |
| `orders` | `client_order_id` (Idempotent) | Order lifecycle: `client_order_id`, `order_id`, `symbol`, `side`, `order_type`, `size`, `price`, `status`, `created_at`, `updated_at`, `response_payload`. Uses `client_order_id` as the document key to guarantee idempotency and avoid duplicate submissions. |
| `trades` | `trade_id` or `{order_id}_{ts}` | Confirmed execution fills: `trade_id`, `order_id`, `symbol`, `side`, `size`, `price`, `executed_at`. |
| `risk_events`| Auto-generated (`risk_{ts}`) | Pre-trade risk audit trail: `timestamp`, `action`, `symbol`, `approved` (boolean), `reason`. |
| `system_status` | `engine_status` | Live engine state for dashboard sync: `trading_enabled`, `emergency_stop_active`, `loop_running`, `symbol`, `daily_realized_loss`, `updated_at`. |

### Secure Credential Configuration

The backend supports multiple secure authentication flows for the Firebase project `hammer-algotrading`:

1. **Option 1: Google Application Default Credentials (ADC - Recommended)**:
   ```bash
   gcloud auth application-default login
   ```
2. **Option 2: Service Account Key File**:
   - Download the service account JSON key from the Firebase Console (`Settings` $\rightarrow$ `Service accounts` $\rightarrow$ `Generate new private key`).
   - Store it outside the repository or at a path ignored by Git (e.g., `service_account.json` is in `.gitignore`).
   - Set in `.env`:
     ```env
     DATABASE_BACKEND=firestore
     FIREBASE_PROJECT_ID=hammer-algotrading
     FIREBASE_SERVICE_ACCOUNT_PATH=./service_account.json
     ```
3. **Option 3: Offline Development via Firebase Emulator**:
   - Run the Firestore Emulator:
     ```bash
     firebase emulators:start --only firestore
     ```
   - In your shell or `.env`:
     ```bash
     # Linux / macOS:
     export FIRESTORE_EMULATOR_HOST="localhost:8080"
     # Windows PowerShell:
     $env:FIRESTORE_EMULATOR_HOST="localhost:8080"
     ```

> **Security Rule**: Service account JSON files and API secrets are never committed to Git. `.gitignore` strictly excludes `*serviceAccount*.json`, `*credentials*.json`, and `.env`.

---

## 8. Installation & Setup

### Prerequisites
- Python 3.10, 3.11, 3.12, 3.13, or 3.14
- Git

### Setup Instructions

```bash
# 1. Clone repository (if not already in directory)
git clone https://github.com/HQHimanshu/hammer_algoTrading.git
cd hammer_algoTrading

# 2. Create virtual environment
python -m venv .venv

# 3. Activate virtual environment
# Windows (PowerShell):
.\.venv\Scripts\Activate.ps1
# Linux / macOS:
source .venv/bin/activate

# 4. Install dependencies
pip install -r requirements.txt
```

---

## 9. Configuration & Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

### Configuration Parameters

| Variable | Default | Purpose |
|---|---|---|
| `DATABASE_BACKEND` | `sqlite` | Persistence backend: `'firestore'` or `'sqlite'` |
| `FIREBASE_PROJECT_ID` | `hammer-algotrading` | Firebase / GCP Project ID |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | `""` | Optional path to service account JSON (uses ADC if omitted) |
| `DELTA_API_KEY` | `""` | Delta Exchange Testnet API Key |
| `DELTA_API_SECRET` | `""` | Delta Exchange Testnet API Secret |
| `DELTA_BASE_URL` | `https://testnet-api.delta.exchange` | Official Testnet REST API URL |
| `TRADING_ENABLED` | `false` | **Safety switch**. Must be set to `true` to allow live testnet execution |
| `MAX_POSITION_SIZE` | `1.0` | Maximum order/position size in contracts |
| `MAX_DAILY_LOSS` | `100.0` | Daily loss ceiling in USD before auto-halt |
| `MAX_OPEN_POSITIONS` | `1` | Max simultaneous open positions |
| `REQUEST_TIMEOUT_SECONDS` | `10.0` | HTTP request timeout |
| `LOG_LEVEL` | `INFO` | Console logging verbosity |
| `DEFAULT_TRADING_SYMBOL` | `BTCUSDT` | Default trading pair |
| `DATABASE_PATH` | `algopilot.db` | Local SQLite database file (when `DATABASE_BACKEND=sqlite`) |
| `EXECUTION_LOOP_INTERVAL_SECONDS` | `30` | Interval between background strategy iterations |

---

## 10. Delta Exchange Testnet API Setup

1. Open your browser and navigate to [https://testnet.delta.exchange](https://testnet.delta.exchange).
2. Register an account or log in.
3. Request testnet mock funds via the Delta Testnet Faucet.
4. Go to **Settings** $\rightarrow$ **API Keys**.
5. Click **Create New API Key** and assign **Read** and **Trade** permissions.
6. Copy the **API Key** and **API Secret** into your `.env` file:
   ```env
   DELTA_API_KEY=your_copied_api_key
   DELTA_API_SECRET=your_copied_api_secret
   DELTA_BASE_URL=https://testnet-api.delta.exchange
   ```
7. To enable orders during your live demonstration, set `TRADING_ENABLED=true`.

---

## 11. API Reference & Example Requests

Once running, interactive OpenAPI documentation is available at:
`http://localhost:8000/docs`

### 1. System Health
```bash
curl -X GET "http://localhost:8000/health"
```
Response:
```json
{
  "status": "ok",
  "app_version": "1.0.0",
  "environment": "Delta Exchange Testnet (https://testnet-api.delta.exchange)",
  "trading_enabled": false,
  "emergency_stop_active": false,
  "exchange_connectivity": true,
  "exchange_latency_ms": 115.42,
  "masked_api_key": "abc...xyz",
  "timestamp": "2026-10-25T06:30:00Z"
}
```

### 2. Live Market Ticker
```bash
curl -X GET "http://localhost:8000/api/v1/market/ticker/BTCUSDT"
```

### 3. Dry-Run Strategy Evaluation
Evaluate signals on custom or live candles without submitting orders:
```bash
curl -X POST "http://localhost:8000/api/v1/strategy/evaluate" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "BTCUSDT",
    "candles": [
      {"time": 1000, "open": 100, "high": 101, "low": 99, "close": 100, "volume": 10},
      {"time": 1060, "open": 99, "high": 100, "low": 98, "close": 99, "volume": 10},
      {"time": 1120, "open": 98, "high": 99, "low": 97, "close": 98, "volume": 10},
      {"time": 1180, "open": 97, "high": 98, "low": 96, "close": 97, "volume": 10},
      {"time": 1240, "open": 98, "high": 99, "low": 97, "close": 98, "volume": 10},
      {"time": 1300, "open": 97.5, "high": 98.5, "low": 97, "close": 97.5, "volume": 10},
      {"time": 1360, "open": 99.5, "high": 100.5, "low": 99, "close": 99.5, "volume": 10}
    ]
  }'
```
Response:
```json
{
  "symbol": "BTCUSDT",
  "action": "BUY",
  "price": 99.5,
  "fast_ma": 98.3333,
  "slow_ma": 98.1667,
  "rsi": 66.67,
  "reason": "BUY Signal: Golden Cross detected (Fast MA 98.33 crossed above Slow MA 98.17). RSI 66.7 confirms bullish trend (< 70.0).",
  "timestamp": "2026-10-25T06:30:00Z"
}
```

### 4. Automated Trading Lifecycle Controls
```bash
# Start background execution loop:
curl -X POST "http://localhost:8000/api/v1/trading/start"

# Inspect active status:
curl -X GET "http://localhost:8000/api/v1/trading/status"

# Stop background loop cleanly:
curl -X POST "http://localhost:8000/api/v1/trading/stop"

# Emergency Stop (blocks all orders immediately):
curl -X POST "http://localhost:8000/api/v1/trading/emergency-stop"
```

### 5. Audit Inspection & Trading Event Ledger
```bash
# Query recent submitted orders:
curl -X GET "http://localhost:8000/api/v1/trading/orders?limit=10"

# Query pre-trade risk decisions:
curl -X GET "http://localhost:8000/api/v1/trading/risk-events?limit=10"

# Query evaluated strategy signals:
curl -X GET "http://localhost:8000/api/v1/trading/signals?limit=10"

# Query trade lifecycle events & verified executions:
curl -X GET "http://localhost:8000/api/v1/trades?symbol=BTCUSDT&limit=10"
curl -X GET "http://localhost:8000/api/v1/trades/TRD-1042"

# Query pre-trade risk audit events:
curl -X GET "http://localhost:8000/api/v1/risk/events?symbol=BTCUSDT&limit=10"
curl -X GET "http://localhost:8000/api/v1/risk/events/RISK-1042"

# Retrieve strategy explanation and rules:
curl -X GET "http://localhost:8000/api/v1/strategy/EMA_RSI_Cross/explain"

# Query deterministic performance analytics summary:
curl -X GET "http://localhost:8000/api/v1/analytics/summary?symbol=BTCUSDT"

# Query TradeMind AI conversation session history:
curl -X GET "http://localhost:8000/api/v1/ai/conversations/test-session-123"
```

---

## 12. Running the Application

### Production / Development Server
```bash
python main.py
```
Or directly using Uvicorn:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 13. Running Automated Tests

Run the full automated test suite:

```bash
# Run environment and dependency diagnosis:
python scripts/verify_environment.py

# Run full test suite:
python -m pytest -v
```

All 90 unit & integration tests run deterministically using in-memory SQLite, mock clients, and isolated fixtures (plus 1 skipped opt-in integration test). **No real network calls or testnet orders are submitted during standard testing.**

### Test Coverage Highlights (90 Passed, 1 Skipped)
- `tests/test_groq_client.py`: Groq client auth, bearer token generation, 401/429/500/timeout error handling, key masking (`gsk_***XXXX`).
- `tests/test_grok_client.py`: xAI Grok client auth, bearer headers, rate limiting, and timeout resilience.
- `tests/test_ai_copilot.py`: TradeMind AI conversation, RAG citation, hallucination prevention, safety refusals, prompt injection resilience.
- `tests/test_embedding_service.py`: Sentence chunking, vector dimension verification, and cosine similarity ranking.
- `tests/test_event_service.py`: Trading Event Ledger recording (`SIG-`, `RISK-`, `ORD-`, `FILL-`, `TRD-`) and deterministic financial analytics.
- `tests/test_api_endpoints.py`: REST routes for trades, risk events, analytics summary, and strategy explanation.
- `tests/test_firestore.py`: Firebase Admin initialization with service-account and ADC hierarchy, fail-safe error handling without fake operations, signals, orders with idempotent client IDs, trade fills, risk events, and engine status document updates.
- `tests/test_strategy.py`: SMA formula, RSI calculations, boundary crossover detection, RSI overbought/oversold veto, duplicate candle prevention.
- `tests/test_risk.py`: Safety switch, emergency stop lifecycle, size limits, daily loss limits, cooldown checks.
- `tests/test_exchange.py`: HMAC-SHA256 signature verification, prehash string formatting, HTTP 401/429/500/timeout error parsing.
- `tests/test_health.py`: Application health, masked credentials, decoupled exchange latency probe, database connectivity.
- `tests/test_trading.py`: API controllers, strategy dry-runs, order rejection safeguards, database audit verification.

### Running Opt-in Live Firestore Integration Tests
When live credentials (`FIREBASE_SERVICE_ACCOUNT_PATH`) or a local emulator (`FIRESTORE_EMULATOR_HOST`) are configured, you can run the live integration test:
```bash
python -m pytest tests/test_firestore.py -k "test_live_firestore_integration" -v
```

---

## 14. Live Demonstration Guide

Follow these steps to demonstrate the system to judges:

1. **Step 1: System Health & Connection**
   - Open browser at `http://localhost:8000/health`.
   - Show judges that `exchange_connectivity` is `true`, latency is reported in milliseconds, `database_backend` is reported, and the API key is safely masked.
2. **Step 2: Live Market Data Ingestion**
   - Query `http://localhost:8000/api/v1/market/ticker/BTCUSDT`.
   - Show live bid/ask quotes and mark prices from Delta Exchange Testnet.
3. **Step 3: Strategy Explanation & Dry-Run Evaluation**
   - Open `http://localhost:8000/docs#/Trading%20%26%20Strategy/evaluate_strategy_api_v1_strategy_evaluate_post`.
   - Execute a dry-run evaluation. Show how moving averages and RSI are computed deterministically.
4. **Step 4: Risk Protection Demonstration**
   - Attempt an order when `TRADING_ENABLED=false` or exceed `MAX_POSITION_SIZE`.
   - Show that the order is rejected immediately with a clear explanation.
   - Inspect `/api/v1/trading/risk-events` to show the pre-trade audit log.
5. **Step 5: Cloud Persistence Verification**
   - Inspect persisted records via `/api/v1/trading/orders`, `/api/v1/trading/signals`, and `/api/v1/trading/risk-events`.
   - When configured with Firebase, show documents synchronizing directly in the Google Cloud Firestore console under project `hammer-algotrading`.
6. **Step 6: Automated Loop & Order Placement**
   - With testnet credentials configured and `TRADING_ENABLED=true`, trigger `/api/v1/trading/start`.
   - Demonstrate the periodic execution loop and order status reconciliation.
7. **Step 7: Emergency Stop**
   - Trigger `/api/v1/trading/emergency-stop`.
   - Show that the background loop terminates immediately and all subsequent entries are blocked.

---

## 15. TradeMind AI — Explainable Algorithmic Trading Copilot

### 15.1 Overview & Objective

**TradeMind AI** is an explainable, retrieval-augmented intelligence copilot embedded directly into the AlgoPilot backend. It enables human operators, trading teams, and hackathon judges to query the trading system using natural language to obtain grounded explanations of:
- Why specific trading signals (BUY, SELL, HOLD) were generated.
- Exactly why the strategy decided to enter or exit a position.
- Why an order was rejected by the pre-trade risk engine (identifying the exact risk rules that failed).
- The exact execution status of orders (pending, open, filled, partially filled, cancelled, rejected).
- Which indicator values (Fast SMA, Slow SMA, RSI) and parameters contributed to a decision.
- What happened during a historical trade, including realized P&L and commission.
- Deterministic performance metrics (win rate %, total orders, fill rates, realized P&L).
- Strategy rules and parameter semantics (e.g. RSI veto rules, cooldown limits).

### 15.2 Core Principle: Evidence Before Explanation

TradeMind AI operates on the strict principle of **evidence before explanation**:
1. **Never Invent Trading Facts**: The AI assistant never fabricates indicator values, order statuses, execution prices, or justifications.
2. **Two Complementary Retrieval Paths**:
   - **Structured Trade Retrieval**: Queries exact records directly from Cloud Firestore (`hammer-algotrading`) or SQLite (`orders`, `signals`, `trades`, `risk_events`). Exact timestamps, order states, fill prices, and client order IDs are retrieved directly from the repository layer.
   - **Semantic Knowledge Retrieval**: Retrieves versioned, approved strategy documentation (`DOC-STRAT-001`, `DOC-STRAT-002`), risk management specifications (`DOC-RISK-001`), and execution lifecycle contracts (`DOC-EXEC-001`).
3. **Deterministic Financial Arithmetic**: Win rate, fill count, and realized P&L calculations are computed deterministically in Python services, never estimated or hallucinated by the LLM from text.
4. **Honest Uncertainty (`INSUFFICIENT_EVIDENCE`)**: When an order, trade, or signal record does not exist in the database, the copilot explicitly states that evidence is missing and refuses to speculate.
5. **Strictly Read-Only Safety Guardrail**: TradeMind AI has **zero execution authority**. It possesses no methods to place, cancel, or modify exchange orders, nor can it alter risk limits or engine states. Any instruction attempting to trade or modify limits is immediately rejected with a `SAFETY REFUSAL`.

### 15.3 Supported Question Categories & Examples

| Category | Description | Example Questions |
| :--- | :--- | :--- |
| **Trade Explanation** | Post-trade analysis of entries and exits | `"Why did the bot enter BTCUSDT?"`<br>`"What was the result of trade trd-btc-101?"` |
| **Order Status** | Detailed state tracking across the exchange lifecycle | `"Was order ord_BTCUSDT_test_123 accepted by the exchange?"`<br>`"Is my order filled or pending?"` |
| **Risk Decision** | Explaining pre-trade rejections & safety blocks | `"Why was order ord-123 rejected?"`<br>`"Which risk checks failed on this trade?"` |
| **Strategy Documentation** | Explanation of indicators, formulas, and parameters | `"How does our RSI veto rule work?"`<br>`"What conditions trigger a Golden Cross BUY signal?"` |
| **Historical Performance** | Realized P&L, win rate %, and order counts | `"What is our total realized PnL and win rate today?"`<br>`"How many orders were filled vs rejected?"` |
| **General Architecture** | System boundaries, storage, and exchange interface | `"How does AlgoPilot store trades in Cloud Firestore?"` |

### 15.4 Trade Explanation Structure

Every trade explanation follows a clear, auditable structure:
```
- Answer: Direct concise answer to the question.
- Evidence: Verifiable bullet points listing Signal ID, Order ID, SMA values, RSI, and timestamps.
- Interpretation: Clear strategy crossover or risk condition that triggered the event.
- Execution: Actual exchange order status and fill outcome (or clearly noting if unrecorded).
- Limitations: Any gaps or missing records that prevent a complete conclusion.
```

### 15.5 API Endpoints & Request/Response Formats

#### 1. AI Health Check
`GET /api/v1/ai/health`

**Response:**
```json
{
  "ai_enabled": false,
  "provider": "mock",
  "model": "gemini-1.5-flash",
  "status": "disabled",
  "timestamp": "2026-10-25T07:15:00.000000Z"
}
```

#### 2. Chat with TradeMind AI Copilot
`POST /api/v1/ai/chat`

**Request Schema:**
```json
{
  "question": "Why was my order rejected by the risk engine?",
  "trade_id": null,
  "order_id": "ord_BTCUSDT_rejected_1",
  "symbol": "BTCUSDT",
  "session_id": null
}
```

**Response Schema:**
```json
{
  "answer": "The order was rejected by the pre-trade risk engine before submission to Delta Exchange Testnet because the TRADING_ENABLED configuration is currently set to False.",
  "sources": [
    {
      "record_type": "risk_event",
      "record_id": "risk_1700000001",
      "event_timestamp": "2026-10-25T07:14:30.123456Z",
      "summary": "Risk Decision: rejected (Rejected: Trading is disabled in configuration (TRADING_ENABLED=False).)"
    }
  ],
  "confidence": "supported",
  "limitations": [],
  "request_id": "req-8f4b12a9",
  "category": "risk_decision",
  "timestamp": "2026-10-25T07:15:01.234567Z"
}
```

### 15.6 Confidence Levels

TradeMind AI classifies response certainty conservatively:
- `supported`: All target records (signals, orders, trades, risk events) or documentation are present and verified in the database.
- `partially_supported`: Some relevant records were found (e.g. signal exists but no corresponding order was submitted), or context had to be truncated.
- `insufficient_evidence`: The specified trade or order ID does not exist in the database, preventing any factual explanation.

### 15.7 Configuration & Setup

Add the following environment variables to your `.env` file:
```bash
# Enable TradeMind AI Copilot (defaults to false for safety)
AI_ENABLED=true

# Provider options: 'groq' (recommended), 'grok' (xAI), 'mock' (offline test fixture), or 'gemini'
AI_PROVIDER=groq

# 1. Groq Cloud Configuration (Recommended)
# Official documentation: https://console.groq.com/docs/api-reference
GROQ_API_KEY=gsk_your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
GROQ_BASE_URL=https://api.groq.com/openai/v1
GROQ_TIMEOUT_SECONDS=60.0

# 2. xAI Grok Configuration (Alternative)
# Official documentation: https://docs.x.ai/overview
# AI_PROVIDER=grok
XAI_API_KEY=your_xai_grok_api_key_here
XAI_MODEL=grok-2-latest
XAI_BASE_URL=https://api.x.ai/v1
XAI_TIMEOUT_SECONDS=60.0

# RAG & Context limits
RAG_TOP_K=5
RAG_MIN_RELEVANCE_SCORE=0.50
AI_MAX_CONTEXT_RECORDS=20
AI_MAX_CONTEXT_CHARS=8000
AI_MAX_OUTPUT_TOKENS=1000
```

---

## 16. Known Limitations & Future Roadmap

1. **Testnet Candle Volume**: On Delta Exchange Testnet, trading volume can be thin during non-peak hackathon hours, resulting in fewer executed trades on certain contract pairs. Ticker spot and mark prices remain live and operational.
2. **Long-Only Policy**: The baseline strategy implements a conservative long-only policy (BUY opens long, SELL closes long). Expanding to bidirectional long/short perpetual trading with dynamic margin sizing is a planned enhancement.
3. **WebSockets**: Real-time orderbook streaming via WebSockets is planned for Phase 2 to complement the current robust REST polling client.
4. **Chat Session Persistence**: Currently, TradeMind AI processes each query with bounded contextual retrieval and request correlation IDs. Multi-turn conversational persistence into Cloud Firestore is scheduled for Phase 2.

---

## 17. Team Understanding & AI Transparency

In compliance with the hackathon rules regarding code ownership (20–30% AI assistance allowance):

- **Architecture & System Design**: Designed collaboratively by the team to meet all hackathon judging criteria.
- **AI Tooling Role**: AI assistance was utilized as a pair-programming productivity tool for boilerplate scaffolding, Pydantic model definitions, and typing annotations.
- **Team-Reviewed Core Logic**:
  - The Firebase Admin and Cloud Firestore integration in `app/firebase_config.py` and `app/repositories/firestore_repo.py`.
  - The HMAC-SHA256 signing algorithm in `app/exchange/delta_client.py`.
  - The crossover detection and RSI confirmation logic in `app/strategies/moving_average.py`.
  - The fail-closed pre-trade risk engine in `app/services/risk_service.py`.
  - The order reconciliation and Firestore schema in `app/services/execution_service.py`.
  - The TradeMind AI grounded RAG service in `app/services/ai/` and its strict read-only safety guardrails.
- **Presentation Readiness**: Every team member can explain the architecture, indicator calculations, risk controls, and execution lifecycle in detail during judging.
