export interface TokenData {
  token_address: string;
  token_name: string;
  token_ticker: string;
  price_sol: number;
  market_cap_sol: number;
  volume_sol: number;
  liquidity_sol: number;
  transaction_count: number;
  price_1hr_change: number;
  protocol: string;
  sources: string[];
  last_updated: number;
  price_24hr_change?: number;
  price_7d_change?: number;
  volume_24h?: number;
}

export interface AggregatedTokenData extends TokenData {
  source_count: number;
  confidence_score: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  next_cursor: string | null;
  has_more: boolean;
  total: number;
}

export interface FilterOptions {
  timePeriod?: '1h' | '24h' | '7d';
  sortBy?: 'volume' | 'price_change' | 'market_cap' | 'liquidity' | 'transaction_count';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  cursor?: string;
  minVolume?: number;
  minMarketCap?: number;
}

export interface WebSocketUpdate {
  type: 'price_update' | 'volume_spike' | 'new_token';
  token: TokenData;
  change_percentage?: number;
  timestamp: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  backoffMultiplier: number;
  maxBackoff: number;
}

export interface CacheConfig {
  ttl: number;
  enabled: boolean;
}


