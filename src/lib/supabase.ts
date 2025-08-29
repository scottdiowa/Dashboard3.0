import { createClient } from '@supabase/supabase-js'

// Check if we have valid Supabase credentials
const hasValidCredentials = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY

const supabaseUrl = hasValidCredentials 
  ? import.meta.env.VITE_SUPABASE_URL 
  : 'https://mock-project.supabase.co'

const supabaseAnonKey = hasValidCredentials 
  ? import.meta.env.VITE_SUPABASE_ANON_KEY 
  : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vY2siLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0OTI3MDAwMCwiZXhwIjoxOTY0ODQ2MDAwfQ.mock-key-for-development'

// For development with mock data
// const isMockMode = !hasValidCredentials // Reserved for future mock mode implementation

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Database types
export interface Database {
  public: {
    Tables: {
      stores: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      users: {
        Row: {
          id: string
          store_id: string
          role: string
          created_at: string
        }
        Insert: {
          id: string
          store_id: string
          role?: string
          created_at?: string
        }
        Update: {
          id?: string
          store_id?: string
          role?: string
          created_at?: string
        }
      }
      omega_daily: {
        Row: {
          id: string
          store_id: string
          business_date: string
          net_sales: number
          last_year_sales: number
          comp_net_sales: number
          labor_hours: number
          ideal_labor_hours: number
          labor_hours_diff: number
          labor_percentage: number
          food_variance_cost: number
          food_variance_percentage: number
          waste_amount: number
          waste_percentage: number
          breakfast_sales: number
          night_sales: number
          created_at: string
        }
        Insert: {
          id?: string
          store_id: string
          business_date: string
          net_sales: number
          last_year_sales: number
          labor_hours: number
          ideal_labor_hours: number
          labor_percentage: number
          food_variance_cost: number
          waste_amount: number
          breakfast_sales: number
          night_sales: number
          created_at?: string
        }
        Update: {
          id?: string
          store_id?: string
          business_date?: string
          net_sales?: number
          last_year_sales?: number
          labor_hours?: number
          ideal_labor_hours?: number
          labor_percentage?: number
          food_variance_cost?: number
          waste_amount?: number
          breakfast_sales?: number
          night_sales?: number
          created_at?: string
        }
      }
      interviews: {
        Row: {
          id: string
          store_id: string
          candidate_name: string
          phone: string | null
          email: string | null
          position: string | null
          interview_date: string
          interview_time: string
          status: 'SCHEDULED' | 'COMPLETED' | 'NO_SHOW' | 'HIRED' | 'REJECTED'
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          store_id: string
          candidate_name: string
          phone?: string | null
          email?: string | null
          position?: string | null
          interview_date: string
          interview_time: string
          status?: 'SCHEDULED' | 'COMPLETED' | 'NO_SHOW' | 'HIRED' | 'REJECTED'
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          store_id?: string
          candidate_name?: string
          phone?: string | null
          email?: string | null
          position?: string | null
          interview_date?: string
          interview_time?: string
          status?: 'SCHEDULED' | 'COMPLETED' | 'NO_SHOW' | 'HIRED' | 'REJECTED'
          notes?: string | null
          created_at?: string
        }
      }
      hires: {
        Row: {
          id: string
          store_id: string
          interview_id: string
          documents_received: boolean
          documents_folder: string | null
          onboarding_sent_date: string | null
          onboarding_completed_date: string | null
          manager_reviewed_date: string | null
          entered_in_system_date: string | null
          fingerprint_scheduled_date: string | null
          first_day: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          store_id: string
          interview_id: string
          documents_received?: boolean
          documents_folder?: string | null
          onboarding_sent_date?: string | null
          onboarding_completed_date?: string | null
          manager_reviewed_date?: string | null
          entered_in_system_date?: string | null
          fingerprint_scheduled_date?: string | null
          first_day?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          store_id?: string
          interview_id?: string
          documents_received?: boolean
          documents_folder?: string | null
          onboarding_sent_date?: string | null
          onboarding_completed_date?: string | null
          manager_reviewed_date?: string | null
          entered_in_system_date?: string | null
          fingerprint_scheduled_date?: string | null
          first_day?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      smg_entries: {
        Row: {
          id: string
          store_id: string
          entry_date: string
          accuracy_of_order: number | null
          zone_of_defection: number | null
          customer_computers: number | null
          taste_of_food: number | null
          osat: number | null
          created_at: string
        }
        Insert: {
          id?: string
          store_id: string
          entry_date: string
          accuracy_of_order?: number | null
          zone_of_defection?: number | null
          customer_computers?: number | null
          taste_of_food?: number | null
          osat?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          store_id?: string
          entry_date?: string
          accuracy_of_order?: number | null
          zone_of_defection?: number | null
          customer_computers?: number | null
          taste_of_food?: number | null
          osat?: number | null
          created_at?: string
        }
      }
    }
    Views: {
      smg_monthly: {
        Row: {
          store_id: string
          month_start: string
          avg_accuracy_of_order: number | null
          avg_zone_of_defection: number | null
          avg_customer_computers: number | null
          avg_taste_of_food: number | null
          avg_osat: number | null
          total_entries: number
        }
      }
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
export type Views<T extends keyof Database['public']['Views']> = Database['public']['Views'][T]['Row']
