/**
 * Project Hammer / AlgoPilot Centralized Frontend API Client
 * 
 * Secure integration layer connecting React 19 UI to FastAPI backend on http://127.0.0.1:8000.
 * Handles timeouts, network failure states, error decoding, and request cancellation.
 */

export interface SystemHealth {
  status: string;
  app_version: string;
  environment: string;
  trading_enabled: boolean;
  emergency_stop_active: boolean;
  exchange_connectivity: boolean;
  exchange_latency_ms: number;
  database_backend: string;
  database_connected: boolean;
  masked_api_key: string;
  timestamp: string;
}

export interface Instrument {
  symbol: string;
  underlying_asset: string;
  quoting_asset: string;
  contract_type: string;
  tick_size: number;
  contract_value: number;
  is_active: boolean;
}

export interface TickerData {
  symbol: string;
  mark_price: number;
  spot_price: number;
  best_bid: number;
  best_ask: number;
  volume_24h: number;
  timestamp: string;
}

export interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketStatus {
  exchange_environment: string;
  base_url: string;
  ws_url?: string;
  selected_contract: string;
  connection_status: string;
  data_source: string;
  last_successful_update?: string | null;
  updates_received_count: number;
  active_frontend_clients: number;
  last_error?: string | null;
  latest_price?: number | null;
}

export interface StrategyCatalogItem {
  id: string;
  name: string;
  status: string;
  symbol: string;
  fast_period?: number;
  slow_period?: number;
  rsi_period?: number;
  rsi_overbought?: number;
  rsi_oversold?: number;
  trend_bars?: number;
  expiry_bars?: number;
  stop_pct?: number;
  target_pct?: number;
  description: string;
}

export interface StrategySignalResult {
  symbol: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  price: number;
  fast_ma?: number | null;
  slow_ma?: number | null;
  rsi?: number | null;
  stop_loss?: number | null;
  take_profit?: number | null;
  reason: string;
  timestamp: string;
  strategy_name: string;
  timeframe: string;
  crossover?: string;
  rsi_confirmed?: boolean | null;
  risk_eligible?: boolean | null;
  data_fresh: boolean;
  execution_eligible?: boolean | null;
}

export interface TradingStatusData {
  trading_enabled: boolean;
  emergency_stop_active: boolean;
  loop_running: boolean;
  symbol: string;
  loop_interval_seconds: number;
  open_positions_count: number;
  daily_realized_loss: number;
  max_daily_loss: number;
  max_position_size: number;
  last_loop_run_time?: string | null;
  last_signal?: StrategySignalResult | null;
}

