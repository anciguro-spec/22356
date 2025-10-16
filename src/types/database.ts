export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'collector' | 'tester' | 'producer' | 'manufacturer';
export type Phase = 'collector' | 'tester' | 'producer' | 'manufacturer';
export type Status = 'pending' | 'approved' | 'rejected';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: UserRole;
          organization: string | null;
          wallet_address: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          role: UserRole;
          organization?: string | null;
          wallet_address?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          role?: UserRole;
          organization?: string | null;
          wallet_address?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          blockchain_id: number | null;
          name: string;
          batch_number: string;
          description: string | null;
          collector_id: string | null;
          current_phase: Phase;
          status: Status;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          blockchain_id?: number | null;
          name: string;
          batch_number: string;
          description?: string | null;
          collector_id?: string | null;
          current_phase?: Phase;
          status?: Status;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          blockchain_id?: number | null;
          name?: string;
          batch_number?: string;
          description?: string | null;
          collector_id?: string | null;
          current_phase?: Phase;
          status?: Status;
          created_at?: string;
          updated_at?: string;
        };
      };
      phase_records: {
        Row: {
          id: string;
          product_id: string | null;
          phase: Phase;
          handler_id: string | null;
          status: Status;
          notes: string | null;
          test_results: Json | null;
          ipfs_hash: string | null;
          blockchain_tx_hash: string | null;
          gps_latitude: number | null;
          gps_longitude: number | null;
          weather_data: Json | null;
          harvest_date: string | null;
          seed_crop_name: string | null;
          pesticide_used: boolean | null;
          pesticide_name: string | null;
          pesticide_quantity: string | null;
          price_per_unit: number | null;
          weight_total: number | null;
          total_price: number | null;
          qr_code_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id?: string | null;
          phase: Phase;
          handler_id?: string | null;
          status?: Status;
          notes?: string | null;
          test_results?: Json | null;
          ipfs_hash?: string | null;
          blockchain_tx_hash?: string | null;
          gps_latitude?: number | null;
          gps_longitude?: number | null;
          weather_data?: Json | null;
          harvest_date?: string | null;
          seed_crop_name?: string | null;
          pesticide_used?: boolean | null;
          pesticide_name?: string | null;
          pesticide_quantity?: string | null;
          price_per_unit?: number | null;
          weight_total?: number | null;
          total_price?: number | null;
          qr_code_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string | null;
          phase?: Phase;
          handler_id?: string | null;
          status?: Status;
          notes?: string | null;
          test_results?: Json | null;
          ipfs_hash?: string | null;
          blockchain_tx_hash?: string | null;
          gps_latitude?: number | null;
          gps_longitude?: number | null;
          weather_data?: Json | null;
          harvest_date?: string | null;
          seed_crop_name?: string | null;
          pesticide_used?: boolean | null;
          pesticide_name?: string | null;
          pesticide_quantity?: string | null;
          price_per_unit?: number | null;
          weight_total?: number | null;
          total_price?: number | null;
          qr_code_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      documents: {
        Row: {
          id: string;
          product_id: string | null;
          phase_record_id: string | null;
          file_name: string;
          file_type: string | null;
          ipfs_hash: string;
          uploaded_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id?: string | null;
          phase_record_id?: string | null;
          file_name: string;
          file_type?: string | null;
          ipfs_hash: string;
          uploaded_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string | null;
          phase_record_id?: string | null;
          file_name?: string;
          file_type?: string | null;
          ipfs_hash?: string;
          uploaded_by?: string | null;
          created_at?: string;
        };
      };
    };
  };
}
