// item_editor.js - Item editor functionality with enhanced features

// Global variables
let allItems = [];       // All items and relics
let currentItem = null;  // Currently selected item
let iconFiles = [];      // Available icon files
let unsavedChanges = {}; // Track changes: { itemId: modifiedItemData }
let selectedItems = new Set(); // For multi-select functionality
let isMultiSelectMode = false; // Track if multi-select mode is active
let autoSaveTimer = null; // For auto-save functionality
const AUTO_SAVE_DELAY = 30000; // 30 seconds

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Add custom styles
  addCustomStyles();
  addValidationStyles();
  
  // Fetch all items on load
  fetchItems();
  
  // Fetch available icons
  fetchIcons();
  
  // Set up event listeners
  setupEventListeners();
});

// Fetch all items and relics from the server
async function fetchItems() {
  try {
    const response = await fetch('/api/editor/items');
    const data = await response.json();
    
    if (data.success) {
      allItems = data.items;
      renderItemList(allItems);
    } else {
      showStatusMessage('Error loading items: ' + data.error, 'error');
    }
  } catch (error) {
    console.error('Error fetching items:', error);
    showStatusMessage('Failed to load items. Check console for details.', 'error');
  }
}

// Fetch available icon files
async function fetchIcons() {
  try {
    const response = await fetch('/api/editor/icons');
    const data = await response.json();
    
    if (data.success) {
      iconFiles = data.icons;
      renderIconGrid(iconFiles);
    } else {
      showStatusMessage('Error loading icons: ' + data.error, 'error');
    }
  } catch (error) {
    console.error('Error fetching icons:', error);
  }
}

// Set up all event listeners
function setupEventListeners() {
  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const type = this.dataset.type;
      
      // Update active tab
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      
      // Filter items
      filterItems(type);
    });
  });
  
  // Search functionality
  document.getElementById('search-input').addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase();
    filterItems(getActiveTabType(), searchTerm);
  });
  
  // Sort functionality
  document.getElementById('sort-select').addEventListener('change', function() {
    const sortType = this.value;
    sortItems(sortType);
  });
  
  // Item type change
  document.getElementById('item-type').addEventListener('change', function() {
    const type = this.value;
    toggleItemTypeFields(type);
  });
  
  // Rarity change for preview
  document.getElementById('item-rarity').addEventListener('change', updatePreview);
  document.getElementById('item-name').addEventListener('input', updatePreview);
  
  // Form fields change tracking
  document.querySelectorAll('.form-group input, .form-group select, .form-group textarea').forEach(el => {
    el.addEventListener('change', trackChanges);
  });
  
  // Action buttons
  document.getElementById('save-item-btn').addEventListener('click', saveCurrentItem);
  document.getElementById('clone-item-btn').addEventListener('click', cloneCurrentItem);
  document.getElementById('delete-item-btn').addEventListener('click', deleteCurrentItem);
  document.getElementById('save-all-btn').addEventListener('click', saveAllChanges);
  document.getElementById('new-item-btn').addEventListener('click', () => createNewItem('consumable'));
  document.getElementById('new-relic-btn').addEventListener('click', () => createNewItem('relic'));
  
  // Icon upload
  document.getElementById('icon-upload-input').addEventListener('change', uploadIcon);
  
  // Before unload warning if there are unsaved changes
  window.addEventListener('beforeunload', function(e) {
    if (Object.keys(unsavedChanges).length > 0) {
      const message = 'You have unsaved changes. Are you sure you want to leave?';
      e.returnValue = message;
      return message;
    }
  });
  
  // New enhanced functionality
  setupKeyboardShortcuts();
  setupAutoSave();
  setupBulkOperations();
  setupDragAndDrop();
  setupAdvancedSearch();
  setupGamePreview();
  setupDataRecovery();
  setupValidation();
}

// Render the item list in the sidebar
function renderItemList(items) {
  const listContainer = document.getElementById('item-list');
  listContainer.innerHTML = '';
  
  if (items.length === 0) {
    listContainer.innerHTML = '<div class="empty-list">No items found</div>';
    return;
  }
  
  items.forEach(item => {
    const itemElement = document.createElement('div');
    itemElement.className = 'item-entry';
    itemElement.dataset.id = item.id;
    
    const badgeType = item.itemType === 'relic' ? 'relic' : 'item';
    
    itemElement.innerHTML = `
      <div class="item-entry-icon">
        <img src="/static/img/items/${item.iconPath || 'default.png'}" 
             alt="${item.name}" width="24" height="24"
             style="image-rendering: pixelated;">
      </div>
      <div class="item-entry-details">
        <div class="item-entry-name">${item.name}</div>
        <div class="item-entry-id">${item.id} <span class="badge badge-${badgeType}">${item.itemType || 'consumable'}</span></div>
      </div>
    `;
    
    // Add rarity class
    if (item.rarity) {
      itemElement.classList.add(item.rarity);
    }
    
    // Check if in multi-select mode
    if (isMultiSelectMode) {
      // Add multi-select behavior
      itemElement.addEventListener('click', () => {
        const itemId = item.id;
        
        if (selectedItems.has(itemId)) {
          selectedItems.delete(itemId);
          itemElement.classList.remove('multi-selected');
        } else {
          selectedItems.add(itemId);
          itemElement.classList.add('multi-selected');
        }
        
        updateSelectionIndicators();
      });
      
      // Add selected class if the item is in the selectedItems
      if (selectedItems.has(item.id)) {
        itemElement.classList.add('multi-selected');
      }
    } else {
      // Normal item selection click
      itemElement.addEventListener('click', () => {
        selectItem(item.id);
      });
      
      // Add selected class if this is the current item
      if (currentItem && item.id === currentItem.id) {
        itemElement.classList.add('selected');
      }
    }
    
    listContainer.appendChild(itemElement);
  });
  
  // Add unsaved changes indicators
  updateUnsavedChangesIndicators();
}

// Render the icon grid in the preview panel
function renderIconGrid(icons) {
  const gridContainer = document.getElementById('icon-grid');
  gridContainer.innerHTML = '';
  
  // Add default icon
  const defaultIcon = document.createElement('div');
  defaultIcon.className = 'icon-grid-item';
  defaultIcon.dataset.icon = 'default.png';
  defaultIcon.innerHTML = '<img src="/static/img/items/default.png" alt="Default" width="24" height="24" style="image-rendering: pixelated;">';
  defaultIcon.addEventListener('click', () => selectIcon('default.png'));
  gridContainer.appendChild(defaultIcon);
  
  // Add all other icons
  icons.forEach(icon => {
    const iconElement = document.createElement('div');
    iconElement.className = 'icon-grid-item';
    iconElement.dataset.icon = icon;
    iconElement.innerHTML = `<img src="/static/img/items/${icon}" alt="${icon}" width="24" height="24" style="image-rendering: pixelated;">`;
    
    iconElement.addEventListener('click', () => selectIcon(icon));
    gridContainer.appendChild(iconElement);
  });
}

// Select an icon for the current item
function selectIcon(iconPath) {
  // Update selected state in grid
  document.querySelectorAll('.icon-grid-item').forEach(icon => {
    icon.classList.remove('selected');
    if (icon.dataset.icon === iconPath) {
      icon.classList.add('selected');
    }
  });
  
  // Update current item (if any)
  if (currentItem) {
    currentItem.iconPath = iconPath;
    trackChanges();
  }
  
  // Update preview
  updatePreview();
}

// Filter items by type and/or search term
function filterItems(type = 'all', searchTerm = '') {
  let filteredItems = [...allItems];
  
  // Filter by type
  if (type !== 'all') {
    filteredItems = filteredItems.filter(item => 
      type === 'relic' ? item.itemType === 'relic' : item.itemType !== 'relic'
    );
  }
  
  // Filter by search term
  if (searchTerm) {
    filteredItems = filteredItems.filter(item => 
      item.name.toLowerCase().includes(searchTerm) || 
      item.id.toLowerCase().includes(searchTerm) ||
      (item.description && item.description.toLowerCase().includes(searchTerm))
    );
  }
  
  // Re-render the list
  renderItemList(filteredItems);
  
  // Maintain selection if possible
  if (currentItem && !isMultiSelectMode) {
    const selectedElement = document.querySelector(`.item-entry[data-id="${currentItem.id}"]`);
    if (selectedElement) {
      selectedElement.classList.add('selected');
    }
  }
}

