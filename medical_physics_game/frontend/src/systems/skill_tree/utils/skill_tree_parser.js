// frontend/src/systems/skill_tree/utils/skill_tree_parser.js

/**
 * SkillTreeParser
 * Utilities for parsing and transforming skill tree data
 */
class SkillTreeParser {
    /**
     * Parse raw skill tree data and prepare it for rendering
     * @param {Object} rawData Raw skill tree data from API
     * @returns {Object} Parsed and enhanced skill tree data
     */
    static parseSkillTreeData(rawData) {
      if (!rawData) return null;
      
      // Create a deep copy to avoid modifying the original
      const data = JSON.parse(JSON.stringify(rawData));
      
      // Validate required properties
      if (!Array.isArray(data.nodes) || !Array.isArray(data.specializations)) {
        console.error('Invalid skill tree data format');
        return null;
      }
      
      // Create maps for faster lookups
      const specializations = new Map();
      data.specializations.forEach(spec => {
        specializations.set(spec.id, spec);
      });
      
      // Process nodes
      data.nodes.forEach(node => {
        // Ensure node has a position
        if (!node.position) {
          node.position = { x: 0, y: 0 };
        }
        
        // Ensure node has visual properties
        if (!node.visual) {
          node.visual = {
            size: node.tier === 0 ? 'core' : 'minor',
            icon: 'default'
          };
        }
        
        // Ensure node has effects array
        if (!Array.isArray(node.effects)) {
          node.effects = [];
        }
        
        // Ensure node has cost
        if (!node.cost) {
          node.cost = {
            reputation: 0,
            skill_points: 0
          };
        }
        
        // Add reference to specialization object
        if (node.specialization && specializations.has(node.specialization)) {
          node._specializationRef = specializations.get(node.specialization);
        }
      });
      
      // Process connections
      const connections = data.connections || [];
      
      // Create a node map
      const nodeMap = new Map();
      data.nodes.forEach(node => {
        nodeMap.set(node.id, node);
      });
      
      // Build node connections (both ways for easier traversal)
      const nodeConnections = new Map();
      
      connections.forEach(conn => {
        // Get source and target nodes
        const sourceNode = nodeMap.get(conn.source);
        const targetNode = nodeMap.get(conn.target);
        
        if (!sourceNode || !targetNode) return;
        
        // Ensure nodes have connections arrays
        if (!sourceNode.connections) sourceNode.connections = [];
        if (!sourceNode.connections.includes(conn.target)) {
          sourceNode.connections.push(conn.target);
        }
        
        // Track incoming connections for prerequisite checking
        if (!targetNode.prerequisites) targetNode.prerequisites = [];
        if (!targetNode.prerequisites.includes(conn.source)) {
          targetNode.prerequisites.push(conn.source);
        }
        
        // Add to connections map
        if (!nodeConnections.has(conn.source)) {
          nodeConnections.set(conn.source, new Set());
        }
        nodeConnections.get(conn.source).add(conn.target);
      });
      
      // Calculate node tiers if not specified
      data.nodes.forEach(node => {
        if (node.tier !== undefined) return;
        
        // Calculate tier based on prerequisites
        const calculateTier = (nodeId, visited = new Set()) => {
          // Avoid cycles
          if (visited.has(nodeId)) return 0;
          visited.add(nodeId);
          
          const node = nodeMap.get(nodeId);
          if (!node) return 0;
          
          // If node has no prerequisites, it's tier 1
          if (!node.prerequisites || node.prerequisites.length === 0) {
            return 1;
          }
          
          // Find max tier of prerequisites
          let maxTier = 0;
          node.prerequisites.forEach(prereqId => {
            const prereqTier = calculateTier(prereqId, visited);
            maxTier = Math.max(maxTier, prereqTier);
          });
          
          // Node tier is one more than max prerequisite tier
          return maxTier + 1;
        };
        
        node.tier = calculateTier(node.id);
      });
      
      return {
        ...data,
        nodeMap,
        nodeConnections,
        specializations
      };
    }
    
