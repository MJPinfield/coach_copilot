
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {

  "public": {
          Tables: {
            "adaptation_proposals": {
                  Row: {
                    "client_id": string,"conversation_id": string | null,"created_at": string,"id": string,"reason": string,"status": string
                  }
                  Insert: {
                    "client_id": string,"conversation_id"?: string | null,"created_at"?: string,"id"?: string,"reason": string,"status"?: string
                  }
                  Update: {
                    "client_id"?: string,"conversation_id"?: string | null,"created_at"?: string,"id"?: string,"reason"?: string,"status"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "adaptation_proposals_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "adaptation_proposals_conversation_id_client_id_fkey"
      columns: ["conversation_id","client_id"]
isOneToOne: false
      referencedRelation: "conversations"
      referencedColumns: ["id","client_id"]
    }
                  ]
                },"coach_clients": {
                  Row: {
                    "client_id": string,"coach_id": string,"created_at": string,"id": string,"status": string
                  }
                  Insert: {
                    "client_id": string,"coach_id": string,"created_at"?: string,"id"?: string,"status"?: string
                  }
                  Update: {
                    "client_id"?: string,"coach_id"?: string,"created_at"?: string,"id"?: string,"status"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "coach_clients_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "coach_clients_coach_id_fkey"
      columns: ["coach_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"conversations": {
                  Row: {
                    "client_id": string,"created_at": string,"id": string,"title": string
                  }
                  Insert: {
                    "client_id": string,"created_at"?: string,"id"?: string,"title"?: string
                  }
                  Update: {
                    "client_id"?: string,"created_at"?: string,"id"?: string,"title"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "conversations_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"exercise_instructions": {
                  Row: {
                    "exercise_id": string,"locale": string,"source_revision": string | null,"steps": (string)[],"text": string
                  }
                  Insert: {
                    "exercise_id": string,"locale": string,"source_revision"?: string | null,"steps"?: (string)[],"text": string
                  }
                  Update: {
                    "exercise_id"?: string,"locale"?: string,"source_revision"?: string | null,"steps"?: (string)[],"text"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "exercise_instructions_exercise_id_fkey"
      columns: ["exercise_id"]
isOneToOne: false
      referencedRelation: "exercises"
      referencedColumns: ["id"]
    }
                  ]
                },"exercise_media": {
                  Row: {
                    "asset_url": string | null,"attribution": string,"exercise_id": string,"height": number | null,"id": string,"kind": string,"rights_reference": string | null,"source_media_id": string | null,"source_path": string | null,"source_revision": string | null,"width": number | null
                  }
                  Insert: {
                    "asset_url"?: string | null,"attribution": string,"exercise_id": string,"height"?: number | null,"id"?: string,"kind": string,"rights_reference"?: string | null,"source_media_id"?: string | null,"source_path"?: string | null,"source_revision"?: string | null,"width"?: number | null
                  }
                  Update: {
                    "asset_url"?: string | null,"attribution"?: string,"exercise_id"?: string,"height"?: number | null,"id"?: string,"kind"?: string,"rights_reference"?: string | null,"source_media_id"?: string | null,"source_path"?: string | null,"source_revision"?: string | null,"width"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "exercise_media_exercise_id_fkey"
      columns: ["exercise_id"]
isOneToOne: false
      referencedRelation: "exercises"
      referencedColumns: ["id"]
    }
                  ]
                },"exercise_prescriptions": {
                  Row: {
                    "block_id": string,"coach_notes": string,"display_name": string,"exercise_id": string | null,"id": string,"position": number,"session_id": string
                  }
                  Insert: {
                    "block_id": string,"coach_notes"?: string,"display_name": string,"exercise_id"?: string | null,"id"?: string,"position": number,"session_id": string
                  }
                  Update: {
                    "block_id"?: string,"coach_notes"?: string,"display_name"?: string,"exercise_id"?: string | null,"id"?: string,"position"?: number,"session_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "exercise_prescriptions_exercise_id_fkey"
      columns: ["exercise_id"]
isOneToOne: false
      referencedRelation: "exercises"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "exercise_prescriptions_session_id_block_id_fkey"
      columns: ["session_id","block_id"]
isOneToOne: false
      referencedRelation: "session_blocks"
      referencedColumns: ["session_id","id"]
    },{
      foreignKeyName: "exercise_prescriptions_session_id_fkey"
      columns: ["session_id"]
isOneToOne: false
      referencedRelation: "sessions"
      referencedColumns: ["id"]
    }
                  ]
                },"exercises": {
                  Row: {
                    "body_part": string | null,"equipment": string | null,"external_id": string | null,"id": string,"muscle_group": string | null,"name": string,"owner_coach_id": string | null,"retired_at": string | null,"secondary_muscles": (string)[],"source": string,"source_created_at": string | null,"source_revision": string | null,"target": string | null
                  }
                  Insert: {
                    "body_part"?: string | null,"equipment"?: string | null,"external_id"?: string | null,"id"?: string,"muscle_group"?: string | null,"name": string,"owner_coach_id"?: string | null,"retired_at"?: string | null,"secondary_muscles"?: (string)[],"source": string,"source_created_at"?: string | null,"source_revision"?: string | null,"target"?: string | null
                  }
                  Update: {
                    "body_part"?: string | null,"equipment"?: string | null,"external_id"?: string | null,"id"?: string,"muscle_group"?: string | null,"name"?: string,"owner_coach_id"?: string | null,"retired_at"?: string | null,"secondary_muscles"?: (string)[],"source"?: string,"source_created_at"?: string | null,"source_revision"?: string | null,"target"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "exercises_owner_coach_id_fkey"
      columns: ["owner_coach_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"logged_sets": {
                  Row: {
                    "completed": boolean,"id": string,"load_kg": number | null,"position": number,"reps": number | null,"rir": number | null,"workout_exercise_id": string
                  }
                  Insert: {
                    "completed"?: boolean,"id"?: string,"load_kg"?: number | null,"position": number,"reps"?: number | null,"rir"?: number | null,"workout_exercise_id": string
                  }
                  Update: {
                    "completed"?: boolean,"id"?: string,"load_kg"?: number | null,"position"?: number,"reps"?: number | null,"rir"?: number | null,"workout_exercise_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "logged_sets_workout_exercise_id_fkey"
      columns: ["workout_exercise_id"]
isOneToOne: false
      referencedRelation: "workout_exercises"
      referencedColumns: ["id"]
    }
                  ]
                },"messages": {
                  Row: {
                    "content": string,"conversation_id": string,"created_at": string,"id": string,"role": string
                  }
                  Insert: {
                    "content": string,"conversation_id": string,"created_at"?: string,"id"?: string,"role": string
                  }
                  Update: {
                    "content"?: string,"conversation_id"?: string,"created_at"?: string,"id"?: string,"role"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "messages_conversation_id_fkey"
      columns: ["conversation_id"]
isOneToOne: false
      referencedRelation: "conversations"
      referencedColumns: ["id"]
    }
                  ]
                },"prescribed_sets": {
                  Row: {
                    "id": string,"load_kg": number | null,"notes": string,"position": number,"prescription_id": string,"reps_max": number | null,"reps_min": number | null,"rest_seconds": number | null,"rir": number | null
                  }
                  Insert: {
                    "id"?: string,"load_kg"?: number | null,"notes"?: string,"position": number,"prescription_id": string,"reps_max"?: number | null,"reps_min"?: number | null,"rest_seconds"?: number | null,"rir"?: number | null
                  }
                  Update: {
                    "id"?: string,"load_kg"?: number | null,"notes"?: string,"position"?: number,"prescription_id"?: string,"reps_max"?: number | null,"reps_min"?: number | null,"rest_seconds"?: number | null,"rir"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "prescribed_sets_prescription_id_fkey"
      columns: ["prescription_id"]
isOneToOne: false
      referencedRelation: "exercise_prescriptions"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "created_at": string,"display_name": string,"id": string,"role": string
                  }
                  Insert: {
                    "created_at"?: string,"display_name"?: string,"id": string,"role"?: string
                  }
                  Update: {
                    "created_at"?: string,"display_name"?: string,"id"?: string,"role"?: string
                  }
                  Relationships: [

                  ]
                },"programme_weeks": {
                  Row: {
                    "id": string,"name": string,"notes": string,"position": number,"programme_id": string
                  }
                  Insert: {
                    "id"?: string,"name": string,"notes"?: string,"position": number,"programme_id": string
                  }
                  Update: {
                    "id"?: string,"name"?: string,"notes"?: string,"position"?: number,"programme_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "programme_weeks_programme_id_fkey"
      columns: ["programme_id"]
isOneToOne: false
      referencedRelation: "programmes"
      referencedColumns: ["id"]
    }
                  ]
                },"programmes": {
                  Row: {
                    "created_at": string,"goal": string,"id": string,"name": string,"relationship_id": string,"revision": number,"status": string
                  }
                  Insert: {
                    "created_at"?: string,"goal"?: string,"id"?: string,"name": string,"relationship_id": string,"revision"?: number,"status"?: string
                  }
                  Update: {
                    "created_at"?: string,"goal"?: string,"id"?: string,"name"?: string,"relationship_id"?: string,"revision"?: number,"status"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "programmes_relationship_id_fkey"
      columns: ["relationship_id"]
isOneToOne: false
      referencedRelation: "coach_clients"
      referencedColumns: ["id"]
    }
                  ]
                },"proposal_exercise_sources": {
                  Row: {
                    "prescription_id": string,"proposed_exercise_id": string
                  }
                  Insert: {
                    "prescription_id": string,"proposed_exercise_id": string
                  }
                  Update: {
                    "prescription_id"?: string,"proposed_exercise_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "proposal_exercise_sources_prescription_id_fkey"
      columns: ["prescription_id"]
isOneToOne: false
      referencedRelation: "exercise_prescriptions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "proposal_exercise_sources_proposed_exercise_id_fkey"
      columns: ["proposed_exercise_id"]
isOneToOne: false
      referencedRelation: "proposed_exercises"
      referencedColumns: ["id"]
    }
                  ]
                },"proposal_sessions": {
                  Row: {
                    "programme_revision": number,"proposal_id": string,"session_id": string
                  }
                  Insert: {
                    "programme_revision": number,"proposal_id": string,"session_id": string
                  }
                  Update: {
                    "programme_revision"?: number,"proposal_id"?: string,"session_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "proposal_sessions_proposal_id_fkey"
      columns: ["proposal_id"]
isOneToOne: false
      referencedRelation: "adaptation_proposals"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "proposal_sessions_session_id_fkey"
      columns: ["session_id"]
isOneToOne: false
      referencedRelation: "sessions"
      referencedColumns: ["id"]
    }
                  ]
                },"proposed_blocks": {
                  Row: {
                    "id": string,"kind": string,"label": string,"position": number,"proposal_id": string,"rest_after_round_seconds": number | null
                  }
                  Insert: {
                    "id"?: string,"kind": string,"label"?: string,"position": number,"proposal_id": string,"rest_after_round_seconds"?: number | null
                  }
                  Update: {
                    "id"?: string,"kind"?: string,"label"?: string,"position"?: number,"proposal_id"?: string,"rest_after_round_seconds"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "proposed_blocks_proposal_id_fkey"
      columns: ["proposal_id"]
isOneToOne: false
      referencedRelation: "adaptation_proposals"
      referencedColumns: ["id"]
    }
                  ]
                },"proposed_exercises": {
                  Row: {
                    "block_id": string,"display_name": string,"exercise_id": string | null,"id": string,"notes": string,"position": number,"proposal_id": string,"targets": NonNullable<Json>
                  }
                  Insert: {
                    "block_id": string,"display_name": string,"exercise_id"?: string | null,"id"?: string,"notes"?: string,"position": number,"proposal_id": string,"targets": NonNullable<Json>
                  }
                  Update: {
                    "block_id"?: string,"display_name"?: string,"exercise_id"?: string | null,"id"?: string,"notes"?: string,"position"?: number,"proposal_id"?: string,"targets"?: NonNullable<Json>
                  }
                  Relationships: [
                    {
      foreignKeyName: "proposed_exercises_exercise_id_fkey"
      columns: ["exercise_id"]
isOneToOne: false
      referencedRelation: "exercises"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "proposed_exercises_proposal_id_block_id_fkey"
      columns: ["proposal_id","block_id"]
isOneToOne: false
      referencedRelation: "proposed_blocks"
      referencedColumns: ["proposal_id","id"]
    },{
      foreignKeyName: "proposed_exercises_proposal_id_fkey"
      columns: ["proposal_id"]
isOneToOne: false
      referencedRelation: "adaptation_proposals"
      referencedColumns: ["id"]
    }
                  ]
                },"session_blocks": {
                  Row: {
                    "id": string,"kind": string,"label": string,"position": number,"rest_after_round_seconds": number | null,"session_id": string
                  }
                  Insert: {
                    "id"?: string,"kind": string,"label"?: string,"position": number,"rest_after_round_seconds"?: number | null,"session_id": string
                  }
                  Update: {
                    "id"?: string,"kind"?: string,"label"?: string,"position"?: number,"rest_after_round_seconds"?: number | null,"session_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "session_blocks_session_id_fkey"
      columns: ["session_id"]
isOneToOne: false
      referencedRelation: "sessions"
      referencedColumns: ["id"]
    }
                  ]
                },"sessions": {
                  Row: {
                    "id": string,"name": string,"notes": string,"position": number,"week_id": string
                  }
                  Insert: {
                    "id"?: string,"name": string,"notes"?: string,"position": number,"week_id": string
                  }
                  Update: {
                    "id"?: string,"name"?: string,"notes"?: string,"position"?: number,"week_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "sessions_week_id_fkey"
      columns: ["week_id"]
isOneToOne: false
      referencedRelation: "programme_weeks"
      referencedColumns: ["id"]
    }
                  ]
                },"workout_blocks": {
                  Row: {
                    "applied_snapshot": NonNullable<Json>,"id": string,"kind": string,"label": string,"position": number,"rest_after_round_seconds": number | null,"workout_id": string
                  }
                  Insert: {
                    "applied_snapshot": NonNullable<Json>,"id"?: string,"kind": string,"label"?: string,"position": number,"rest_after_round_seconds"?: number | null,"workout_id": string
                  }
                  Update: {
                    "applied_snapshot"?: NonNullable<Json>,"id"?: string,"kind"?: string,"label"?: string,"position"?: number,"rest_after_round_seconds"?: number | null,"workout_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "workout_blocks_workout_id_fkey"
      columns: ["workout_id"]
isOneToOne: false
      referencedRelation: "workouts"
      referencedColumns: ["id"]
    }
                  ]
                },"workout_exercise_sources": {
                  Row: {
                    "prescription_id": string,"workout_exercise_id": string
                  }
                  Insert: {
                    "prescription_id": string,"workout_exercise_id": string
                  }
                  Update: {
                    "prescription_id"?: string,"workout_exercise_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "workout_exercise_sources_prescription_id_fkey"
      columns: ["prescription_id"]
isOneToOne: false
      referencedRelation: "exercise_prescriptions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "workout_exercise_sources_workout_exercise_id_fkey"
      columns: ["workout_exercise_id"]
isOneToOne: false
      referencedRelation: "workout_exercises"
      referencedColumns: ["id"]
    }
                  ]
                },"workout_exercises": {
                  Row: {
                    "applied_snapshot": NonNullable<Json>,"block_id": string,"exercise_id": string | null,"id": string,"performed_name": string,"position": number,"workout_id": string
                  }
                  Insert: {
                    "applied_snapshot": NonNullable<Json>,"block_id": string,"exercise_id"?: string | null,"id"?: string,"performed_name": string,"position": number,"workout_id": string
                  }
                  Update: {
                    "applied_snapshot"?: NonNullable<Json>,"block_id"?: string,"exercise_id"?: string | null,"id"?: string,"performed_name"?: string,"position"?: number,"workout_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "workout_exercises_exercise_id_fkey"
      columns: ["exercise_id"]
isOneToOne: false
      referencedRelation: "exercises"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "workout_exercises_workout_id_block_id_fkey"
      columns: ["workout_id","block_id"]
isOneToOne: false
      referencedRelation: "workout_blocks"
      referencedColumns: ["workout_id","id"]
    },{
      foreignKeyName: "workout_exercises_workout_id_fkey"
      columns: ["workout_id"]
isOneToOne: false
      referencedRelation: "workouts"
      referencedColumns: ["id"]
    }
                  ]
                },"workout_feedback": {
                  Row: {
                    "energy": string | null,"notes": string,"pain_location": string | null,"pain_reported": boolean | null,"pain_severity": number | null,"sleep_hours": number | null,"workout_id": string
                  }
                  Insert: {
                    "energy"?: string | null,"notes"?: string,"pain_location"?: string | null,"pain_reported"?: boolean | null,"pain_severity"?: number | null,"sleep_hours"?: number | null,"workout_id": string
                  }
                  Update: {
                    "energy"?: string | null,"notes"?: string,"pain_location"?: string | null,"pain_reported"?: boolean | null,"pain_severity"?: number | null,"sleep_hours"?: number | null,"workout_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "workout_feedback_workout_id_fkey"
      columns: ["workout_id"]
isOneToOne: true
      referencedRelation: "workouts"
      referencedColumns: ["id"]
    }
                  ]
                },"workout_sources": {
                  Row: {
                    "programme_revision": number,"session_id": string,"workout_id": string
                  }
                  Insert: {
                    "programme_revision": number,"session_id": string,"workout_id": string
                  }
                  Update: {
                    "programme_revision"?: number,"session_id"?: string,"workout_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "workout_sources_session_id_fkey"
      columns: ["session_id"]
isOneToOne: false
      referencedRelation: "sessions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "workout_sources_workout_id_fkey"
      columns: ["workout_id"]
isOneToOne: false
      referencedRelation: "workouts"
      referencedColumns: ["id"]
    }
                  ]
                },"workouts": {
                  Row: {
                    "adaptation_reason": string | null,"applied_by": string | null,"client_id": string,"completed_at": string | null,"id": string,"original_snapshot": NonNullable<Json>,"proposal_id": string | null,"readiness": NonNullable<Json>,"started_at": string,"status": string
                  }
                  Insert: {
                    "adaptation_reason"?: string | null,"applied_by"?: string | null,"client_id": string,"completed_at"?: string | null,"id": string,"original_snapshot": NonNullable<Json>,"proposal_id"?: string | null,"readiness"?: NonNullable<Json>,"started_at"?: string,"status"?: string
                  }
                  Update: {
                    "adaptation_reason"?: string | null,"applied_by"?: string | null,"client_id"?: string,"completed_at"?: string | null,"id"?: string,"original_snapshot"?: NonNullable<Json>,"proposal_id"?: string | null,"readiness"?: NonNullable<Json>,"started_at"?: string,"status"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "workouts_applied_by_fkey"
      columns: ["applied_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "workouts_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "workouts_proposal_id_fkey"
      columns: ["proposal_id"]
isOneToOne: true
      referencedRelation: "adaptation_proposals"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "abandon_workout":
{ Args: { "workout_id": string }; Returns: undefined
                           },
"accept_invitation":
{ Args: { "relationship_id": string }; Returns: {
              "client_id": string,
"coach_id": string,
"created_at": string,
"id": string,
"status": string
            }
                          SetofOptions: {
        from: "*"
        to: "coach_clients"
        isOneToOne: true
        isSetofReturn: false
      } },
"add_workout_exercise":
{ Args: { "display_name": string,"exercise_id": string,"workout_id": string }; Returns: {
              "applied_snapshot": NonNullable<Json>,
"block_id": string,
"exercise_id": string | null,
"id": string,
"performed_name": string,
"position": number,
"workout_id": string
            }
                          SetofOptions: {
        from: "*"
        to: "workout_exercises"
        isOneToOne: true
        isSetofReturn: false
      } },
"create_adaptation_proposal":
{ Args: { "blocks"?: Json,"client_id": string,"conversation_id"?: string,"exercises": Json,"reason": string,"session_ids": (string)[] }; Returns: {
              "client_id": string,
"conversation_id": string | null,
"created_at": string,
"id": string,
"reason": string,
"status": string
            }
                          SetofOptions: {
        from: "*"
        to: "adaptation_proposals"
        isOneToOne: true
        isSetofReturn: false
      } },
"deactivate_relationship":
{ Args: { "relationship_id": string }; Returns: undefined
                           },
"reject_proposal":
{ Args: { "proposal_id": string }; Returns: undefined
                           },
"save_workout":
{ Args: { "complete"?: boolean,"exercises": Json,"feedback"?: Json,"workout_id": string }; Returns: {
              "adaptation_reason": string | null,
"applied_by": string | null,
"client_id": string,
"completed_at": string | null,
"id": string,
"original_snapshot": NonNullable<Json>,
"proposal_id": string | null,
"readiness": NonNullable<Json>,
"started_at": string,
"status": string
            }
                          SetofOptions: {
        from: "*"
        to: "workouts"
        isOneToOne: true
        isSetofReturn: false
      } },
"start_workout":
{ Args: { "proposal_id"?: string,"readiness"?: Json,"session_ids": (string)[],"workout_id": string }; Returns: {
              "adaptation_reason": string | null,
"applied_by": string | null,
"client_id": string,
"completed_at": string | null,
"id": string,
"original_snapshot": NonNullable<Json>,
"proposal_id": string | null,
"readiness": NonNullable<Json>,
"started_at": string,
"status": string
            }
                          SetofOptions: {
        from: "*"
        to: "workouts"
        isOneToOne: true
        isSetofReturn: false
      } }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {

          }
        }
} as const