// Sort items by the specified property
function sortItems(sortType) {
  // Get current filters
  const searchTerm = document.getElementById('search-input').value.toLowerCase();
  const type = getActiveTabType();
  
  // First filter
  let filteredItems = [...allItems];
  
  // Filter by type
  if (type !== 'all') {
    filteredItems = filteredItems.filter(item => 
      type === 'relic' ? item.itemType === 'relic' : item.itemType !== 'relic'
    );
  }
  
  // Filter by search term
  if (searchTerm) {
    filteredItems = filteredItems.filter(item => 
      item.name.toLowerCase().includes(searchTerm) || 
      item.id.toLowerCase().includes(searchTerm) ||
      (item.description && item.description.toLowerCase().includes(searchTerm))
    );
  }
  
  // Then sort
  filteredItems.sort((a, b) => {
    switch (sortType) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'id':
        return a.id.localeCompare(b.id);
      case 'rarity':
        // Define rarity order
        const rarityOrder = { 'common': 0, 'uncommon': 1, 'rare': 2, 'epic': 3 };
        return rarityOrder[a.rarity || 'common'] - rarityOrder[b.rarity || 'common'];
      case 'type':
        return (a.itemType || 'consumable').localeCompare(b.itemType || 'consumable');
      default:
        return 0;
    }
  });
  
  // Re-render the list
  renderItemList(filteredItems);
}

// Get the currently active tab type
function getActiveTabType() {
  const activeTab = document.querySelector('.tab-btn.active');
  return activeTab ? activeTab.dataset.type : 'all';
}

// Toggle fields based on item type
function toggleItemTypeFields(type) {
  const consumableFields = document.getElementById('consumable-fields');
  const relicFields = document.getElementById('relic-fields');
  
  if (type === 'relic') {
    consumableFields.style.display = 'none';
    relicFields.style.display = 'block';
    
    // Set appropriate effect duration
    document.getElementById('effect-duration').value = 'permanent';
  } else {
    consumableFields.style.display = 'block';
    relicFields.style.display = 'none';
    
    // Set appropriate effect duration
    document.getElementById('effect-duration').value = 'instant';
  }
  
  // Update the form to track changes
  trackChanges();
}

// Update the item preview
function updatePreview() {
  const previewElement = document.getElementById('item-preview');
  const previewName = document.getElementById('preview-name');
  const previewRarity = document.getElementById('preview-rarity');
  
  // Get current values, either from form or current item
  const name = document.getElementById('item-name').value || (currentItem ? currentItem.name : 'Item Name');
  const rarity = document.getElementById('item-rarity').value || (currentItem ? currentItem.rarity : 'common');
  const iconPath = currentItem?.iconPath || 'default.png';
  
  // Update preview
  previewName.textContent = name;
  previewRarity.textContent = rarity;
  previewRarity.className = `rarity-badge ${rarity}`;
  
  // Update item visual
  previewElement.className = `inventory-item ${rarity}`;
  
  // Update icon
  const iconElement = previewElement.querySelector('.item-icon');
  iconElement.innerHTML = `<img src="/static/img/items/${iconPath}" alt="${name}" width="24" height="24" style="image-rendering: pixelated;">`;
  
  // Update pixel border
  const pixelBorder = previewElement.querySelector('.pixel-border');
  pixelBorder.className = `pixel-border ${rarity}`;
}

// Select an item for editing
function selectItem(itemId) {
  // Get the item
  const item = allItems.find(i => i.id === itemId);
  if (!item) return;
  
  // Update current item
  currentItem = item;
  
  // Update selection in the list
  document.querySelectorAll('.item-entry').forEach(el => {
    el.classList.remove('selected');
  });
  
  const selectedElement = document.querySelector(`.item-entry[data-id="${itemId}"]`);
  if (selectedElement) {
    selectedElement.classList.add('selected');
  }
  
  // Populate the form
  populateForm(item);
  
  // Update the preview
  updatePreview();
  
  // Select the appropriate icon in the grid
  selectIconInGrid(item.iconPath);
}

// Populate the form with item data
function populateForm(item) {
  // Core properties
  document.getElementById('item-id').value = item.id || '';
  document.getElementById('item-name').value = item.name || '';
  document.getElementById('item-type').value = item.itemType || 'consumable';
  document.getElementById('item-rarity').value = item.rarity || 'common';
  document.getElementById('item-description').value = item.description || '';
  
  // Toggle appropriate fields
  toggleItemTypeFields(item.itemType || 'consumable');
  
  // Type-specific fields
  if (item.itemType === 'relic') {
    document.getElementById('item-passive-text').value = item.passiveText || '';
  } else {
    document.getElementById('item-use-text').value = item.useText || '';
  }
  
  // Effect properties
  if (item.effect) {
    document.getElementById('effect-type').value = item.effect.type || 'heal';
    document.getElementById('effect-value').value = item.effect.value || '';
    document.getElementById('effect-duration').value = item.effect.duration || 'instant';
  } else {
    document.getElementById('effect-type').value = 'heal';
    document.getElementById('effect-value').value = '';
    document.getElementById('effect-duration').value = 'instant';
  }
  
  // Clear input validation errors
  clearInputErrors();
}

// Select the appropriate icon in the grid
function selectIconInGrid(iconPath) {
  document.querySelectorAll('.icon-grid-item').forEach(icon => {
    icon.classList.remove('selected');
    if (icon.dataset.icon === iconPath) {
      icon.classList.add('selected');
    }
  });
}

// Create a new item/relic
function createNewItem(type) {
  // Generate unique ID
  const baseId = type === 'relic' ? 'new_relic' : 'new_item';
  let id = baseId;
  let counter = 1;
  
  // Ensure the ID is unique
  while (allItems.some(item => item.id === id)) {
    id = `${baseId}_${counter}`;
    counter++;
  }
  
  // Create the new item
  const newItem = {
    id: id,
    name: type === 'relic' ? 'New Relic' : 'New Item',
    description: '',
    rarity: 'common',
    itemType: type,
    iconPath: 'default.png',
    effect: {
      type: type === 'relic' ? 'insight_gain' : 'heal',
      value: type === 'relic' ? '10' : '1',
      duration: type === 'relic' ? 'permanent' : 'instant'
    }
  };
  
  if (type === 'relic') {
    newItem.passiveText = 'Passive: Effect description';
  } else {
    newItem.useText = 'How to use this item';
  }
  
  // Add to items list
  allItems.push(newItem);
  
  // Add to unsaved changes
  unsavedChanges[id] = { ...newItem, isNew: true };
  
  // Re-render list
  renderItemList(allItems);
  
  // Select the new item
  selectItem(id);
  
  // Show message
  showStatusMessage(`New ${type} created! Remember to save your changes.`, 'success');
  
  // Update unsaved changes indicators
  updateUnsavedChangesIndicators();
}

// Clone the current item
function cloneCurrentItem() {
  if (!currentItem) {
    showStatusMessage('No item selected to clone', 'error');
    return;
  }
  
  // Generate unique ID
  const baseId = `${currentItem.id}_clone`;
  let id = baseId;
  let counter = 1;
  
  // Ensure the ID is unique
  while (allItems.some(item => item.id === id)) {
    id = `${baseId}_${counter}`;
    counter++;
  }
  
  // Clone the item with the new ID
  const clonedItem = {
    ...JSON.parse(JSON.stringify(currentItem)),
    id: id,
    name: `${currentItem.name} (Clone)`
  };
  
  // Add to items list
  allItems.push(clonedItem);
  
  // Add to unsaved changes
  unsavedChanges[id] = { ...clonedItem, isNew: true };
  
  // Re-render list
  renderItemList(allItems);
  
  // Select the cloned item
  selectItem(id);
  
  // Show message
  showStatusMessage('Item cloned! Remember to save your changes.', 'success');
  
  // Update unsaved changes indicators
  updateUnsavedChangesIndicators();
}