export interface OrderRecord {
  id?: string;
  client_order_id?: string;
  exchange_order_id?: string;
  symbol: string;
  side: string;
  order_type: string;
  size: number;
  price?: number | null;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export interface TradeRecord {
  id?: string;
  order_id?: string;
  symbol: string;
  side: string;
  size: number;
  price: number;
  fee?: number;
  realized_pnl?: number;
  executed_at?: string;
}

export interface RiskEventRecord {
  id?: string;
  symbol: string;
  side: string;
  size: number;
  price?: number | null;
  status: string;
  reason: string;
  checks_passed?: string;
  checks_failed?: string;
  created_at?: string;
}

export interface CopilotChatResponse {
  answer: string;
  sources: Array<{
    record_type: string;
    record_id: string;
    event_timestamp?: string | null;
    summary?: string | null;
  }>;
  confidence: 'supported' | 'partially_supported' | 'insufficient_evidence';
  limitations: string[];
  request_id: string;
  category: string;
}

export interface AIHealthData {
  ai_enabled: boolean;
  provider: string;
  model: string;
  status: string;
  timestamp: string;
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || 'http://127.0.0.1:8000';
const DEFAULT_TIMEOUT_MS = 12000;

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(options.headers || {}),
        },
      });

      if (!response.ok) {
        let errorDetail = `HTTP ${response.status} ${response.statusText}`;
        try {
          const errJson = await response.json();
          if (errJson.detail) {
            errorDetail = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
          } else if (errJson.message) {
            errorDetail = errJson.message;
          }
        } catch {
          // Fallback to HTTP text
        }
        throw new Error(errorDetail);
      }

      return (await response.json()) as T;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error(`Request timed out after ${DEFAULT_TIMEOUT_MS / 1000} seconds: ${endpoint}`);
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // System & Health
  async getHealth(): Promise<SystemHealth> {
    return this.request<SystemHealth>('/health');
  }

  // Market Data
  async getInstruments(refresh: boolean = false): Promise<Instrument[]> {
    return this.request<Instrument[]>(`/api/v1/market/instruments?refresh=${refresh}`);
  }

  async getTicker(symbol: string): Promise<TickerData> {
    return this.request<TickerData>(`/api/v1/market/ticker/${encodeURIComponent(symbol)}`);
  }

  async getMarketStatus(): Promise<MarketStatus> {
    return this.request<MarketStatus>('/api/market/status');
  }

  async getCandles(symbol: string, resolution: string = '1m', limit: number = 60): Promise<CandleData[]> {
    return this.request<CandleData[]>(
      `/api/v1/market/candles/${encodeURIComponent(symbol)}?resolution=${resolution}&limit=${limit}`
    );
  }

  /**
   * Connect to Delta Demo Market WebSocket feed via backend /ws/market.
   * Auto-reconnects with backoff and handles heartbeat pings.
   */
  connectMarketWebSocket(
    onMessage: (data: any) => void,
    onStatusChange?: (status: 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'RECONNECTING') => void
  ): () => void {
    const wsBaseUrl = (import.meta.env.VITE_WS_BASE_URL as string) || 
      this.baseUrl.replace(/^http/, 'ws');
    const wsUrl = `${wsBaseUrl.replace(/\/+$/, '')}/ws/market`;

    let socket: WebSocket | null = null;
    let isClosedExplicitly = false;
    let reconnectTimeout: any = null;
    let pingInterval: any = null;

    const connect = () => {
      if (isClosedExplicitly) return;
      onStatusChange?.('CONNECTING');

      try {
        socket = new WebSocket(wsUrl);

        socket.onopen = () => {
          onStatusChange?.('CONNECTED');
          pingInterval = setInterval(() => {
            if (socket && socket.readyState === WebSocket.OPEN) {
              socket.send('ping');
            }
          }, 15000);
        };

        socket.onmessage = (event) => {
          if (event.data === 'pong') return;
          try {
            const parsed = JSON.parse(event.data);
            onMessage(parsed);
          } catch (err) {
            console.debug('Failed to parse WS frame:', err);
          }
        };

        socket.onclose = () => {
          clearInterval(pingInterval);
          if (!isClosedExplicitly) {
            onStatusChange?.('RECONNECTING');
            reconnectTimeout = setTimeout(connect, 3000);
          } else {
            onStatusChange?.('DISCONNECTED');
          }
        };

        socket.onerror = (err) => {
          console.warn('Market WebSocket warning:', err);
          socket?.close();
        };
      } catch (err) {
        console.error('Failed to initialize WebSocket:', err);
        if (!isClosedExplicitly) {
          reconnectTimeout = setTimeout(connect, 3000);
        }
      }
    };

    connect();

    return () => {
      isClosedExplicitly = true;
      clearInterval(pingInterval);
      clearTimeout(reconnectTimeout);
      if (socket) {
        socket.close();
      }
      onStatusChange?.('DISCONNECTED');
    };
  }

  // Strategy & Algo Engine
  async getStrategies(): Promise<StrategyCatalogItem[]> {
    return this.request<StrategyCatalogItem[]>('/api/v1/strategies');
  }

  async getStrategyStatus(): Promise<any> {
    return this.request<any>('/api/v1/strategy/status');
  }

  async explainStrategy(strategyId: string): Promise<any> {
    return this.request<any>(`/api/v1/strategy/${encodeURIComponent(strategyId)}/explain`);
  }

  async evaluateStrategy(
    symbol: string = 'BTCUSDT',
    strategyId: string = 'strategy_1',
    candles?: CandleData[]
  ): Promise<StrategySignalResult> {
    return this.request<StrategySignalResult>('/api/v1/strategy/evaluate', {
      method: 'POST',
      body: JSON.stringify({
        symbol,
        strategy_id: strategyId,
        candles: candles && candles.length > 0 ? candles : undefined,
      }),
    });
  }

  // Trading Lifecycle & Controls
  async getTradingStatus(): Promise<TradingStatusData> {
    return this.request<TradingStatusData>('/api/v1/trading/status');
  }

  async enableTrading(): Promise<any> {
    return this.request<any>('/api/trading/enable', { method: 'POST' });
  }

  async disableTrading(): Promise<any> {
    return this.request<any>('/api/trading/disable', { method: 'POST' });
  }

  async startTrading(): Promise<any> {
    return this.request<any>('/api/v1/trading/start', { method: 'POST' });
  }

  async stopTrading(): Promise<any> {
    return this.request<any>('/api/v1/trading/stop', { method: 'POST' });
  }

  async emergencyStop(): Promise<any> {
    return this.request<any>('/api/v1/trading/emergency-stop', { method: 'POST' });
  }

  async getTradingHistory(limit: number = 50): Promise<any> {
    return this.request<any>(`/api/trading/history?limit=${limit}`);
  }

  async getWalletBalances(): Promise<{ success: boolean; environment: string; balances: any[] }> {
    return this.request<{ success: boolean; environment: string; balances: any[] }>('/api/v1/trading/balances');
  }

  // History & Audit Records
  async getPositions(): Promise<any[]> {
    return this.request<any[]>('/api/v1/trading/positions');
  }

  async getOrders(limit: number = 50): Promise<OrderRecord[]> {
    return this.request<OrderRecord[]>(`/api/v1/trading/orders?limit=${limit}`);
  }

  async getTrades(limit: number = 50): Promise<TradeRecord[]> {
    return this.request<TradeRecord[]>(`/api/v1/trading/trades?limit=${limit}`);
  }

  async getRiskEvents(limit: number = 50): Promise<RiskEventRecord[]> {
    return this.request<RiskEventRecord[]>(`/api/v1/trading/risk-events?limit=${limit}`);
  }

  async getSignals(limit: number = 50): Promise<any[]> {
    return this.request<any[]>(`/api/v1/trading/signals?limit=${limit}`);
  }

  async getAnalyticsSummary(): Promise<any> {
    return this.request<any>('/api/v1/analytics/summary');
  }

  // TradeMind AI Copilot
  async getAiHealth(): Promise<AIHealthData> {
    return this.request<AIHealthData>('/api/v1/ai/health');
  }

  async askCopilot(
    question: string,
    options: {
      trade_id?: string;
      order_id?: string;
      signal_id?: string;
      symbol?: string;
      session_id?: string;
    } = {}
  ): Promise<CopilotChatResponse> {
    return this.request<CopilotChatResponse>('/api/v1/ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        question,
        trade_id: options.trade_id || undefined,
        order_id: options.order_id || undefined,
        signal_id: options.signal_id || undefined,
        symbol: options.symbol || undefined,
        session_id: options.session_id || undefined,
      }),
    });
  }
}

export const api = new ApiClient();
export default api;
