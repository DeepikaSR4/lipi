import posthog from "posthog-js";

/**
 * Strongly typed wrapper for PostHog analytics based on Lipi Events CSV.
 * Call these functions to track specific events across the app.
 */
export const analytics = {
  // ─── Landing Page ───────────────────────────────────────────────────────────
  trackLandingPageViewed: (properties?: { source?: string; utm_source?: string; utm_campaign?: string; device_type?: string }) => {
    posthog.capture("landing_page_viewed", properties);
  },
  trackCtaClicked: (cta_name: string, section: string) => {
    posthog.capture("cta_clicked", { cta_name, section });
  },
  trackDemoClicked: (section: string) => {
    posthog.capture("demo_clicked", { section });
  },

  // ─── Authentication ─────────────────────────────────────────────────────────
  trackSignupStarted: (method: "email" | "google") => {
    posthog.capture("signup_started", { method });
  },
  trackSignupCompleted: (method: "email" | "google") => {
    posthog.capture("signup_completed", { method });
  },
  trackLoginCompleted: (method: "email" | "google") => {
    posthog.capture("login_completed", { method });
  },

  // ─── Onboarding ─────────────────────────────────────────────────────────────
  trackOnboardingStarted: (source: string) => {
    posthog.capture("onboarding_started", { source });
  },
  trackOnboardingCompleted: (onboarding_time_sec: number) => {
    posthog.capture("onboarding_completed", { onboarding_time_sec });
  },

  // ─── Dashboard & Project Setup ──────────────────────────────────────────────
  trackDashboardViewed: (font_count: number) => {
    posthog.capture("dashboard_viewed", { font_count });
  },
  trackCreateFontClicked: (source_location: string) => {
    posthog.capture("create_font_clicked", { source_location });
  },
  trackFontCreationStarted: (creation_method: "draw" | "upload") => {
    posthog.capture("font_creation_started", { creation_method });
  },
  trackFontNameAdded: (font_name: string) => {
    posthog.capture("font_name_added", { font_name });
  },
  trackFontCreationMethodSelected: (method: "draw" | "upload") => {
    posthog.capture("font_creation_method_selected", { method });
  },

  // ─── Workspace & Drawing ────────────────────────────────────────────────────
  trackFirstCharacterDrawn: (character: string) => {
    posthog.capture("first_character_drawn", { character });
  },
  trackCharacterCompleted: (character: string, progress_percent: number) => {
    posthog.capture("character_completed", { character, progress_percent });
  },
  trackCharacterSetProgress: (progress_percent: number) => {
    posthog.capture("character_set_progress", { progress_percent });
  },
  trackCanvasToolSelected: (tool_name: "Pen" | "Eraser" | "Undo" | "Redo") => {
    posthog.capture("canvas_tool_selected", { tool_name });
  },
  trackCanvasCleared: (character: string) => {
    posthog.capture("canvas_cleared", { character });
  },
  trackFontProjectSaved: (font_id: string) => {
    posthog.capture("font_project_saved", { font_id });
  },
  trackFontProjectReopened: (font_id: string) => {
    posthog.capture("font_project_reopened", { font_id });
  },

  // ─── Handwriting Upload & OCR (Future Features) ─────────────────────────────
  trackHandwritingUploadStarted: (file_type: string) => {
    posthog.capture("handwriting_upload_started", { file_type });
  },
  trackHandwritingUploadCompleted: (file_type: string, file_size_mb: number) => {
    posthog.capture("handwriting_upload_completed", { file_type, file_size_mb });
  },
  trackCharacterDetectionCompleted: (detected_count: number) => {
    posthog.capture("character_detection_completed", { detected_count });
  },
  trackCharacterDetectionCorrected: (corrections_count: number) => {
    posthog.capture("character_detection_corrected", { corrections_count });
  },
  trackAiCleanupStarted: (font_id: string) => {
    posthog.capture("ai_cleanup_started", { font_id });
  },
  trackAiCleanupCompleted: (cleanup_time_sec: number) => {
    posthog.capture("ai_cleanup_completed", { cleanup_time_sec });
  },

  // ─── Font Generation & Export ───────────────────────────────────────────────
  trackFontGenerationStarted: (method: "draw" | "upload") => {
    posthog.capture("font_generation_started", { method });
  },
  trackFontGenerationCompleted: (method: "draw" | "upload", generation_time_sec: number) => {
    posthog.capture("font_generation_completed", { method, generation_time_sec });
  },
  trackFontGenerationFailed: (error_reason: string) => {
    posthog.capture("font_generation_failed", { error_reason });
  },
  trackFontDownloadRequested: (format: "TTF" | "OTF") => {
    posthog.capture("font_download_requested", { format });
  },
  trackFontExportStarted: (format: "TTF" | "OTF") => {
    posthog.capture("font_export_started", { format });
  },
  trackFontExportCompleted: (format: "TTF" | "OTF", file_size_kb: number) => {
    posthog.capture("font_export_completed", { format, file_size_kb });
  },
  trackFontDownloaded: (format: "TTF" | "OTF") => {
    posthog.capture("font_downloaded", { format });
  },

  // ─── Preview & Font Management ──────────────────────────────────────────────
  trackPreviewOpened: (font_id: string) => {
    posthog.capture("preview_opened", { font_id });
  },
  trackPreviewTabChanged: (tab_name: string) => {
    posthog.capture("preview_tab_changed", { tab_name });
  },
  trackPreviewTextEntered: (text_length: number) => {
    posthog.capture("preview_text_entered", { text_length });
  },
  trackFontShared: (channel: string) => {
    posthog.capture("font_shared", { channel });
  },
  trackFontDeleted: (font_id: string) => {
    posthog.capture("font_deleted", { font_id });
  },
  trackFontDuplicated: (font_id: string) => {
    posthog.capture("font_duplicated", { font_id });
  },
  trackFontRenamed: (old_name: string, new_name: string) => {
    posthog.capture("font_renamed", { old_name, new_name });
  },

  // ─── Payments & Subscriptions (Future Features) ─────────────────────────────
  trackPremiumPageViewed: (source: string) => {
    posthog.capture("premium_page_viewed", { source });
  },
  trackUpgradeClicked: (source_location: string) => {
    posthog.capture("upgrade_clicked", { source_location });
  },
  trackCheckoutStarted: (plan_type: string) => {
    posthog.capture("checkout_started", { plan_type });
  },
  trackCheckoutCompleted: (plan_type: string, amount: number) => {
    posthog.capture("checkout_completed", { plan_type, amount });
  },
  trackSubscriptionStarted: (plan_type: string) => {
    posthog.capture("subscription_started", { plan_type });
  },
  trackSubscriptionCancelled: (plan_type: string) => {
    posthog.capture("subscription_cancelled", { plan_type });
  },

  // ─── Misc ───────────────────────────────────────────────────────────────────
  trackFeedbackSubmitted: (properties: { rating: number; nps: number | null; feedback: string; source: string }) => {
    posthog.capture("feedback_submitted", properties);
  },
  trackBugReportSubmitted: (category: string) => {
    posthog.capture("bug_report_submitted", { category });
  },
  trackSessionCompleted: (duration_sec: number, fonts_created: number) => {
    posthog.capture("session_completed", { duration_sec, fonts_created });
  },
};