// Delete the current item
function deleteCurrentItem() {
  if (!currentItem) {
    showStatusMessage('No item selected to delete', 'error');
    return;
  }
  
  // Create a custom modal for deletion confirmation
  const modalHTML = `
    <div class="delete-confirmation-modal">
      <div class="delete-modal-content">
        <h3>Delete Item</h3>
        <p>Are you sure you want to delete "${currentItem.name}"?</p>
        <p><strong>This action cannot be undone!</strong></p>
        
        <div class="delete-modal-buttons">
          <button id="cancel-delete-btn" class="retro-btn">Cancel</button>
          <button id="confirm-delete-btn" class="retro-btn danger">Delete Item</button>
        </div>
      </div>
    </div>
  `;
  
  // Add modal to DOM
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  // Set up event listeners
  document.getElementById('cancel-delete-btn').addEventListener('click', () => {
    // Remove the modal
    document.querySelector('.delete-confirmation-modal').remove();
  });
  
  document.getElementById('confirm-delete-btn').addEventListener('click', () => {
    const itemId = currentItem.id;
    
    // Remove from items list
    allItems = allItems.filter(item => item.id !== itemId);
    
    // Add to delete queue (if not a new unsaved item)
    if (!unsavedChanges[itemId]?.isNew) {
      unsavedChanges[itemId] = { id: itemId, deleted: true };
    } else {
      // If it was a new item, just remove it from changes
      delete unsavedChanges[itemId];
    }
    
    // Reset current item
    currentItem = null;
    
    // Re-render list
    renderItemList(allItems);
    
    // Clear form
    document.getElementById('item-id').value = '';
    document.getElementById('item-name').value = '';
    document.getElementById('item-description').value = '';
    
    // Remove the modal
    document.querySelector('.delete-confirmation-modal').remove();
    
    // Show success message
    showStatusMessage('Item deleted! Remember to save your changes.', 'success');
    
    // Update unsaved changes indicators
    updateUnsavedChangesIndicators();
  });
}

// Track changes to form fields
function trackChanges() {
  if (!currentItem) return;
  
  // Get all form values
  const formData = getFormData();
  
  // Only track if there are actual changes
  if (JSON.stringify(formData) !== JSON.stringify(currentItem)) {
    // Create a copy with changes
    const updatedItem = { ...formData };
    
    // Keep track of isNew flag if it exists
    if (unsavedChanges[currentItem.id]?.isNew) {
      updatedItem.isNew = true;
    }
    
    // Add to unsaved changes
    unsavedChanges[currentItem.id] = updatedItem;
    
    // Update the current item (for immediate visual feedback)
    Object.assign(currentItem, formData);
    
    // Update preview
    updatePreview();
    
    // Update unsaved changes indicators
    updateUnsavedChangesIndicators();
    
    // Start auto-save timer
    startAutoSaveTimer();
  }
}

// Get all form data as an object
function getFormData() {
  const data = {
    id: document.getElementById('item-id').value,
    name: document.getElementById('item-name').value,
    description: document.getElementById('item-description').value,
    rarity: document.getElementById('item-rarity').value,
    itemType: document.getElementById('item-type').value,
    iconPath: currentItem?.iconPath || 'default.png',
    effect: {
      type: document.getElementById('effect-type').value,
      value: document.getElementById('effect-value').value,
      duration: document.getElementById('effect-duration').value
    }
  };
  
  // Type-specific fields
  if (data.itemType === 'relic') {
    data.passiveText = document.getElementById('item-passive-text').value;
  } else {
    data.useText = document.getElementById('item-use-text').value;
  }
  
  return data;
}

// IMPROVED: Save the current item - fixed to prevent duplicates
async function saveCurrentItem() {
  if (!currentItem) {
    showStatusMessage('No item selected to save', 'error');
    return;
  }
  
  // Get form data
  const formData = getFormData();
  const oldId = currentItem.id;
  const idChanged = formData.id !== oldId;
  
  try {
    // Save to server
    const response = await fetch('/api/editor/save-item', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });
    
    const data = await response.json();
    
    if (data.success) {
      // If old ID exists in unsaved changes, remove it
      if (unsavedChanges[oldId]) {
        delete unsavedChanges[oldId];
      }
      
      if (idChanged) {
        // Find and remove the old item from allItems
        allItems = allItems.filter(item => item.id !== oldId);
        
        // Add the new item to allItems
        allItems.push(formData);
        
        // Update currentItem to the new item
        currentItem = {...formData};
        
        // Re-render the entire list to reflect changes
        renderItemList(allItems);
        
        // Select the new item
        setTimeout(() => {
          // Add a small delay to ensure DOM is updated
          selectItem(formData.id);
        }, 50);
        
        showStatusMessage(`Item saved and ID updated from ${oldId} to ${formData.id}!`, 'success');
      } else {
        // Update the current item in allItems array
        const index = allItems.findIndex(item => item.id === oldId);
        if (index !== -1) {
          allItems[index] = {...formData};
        }
        
        // Update currentItem as a new object to avoid reference issues
        currentItem = {...formData};
        
        // Update just this item in the list for efficiency
        updateItemInList(formData);
        
        showStatusMessage('Item saved successfully!', 'success');
      }
      
      // Clear auto-save timer
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
        autoSaveTimer = null;
      }
      
      // Update unsaved changes indicators
      updateUnsavedChangesIndicators();
    } else {
      showStatusMessage('Error saving item: ' + data.error, 'error');
    }
  } catch (error) {
    console.error('Error saving item:', error);
    showStatusMessage('Failed to save item. Check console for details.', 'error');
  }
}

// IMPROVED: Save all changes
async function saveAllChanges() {
  if (Object.keys(unsavedChanges).length === 0) {
    showStatusMessage('No changes to save', 'info');
    return;
  }
  
  try {
    // Save all changes to server
    const response = await fetch('/api/editor/save-all', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ changes: unsavedChanges })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Clear unsaved changes
      unsavedChanges = {};
      
      // Reload all items from server to ensure consistency
      await fetchItems();
      
      // Reselect current item if it still exists
      if (currentItem && currentItem.id) {
        const stillExists = allItems.some(item => item.id === currentItem.id);
        if (stillExists) {
          selectItem(currentItem.id);
        } else {
          // Current item was deleted or ID changed, reset form
          currentItem = null;
          document.getElementById('item-id').value = '';
          document.getElementById('item-name').value = '';
          document.getElementById('item-description').value = '';
        }
      }
      
      // Clear any auto-save timer
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
        autoSaveTimer = null;
      }
      
      // Clear localStorage backup
      localStorage.removeItem('itemEditorUnsavedChanges');
      
      // Update unsaved changes indicators
      updateUnsavedChangesIndicators();
      
      showStatusMessage(`All changes saved successfully!`, 'success');
    } else {
      showStatusMessage('Error saving changes: ' + data.error, 'error');
    }
  } catch (error) {
    console.error('Error saving changes:', error);
    showStatusMessage('Failed to save changes. Check console for details.', 'error');
  }
}

// NEW: Helper function to update a single item in the list
function updateItemInList(item) {
  const itemElement = document.querySelector(`.item-entry[data-id="${item.id}"]`);
  if (!itemElement) return;
  
  // Update item display
  const nameElement = itemElement.querySelector('.item-entry-name');
  if (nameElement) nameElement.textContent = item.name;
  
  // Update icon if needed
  const iconElement = itemElement.querySelector('.item-entry-icon img');
  if (iconElement) {
    iconElement.src = `/static/img/items/${item.iconPath || 'default.png'}`;
    iconElement.alt = item.name;
  }
  
  // Ensure the item has proper event listener
  // First remove existing listeners by cloning and replacing
  const newElement = itemElement.cloneNode(true);
  newElement.addEventListener('click', () => selectItem(item.id));
  itemElement.parentNode.replaceChild(newElement, itemElement);
}

