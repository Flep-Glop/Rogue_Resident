// frontend/src/ui/components/map_renderer.js
class MapRenderer {
    constructor(containerId, gameState) {
        this.container = document.getElementById(containerId);
        this.gameState = gameState;
        this.nodeSize = 80;
        this.nodeMargin = 40;
        this.svg = null;
        this.onNodeClick = null;
    }
    
    initialize() {
        if (!this.container) {
            console.error('Map container not found');
            return;
        }
        
        // Create SVG element
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.setAttribute('class', 'game-map');
        this.container.appendChild(this.svg);
        
        // Initial render
        this.render(this.gameState);
    }
    
    render(gameState) {
        if (!this.svg) {
            this.initialize();
        }
        
        this.gameState = gameState;
        if (!gameState || !gameState.map) {
            return;
        }
        
        // Clear SVG
        while (this.svg.firstChild) {
            this.svg.removeChild(this.svg.firstChild);
        }
        
        const map = gameState.map;
        const width = map.width * (this.nodeSize + this.nodeMargin);
        const height = map.height * (this.nodeSize + this.nodeMargin) + this.nodeSize;
        
        // Set SVG size
        this.svg.setAttribute('width', width);
        this.svg.setAttribute('height', height);
        
        // Draw paths first (so they're behind nodes)
        this._drawPaths(map, gameState);
        
        // Draw nodes
        this._drawNodes(map, gameState);
    }
    
    _drawNodes(map, gameState) {
        const visitedNodes = gameState.visited_nodes || [];
        const availableNodes = gameState.available_nodes || [];
        const currentNode = gameState.current_node;
        
        map.grid.forEach((row, rowIndex) => {
            row.forEach((node, colIndex) => {
                const x = colIndex * (this.nodeSize + this.nodeMargin) + this.nodeSize/2;
                const y = rowIndex * (this.nodeSize + this.nodeMargin) + this.nodeSize/2;
                
                // Determine node state
                let nodeState = 'hidden'; // Default state
                if (visitedNodes.includes(node.id)) {
                    nodeState = 'visited';
                }
                if (availableNodes.includes(node.id)) {
                    nodeState = 'available';
                }
                if (node.id === currentNode) {
                    nodeState = 'current';
                }
                
                // Draw node
                const nodeElement = this._createNodeElement(node, x, y, nodeState);
                this.svg.appendChild(nodeElement);
                
                // Add click handler
                if (nodeState === 'available' && this.onNodeClick) {
                    nodeElement.style.cursor = 'pointer';
                    nodeElement.addEventListener('click', () => {
                        this.onNodeClick(node.id);
                    });
                }
            });
        });
    }
    
    _drawPaths(map, gameState) {
        const visitedNodes = gameState.visited_nodes || [];
        const availableNodes = gameState.available_nodes || [];
        
        // Draw connections between nodes
        map.paths.forEach(path => {
            // Find source and target node positions
            const sourceNode = this._findNodeById(map, path.from);
            const targetNode = this._findNodeById(map, path.to);
            
            if (!sourceNode || !targetNode) {
                return;
            }
            
            const sourceRow = this._findNodeRow(map, sourceNode);
            const targetRow = this._findNodeRow(map, targetNode);
            
            const sourceCol = sourceNode.x;
            const targetCol = targetNode.x;
            
            // Calculate coordinates
            const x1 = sourceCol * (this.nodeSize + this.nodeMargin) + this.nodeSize/2;
            const y1 = sourceRow * (this.nodeSize + this.nodeMargin) + this.nodeSize/2;
            const x2 = targetCol * (this.nodeSize + this.nodeMargin) + this.nodeSize/2;
            const y2 = targetRow * (this.nodeSize + this.nodeMargin) + this.nodeSize/2;
            
            // Determine path state
            let pathState = 'hidden';
            if (visitedNodes.includes(path.from)) {
                if (visitedNodes.includes(path.to)) {
                    pathState = 'traveled';
                } else if (availableNodes.includes(path.to)) {
                    pathState = 'available';
                } else {
                    pathState = 'visible';
                }
            }
            
            // Draw path
            const pathElement = this._createPathElement(x1, y1, x2, y2, pathState);
            this.svg.appendChild(pathElement);
        });
    }
    
    _createNodeElement(node, x, y, state) {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('data-node-id', node.id);
        g.setAttribute('data-node-type', node.type);
        
        // Create circle for node
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', x);
        circle.setAttribute('cy', y);
        circle.setAttribute('r', this.nodeSize / 2);
        
        // Apply styles based on state
        switch (state) {
            case 'current':
                circle.setAttribute('class', 'map-node map-node-current');
                break;
            case 'visited':
                circle.setAttribute('class', 'map-node map-node-visited');
                break;
            case 'available':
                circle.setAttribute('class', 'map-node map-node-available');
                break;
            case 'hidden':
            default:
                circle.setAttribute('class', 'map-node map-node-hidden');
                break;
        }
        
        g.appendChild(circle);
        
        // Add icon based on node type
        const icon = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        icon.setAttribute('x', x);
        icon.setAttribute('y', y);
        icon.setAttribute('text-anchor', 'middle');
        icon.setAttribute('dominant-baseline', 'middle');
        icon.setAttribute('class', 'map-node-icon');
        
        // Set icon based on node type
        let iconText = '?';
        switch (node.type) {
            case 'question':
                iconText = 'Q';
                break;
            case 'patient':
                iconText = 'P';
                break;
            case 'elite':
                iconText = 'E';
                break;
            case 'boss':
                iconText = 'B';
                break;
            case 'rest':
                iconText = 'R';
                break;
            case 'treasure':
                iconText = 'T';
                break;
            case 'event':
                iconText = '!';
                break;
            case 'start':
                iconText = 'S';
                break;
        }
        
        icon.textContent = iconText;
        g.appendChild(icon);
        
        return g;
    }
    
    _createPathElement(x1, y1, x2, y2, state) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        path.setAttribute('x1', x1);
        path.setAttribute('y1', y1);
        path.setAttribute('x2', x2);
        path.setAttribute('y2', y2);
        
        // Apply styles based on state
        switch (state) {
            case 'traveled':
                path.setAttribute('class', 'map-path map-path-traveled');
                break;
            case 'available':
                path.setAttribute('class', 'map-path map-path-available');
                break;
            case 'visible':
                path.setAttribute('class', 'map-path map-path-visible');
                break;
            case 'hidden':
            default:
                path.setAttribute('class', 'map-path map-path-hidden');
                break;
        }
        
        return path;
    }
    
    _findNodeById(map, nodeId) {
        for (const row of map.grid) {
            for (const node of row) {
                if (node.id === nodeId) {
                    return node;
                }
            }
        }
        return null;
    }
    
    _findNodeRow(map, node) {
        for (let rowIndex = 0; rowIndex < map.grid.length; rowIndex++) {
            if (map.grid[rowIndex].some(n => n.id === node.id)) {
                return rowIndex;
            }
        }
        return -1;
    }
    
    setNodeClickHandler(handler) {
        this.onNodeClick = handler;
    }
}

export default MapRenderer;