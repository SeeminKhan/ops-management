export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'outlet_staff' | 'operations_manager';
export type IssueCategory = 'maintenance' | 'equipment' | 'inventory' | 'quality' | 'other';
export type IssuePriority = 'low' | 'medium' | 'high';
export type IssueStatus = 'open' | 'in_progress' | 'resolved';
export type ActivityType = 'created' | 'status_changed' | 'priority_changed' | 'assigned' | 'unassigned' | 
                          'due_date_changed' | 'resolution_added' | 'resolution_updated' | 
                          'attachment_added' | 'attachment_removed';
export type NotificationType = 'high_priority_issue' | 'issue_assigned' | 'issue_resolved' | 
                               'issue_overdue' | 'issue_updated';

export interface Database {
  public: {
    Tables: {
      outlets: {
        Row: {
          id: string;
          name: string;
          location: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          location?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          location?: string | null;
          created_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          full_name: string;
          role: UserRole;
          outlet_id: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          role: UserRole;
          outlet_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          role?: UserRole;
          outlet_id?: string | null;
          created_at?: string;
        };
      };
      issues: {
        Row: {
          id: string;
          title: string;
          description: string;
          category: IssueCategory;
          priority: IssuePriority;
          status: IssueStatus;
          outlet_id: string;
          reported_by: string;
          assigned_to: string | null;
          resolution_note: string | null;
          due_date: string | null;
          resolved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          category: IssueCategory;
          priority: IssuePriority;
          status?: IssueStatus;
          outlet_id: string;
          reported_by: string;
          assigned_to?: string | null;
          resolution_note?: string | null;
          due_date?: string | null;
          resolved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          category?: IssueCategory;
          priority?: IssuePriority;
          status?: IssueStatus;
          outlet_id?: string;
          reported_by?: string;
          assigned_to?: string | null;
          resolution_note?: string | null;
          due_date?: string | null;
          resolved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      issue_activity: {
        Row: {
          id: string;
          issue_id: string;
          actor_id: string | null;
          activity_type: ActivityType;
          old_value: string | null;
          new_value: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          issue_id: string;
          actor_id?: string | null;
          activity_type: ActivityType;
          old_value?: string | null;
          new_value?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          issue_id?: string;
          actor_id?: string | null;
          activity_type?: ActivityType;
          old_value?: string | null;
          new_value?: string | null;
          created_at?: string;
        };
      };
      issue_attachments: {
        Row: {
          id: string;
          issue_id: string;
          uploaded_by: string;
          file_name: string;
          file_path: string;
          file_size: number;
          content_type: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          issue_id: string;
          uploaded_by: string;
          file_name: string;
          file_path: string;
          file_size: number;
          content_type: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          issue_id?: string;
          uploaded_by?: string;
          file_name?: string;
          file_path?: string;
          file_size?: number;
          content_type?: string;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          recipient_id: string;
          issue_id: string | null;
          notification_type: NotificationType;
          title: string;
          message: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          recipient_id: string;
          issue_id?: string | null;
          notification_type: NotificationType;
          title: string;
          message: string;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          recipient_id?: string;
          issue_id?: string | null;
          notification_type?: NotificationType;
          title?: string;
          message?: string;
          is_read?: boolean;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_unread_notification_count: {
        Args: { user_id: string };
        Returns: number;
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