// Upload a new icon
async function uploadIcon() {
  const input = document.getElementById('icon-upload-input');
  const file = input.files[0];
  
  if (!file) return;
  
  // Check if it's a PNG file
  if (!file.type.includes('png')) {
    showStatusMessage('Only PNG files are supported', 'error');
    return;
  }
  
  // Create form data
  const formData = new FormData();
  formData.append('icon', file);
  
  try {
    // Upload to server
    const response = await fetch('/api/editor/upload-icon', {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Add to icons list
      iconFiles.push(data.filename);
      
      // Re-render icon grid
      renderIconGrid(iconFiles);
      
      // Select the new icon
      selectIcon(data.filename);
      
      // Reset file input
      input.value = '';
      
      showStatusMessage('Icon uploaded successfully!', 'success');
    } else {
      showStatusMessage('Error uploading icon: ' + data.error, 'error');
    }
  } catch (error) {
    console.error('Error uploading icon:', error);
    showStatusMessage('Failed to upload icon. Check console for details.', 'error');
  }
}

// Show a status message
function showStatusMessage(message, type = 'info') {
  const statusElement = document.getElementById('status-message');
  statusElement.textContent = message;
  statusElement.className = `status-message ${type}`;
  statusElement.style.display = 'block';
  
  // Auto-hide after a delay
  setTimeout(() => {
    statusElement.style.display = 'none';
  }, 3000);
}

// Toast notification (similar to status message but can have multiple)
function showToast(message, type = 'info') {
  const toastContainer = document.querySelector('.toast-container');
  if (!toastContainer) return;
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  
  toastContainer.appendChild(toast);
  
  // Auto-remove after delay
  setTimeout(() => {
    toast.classList.add('toast-hide');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 3000);
}

// Helper: Get base price for an item based on rarity (used for preview)
function getItemBasePrice(rarity) {
  switch(rarity) {
    case 'common': return 15;
    case 'uncommon': return 30;
    case 'rare': return 50;
    case 'epic': return 80;
    default: return 20;
  }
}

// Clear all input validation errors
function clearInputErrors() {
  document.querySelectorAll('.form-group input, .form-group select, .form-group textarea').forEach(el => {
    el.classList.remove('invalid');
    
    // Remove error message if exists
    const errorElement = el.parentNode.querySelector('.input-error');
    if (errorElement) {
      errorElement.remove();
    }
  });
}

// ========== UNSAVED CHANGES INDICATOR ==========

function updateUnsavedChangesIndicators() {
  // Clear all existing indicators
  document.querySelectorAll('.unsaved-indicator').forEach(el => el.remove());
  
  // Add indicators to items with unsaved changes
  Object.keys(unsavedChanges).forEach(itemId => {
    const itemElement = document.querySelector(`.item-entry[data-id="${itemId}"]`);
    if (!itemElement) return;
    
    // Don't add indicator for deleted items
    if (unsavedChanges[itemId].deleted) return;
    
    // Create and add indicator
    const indicator = document.createElement('div');
    indicator.className = 'unsaved-indicator';
    indicator.title = 'Unsaved changes';
    indicator.innerHTML = '*';
    
    itemElement.appendChild(indicator);
  });
  
  // Update the save all button to show count of unsaved changes
  const saveAllBtn = document.getElementById('save-all-btn');
  const count = Object.keys(unsavedChanges).length;
  
  if (count > 0) {
    saveAllBtn.textContent = `Save All Changes (${count})`;
    saveAllBtn.classList.add('pulse-animation');
  } else {
    saveAllBtn.textContent = 'Save All Changes';
    saveAllBtn.classList.remove('pulse-animation');
  }
}

// ========== KEYBOARD SHORTCUTS ==========

function setupKeyboardShortcuts() {
  document.addEventListener('keydown', function(e) {
    // Only process if not in input field
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    
    // Ctrl/Cmd + S: Save current item
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      if (currentItem) saveCurrentItem();
    }
    
    // Ctrl/Cmd + D: Clone current item
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
      e.preventDefault();
      if (currentItem) cloneCurrentItem();
    }
    
    // Delete: Delete current item (with confirmation)
    if (e.key === 'Delete' && currentItem) {
      e.preventDefault();
      deleteCurrentItem();
    }
    
    // Ctrl/Cmd + N: New item
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
      e.preventDefault();
      createNewItem('consumable');
    }
    
    // Ctrl/Cmd + Shift + N: New relic
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'N') {
      e.preventDefault();
      createNewItem('relic');
    }
  });
}

// ========== AUTO-SAVE FUNCTIONALITY ==========

function setupAutoSave() {
  // Clear existing timer when setting up
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer);
    autoSaveTimer = null;
  }
  
  // Add auto-save to all form fields
  document.querySelectorAll('.form-group input, .form-group select, .form-group textarea').forEach(el => {
    el.addEventListener('change', startAutoSaveTimer);
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.addEventListener('input', startAutoSaveTimer);
    }
  });
}

function startAutoSaveTimer() {
  // Clear existing timer
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer);
  }
  
  // Only start timer if we have a current item
  if (!currentItem) return;
  
  // Start a new timer
  autoSaveTimer = setTimeout(() => {
    // Only auto-save if there are changes
    if (unsavedChanges[currentItem.id]) {
      saveCurrentItem()
        .then(() => {
          showToast('Item auto-saved', 'info');
        })
        .catch(error => {
          console.error('Auto-save failed:', error);
        });
    }
  }, AUTO_SAVE_DELAY);
}

// ========== BULK OPERATIONS ==========

function setupBulkOperations() {
  // Add multi-select toggle button
  const controlsDiv = document.querySelector('.filter-controls');
  const multiSelectBtn = document.createElement('button');
  multiSelectBtn.id = 'multi-select-btn';
  multiSelectBtn.className = 'multi-select-btn';
  multiSelectBtn.textContent = 'Multi-Select';
  multiSelectBtn.addEventListener('click', toggleMultiSelectMode);
  controlsDiv.appendChild(multiSelectBtn);
  
  // Add bulk operations menu (initially hidden)
  const bulkMenu = document.createElement('div');
  bulkMenu.id = 'bulk-operations';
  bulkMenu.className = 'bulk-operations';
  bulkMenu.style.display = 'none';
  bulkMenu.innerHTML = `
    <button id="bulk-delete-btn" class="retro-btn danger">Delete Selected</button>
    <button id="bulk-rarity-btn" class="retro-btn">Change Rarity</button>
    <select id="bulk-rarity-select" class="bulk-select">
      <option value="common">Common</option>
      <option value="uncommon">Uncommon</option>
      <option value="rare">Rare</option>
      <option value="epic">Epic</option>
    </select>
  `;
  document.querySelector('.item-sidebar').appendChild(bulkMenu);
  
  // Set up event listeners for bulk actions
  document.getElementById('bulk-delete-btn').addEventListener('click', bulkDeleteItems);
  document.getElementById('bulk-rarity-btn').addEventListener('click', bulkChangeRarity);
}

function toggleMultiSelectMode() {
  isMultiSelectMode = !isMultiSelectMode;
  const multiSelectBtn = document.getElementById('multi-select-btn');
  const bulkOperations = document.getElementById('bulk-operations');
  
  if (isMultiSelectMode) {
    // Enable mode
    multiSelectBtn.classList.add('active');
    multiSelectBtn.textContent = 'Done';
    bulkOperations.style.display = 'flex';
    document.body.classList.add('multi-select-mode');
    
    // Clear selection
    selectedItems.clear();
    updateSelectionIndicators();
    
    // Re-render items with multi-select handlers
    renderItemList(allItems);
  } else {
    // Disable mode
    multiSelectBtn.classList.remove('active');
    multiSelectBtn.textContent = 'Multi-Select';
    bulkOperations.style.display = 'none';
    document.body.classList.remove('multi-select-mode');
    
    // Reset to normal item click behavior
    renderItemList(allItems);
    
    // Reselect current item if any
    if (currentItem) {
      selectItem(currentItem.id);
    }
  }
}

function updateSelectionIndicators() {
  // Update item elements
  document.querySelectorAll('.item-entry').forEach(el => {
    if (selectedItems.has(el.dataset.id)) {
      el.classList.add('multi-selected');
    } else {
      el.classList.remove('multi-selected');
    }
  });
  
  // Update bulk action buttons
  const bulkDeleteBtn = document.getElementById('bulk-delete-btn');
  bulkDeleteBtn.textContent = `Delete Selected (${selectedItems.size})`;
  bulkDeleteBtn.disabled = selectedItems.size === 0;
  
  const bulkRarityBtn = document.getElementById('bulk-rarity-btn');
  bulkRarityBtn.textContent = `Change Rarity (${selectedItems.size})`;
  bulkRarityBtn.disabled = selectedItems.size === 0;
}

