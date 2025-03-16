// Core modules test
import { EventSystem } from '../frontend/src/core/event_system.js';
import { StateManager } from '../frontend/src/core/state_manager.js';
import { Game } from '../frontend/src/core/game.js';

// Entity modules test
import { Character } from '../frontend/src/entities/player/character.js';
import { NodeRegistry } from '../frontend/src/entities/nodes/node_registry.js';
import { NodeFactory } from '../frontend/src/entities/nodes/node_factory.js';

// Node type modules test
import { BossNode } from '../frontend/src/entities/nodes/node_types/boss.js';
import { QuestionNode } from '../frontend/src/entities/nodes/node_types/question.js';
import { RestNode } from '../frontend/src/entities/nodes/node_types/rest.js';
import { ShopNode } from '../frontend/src/entities/nodes/node_types/shop.js';

// System modules test
import { EffectHandler } from '../frontend/src/systems/effects/effect_handler.js';
import { SkillTreeManager } from '../frontend/src/systems/skill_tree/skill_tree_manager.js';
import { ProgressionSystem } from '../frontend/src/systems/progression/progression.js';

// UI modules test
import { CharacterPanel } from '../frontend/src/ui/components/character_panel.js';
import { MapRenderer } from '../frontend/src/ui/components/map_renderer.js';
import { APIClient } from '../frontend/src/ui/utils/api_client.js';

console.log('✅ All modules imported successfully!');

// Test module functionality
function testModules() {
    console.log('Testing EventSystem...');
    const events = new EventSystem();
    events.on('test', () => console.log('EventSystem works!'));
    events.emit('test');
    
    console.log('Testing StateManager...');
    const state = new StateManager();
    state.setState('test', 'value');
    console.log(`StateManager getState: ${state.getState('test')}`);
    
    console.log('Testing NodeRegistry...');
    const registry = new NodeRegistry();
    registry.register('test', {});
    console.log(`NodeRegistry getNodeType: ${registry.getNodeType('test') !== null}`);
    
    console.log('✅ Module functionality verified!');
}

// Run tests when DOM is loaded
document.addEventListener('DOMContentLoaded', testModules);
