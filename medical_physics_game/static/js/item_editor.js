// item_editor.js - Item editor functionality

// Global variables
let allItems = [];       // All items and relics
let currentItem = null;  // Currently selected item
let iconFiles = [];      // Available icon files
let unsavedChanges = {}; // Track changes: { itemId: modifiedItemData }

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
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
    
    // Click to select item
    itemElement.addEventListener('click', () => {
      selectItem(item.id);
    });
    
    listContainer.appendChild(itemElement);
  });
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
  if (currentItem) {
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
  
  // Maintain selection if possible
  if (currentItem) {
    const selectedElement = document.querySelector(`.item-entry[data-id="${currentItem.id}"]`);
    if (selectedElement) {
      selectedElement.classList.add('selected');
    }
  }
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

// Save the current item
async function saveCurrentItem() {
  if (!currentItem) {
    showStatusMessage('No item selected to save', 'error');
    return;
  }
  
  // Get form data
  const formData = getFormData();
  
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
      // Remove from unsaved changes
      delete unsavedChanges[currentItem.id];
      
      // If ID changed, update references
      if (formData.id !== currentItem.id) {
        // Find and update in allItems
        const index = allItems.findIndex(i => i.id === currentItem.id);
        if (index !== -1) {
          allItems.splice(index, 1);
          allItems.push(formData);
        }
        
        // Update currentItem
        currentItem = formData;
        
        // Re-render list
        renderItemList(allItems);
        
        // Re-select the item with new ID
        selectItem(formData.id);
      } else {
        // Just update the current item
        Object.assign(currentItem, formData);
      }
      
      showStatusMessage('Item saved successfully!', 'success');
    } else {
      showStatusMessage('Error saving item: ' + data.error, 'error');
    }
  } catch (error) {
    console.error('Error saving item:', error);
    showStatusMessage('Failed to save item. Check console for details.', 'error');
  }
}

// Save all changes
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
      
      // Refresh items list
      fetchItems();
      
      showStatusMessage(`All changes saved successfully!`, 'success');
    } else {
      showStatusMessage('Error saving changes: ' + data.error, 'error');
    }
  } catch (error) {
    console.error('Error saving changes:', error);
    showStatusMessage('Failed to save changes. Check console for details.', 'error');
  }
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