function bulkDeleteItems() {
  if (selectedItems.size === 0) return;
  
  // Show confirmation
  const modalHTML = `
    <div class="delete-confirmation-modal">
      <div class="delete-modal-content">
        <h3>Delete Items</h3>
        <p>Are you sure you want to delete ${selectedItems.size} item(s)?</p>
        <p><strong>This action cannot be undone!</strong></p>
        
        <div class="delete-modal-buttons">
          <button id="cancel-bulk-delete-btn" class="retro-btn">Cancel</button>
          <button id="confirm-bulk-delete-btn" class="retro-btn danger">Delete ${selectedItems.size} Items</button>
        </div>
      </div>
    </div>
  `;
  
  // Add modal to DOM
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  // Set up event listeners
  document.getElementById('cancel-bulk-delete-btn').addEventListener('click', () => {
    document.querySelector('.delete-confirmation-modal').remove();
  });
  
  document.getElementById('confirm-bulk-delete-btn').addEventListener('click', () => {
    // Process deletion
    selectedItems.forEach(itemId => {
      // Find the item
      const item = allItems.find(i => i.id === itemId);
      if (!item) return;
      
      // Add to delete queue (if not a new unsaved item)
      if (!unsavedChanges[itemId]?.isNew) {
        unsavedChanges[itemId] = { id: itemId, deleted: true };
      } else {
        // If it was a new item, just remove it from changes
        delete unsavedChanges[itemId];
      }
    });
    
    // Remove from items list
    allItems = allItems.filter(item => !selectedItems.has(item.id));
    
    // Reset current item if it was deleted
    if (currentItem && selectedItems.has(currentItem.id)) {
      currentItem = null;
      // Clear form
      document.getElementById('item-id').value = '';
      document.getElementById('item-name').value = '';
      document.getElementById('item-description').value = '';
    }
    
    // Re-render list
    renderItemList(allItems);
    
    // Clear selection
    selectedItems.clear();
    
    // Remove the modal
    document.querySelector('.delete-confirmation-modal').remove();
    
    // Exit multi-select mode
    toggleMultiSelectMode();
    
    // Show success message
    showStatusMessage(`${selectedItems.size} items deleted! Remember to save your changes.`, 'success');
    
    // Update changes indicators
    updateUnsavedChangesIndicators();
  });
}

function bulkChangeRarity() {
  if (selectedItems.size === 0) return;
  
  const newRarity = document.getElementById('bulk-rarity-select').value;
  
  // Apply rarity change to all selected items
  selectedItems.forEach(itemId => {
    // Find the item
    const item = allItems.find(i => i.id === itemId);
    if (!item) return;
    
    // Update rarity
    item.rarity = newRarity;
    
    // Add to unsaved changes
    if (unsavedChanges[itemId]) {
      unsavedChanges[itemId].rarity = newRarity;
    } else {
      unsavedChanges[itemId] = { ...item };
    }
  });
  
  // Re-render list
  renderItemList(allItems);
  
  // Update current item if it was affected
  if (currentItem && selectedItems.has(currentItem.id)) {
    currentItem.rarity = newRarity;
    document.getElementById('item-rarity').value = newRarity;
    updatePreview();
  }
  
  // Show success message
  showStatusMessage(`Rarity updated for ${selectedItems.size} items! Remember to save your changes.`, 'success');
  
  // Exit multi-select mode
  toggleMultiSelectMode();
  
  // Update changes indicators
  updateUnsavedChangesIndicators();
}

// ========== DRAG & DROP FOR ICONS ==========

function setupDragAndDrop() {
  const iconGrid = document.getElementById('icon-grid');
  
  // Set up event listeners
  iconGrid.addEventListener('dragover', e => {
    e.preventDefault();
    iconGrid.classList.add('drag-over');
  });
  
  iconGrid.addEventListener('dragleave', () => {
    iconGrid.classList.remove('drag-over');
  });
  
  iconGrid.addEventListener('drop', e => {
    e.preventDefault();
    iconGrid.classList.remove('drag-over');
    
    // Process dropped files
    if (e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      
      // Check if it's a PNG file
      if (file.type.includes('png')) {
        // Set the file input value and trigger the upload
        const input = document.getElementById('icon-upload-input');
        input.files = e.dataTransfer.files;
        uploadIcon();
      } else {
        showStatusMessage('Only PNG files are supported', 'error');
      }
    }
  });
}

// ========== ADVANCED SEARCH AND FILTER ==========

function setupAdvancedSearch() {
  // Add filter button next to search
  const searchBar = document.querySelector('.search-bar');
  searchBar.style.display = 'flex';
  
  const filterBtn = document.createElement('button');
  filterBtn.id = 'advanced-filter-btn';
  filterBtn.className = 'filter-btn';
  filterBtn.innerHTML = '<i class="fas fa-filter"></i>';
  filterBtn.title = 'Advanced Filters';
  filterBtn.addEventListener('click', toggleAdvancedFilters);
  
  searchBar.appendChild(filterBtn);
  
  // Create advanced filter panel (initially hidden)
  const filterPanel = document.createElement('div');
  filterPanel.id = 'advanced-filter-panel';
  filterPanel.className = 'advanced-filter-panel';
  filterPanel.style.display = 'none';
  
  filterPanel.innerHTML = `
    <div class="filter-section">
      <h4>Filter by Rarity</h4>
      <div class="checkbox-group">
        <label><input type="checkbox" class="rarity-filter" value="common" checked> Common</label>
        <label><input type="checkbox" class="rarity-filter" value="uncommon" checked> Uncommon</label>
        <label><input type="checkbox" class="rarity-filter" value="rare" checked> Rare</label>
        <label><input type="checkbox" class="rarity-filter" value="epic" checked> Epic</label>
      </div>
    </div>
    
    <div class="filter-section">
      <h4>Filter by Effect</h4>
      <div class="checkbox-group">
        <label><input type="checkbox" class="effect-filter" value="heal" checked> Heal</label>
        <label><input type="checkbox" class="effect-filter" value="insight_gain" checked> Insight Gain</label>
        <label><input type="checkbox" class="effect-filter" value="retry" checked> Retry</label>
        <label><input type="checkbox" class="effect-filter" value="category_boost" checked> Category Boost</label>
        <label><input type="checkbox" class="effect-filter" value="extra_life" checked> Extra Life</label>
        <label><input type="checkbox" class="effect-filter" value="defense" checked> Defense</label>
        <label><input type="checkbox" class="effect-filter" value="custom" checked> Custom</label>
      </div>
    </div>
    
    <div class="filter-actions">
      <button id="apply-filters-btn" class="retro-btn small">Apply Filters</button>
      <button id="reset-filters-btn" class="retro-btn small secondary">Reset</button>
    </div>
  `;
  
  document.querySelector('.filter-controls').appendChild(filterPanel);
  
  // Set up event listeners
  document.getElementById('apply-filters-btn').addEventListener('click', applyAdvancedFilters);
  document.getElementById('reset-filters-btn').addEventListener('click', resetAdvancedFilters);
}

function toggleAdvancedFilters() {
  const filterPanel = document.getElementById('advanced-filter-panel');
  filterPanel.style.display = filterPanel.style.display === 'none' ? 'block' : 'none';
}

function applyAdvancedFilters() {
  // Get selected rarities
  const selectedRarities = Array.from(document.querySelectorAll('.rarity-filter:checked'))
    .map(cb => cb.value);
    
  // Get selected effect types
  const selectedEffects = Array.from(document.querySelectorAll('.effect-filter:checked'))
    .map(cb => cb.value);
  
  // Get search term
  const searchTerm = document.getElementById('search-input').value.toLowerCase();
  
  // Get tab type
  const type = getActiveTabType();
  
  // Filter items
  let filteredItems = [...allItems];
  
  // Filter by type
  if (type !== 'all') {
    filteredItems = filteredItems.filter(item => 
      type === 'relic' ? item.itemType === 'relic' : item.itemType !== 'relic'
    );
  }
  
  // Filter by search term
  if (searchTerm) {
    filteredItems = filteredItems.filter(item => 
      item.name.toLowerCase().includes(searchTerm) || 
      item.id.toLowerCase().includes(searchTerm) ||
      (item.description && item.description.toLowerCase().includes(searchTerm))
    );
  }
  
  // Filter by rarity
  filteredItems = filteredItems.filter(item => 
    selectedRarities.includes(item.rarity || 'common')
  );
  
  // Filter by effect type
  filteredItems = filteredItems.filter(item => 
    !item.effect || !item.effect.type || selectedEffects.includes(item.effect.type)
  );
  
  // Re-render the list
  renderItemList(filteredItems);
  
  // Maintain selection if possible
  if (currentItem) {
    const selectedElement = document.querySelector(`.item-entry[data-id="${currentItem.id}"]`);
    if (selectedElement) {
      selectedElement.classList.add('selected');
    }
  }
  
  // Hide filter panel
  toggleAdvancedFilters();
}

