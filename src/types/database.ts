export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      reminders: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          event_type: string;
          relation: string | null;
          event_date: string;
          reminder_time: string;
          is_recurring: boolean;
          recurrence_type: string | null;
          notes: string | null;
          email_sent: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          event_type: string;
          relation?: string | null;
          event_date: string;
          reminder_time: string;
          is_recurring?: boolean;
          recurrence_type?: string | null;
          notes?: string | null;
          email_sent?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          event_type?: string;
          relation?: string | null;
          event_date?: string;
          reminder_time?: string;
          is_recurring?: boolean;
          recurrence_type?: string | null;
          notes?: string | null;
          email_sent?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
