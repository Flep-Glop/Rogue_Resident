// frontend/src/ui/components/skill_tree_ui.js
class SkillTreeUI {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.svg = null;
        this.skillTree = [];
        this.unlockedNodes = [];
        this.availablePoints = 0;
        this.onNodeClick = null;
        
        // Layout parameters
        this.nodeSize = 60;
        this.horizontalSpacing = 120;
        this.verticalSpacing = 100;
        this.pathThickness = 3;
    }
    
    initialize(skillTree, unlockedNodes, availablePoints) {
        if (!this.container) {
            console.error('Skill tree container not found');
            return;
        }
        
        this.skillTree = skillTree || [];
        this.unlockedNodes = unlockedNodes || [];
        this.availablePoints = availablePoints || 0;
        
        // Create SVG element
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.setAttribute('class', 'skill-tree');
        this.container.appendChild(this.svg);
        
        // Render skill tree
        this._renderSkillTree();
    }
    
    update(unlockedNodes, availablePoints) {
        this.unlockedNodes = unlockedNodes || this.unlockedNodes;
        this.availablePoints = availablePoints || this.availablePoints;
        
        // Re-render with updated data
        this._renderSkillTree();
    }
    
    _renderSkillTree() {
        if (!this.svg || !this.skillTree.length) {
            return;
        }
        
        // Clear SVG
        while (this.svg.firstChild) {
            this.svg.removeChild(this.svg.firstChild);
        }
        
        // Calculate positions for each node
        this._calculateNodePositions();
        
        // Draw connections first (so they're behind nodes)
        this._renderConnections();
        
        // Draw nodes
        this._renderNodes();
        
        // Set SVG size based on node positions
        this._resizeSvg();
    }
    
    _calculateNodePositions() {
        // Group nodes by tier (distance from root)
        const tierMap = {};
        
        // Find root nodes (tier 0)
        const rootNodes = this.skillTree.filter(node => !node.prerequisites || node.prerequisites.length === 0);
        rootNodes.forEach(node => {
            node._tier = 0;
            if (!tierMap[0]) tierMap[0] = [];
            tierMap[0].push(node);
        });
        
        // Assign tiers to remaining nodes
        let currentTier = 0;
        let allAssigned = false;
        
        while (!allAssigned) {
            allAssigned = true;
            
            // Find nodes with all prerequisites in previous tiers
            this.skillTree.forEach(node => {
                if (node._tier !== undefined) return;
                
                const prereqs = node.prerequisites || [];
                const allPrereqsAssigned = prereqs.every(prereqId => {
                    const prereqNode = this.skillTree.find(n => n.id === prereqId);
                    return prereqNode && prereqNode._tier !== undefined;
                });
                
                if (allPrereqsAssigned) {
                    // Find maximum tier among prerequisites
                    let maxPrereqTier = -1;
                    prereqs.forEach(prereqId => {
                        const prereqNode = this.skillTree.find(n => n.id === prereqId);
                        if (prereqNode && prereqNode._tier > maxPrereqTier) {
                            maxPrereqTier = prereqNode._tier;
                        }
                    });
                    
                    node._tier = maxPrereqTier + 1;
                    if (!tierMap[node._tier]) tierMap[node._tier] = [];
                    tierMap[node._tier].push(node);
                } else {
                    allAssigned = false;
                }
            });
            
            currentTier++;
            if (currentTier > 100) {
                console.error('Skill tree has circular dependencies');
                break;
            }
        }
        
        // Assign x and y coordinates based on tiers
        Object.keys(tierMap).forEach(tier => {
            const nodes = tierMap[tier];
            const tierY = parseInt(tier) * this.verticalSpacing + this.nodeSize;
            
            // Distribute nodes horizontally
            const tierWidth = nodes.length * this.horizontalSpacing;
            const startX = tierWidth / 2;
            
            nodes.forEach((node, index) => {
                node._x = startX - index * this.horizontalSpacing;
                node._y = tierY;
            });
        });
    }
    
    _renderNodes() {
        this.skillTree.forEach(node => {
            if (!node._x || !node._y) return;
            
            // Determine node state
            let nodeState = 'locked';
            if (this.unlockedNodes.includes(node.id)) {
                nodeState = 'unlocked';
            } else if (this._canUnlockNode(node)) {
                nodeState = 'available';
            }
            
            // Create node element
            const nodeElement = this._createNodeElement(node, nodeState);
            this.svg.appendChild(nodeElement);
            
            // Add click handler for available nodes
            if (nodeState === 'available' && this.onNodeClick) {
                nodeElement.style.cursor = 'pointer';
                nodeElement.addEventListener('click', () => {
                    this.onNodeClick(node.id);
                });
            }
        });
    }
    
    _renderConnections() {
        this.skillTree.forEach(node => {
            if (!node.prerequisites) return;
            
            node.prerequisites.forEach(prereqId => {
                const prereqNode = this.skillTree.find(n => n.id === prereqId);
                if (!prereqNode || !node._x || !node._y || !prereqNode._x || !prereqNode._y) {
                    return;
                }
                
                // Determine connection state
                let connectionState = 'locked';
                if (this.unlockedNodes.includes(node.id) && 
                    this.unlockedNodes.includes(prereqId)) {
                    connectionState = 'unlocked';
                } else if (this.unlockedNodes.includes(prereqId)) {
                    connectionState = 'available';
                }
                
                // Create connection element
                const connectionElement = this._createConnectionElement(
                    prereqNode._x, prereqNode._y,
                    node._x, node._y,
                    connectionState
                );
                this.svg.appendChild(connectionElement);
            });
        });
    }
    
    _createNodeElement(node, state) {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('data-node-id', node.id);
        
        // Create circle for node
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', node._x);
        circle.setAttribute('cy', node._y);
        circle.setAttribute('r', this.nodeSize / 2);
        
        // Apply styles based on state
        switch (state) {
            case 'unlocked':
                circle.setAttribute('class', 'skill-node skill-node-unlocked');
                break;
            case 'available':
                circle.setAttribute('class', 'skill-node skill-node-available');
                break;
            case 'locked':
            default:
                circle.setAttribute('class', 'skill-node skill-node-locked');
                break;
        }
        
        g.appendChild(circle);
        
        // Add label
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', node._x);
        text.setAttribute('y', node._y);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'middle');
        text.setAttribute('class', 'skill-node-label');
        text.textContent = node.name || '';
        
        g.appendChild(text);
        
        return g;
    }
    
    _createConnectionElement(x1, y1, x2, y2, state) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        path.setAttribute('x1', x1);
        path.setAttribute('y1', y1);
        path.setAttribute('x2', x2);
        path.setAttribute('y2', y2);
        path.setAttribute('stroke-width', this.pathThickness);
        
        // Apply styles based on state
        switch (state) {
            case 'unlocked':
                path.setAttribute('class', 'skill-path skill-path-unlocked');
                break;
            case 'available':
                path.setAttribute('class', 'skill-path skill-path-available');
                break;
            case 'locked':
            default:
                path.setAttribute('class', 'skill-path skill-path-locked');
                break;
        }
        
        return path;
    }
    
    _canUnlockNode(node) {
        // Check if player has enough skill points
        if (this.availablePoints < node.cost) {
            return false;
        }
        
        // Check if all prerequisites are unlocked
        if (!node.prerequisites) {
            return true;
        }
        
        return node.prerequisites.every(prereqId => 
            this.unlockedNodes.includes(prereqId)
        );
    }
    
    _resizeSvg() {
        // Find bounds of all nodes
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        
        this.skillTree.forEach(node => {
            if (!node._x || !node._y) return;
            
            minX = Math.min(minX, node._x - this.nodeSize/2);
            minY = Math.min(minY, node._y - this.nodeSize/2);
            maxX = Math.max(maxX, node._x + this.nodeSize/2);
            maxY = Math.max(maxY, node._y + this.nodeSize/2);
        });
        
        // Add padding
        const padding = this.nodeSize;
        minX -= padding;
        minY -= padding;
        maxX += padding;
        maxY += padding;
        
        // Set viewBox to encompass all nodes
        this.svg.setAttribute('viewBox', `${minX} ${minY} ${maxX - minX} ${maxY - minY}`);
        this.svg.setAttribute('width', '100%');
        this.svg.setAttribute('height', '600px');
    }
    
    setNodeClickHandler(handler) {
        this.onNodeClick = handler;
    }
}

export default SkillTreeUI;