function resetAdvancedFilters() {
  // Reset all checkboxes
  document.querySelectorAll('.rarity-filter, .effect-filter').forEach(cb => {
    cb.checked = true;
  });
  
  // Clear search
  document.getElementById('search-input').value = '';
  
  // Re-render with all items
  renderItemList(allItems);
  
  // Maintain selection if possible
  if (currentItem) {
    const selectedElement = document.querySelector(`.item-entry[data-id="${currentItem.id}"]`);
    if (selectedElement) {
      selectedElement.classList.add('selected');
    }
  }
}

// ========== ITEM PREVIEW IN GAME CONTEXT ==========

function setupGamePreview() {
  // Add preview button
  const previewSection = document.querySelector('.preview-container');
  
  const previewBtn = document.createElement('button');
  previewBtn.id = 'game-preview-btn';
  previewBtn.className = 'retro-btn small';
  previewBtn.textContent = 'Preview In-Game';
  previewBtn.addEventListener('click', showGamePreview);
  
  previewSection.appendChild(previewBtn);
}

function showGamePreview() {
  if (!currentItem) {
    showStatusMessage('No item selected to preview', 'error');
    return;
  }
  
  // Create preview modal
  const modalHTML = `
    <div class="preview-modal-overlay">
      <div class="preview-modal-content">
        <div class="preview-modal-header">
          <h3>In-Game Preview</h3>
          <button class="close-modal-btn">&times;</button>
        </div>
        
        <div class="preview-tabs">
          <button class="preview-tab-btn active" data-tab="inventory">Inventory</button>
          <button class="preview-tab-btn" data-tab="treasure">Treasure Room</button>
          <button class="preview-tab-btn" data-tab="shop">Shop</button>
        </div>
        
        <div class="preview-tab-content" id="inventory-preview">
          <!-- Render inventory view -->
          <div class="inventory-preview-container">
            <div class="inventory-grid">
              ${generateInventoryPreview()}
            </div>
            <div class="inventory-detail">
              ${generateItemDetailPreview()}
            </div>
          </div>
        </div>
        
        <div class="preview-tab-content" id="treasure-preview" style="display: none;">
          <!-- Render treasure room view -->
          ${generateTreasurePreview()}
        </div>
        
        <div class="preview-tab-content" id="shop-preview" style="display: none;">
          <!-- Render shop view -->
          ${generateShopPreview()}
        </div>
      </div>
    </div>
  `;
  
  // Add to DOM
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  // Set up event listeners
  document.querySelector('.close-modal-btn').addEventListener('click', () => {
    document.querySelector('.preview-modal-overlay').remove();
  });
  
  // Tab switching
  document.querySelectorAll('.preview-tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      // Update active tab
      document.querySelectorAll('.preview-tab-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      
      // Hide all content
      document.querySelectorAll('.preview-tab-content').forEach(content => {
        content.style.display = 'none';
      });
      
      // Show selected content
      const tabId = this.dataset.tab + '-preview';
      document.getElementById(tabId).style.display = 'block';
    });
  });
}

function generateInventoryPreview() {
  // Create a fake inventory with the current item and some placeholders
  let html = '';
  
  // Add some placeholder items
  for (let i = 0; i < 9; i++) {
    if (i === 4) {
      // Middle slot is the current item
      html += `
        <div class="inventory-slot selected">
          <div class="inventory-item ${currentItem.rarity || 'common'}">
            <div class="item-inner">
              <div class="item-icon">
                <img src="/static/img/items/${currentItem.iconPath || 'default.png'}" 
                     alt="${currentItem.name}" width="24" height="24"
                     style="image-rendering: pixelated;">
              </div>
              <div class="item-glow"></div>
            </div>
            <div class="pixel-border ${currentItem.rarity || 'common'}">
              <div class="pixel-corner top-left"></div>
              <div class="pixel-corner top-right"></div>
              <div class="pixel-corner bottom-left"></div>
              <div class="pixel-corner bottom-right"></div>
            </div>
          </div>
        </div>
      `;
    } else {
      // Random placeholder or empty
      const empty = Math.random() > 0.6;
      
      if (empty) {
        html += `<div class="inventory-slot empty"></div>`;
      } else {
        const rarities = ['common', 'uncommon', 'rare', 'epic'];
        const rarity = rarities[Math.floor(Math.random() * rarities.length)];
        
        html += `
          <div class="inventory-slot">
            <div class="inventory-item ${rarity}">
              <div class="item-inner">
                <div class="item-icon">
                  <img src="/static/img/items/default.png" 
                       alt="Placeholder" width="24" height="24"
                       style="image-rendering: pixelated;">
                </div>
                <div class="item-glow"></div>
              </div>
              <div class="pixel-border ${rarity}">
                <div class="pixel-corner top-left"></div>
                <div class="pixel-corner top-right"></div>
                <div class="pixel-corner bottom-left"></div>
                <div class="pixel-corner bottom-right"></div>
              </div>
            </div>
          </div>
        `;
      }
    }
  }
  
  return html;
}

function generateItemDetailPreview() {
  const effectDescription = getEffectDescription(currentItem.effect);
  
  return `
    <div class="item-detail-card ${currentItem.rarity || 'common'}">
      <div class="item-detail-header">
        <h4>${currentItem.name}</h4>
        <span class="rarity-badge ${currentItem.rarity || 'common'}">${currentItem.rarity || 'common'}</span>
      </div>
      
      <div class="item-detail-body">
        <div class="item-detail-icon">
          <img src="/static/img/items/${currentItem.iconPath || 'default.png'}" 
               alt="${currentItem.name}" width="48" height="48"
               style="image-rendering: pixelated;">
        </div>
        
        <div class="item-detail-desc">
          <p>${currentItem.description || 'No description available.'}</p>
          
          <div class="item-detail-effect">
            <span class="effect-label">Effect:</span>
            <span class="effect-text">${effectDescription}</span>
          </div>
        </div>
      </div>
      
      <div class="item-detail-footer">
        <button class="game-btn game-btn--secondary">Use Item</button>
      </div>
    </div>
  `;
}

function generateTreasurePreview() {
  const item = currentItem;
  const itemRarity = item.rarity || 'common';
  
  return `
    <div class="game-panel anim-fade-in">
      <div class="text-center mb-md">
        <h3 class="text-warning glow-text anim-pulse-warning">Treasure Found!</h3>
      </div>
      
      <div class="game-card game-card--${itemRarity} shadow-md mb-lg">
        <div class="game-card__header">
          <h4 class="game-card__title">${item.name}</h4>
          <span class="rarity-badge rarity-badge-${itemRarity}">${itemRarity}</span>
        </div>
        
        <div class="game-card__body flex">
          <div class="flex-shrink-0 mr-md">
            <div class="item-icon item-icon--${itemRarity}">
              <img src="/static/img/items/${item.iconPath || 'default.png'}" 
                   alt="${item.name}" width="32" height="32"
                   style="image-rendering: pixelated;">
            </div>
          </div>
          
          <div class="flex-grow">
            <p class="mb-sm">${item.description || 'No description available.'}</p>
            
            <div class="item-tooltip__effect mt-md">
              <span class="text-primary">Effect:</span>
              <span>${getEffectDescription(item.effect)}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="flex gap-md">
        <button class="game-btn game-btn--secondary flex-1 anim-pulse-scale">
          Take Item
        </button>
        <button class="game-btn game-btn--primary flex-1">
          Leave It
        </button>
      </div>
    </div>
  `;
}

function generateShopPreview() {
  const item = currentItem;
  const rarity = item.rarity || 'common';
  const price = getItemBasePrice(rarity);
  
  return `
    <div class="game-panel shadow-md anim-fade-in">
      <div class="game-panel__title flex justify-between items-center">
        <h3>Department Store</h3>
        <div class="badge badge-warning px-md">
          <span class="text-sm">Available Insight:</span>
          <span class="text-md ml-xs">50</span>
        </div>
      </div>
      
      <p class="text-light mb-md">Browse and purchase items using your insight points.</p>
      
      <div class="grid grid-cols-auto-fill gap-md mb-lg">
        <div class="game-card rarity-${rarity} anim-fade-in">
          <div class="game-card__header">
            <h5 class="game-card__title">${item.name}</h5>
            <span class="badge badge-primary">
              ${price} Insight
            </span>
          </div>
          
          <div class="game-card__body">
            <div class="flex mb-sm">
              <div class="item-icon item-icon--${rarity} mr-sm">
                <img src="/static/img/items/${item.iconPath || 'default.png'}" 
                     alt="${item.name}" width="32" height="32"
                     style="image-rendering: pixelated;">
              </div>
              <div>
                <span class="badge rarity-badge-${rarity} mb-xs">${rarity}</span>
                <p class="text-sm">${item.description || 'No description available.'}</p>
              </div>
            </div>
            
            <div class="item-effect p-xs rounded-sm bg-dark-alt">
              ${getEffectDescription(item.effect)}
            </div>
          </div>
          
          <div class="game-card__footer">
            <button class="game-btn game-btn--secondary w-full">
              Purchase
            </button>
          </div>
        </div>
        
        <!-- Add some placeholder items -->
        ${generatePlaceholderShopItems()}
      </div>
      
      <button class="game-btn game-btn--primary w-full">
        Leave Shop
      </button>
    </div>
  `;
}

