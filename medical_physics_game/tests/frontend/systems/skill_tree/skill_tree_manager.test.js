// tests/frontend/systems/skill_tree/skill_tree_manager.test.js

/**
 * Test suite for SkillTreeManager
 */

describe('SkillTreeManager', () => {
  let skillTreeManager;
  let mockEventSystem;
  let mockApiClient;
  
  // Mock data
  const mockTreeData = {
    specializations: [
      { id: 'theory', name: 'Theory Specialist' },
      { id: 'clinical', name: 'Clinical Expert' }
    ],
    nodes: [
      {
        id: 'core_physics',
        name: 'Core Physics',
        specialization: null,
        tier: 0,
        cost: { skill_points: 0, reputation: 0 },
        position: { x: 400, y: 300 },
        visual: { size: 'core', icon: 'atom' }
      },
      {
        id: 'quantum_comprehension',
        name: 'Quantum Comprehension',
        specialization: 'theory',
        tier: 1,
        prerequisites: ['core_physics'],
        cost: { skill_points: 1, reputation: 10 },
        position: { x: 300, y: 150 },
        visual: { size: 'minor', icon: 'brain' }
      }
    ],
    connections: [
      { source: 'core_physics', target: 'quantum_comprehension' }
    ]
  };
  
  const mockProgress = {
    reputation: 20,
    skill_points_available: 3,
    unlocked_skills: ['core_physics'],
    active_skills: ['core_physics'],
    specialization_progress: { core: 1 }
  };
  
  beforeEach(() => {
    // Import manager
    const SkillTreeManager = require('../../../../frontend/src/systems/skill_tree/core/skill_tree_manager').default;
    
    // Mock event system
    mockEventSystem = {
      publish: jest.fn(),
      subscribe: jest.fn()
    };
    
    // Mock API client
    mockApiClient = {
      getSkillTree: jest.fn().mockResolvedValue(mockTreeData),
      getSkillProgress: jest.fn().mockResolvedValue(mockProgress),
      saveSkillProgress: jest.fn().mockResolvedValue({ status: 'success' })
    };
    
    // Initialize manager
    skillTreeManager = new SkillTreeManager();
    skillTreeManager.initialize({
      apiClient: mockApiClient,
      eventSystem: mockEventSystem
    });
    
    // Mock localStorage for character ID
    global.localStorage = {
      getItem: jest.fn().mockReturnValue(JSON.stringify({ id: 'test_character' })),
      setItem: jest.fn()
    };
  });
  
  afterEach(() => {
    jest.resetAllMocks();
  });
  
  test('should initialize correctly', () => {
    expect(skillTreeManager.initialized).toBe(true);
    expect(mockEventSystem.subscribe).toHaveBeenCalled();
  });
  
  test('should load data correctly', async () => {
    const result = await skillTreeManager.loadData();
    
    expect(mockApiClient.getSkillTree).toHaveBeenCalled();
    expect(mockApiClient.getSkillProgress).toHaveBeenCalled();
    expect(result.data).toEqual(mockTreeData);
    expect(result.progress).toEqual(mockProgress);
    expect(mockEventSystem.publish).toHaveBeenCalledWith(
      'skill_tree.data_loaded',
      expect.any(Object)
    );
  });
  
  test('should handle data loading errors', async () => {
    mockApiClient.getSkillTree.mockRejectedValue(new Error('API error'));
    
    await expect(skillTreeManager.loadData()).rejects.toThrow('API error');
    expect(mockEventSystem.publish).toHaveBeenCalledWith(
      'skill_tree.loading_error',
      expect.any(Object)
    );
  });
  
  test('should correctly check if node can be unlocked', async () => {
    await skillTreeManager.loadData();
    
    // Should be able to unlock quantum_comprehension
    expect(skillTreeManager.canUnlockNode('quantum_comprehension')).toBe(true);
    
    // Modify progress to have insufficient skill points
    skillTreeManager.progress.skill_points_available = 0;
    expect(skillTreeManager.canUnlockNode('quantum_comprehension')).toBe(false);
    
    // Restore skill points but remove prerequisite
    skillTreeManager.progress.skill_points_available = 3;
    skillTreeManager.progress.unlocked_skills = [];
    expect(skillTreeManager.canUnlockNode('quantum_comprehension')).toBe(false);
    
    // Non-existent node should return false
    expect(skillTreeManager.canUnlockNode('non_existent_node')).toBe(false);
  });
  
  test('should unlock nodes correctly', async () => {
    await skillTreeManager.loadData();
    
    const result = skillTreeManager.unlockNode('quantum_comprehension');
    expect(result).toBe(true);
    expect(skillTreeManager.progress.unlocked_skills).toContain('quantum_comprehension');
    expect(skillTreeManager.progress.skill_points_available).toBe(2); // 3 - 1
    expect(mockEventSystem.publish).toHaveBeenCalledWith(
      'skill_tree.node_unlocked',
      expect.any(Object)
    );
  });
  
  test('should not unlock unavailable nodes', async () => {
    await skillTreeManager.loadData();
    
    // Remove prerequisite
    skillTreeManager.progress.unlocked_skills = [];
    
    const result = skillTreeManager.unlockNode('quantum_comprehension');
    expect(result).toBe(false);
    expect(skillTreeManager.progress.unlocked_skills).not.toContain('quantum_comprehension');
    expect(mockEventSystem.publish).toHaveBeenCalledWith(
      'skill_tree.unlock_failed',
      expect.any(Object)
    );
  });
  
  test('should handle specialization filtering', async () => {
    await skillTreeManager.loadData();
    
    skillTreeManager.filterBySpecialization('theory');
    expect(skillTreeManager.state.filteredSpecialization).toBe('theory');
    expect(mockEventSystem.publish).toHaveBeenCalledWith(
      'skill_tree.view_filtered',
      { specialization: 'theory' }
    );
  });
  
  test('should provide detailed node information', async () => {
    await skillTreeManager.loadData();
    
    const details = skillTreeManager.getNodeDetails('quantum_comprehension');
    expect(details).toBeTruthy();
    expect(details.state).toBe('available');
    expect(details.canUnlock).toBe(true);
    expect(details.unlocked).toBe(false);
    expect(details.specialization).toEqual(mockTreeData.specializations[0]);
    expect(details.incomingConnections).toHaveLength(1);
    expect(details.incomingConnections[0].nodeId).toBe('core_physics');
  });
  
  test('should save progress correctly', async () => {
    await skillTreeManager.loadData();
    
    await skillTreeManager.saveProgress();
    expect(mockApiClient.saveSkillProgress).toHaveBeenCalledWith(
      'test_character',
      expect.any(Object)
    );
    expect(mockEventSystem.publish).toHaveBeenCalledWith(
      'skill_tree.save_completed',
      expect.any(Object)
    );
  });
  
  test('should handle save errors', async () => {
    await skillTreeManager.loadData();
    
    mockApiClient.saveSkillProgress.mockRejectedValue(new Error('Save error'));
    
    await expect(skillTreeManager.saveProgress()).rejects.toThrow('Save error');
    expect(mockEventSystem.publish).toHaveBeenCalledWith(
      'skill_tree.save_error',
      expect.any(Object)
    );
  });
  
  test('should add reputation correctly', async () => {
    await skillTreeManager.loadData();
    
    skillTreeManager.addReputation(10, 'achievement');
    expect(skillTreeManager.progress.reputation).toBe(30); // 20 + 10
    expect(mockEventSystem.publish).toHaveBeenCalledWith(
      'skill_tree.reputation_changed',
      expect.objectContaining({
        oldValue: 20,
        newValue: 30,
        change: 10,
        source: 'achievement'
      })
    );
  });
});