    /**
     * Calculate node positions based on tier and specialization
     * @param {Object} skillTreeData Skill tree data
     * @returns {Object} Updated skill tree data with calculated positions
     */
    static calculateNodePositions(skillTreeData) {
      if (!skillTreeData || !Array.isArray(skillTreeData.nodes)) {
        return skillTreeData;
      }
      
      const data = JSON.parse(JSON.stringify(skillTreeData));
      
      // Group nodes by tier and specialization
      const nodesByTier = new Map();
      
      // First pass: group nodes
      data.nodes.forEach(node => {
        const tier = node.tier || 0;
        
        if (!nodesByTier.has(tier)) {
          nodesByTier.set(tier, {
            nodes: [],
            bySpecialization: new Map()
          });
        }
        
        const tierData = nodesByTier.get(tier);
        tierData.nodes.push(node);
        
        // Group by specialization
        const spec = node.specialization || 'core';
        if (!tierData.bySpecialization.has(spec)) {
          tierData.bySpecialization.set(spec, []);
        }
        
        tierData.bySpecialization.get(spec).push(node);
      });
      
      // Define layout parameters
      const centerX = 400;
      const centerY = 300;
      const tierRadius = [80, 180, 280, 380, 480, 580];
      
      // Second pass: calculate positions
      nodesByTier.forEach((tierData, tier) => {
        const radius = tierRadius[tier] || 600;
        
        // Handle core tier (tier 0) specially
        if (tier === 0) {
          const coreNodes = tierData.nodes;
          
          if (coreNodes.length === 1) {
            // Single core node at center
            coreNodes[0].position = { x: centerX, y: centerY };
          } else if (coreNodes.length > 1) {
            // Multiple core nodes in a circle
            const angleStep = (2 * Math.PI) / coreNodes.length;
            const coreRadius = 50;
            
            coreNodes.forEach((node, index) => {
              const angle = index * angleStep;
              node.position = {
                x: centerX + Math.cos(angle) * coreRadius,
                y: centerY + Math.sin(angle) * coreRadius
              };
            });
          }
        } else {
          // Handle higher tiers
          const specCount = tierData.bySpecialization.size;
          const anglePerSpec = (2 * Math.PI) / specCount;
          
          let specIndex = 0;
          tierData.bySpecialization.forEach((nodes, spec) => {
            const startAngle = specIndex * anglePerSpec;
            const angleRange = anglePerSpec * 0.8; // Leave space between specializations
            
            nodes.forEach((node, nodeIndex) => {
              const nodeCount = nodes.length;
              const angleOffset = nodeCount > 1 
                ? (nodeIndex / (nodeCount - 1)) * angleRange 
                : 0;
              const angle = startAngle + angleOffset;
              
              node.position = {
                x: centerX + Math.cos(angle) * radius,
                y: centerY + Math.sin(angle) * radius
              };
            });
            
            specIndex++;
          });
        }
      });
      
      return data;
    }
    
    /**
     * Combine skill tree data with player progress
     * @param {Object} skillTreeData Skill tree data
     * @param {Object} progressData Player progress data
     * @returns {Object} Combined data with node states
     */
    static combineDataWithProgress(skillTreeData, progressData) {
      if (!skillTreeData || !progressData) {
        return skillTreeData;
      }
      
      const data = JSON.parse(JSON.stringify(skillTreeData));
      
      // Unpack progress data
      const {
        unlocked_skills = [],
        active_skills = [],
        skill_points_available = 0,
        reputation = 0
      } = progressData;
      
      // Create a node map if not exists
      const nodeMap = new Map();
      data.nodes.forEach(node => {
        nodeMap.set(node.id, node);
      });
      
      // Calculate node states
      data.nodes.forEach(node => {
        // Basic state
        if (unlocked_skills.includes(node.id)) {
          node.state = 'unlocked';
          node.unlocked = true;
        } else {
          node.state = 'locked';
          node.unlocked = false;
        }
        
        // Active state
        node.active = active_skills.includes(node.id);
        
        // Calculate availability
        node.available = false;
        
        if (!node.unlocked) {
          // Check if can be unlocked
          const hasSufficientPoints = skill_points_available >= (node.cost?.skill_points || 0);
          const hasSufficientReputation = reputation >= (node.cost?.reputation || 0);
          
          // Check prerequisites
          let prerequisitesMet = true;
          if (node.prerequisites && node.prerequisites.length > 0) {
            prerequisitesMet = node.prerequisites.every(prereqId => 
              unlocked_skills.includes(prereqId)
            );
          }
          
          node.available = hasSufficientPoints && hasSufficientReputation && prerequisitesMet;
          
          if (node.available) {
            node.state = 'available';
          }
        }
      });
      
      return {
        ...data,
        progress: progressData,
        nodeMap
      };
    }
    
    /**
     * Get node effects from unlocked and active skills
     * @param {Object} skillTreeData Skill tree data
     * @param {Array} activeSkillIds IDs of active skills
     * @returns {Array} Combined effects from active skills
     */
    static getActiveNodeEffects(skillTreeData, activeSkillIds) {
      if (!skillTreeData || !Array.isArray(activeSkillIds)) {
        return [];
      }
      
      const effects = [];
      
      // Get nodes for active skills
      activeSkillIds.forEach(skillId => {
        const node = skillTreeData.nodeMap?.get(skillId) || 
                    skillTreeData.nodes?.find(n => n.id === skillId);
        
        if (node && Array.isArray(node.effects)) {
          // Add each effect with source information
          node.effects.forEach(effect => {
            effects.push({
              ...effect,
              sourceNode: node.id,
              sourceName: node.name
            });
          });
        }
      });
      
      return effects;
    }
  }
  
  export default SkillTreeParser;