function generatePlaceholderShopItems() {
  const rarities = ['common', 'uncommon', 'rare'];
  let html = '';
  
  for (let i = 0; i < 2; i++) {
    const rarity = rarities[Math.floor(Math.random() * rarities.length)];
    const price = getItemBasePrice(rarity);
    
    html += `
      <div class="game-card rarity-${rarity} anim-fade-in">
        <div class="game-card__header">
          <h5 class="game-card__title">Placeholder Item</h5>
          <span class="badge badge-primary">
            ${price} Insight
          </span>
        </div>
        
        <div class="game-card__body">
          <div class="flex mb-sm">
            <div class="item-icon item-icon--${rarity} mr-sm">
              <img src="/static/img/items/default.png" 
                   alt="Placeholder" width="32" height="32"
                   style="image-rendering: pixelated;">
            </div>
            <div>
              <span class="badge rarity-badge-${rarity} mb-xs">${rarity}</span>
              <p class="text-sm">This is a placeholder item description.</p>
            </div>
          </div>
          
          <div class="item-effect p-xs rounded-sm bg-dark-alt">
            Sample effect description
          </div>
        </div>
        
        <div class="game-card__footer">
          <button class="game-btn game-btn--secondary w-full">
            Purchase
          </button>
        </div>
      </div>
    `;
  }
  
  return html;
}

function getEffectDescription(effect) {
  if (!effect || !effect.type) return 'No effect';
  
  switch(effect.type) {
    case 'heal':
      return `Restore ${effect.value || '1'} lives`;
    case 'insight_gain':
      return `Gain ${effect.value || '10'} insight`;
    case 'retry':
      return 'Retry the current question';
    case 'category_boost':
      return `+${effect.value || '10%'} bonus to ${effect.category || 'all'} questions`;
    case 'extra_life':
      return `Gain ${effect.value || '1'} maximum lives`;
    case 'defense':
      return `Reduce damage by ${effect.value || '10%'}`;
    case 'custom':
      return effect.value || 'Custom effect';
    default:
      return effect.value || 'Unknown effect';
  }
}

// ========== DATA AUTOSAVE/RECOVERY ==========

function setupDataRecovery() {
  // When changes are tracked, save to localStorage
  const saveToLocalStorage = () => {
    localStorage.setItem('itemEditorUnsavedChanges', JSON.stringify(unsavedChanges));
  };
  
  // Add save to localStorage to trackChanges
  const originalTrackChanges = trackChanges;
  window.originalTrackChanges = trackChanges; // For debugging
  trackChanges = function() {
    originalTrackChanges.apply(this, arguments);
    saveToLocalStorage();
  };
  
  // When the page loads, check for unsaved changes
  const savedChanges = localStorage.getItem('itemEditorUnsavedChanges');
  if (savedChanges) {
    try {
      const parsedChanges = JSON.parse(savedChanges);
      
      // Only restore if there are changes
      if (Object.keys(parsedChanges).length > 0) {
        // Show recovery dialog
        const modalHTML = `
          <div class="delete-confirmation-modal">
            <div class="delete-modal-content">
              <h3>Recover Unsaved Changes?</h3>
              <p>We found unsaved changes from your previous session.</p>
              <p>Would you like to restore them?</p>
              
              <div class="delete-modal-buttons">
                <button id="discard-changes-btn" class="retro-btn">Discard</button>
                <button id="restore-changes-btn" class="retro-btn start">Restore Changes</button>
              </div>
            </div>
          </div>
        `;
        
        // Add modal to DOM after a short delay to ensure page is loaded
        setTimeout(() => {
          document.body.insertAdjacentHTML('beforeend', modalHTML);
          
          // Set up event listeners
          document.getElementById('discard-changes-btn').addEventListener('click', () => {
            // Clear saved changes
            localStorage.removeItem('itemEditorUnsavedChanges');
            document.querySelector('.delete-confirmation-modal').remove();
          });
          
          document.getElementById('restore-changes-btn').addEventListener('click', () => {
            // Restore changes
            unsavedChanges = parsedChanges;
            
            // Update UI to reflect changes
            updateUnsavedChangesIndicators();
            
            // Process changes for new and modified items
            Object.keys(unsavedChanges).forEach(itemId => {
              const change = unsavedChanges[itemId];
              
              // Skip deleted items
              if (change.deleted) return;
              
              // Find existing item
              const existingItem = allItems.find(item => item.id === itemId);
              
              if (existingItem) {
                // Update existing item
                Object.assign(existingItem, change);
              } else if (change.isNew) {
                // Add new item
                allItems.push(change);
              }
            });
            
            // Re-render items list
            renderItemList(allItems);
            
            // Remove the modal
            document.querySelector('.delete-confirmation-modal').remove();
            
            // Show success message
            showStatusMessage('Unsaved changes restored!', 'success');
          });
        }, 500);
      }
    } catch (error) {
      console.error('Error parsing saved changes:', error);
      // Clear invalid saved changes
      localStorage.removeItem('itemEditorUnsavedChanges');
    }
  }
}

// ========== INPUT VALIDATION ==========

function setupValidation() {
  // Validate item ID (required, no spaces, only alphanumeric and underscore)
  const idInput = document.getElementById('item-id');
  idInput.addEventListener('blur', () => {
    const value = idInput.value.trim();
    
    if (!value) {
      showInputError(idInput, 'ID is required');
      return;
    }
    
    if (!/^[a-z0-9_]+$/i.test(value)) {
      showInputError(idInput, 'ID can only contain letters, numbers, and underscores');
      return;
    }
    
    // Check for duplicate ID (except current item)
    if (currentItem && value !== currentItem.id) {
      const isDuplicate = allItems.some(item => item.id === value);
      if (isDuplicate) {
        showInputError(idInput, 'This ID is already in use');
        return;
      }
    }
    
    // Clear error
    clearInputError(idInput);
  });
  
  // Validate item name (required)
  const nameInput = document.getElementById('item-name');
  nameInput.addEventListener('blur', () => {
    const value = nameInput.value.trim();
    
    if (!value) {
      showInputError(nameInput, 'Name is required');
      return;
    }
    
    // Clear error
    clearInputError(nameInput);
  });
  
  // Validate effect value (required for certain effect types)
  const effectTypeInput = document.getElementById('effect-type');
  const effectValueInput = document.getElementById('effect-value');
  
  effectTypeInput.addEventListener('change', validateEffectValue);
  effectValueInput.addEventListener('blur', validateEffectValue);
  
  function validateEffectValue() {
    const type = effectTypeInput.value;
    const value = effectValueInput.value.trim();
    
    // These effect types require a value
    const requiresValue = ['heal', 'insight_gain', 'category_boost', 'extra_life', 'defense'];
    
    if (requiresValue.includes(type) && !value) {
      showInputError(effectValueInput, 'Effect value is required for this effect type');
      return;
    }
    
    // For numeric effects, validate that it's a number
    const numericEffects = ['heal', 'insight_gain', 'extra_life'];
    if (numericEffects.includes(type) && value && isNaN(parseInt(value))) {
      showInputError(effectValueInput, 'Effect value must be a number');
      return;
    }
    
    // Clear error
    clearInputError(effectValueInput);
  }
}

function showInputError(inputElement, message) {
  // Remove any existing error
  clearInputError(inputElement);
  
  // Create error message
  const errorElement = document.createElement('div');
  errorElement.className = 'input-error';
  errorElement.textContent = message;
  
  // Mark the input as invalid
  inputElement.classList.add('invalid');
  
  // Add error message after the input
  inputElement.parentNode.appendChild(errorElement);
}

