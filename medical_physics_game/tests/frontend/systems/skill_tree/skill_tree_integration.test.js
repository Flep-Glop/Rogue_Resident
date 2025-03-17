// tests/frontend/systems/skill_tree/skill_tree_integration.test.js

import { initialize, loadSkillTree } from '../../../../frontend/src/systems/skill_tree';

describe('Skill Tree Integration', () => {
  // Mock dependencies
  const mockEventSystem = {
    publish: jest.fn(),
    subscribe: jest.fn()
  };
  
  const mockApiClient = {
    getSkillTree: jest.fn().mockResolvedValue({
      specializations: [],
      nodes: [],
      connections: []
    }),
    getSkillProgress: jest.fn().mockResolvedValue({
      reputation: 0,
      unlocked_skills: [],
      active_skills: [],
      skill_points_available: 0
    })
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('should initialize without errors', async () => {
    await initialize({
      eventSystem: mockEventSystem,
      apiClient: mockApiClient,
      autoLoad: false
    });
    
    expect(mockEventSystem.subscribe).toHaveBeenCalled();
  });
  
  test('should load skill tree data', async () => {
    await initialize({
      eventSystem: mockEventSystem,
      apiClient: mockApiClient,
      autoLoad: false
    });
    
    await loadSkillTree();
    
    expect(mockApiClient.getSkillTree).toHaveBeenCalled();
    expect(mockApiClient.getSkillProgress).toHaveBeenCalled();
  });
});