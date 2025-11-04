export type UUID = string;

export interface Database {
  public: {
    Tables: {
      households: {
        Row: {
          id: UUID;
          name: string;
          created_at: string | null;
        };
        Insert: {
          id?: UUID;
          name: string;
          created_at?: string | null;
        };
        Update: {
          id?: UUID;
          name?: string;
          created_at?: string | null;
      };
      Relationships: [];
    };
    user_profiles: {
      Row: {
        id: UUID;
          auth_user_id: UUID;
          household_id: UUID;
          display_name: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: UUID;
          auth_user_id: UUID;
          household_id: UUID;
          display_name?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: UUID;
          auth_user_id?: UUID;
          household_id?: UUID;
          display_name?: string | null;
          created_at?: string | null;
      };
      Relationships: [];
    };
    transactions: {
      Row: {
        id: UUID;
          household_id: UUID;
          date: string;
          category: string;
          tipo: "ingreso" | "gasto" | "deuda";
          monto: number;
          persona: string;
          metodo: string | null;
          nota: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: UUID;
          household_id: UUID;
          date: string;
          category: string;
          tipo: "ingreso" | "gasto" | "deuda";
          monto: number;
          persona: string;
          metodo?: string | null;
          nota?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: UUID;
          household_id?: UUID;
          date?: string;
          category?: string;
          tipo?: "ingreso" | "gasto" | "deuda";
          monto?: number;
          persona?: string;
          metodo?: string | null;
          nota?: string | null;
          created_at?: string | null;
      };
      Relationships: [];
    };
    budgets: {
      Row: {
        id: UUID;
          household_id: UUID;
          month_key: string;
          category: string;
          amount: number;
          created_at: string | null;
        };
        Insert: {
          id?: UUID;
          household_id: UUID;
          month_key: string;
          category: string;
          amount: number;
          created_at?: string | null;
        };
        Update: {
          id?: UUID;
          household_id?: UUID;
          month_key?: string;
          category?: string;
          amount?: number;
          created_at?: string | null;
      };
      Relationships: [];
    };
    debts: {
        Row: {
          id: UUID;
          household_id: UUID;
          entity: string;
          balance: number;
          monthly_payment: number;
          interest_rate: number | null;
          status: "activa" | "pagada" | "morosa";
          created_at: string | null;
        };
        Insert: {
          id?: UUID;
          household_id: UUID;
          entity: string;
          balance: number;
          monthly_payment: number;
          interest_rate?: number | null;
          status?: "activa" | "pagada" | "morosa";
          created_at?: string | null;
        };
        Update: {
          id?: UUID;
          household_id?: UUID;
          entity?: string;
          balance?: number;
          monthly_payment?: number;
          interest_rate?: number | null;
          status?: "activa" | "pagada" | "morosa";
          created_at?: string | null;
      };
      Relationships: [];
    };
    savings: {
      Row: {
        id: UUID;
          household_id: UUID;
          goal_name: string;
          target_amount: number;
          current_amount: number;
          deadline: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: UUID;
          household_id: UUID;
          goal_name: string;
          target_amount: number;
          current_amount?: number;
          deadline?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: UUID;
          household_id?: UUID;
          goal_name?: string;
          target_amount?: number;
          current_amount?: number;
          deadline?: string | null;
          created_at?: string | null;
        };
      };
      Relationships: [];
    };
  };
}

export type Tables = Database["public"]["Tables"];
export type Household = Tables["households"]["Row"];
export type UserProfile = Tables["user_profiles"]["Row"];
export type Transaction = Tables["transactions"]["Row"];
export type Budget = Tables["budgets"]["Row"];
export type Debt = Tables["debts"]["Row"];
export type SavingGoal = Tables["savings"]["Row"];
