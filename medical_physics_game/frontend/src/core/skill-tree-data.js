// skill_tree_data.js - Core data structures for the skill tree system
import { NODE_SIZES, EFFECT_TYPES } from './skill_tree_constants.js';

/**
 * Core cluster nodes - replaces the single core_physics node
 * with a cluster of interconnected core skills
 */
export const CoreClusterNodes = Object.freeze({
  "radiation_physics": {
    "id": "radiation_physics",
    "name": "Radiation Physics",
    "specialization": "core",
    "tier": 0,
    "description": "Understanding of radiation behavior and interactions with matter.",
    "effects": [
      {
        "type": EFFECT_TYPES.INSIGHT_GAIN_FLAT,
        "value": 2,
        "condition": null
      }
    ],
    "position": {"x": 370, "y": 280},
    "connections": ["quantum_comprehension", "radiation_detection"],
    "cost": {
      "reputation": 0,
      "skill_points": 0
    },
    "visual": {
      "size": NODE_SIZES.MINOR,
      "icon": "zap"
    }
  },
  "medical_instrumentation": {
    "id": "medical_instrumentation",
    "name": "Medical Instrumentation",
    "specialization": "core",
    "tier": 0,
    "description": "Knowledge of medical imaging and therapy devices.",
    "effects": [
      {
        "type": EFFECT_TYPES.EQUIPMENT_COST_REDUCTION,
        "value": 0.1,
        "condition": null
      }
    ],
    "position": {"x": 430, "y": 280},
    "connections": ["calibration_expert", "machine_whisperer"],
    "cost": {
      "reputation": 0,
      "skill_points": 0
    },
    "visual": {
      "size": NODE_SIZES.MINOR,
      "icon": "tool"
    }
  },
  "patient_care": {
    "id": "patient_care",
    "name": "Patient Care",
    "specialization": "core",
    "tier": 0,
    "description": "Fundamentals of patient care and safety protocols.",
    "effects": [
      {
        "type": EFFECT_TYPES.PATIENT_OUTCOME_MULTIPLIER,
        "value": 1.1,
        "condition": null
      }
    ],
    "position": {"x": 370, "y": 320},
    "connections": ["bedside_manner", "diagnostic_intuition"],
    "cost": {
      "reputation": 0,
      "skill_points": 0
    },
    "visual": {
      "size": NODE_SIZES.MINOR,
      "icon": "heart"
    }
  },
  "medical_science": {
    "id": "medical_science",
    "name": "Medical Science",
    "specialization": "core",
    "tier": 0,
    "description": "Scientific principles underlying medical physics.",
    "effects": [
      {
        "type": EFFECT_TYPES.INSIGHT_GAIN_MULTIPLIER,
        "value": 1.05,
        "condition": null
      }
    ],
    "position": {"x": 430, "y": 320},
    "connections": ["literature_review", "scholarly_memory"],
    "cost": {
      "reputation": 0,
      "skill_points": 0
    },
    "visual": {
      "size": NODE_SIZES.MINOR,
      "icon": "book"
    }
  }
});

/**
 * Default specialization data
 * Used when creating fallback data or for reference
 */
export const DefaultSpecializations = Object.freeze({
  "core": {
    "id": "core",
    "name": "Core Competencies",
    "description": "Fundamental medical physics knowledge",
    "color": "#777777", // Grey color for core nodes
    "threshold": 4,
    "mastery_threshold": 4
  },
  "theory": {
    "id": "theory",
    "name": "Theory Specialist",
    "description": "Focus on physics principles and mathematical understanding",
    "color": "#4287f5", // Blue
    "threshold": 5,
    "mastery_threshold": 8
  },
  "clinical": {
    "id": "clinical",
    "name": "Clinical Expert", 
    "description": "Focus on patient care and treatment application",
    "color": "#42f575", // Green
    "threshold": 5,
    "mastery_threshold": 8
  },
  "technical": {
    "id": "technical",
    "name": "Technical Specialist",
    "description": "Focus on equipment operation and quality assurance",
    "color": "#f59142", // Orange
    "threshold": 5,
    "mastery_threshold": 8
  },
  "research": {
    "id": "research",
    "name": "Research Scientist",
    "description": "Focus on advancement and innovation in the field",
    "color": "#a142f5", // Purple
    "threshold": 5,
    "mastery_threshold": 8
  }
});

/**
 * Node templates for creating new nodes
 * Provides standardized starting points for different node types
 */
export const NodeTemplates = Object.freeze({
  "insight_boost": {
    "name": "Insight Boost",
    "description": "Increases insight gain from all sources",
    "effects": [
      {
        "type": EFFECT_TYPES.INSIGHT_GAIN_MULTIPLIER,
        "value": 1.15,
        "condition": null
      }
    ],
    "visual": {
      "size": NODE_SIZES.MINOR,
      "icon": "brain"
    }
  },
  "clinical_boost": {
    "name": "Clinical Expertise",
    "description": "Improves patient outcomes",
    "effects": [
      {
        "type": EFFECT_TYPES.PATIENT_OUTCOME_MULTIPLIER,
        "value": 1.2,
        "condition": null
      }
    ],
    "visual": {
      "size": NODE_SIZES.MINOR,
      "icon": "heart"
    }
  },
  "technical_boost": {
    "name": "Technical Mastery",
    "description": "Improves equipment performance",
    "effects": [
      {
        "type": EFFECT_TYPES.EQUIPMENT_COST_REDUCTION,
        "value": 0.2,
        "condition": null
      }
    ],
    "visual": {
      "size": NODE_SIZES.MINOR,
      "icon": "tool"
    }
  },
  "research_boost": {
    "name": "Research Focus",
    "description": "Increases research effectiveness",
    "effects": [
      {
        "type": EFFECT_TYPES.INSIGHT_TO_REPUTATION_CONVERSION,
        "value": 0.1,
        "condition": null
      }
    ],
    "visual": {
      "size": NODE_SIZES.MINOR,
      "icon": "flask"
    }
  }
});

// For backward compatibility with existing code
window.CORE_CLUSTER_NODES = CoreClusterNodes;
