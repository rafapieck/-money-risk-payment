export type RiskLevel = "low" | "moderate" | "high";
export type PaymentRouteType =
  | "installment_plan"
  | "imss_route"
  | "community_fund";

export interface Database {
  public: {
    Tables: {
      questionnaire_responses: {
        Row: {
          id: string;
          user_id: string;
          answers: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          answers: Record<string, unknown>;
          created_at?: string;
        };
        Update: Partial<{
          id: string;
          user_id: string;
          answers: Record<string, unknown>;
          created_at: string;
        }>;
        Relationships: [];
      };
      risk_results: {
        Row: {
          id: string;
          user_id: string;
          questionnaire_id: string;
          risk_level: RiskLevel;
          explanation: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          questionnaire_id: string;
          risk_level: RiskLevel;
          explanation: string;
          created_at?: string;
        };
        Update: Partial<{
          id: string;
          user_id: string;
          questionnaire_id: string;
          risk_level: RiskLevel;
          explanation: string;
          created_at: string;
        }>;
        Relationships: [];
      };
      payment_routes: {
        Row: {
          id: string;
          label: string;
          description: string;
          type: PaymentRouteType;
          is_simulated: boolean;
          is_active: boolean;
          created_at: string;
        };
        Insert: Partial<{
          id: string;
          label: string;
          description: string;
          type: PaymentRouteType;
          is_simulated: boolean;
          is_active: boolean;
          created_at: string;
        }>;
        Update: Partial<{
          id: string;
          label: string;
          description: string;
          type: PaymentRouteType;
          is_simulated: boolean;
          is_active: boolean;
          created_at: string;
        }>;
        Relationships: [];
      };
      risk_result_routes: {
        Row: {
          id: string;
          risk_result_id: string;
          payment_route_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          risk_result_id: string;
          payment_route_id: string;
          created_at?: string;
        };
        Update: Partial<{
          id: string;
          risk_result_id: string;
          payment_route_id: string;
          created_at: string;
        }>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