function clearInputError(inputElement) {
  // Remove invalid class
  inputElement.classList.remove('invalid');
  
  // Remove error message if exists
  const errorElement = inputElement.parentNode.querySelector('.input-error');
  if (errorElement) {
    errorElement.remove();
  }
}

// ========== CSS STYLES ==========

function addCustomStyles() {
  const style = document.createElement('style');
  style.textContent = `
    /* Unsaved changes indicator */
    .unsaved-indicator {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 8px;
      height: 8px;
      background-color: var(--warning);
      border-radius: 50%;
      box-shadow: 0 0 5px var(--warning);
      animation: pulse 1.5s infinite;
    }
    
    @keyframes pulse {
      0% { opacity: 0.5; }
      50% { opacity: 1; }
      100% { opacity: 0.5; }
    }
    
    .item-entry {
      position: relative;
    }
    
    /* Save button animation */
    .pulse-animation {
      animation: button-pulse 2s infinite;
    }
    
    @keyframes button-pulse {
      0% { background-color: var(--primary); }
      50% { background-color: var(--secondary); }
      100% { background-color: var(--primary); }
    }
    
    /* Multi-select styling */
    .multi-select-btn {
      width: 100%;
      padding: var(--spacing-sm);
      margin-top: var(--spacing-sm);
      background-color: var(--dark-alt);
      color: var(--text);
      border: none;
      border-radius: var(--border-radius-sm);
      cursor: pointer;
      font-family: 'Press Start 2P', cursive;
      font-size: var(--font-size-xs);
      transition: all var(--transition-fast);
    }
    
    .multi-select-btn.active {
      background-color: var(--secondary);
      color: white;
    }
    
    .bulk-operations {
      display: flex;
      flex-wrap: wrap;
      gap: var(--spacing-sm);
      padding: var(--spacing-sm);
      background-color: var(--background);
      border-top: 2px solid rgba(255, 255, 255, 0.1);
    }
    
    .bulk-select {
      padding: var(--spacing-xs);
      background-color: var(--dark-alt);
      border: 1px solid var(--dark);
      color: var(--text);
      border-radius: var(--border-radius-sm);
      font-size: var(--font-size-xs);
    }
    
    .item-entry.multi-selected {
      background-color: rgba(86, 184, 134, 0.2);
      border-left-color: var(--secondary);
    }
    
    /* Advanced search panel */
    .search-bar {
      position: relative;
    }
    
    .filter-btn {
      width: 34px;
      height: 34px;
      background-color: var(--dark-alt);
      border: none;
      border-radius: 0 var(--border-radius-sm) var(--border-radius-sm) 0;
      cursor: pointer;
      color: var(--text);
      margin-left: 2px;
    }
    
    .search-bar input {
      border-radius: var(--border-radius-sm) 0 0 var(--border-radius-sm) !important;
      width: calc(100% - 36px) !important;
    }
    
    .advanced-filter-panel {
      position: absolute;
      top: 100%;
      left: 0;
      width: 100%;
      background-color: var(--dark-alt);
      border: 1px solid var(--dark);
      border-radius: var(--border-radius-sm);
      z-index: 100;
      padding: var(--spacing-sm);
      margin-top: var(--spacing-xs);
    }
    
    .filter-section {
      margin-bottom: var(--spacing-sm);
    }
    
    .filter-section h4 {
      font-size: var(--font-size-xs);
      margin-bottom: var(--spacing-xs);
    }
    
    .checkbox-group {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--spacing-xs);
    }
    
    .checkbox-group label {
      font-size: var(--font-size-xs);
      display: flex;
      align-items: center;
    }
    
    .checkbox-group input {
      margin-right: var(--spacing-xs);
    }
    
    .filter-actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--spacing-sm);
      margin-top: var(--spacing-sm);
    }
    
    /* Game preview modal */
    .preview-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 2000;
    }
    
    .preview-modal-content {
      width: 800px;
      max-width: 90vw;
      max-height: 90vh;
      background-color: var(--background-alt);
      border: 4px solid var(--primary);
      border-radius: var(--border-radius-md);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    
    .preview-modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-md);
      border-bottom: 2px solid var(--dark);
    }
    
    .preview-modal-header h3 {
      margin: 0;
    }
    
    .close-modal-btn {
      background: none;
      border: none;
      color: var(--text);
      font-size: 24px;
      cursor: pointer;
    }
    
    .preview-tabs {
      display: flex;
      border-bottom: 2px solid var(--dark);
    }
    
    .preview-tab-btn {
      flex: 1;
      padding: var(--spacing-sm);
      background-color: var(--dark-alt);
      border: none;
      color: var(--text);
      cursor: pointer;
      font-family: 'Press Start 2P', cursive;
      font-size: var(--font-size-xs);
    }
    
    .preview-tab-btn.active {
      background-color: var(--primary);
      color: white;
    }
    
    .preview-tab-content {
      padding: var(--spacing-md);
      overflow-y: auto;
      max-height: 60vh;
    }
    
    /* Inventory preview */
    .inventory-preview-container {
      display: flex;
      gap: var(--spacing-md);
    }
    
    .inventory-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--spacing-sm);
    }
    
    .inventory-slot {
      width: 64px;
      height: 64px;
      background-color: var(--dark);
      border-radius: var(--border-radius-sm);
      display: flex;
      justify-content: center;
      align-items: center;
      border: 1px solid var(--dark-alt);
    }
    
    .inventory-slot.empty {
      border: 1px dashed var(--dark-alt);
    }
    
    .inventory-slot.selected {
      border: 2px solid var(--secondary);
    }
    
    .inventory-detail {
      flex: 1;
    }
    
    .item-detail-card {
      background-color: var(--dark-alt);
      border-radius: var(--border-radius-md);
      border-left: 4px solid var(--primary);
      overflow: hidden;
    }
    
    .item-detail-card.uncommon {
      border-left-color: var(--primary);
    }
    
    .item-detail-card.rare {
      border-left-color: var(--warning);
    }
    
    .item-detail-card.epic {
      border-left-color: var(--secondary);
      box-shadow: 0 0 10px rgba(86, 184, 134, 0.5);
    }
    
    .item-detail-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-sm);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .item-detail-header h4 {
      margin: 0;
    }
    
    .item-detail-body {
      display: flex;
      padding: var(--spacing-md);
    }
    
    .item-detail-icon {
      margin-right: var(--spacing-md);
    }
    
    .item-detail-desc {
      flex: 1;
    }
    
    .item-detail-effect {
      margin-top: var(--spacing-sm);
      padding: var(--spacing-sm);
      background-color: var(--dark);
      border-radius: var(--border-radius-sm);
    }
    
    .effect-label {
      color: var(--primary);
      margin-right: var(--spacing-xs);
    }
    
    .item-detail-footer {
      padding: var(--spacing-sm);
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      justify-content: flex-end;
    }
    
    /* Small button variant */
    .retro-btn.small {
      font-size: 8px;
      padding: 6px 10px;
    }
    
    /* Toast styling */
    .toast-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    
    .toast {
      padding: 10px 15px;
      border-radius: var(--border-radius-sm);
      background-color: var(--background-alt);
      color: var(--text);
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
      transition: opacity 0.3s, transform 0.3s;
      animation: toast-in 0.3s;
    }
    
    .toast-info {
      border-left: 4px solid var(--primary);
    }
    
    .toast-success {
      border-left: 4px solid var(--secondary);
    }
    
    .toast-warning {
      border-left: 4px solid var(--warning);
    }
    
    .toast-error {
      border-left: 4px solid var(--danger);
    }
    
    .toast-hide {
      opacity: 0;
      transform: translateX(50px);
    }
    
    @keyframes toast-in {
      from {
        opacity: 0;
        transform: translateX(50px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
    
    /* Icon grid drag and drop */
    .icon-grid.drag-over {
      border: 2px dashed var(--primary);
      background-color: rgba(91, 140, 217, 0.1);
    }
  `;
  
  document.head.appendChild(style);
}

function addValidationStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .form-group input.invalid,
    .form-group select.invalid,
    .form-group textarea.invalid {
      border: 1px solid var(--danger);
      box-shadow: 0 0 4px var(--danger);
    }
    
    .input-error {
      color: var(--danger);
      font-size: calc(var(--font-size-xs) - 1px);
      margin-top: 4px;
      animation: fade-in 0.3s;
    }
    
    @keyframes fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `;
  
  document.head.appendChild(style);
}

// Export globally
window.ItemManager = ItemManager;