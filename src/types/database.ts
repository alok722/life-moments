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
          event_month: number;
          event_day: number;
          reminder_offset: string;
          recurrence_type: string;
          notes: string | null;
          email_sent: boolean;
          next_reminder_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          event_type: string;
          relation?: string | null;
          event_month: number;
          event_day: number;
          reminder_offset: string;
          recurrence_type: string;
          notes?: string | null;
          email_sent?: boolean;
          next_reminder_at: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          event_type?: string;
          relation?: string | null;
          event_month?: number;
          event_day?: number;
          reminder_offset?: string;
          recurrence_type?: string;
          notes?: string | null;
          email_sent?: boolean;
          next_reminder_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      notification_recipients: {
        Row: {
          id: string;
          user_id: string;
          email: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          email: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          email?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
