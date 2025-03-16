// skill_tree_constants.js - Constants used throughout the skill tree system

/**
 * Possible states for skill nodes
 */
export const SKILL_STATES = Object.freeze({
  LOCKED: 'locked',       // Cannot be unlocked yet (prerequisites not met)
  UNLOCKABLE: 'unlockable', // Can be unlocked (prerequisites met, reputation cost affordable)
  UNLOCKED: 'unlocked',   // Unlocked but not active in current run
  ACTIVE: 'active'        // Unlocked and active in current run
});

/**
 * Node sizes with descriptive keys
 */
export const NODE_SIZES = Object.freeze({
  CORE: 'core',         // Largest nodes (core skills)
  MAJOR: 'major',       // Medium-large nodes (important skills)
  MINOR: 'minor',       // Standard nodes (most skills)
  CONNECTOR: 'connector' // Small nodes (utility/connection skills)
});

/**
 * Effect types used in the skill system
 */
export const EFFECT_TYPES = Object.freeze({
  // Insight-related effects
  INSIGHT_GAIN_FLAT: 'insight_gain_flat',
  INSIGHT_GAIN_MULTIPLIER: 'insight_gain_multiplier',
  CRITICAL_INSIGHT_MULTIPLIER: 'critical_insight_multiplier',
  FAILURE_CONVERSION: 'failure_conversion',
  
  // Patient-related effects
  PATIENT_OUTCOME_MULTIPLIER: 'patient_outcome_multiplier',
  REVEAL_PATIENT_PARAMETER: 'reveal_patient_parameter',
  ADVERSE_EVENT_REDUCTION: 'adverse_event_reduction',
  
  // Equipment-related effects
  EQUIPMENT_COST_REDUCTION: 'equipment_cost_reduction',
  CALIBRATION_SUCCESS: 'calibration_success',
  MALFUNCTION_PENALTY_REDUCTION: 'malfunction_penalty_reduction',
  REPAIR_COST_REDUCTION: 'repair_cost_reduction',
  REVEAL_EQUIPMENT_INTERNALS: 'reveal_equipment_internals',
  MULTI_EQUIPMENT_BONUS: 'multi_equipment_bonus',
  TEMPORARY_EQUIPMENT_FIX: 'temporary_equipment_fix',
  
  // General gameplay effects
  REVEAL_PARAMETER: 'reveal_parameter',
  AUTO_SOLVE_CHANCE: 'auto_solve_chance',
  TIME_COST_REDUCTION: 'time_cost_reduction',
  CONSULT_HELP: 'consult_help',
  PREVIEW_OUTCOMES: 'preview_outcomes',
  UNLOCK_DIALOGUE_OPTIONS: 'unlock_dialogue_options',
  UNLOCK_EXPERIMENTAL_TREATMENTS: 'unlock_experimental_treatments',
  
  // Run-related effects
  START_WITH_ITEMS: 'start_with_items',
  FUNDING_MULTIPLIER: 'funding_multiplier',
  FAVOR_USAGE: 'favor_usage',
  
  // Specialization effects
  INSIGHT_TO_REPUTATION_CONVERSION: 'insight_to_reputation_conversion',
  CLINICAL_TO_REPUTATION_CONVERSION: 'clinical_to_reputation_conversion',
  MULTI_SPECIALIZATION_BONUS: 'multi_specialization_bonus',
  SPECIALIZATION_SYNERGY: 'specialization_synergy',
  
  // Special effects
  COMPANION: 'companion',
  RECALL_SIMILAR_QUESTIONS: 'recall_similar_questions',
  AUTO_DETECT_QA_ISSUES: 'auto_detect_qa_issues',
  AUTO_DETECT_RADIATION_ANOMALIES: 'auto_detect_radiation_anomalies'
});

/**
 * Event types for the skill tree system
 */
export const SKILL_TREE_EVENTS = Object.freeze({
  INITIALIZED: 'skillTreeInitialized',
  SKILL_UNLOCKED: 'skillUnlocked',
  SKILL_ACTIVATED: 'skillActivated',
  SKILL_DEACTIVATED: 'skillDeactivated',
  SPECIALIZATION_UPDATED: 'specializationUpdated',
  REPUTATION_CHANGED: 'reputationChanged',
  SKILL_POINTS_CHANGED: 'skillPointsChanged',
  SKILL_STATES_UPDATED: 'skillStatesUpdated',
  SKILLS_RESET: 'skillsReset',
  ERROR: 'skillTreeError'
});

/**
 * Icon types available for skill nodes
 */
export const ICON_TYPES = Object.freeze({
  ATOM: 'atom',
  BRAIN: 'brain',
  RADIATION: 'radiation',
  STAR: 'star',
  CHART: 'chart',
  BOOK: 'book',
  LIGHTBULB: 'lightbulb',
  EYE: 'eye',
  SHUFFLE: 'shuffle',
  HEART: 'heart',
  STETHOSCOPE: 'stethoscope',
  TARGET: 'target',
  MESSAGE: 'message',
  CLOCK: 'clock',
  USERS: 'users',
  SHIELD: 'shield',
  FILE_TEXT: 'file-text',
  TOOL: 'tool',
  CPU: 'cpu',
  SETTINGS: 'settings',
  CHECK_CIRCLE: 'check-circle',
  ZAP: 'zap',
  DOLLAR_SIGN: 'dollar-sign',
  LAYERS: 'layers',
  BOOK_OPEN: 'book-open',
  AWARD: 'award',
  FLASK: 'flask',
  USER_PLUS: 'user-plus',
  PRESENTATION: 'presentation',
  X_RAY: 'x-ray',
  ACTIVITY: 'activity',
  CLIPBOARD: 'clipboard',
  DATABASE: 'database',
  HELP: 'help' // Default icon
});

// For backward compatibility with existing code
window.SKILL_STATE = SKILL_STATES;
