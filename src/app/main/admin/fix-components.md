# Script de Correction Automatique des Composants Admin

## 🔧 Corrections à Appliquer Systématiquement

### 1. **Remplacements HTML Standards**

#### Boutons
```html
<!-- AVANT -->
<button ibmButton="primary" size="sm" (click)="action()">
  <svg ibmIcon="icon-name" size="16"></svg>
  Texte
</button>

<!-- APRÈS -->
<button class="admin-btn admin-btn-primary" (click)="action()">
  <svg width="16" height="16" viewBox="0 0 16 16">
    <path d="..."/>
  </svg>
  Texte
</button>
```

#### Tables
```html
<!-- AVANT -->
<ibm-table>
  <ibm-table-header>
    <ibm-table-header-row>
      <ibm-table-header-cell>Header</ibm-table-header-cell>
    </ibm-table-header-row>
  </ibm-table-header>
  <ibm-table-body>
    <ibm-table-row>
      <ibm-table-cell>Content</ibm-table-cell>
    </ibm-table-row>
  </ibm-table-body>
</ibm-table>

<!-- APRÈS -->
<table class="admin-table">
  <thead>
    <tr>
      <th>Header</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Content</td>
    </tr>
  </tbody>
</table>
```

#### Tabs
```html
<!-- AVANT -->
<ibm-tabs>
  <ibm-tab heading="Tab 1" [active]="selectedTab === 'tab1'" (click)="onTabChange('tab1')">
    Content
  </ibm-tab>
</ibm-tabs>

<!-- APRÈS -->
<div class="admin-tabs-nav">
  <button class="admin-tab-btn" [class.active]="selectedTab === 'tab1'" (click)="onTabChange('tab1')">
    Tab 1
  </button>
</div>
<div class="admin-tab-content">
  <div *ngIf="selectedTab === 'tab1'">Content</div>
</div>
```

#### Dropdowns/Selects
```html
<!-- AVANT -->
<ibm-dropdown>
  <button ibmDropdownTrigger>Option</button>
  <ibm-dropdown-list>
    <ibm-dropdown-option value="val">Label</ibm-dropdown-option>
  </ibm-dropdown-list>
</ibm-dropdown>

<!-- APRÈS -->
<select class="admin-select" (change)="onChange($event.target.value)">
  <option value="val">Label</option>
</select>
```

#### Tags
```html
<!-- AVANT -->
<ibm-tag [type]="'success'" size="sm">Active</ibm-tag>

<!-- APRÈS -->
<span class="admin-status-tag status-active">Active</span>
```

#### Loading
```html
<!-- AVANT -->
<ibm-loading></ibm-loading>

<!-- APRÈS -->
<div class="admin-spinner"></div>
```

#### Overflow Menu
```html
<!-- AVANT -->
<ibm-overflow-menu>
  <ibm-overflow-menu-option (click)="action()">
    <svg ibmIcon="edit" size="16"></svg>
    Action
  </ibm-overflow-menu-option>
</ibm-overflow-menu>

<!-- APRÈS -->
<div class="admin-actions-menu">
  <button class="admin-menu-trigger" (click)="toggleMenu(id)">⋮</button>
  <div class="admin-menu-dropdown" *ngIf="openMenuId === id">
    <button (click)="action()">
      <svg width="16" height="16" viewBox="0 0 16 16">
        <path d="..."/>
      </svg>
      Action
    </button>
  </div>
</div>
```

### 2. **Icônes SVG Standards**

#### Icônes Communes
```html
<!-- Refresh -->
<svg width="16" height="16" viewBox="0 0 16 16">
  <path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41zm-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9z"/>
  <path fill-rule="evenodd" d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5.002 5.002 0 0 0 8 3zM3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9H3.1z"/>
</svg>

<!-- Add -->
<svg width="16" height="16" viewBox="0 0 16 16">
  <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
</svg>

<!-- Edit -->
<svg width="16" height="16" viewBox="0 0 16 16">
  <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708L10.5 9.207l-3-3L12.146.146zM11.207 2L2 11.207V14h2.793L14 4.793 11.207 2z"/>
</svg>

<!-- Delete -->
<svg width="16" height="16" viewBox="0 0 16 16">
  <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
  <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
</svg>

<!-- Checkmark -->
<svg width="16" height="16" viewBox="0 0 16 16">
  <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.061L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
</svg>
```

### 3. **Styles SCSS Standards**

#### Classes de Base
```scss
.admin-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &.admin-btn-primary {
    background: $ndiye-primary;
    color: $ndiye-white;
    &:hover { background: $ndiye-primary-dark; }
  }

  &.admin-btn-secondary {
    background: $ndiye-white;
    color: $ndiye-dark;
    border: 1px solid rgba($ndiye-primary, 0.2);
    &:hover { 
      background: rgba($ndiye-primary, 0.05);
      border-color: $ndiye-primary;
    }
  }

  svg { fill: currentColor; }
}

.admin-table {
  width: 100%;
  border-collapse: collapse;

  th, td {
    padding: 12px 16px;
    text-align: left;
    border-bottom: 1px solid rgba($ndiye-primary, 0.1);
  }

  th {
    background: rgba($ndiye-primary, 0.05);
    font-weight: 600;
    color: $ndiye-dark;
    font-size: 0.875rem;
  }

  tr:hover { background: rgba($ndiye-primary, 0.02); }
}

.admin-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba($ndiye-primary, 0.1);
  border-top: 3px solid $ndiye-primary;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

### 4. **Méthodes TypeScript Standards**

```typescript
// Menu state
openMenuId: string | null = null;

toggleMenu(id: string): void {
  this.openMenuId = this.openMenuId === id ? null : id;
}

// Tab management
selectedTab = 'default';

onTabChange(tab: string): void {
  this.selectedTab = tab;
}
```

## 🎯 Composants à Corriger

1. **AdminGeographyComponent** ❌
2. **AdminPaymentsComponent** ❌  
3. **AdminSettingsComponent** ❌

## ✅ Composants Corrigés

1. **AdminUsersComponent** ✅
2. **AdminDashboardComponent** ✅
3. **AdminRolesComponent** ✅

---

**Note :** Appliquer ces corrections systématiquement à tous les composants restants pour avoir une interface cohérente et fonctionnelle.
