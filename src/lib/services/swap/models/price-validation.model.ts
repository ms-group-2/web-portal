export interface PriceValidationRequest {
  title: string;
  estimated_value: number;
  condition: string;
  category?: string;
  photos?: string[];
}

export interface ConditionAnalysis {
  condition: string;
  confidence: number;
  reasoning: string;
  defects: string[];
}

export interface FairRange {
  min: number;
  max: number;
}

export interface MarketData {
  samples: number;
  median: number;
  confidence: string;
}

export interface CompetitorItem {
  title: string;
  price: number;
  link: string;
}

export interface PriceValidationResponse {
  title: string;
  condition: string;
  condition_source: 'ai' | 'user';
  condition_analysis: ConditionAnalysis | null;
  estimated_value: number;
  status: 'eligible' | 'overpriced' | 'underpriced' | 'pending_review' | 'rejected';
  message: string;
  suggested_price: number;
  fair_range: FairRange;
  market_data: MarketData;
  competitors: CompetitorItem[];
}
