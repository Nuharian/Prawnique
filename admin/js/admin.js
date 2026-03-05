/**
 * Prawnique - Admin Panel JavaScript
 * Handles authentication, CRUD operations, and content management
 */

// ============================================
// STATE & INITIALIZATION
// ============================================

let currentSection = 'dashboard';
let currentEditId = null;
let uploadedImagePath = '';

// Fetch wrapper with credentials
const fetchWithCredentials = (url, options = {}) => {
    return fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
            ...options.headers,
        }
    });
};

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    initLoginForm();
    initLogout();
    initSidebar();
    initSliderForm();
    initSettingsForm();
});
});

// ============================================
// AUTHENTICATION
// ============================================

async function checkAuth() {
    try {
        const response = await fetchWithCredentials('/api/admin/check');
        if (response.ok) {
            const data = await response.json();
            showAdmin(data.username);
        }
    } catch (error) {
        // Not authenticated, show login
    }
}

function initLoginForm() {
    const form = document.getElementById('loginForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorEl = document.getElementById('loginError');

        errorEl.textContent = 'Logging in...';

        try {
            const response = await fetchWithCredentials('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();
            console.log('Login response:', data);

            if (data.success) {
                errorEl.textContent = 'Login successful! Loading...';
                showAdmin(data.username);
            } else {
                errorEl.textContent = data.error || 'Invalid credentials';
            }
        } catch (error) {
            console.error('Login error:', error);
            errorEl.textContent = 'Connection error. Please try again.';
        }
    });
}

function showAdmin(username) {
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('adminWrapper').style.display = 'flex';
    document.getElementById('adminName').textContent = username;
    loadDashboardStats();
    loadAllData();
}

function initLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (!logoutBtn) return;

    logoutBtn.addEventListener('click', async () => {
        await fetchWithCredentials('/api/admin/logout', { method: 'POST' });
        window.location.reload();
    });
}

// ============================================
// SIDEBAR NAVIGATION
// ============================================

function initSidebar() {
    const navItems = document.querySelectorAll('.nav-item[data-section]');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.dataset.section;
            showSection(section);

            // Update active state
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            // Close mobile sidebar
            if (window.innerWidth <= 992) {
                sidebar.classList.remove('active');
            }
        });
    });

    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }
}

function showSection(section) {
    currentSection = section;

    // Hide all sections
    document.querySelectorAll('.content-section').forEach(s => {
        s.classList.remove('active');
    });

    // Show target section
    const targetSection = document.getElementById(`section-${section}`);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    // Update page title
    const titles = {
        dashboard: 'Dashboard',
        slider: 'Homepage Slider',
        sections: 'Page Sections',
        products: 'Products',
        team: 'Team Members',
        news: 'News / Blog',
        gallery: 'Gallery',
        contacts: 'Contact Messages',
        settings: 'Site Settings'
    };
    document.getElementById('pageTitle').textContent = titles[section] || 'Dashboard';

    // Load section data
    loadSectionData(section);
}

function loadSectionData(section) {
    switch (section) {
        case 'dashboard':
            loadDashboardStats();
            break;
        case 'slider':
            loadSliderImages();
            break;
        case 'sections':
            loadSections();
            break;
        case 'products':
            loadProducts();
            break;
        case 'team':
            loadTeamMembers();
            break;
        case 'news':
            loadNewsPosts();
            break;
        case 'gallery':
            loadGalleryImages();
            break;
        case 'contacts':
            loadContacts();
            break;
        case 'settings':
            loadSettings();
            break;
    }
}

// ============================================
// DASHBOARD STATS
// ============================================

async function loadDashboardStats() {
    try {
        const response = await fetchWithCredentials('/api/admin/stats');
        const stats = await response.json();

        document.getElementById('statProducts').textContent = stats.products || 0;
        document.getElementById('statTeam').textContent = stats.team || 0;
        document.getElementById('statNews').textContent = stats.news || 0;
        document.getElementById('statContacts').textContent = stats.unreadContacts || 0;
    } catch (error) {
        console.error('Failed to load stats:', error);
    }
}

// ============================================
// IMAGE UPLOAD
// ============================================

function initUploadArea(areaId, inputId, previewId, type) {
    const area = document.getElementById(areaId);
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);

    if (!area || !input) return;

    area.addEventListener('click', () => input.click());

    area.addEventListener('dragover', (e) => {
        e.preventDefault();
        area.style.borderColor = 'var(--admin-secondary)';
    });

    area.addEventListener('dragleave', () => {
        area.style.borderColor = '';
    });

    area.addEventListener('drop', (e) => {
        e.preventDefault();
        area.style.borderColor = '';
        const files = e.dataTransfer.files;
        if (files.length) {
            input.files = files;
            handleImageUpload(input.files[0], type, preview);
        }
    });

    input.addEventListener('change', () => {
        if (input.files.length) {
            handleImageUpload(input.files[0], type, preview);
        }
    });
}

async function handleImageUpload(file, type, previewEl) {
    const formData = new FormData();
    formData.append('image', file);

    try {
        const response = await fetch(`/api/admin/upload/${type}`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            uploadedImagePath = data.path;
            if (previewEl) {
                previewEl.src = data.path;
                previewEl.style.display = 'block';
            }
            showToast('Image uploaded successfully', 'success');
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        showToast('Failed to upload image', 'error');
    }
}

// ============================================
// SLIDER MANAGEMENT
// ============================================

function initSliderForm() {
    initUploadArea('sliderUploadArea', 'sliderImage', 'sliderPreview', 'slider');

    const form = document.getElementById('sliderForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!uploadedImagePath) {
            showToast('Please upload an image first', 'error');
            return;
        }

        const data = {
            image_path: uploadedImagePath,
            title: document.getElementById('sliderTitle').value,
            subtitle: document.getElementById('sliderSubtitle').value,
            button_text: document.getElementById('sliderBtnText').value,
            button_link: document.getElementById('sliderBtnLink').value
        };

        try {
            const response = await fetchWithCredentials('/api/admin/slider', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to add slide');
            }

            const result = await response.json();

            if (result.success) {
                showToast('Slide added successfully', 'success');
                form.reset();
                document.getElementById('sliderPreview').style.display = 'none';
                uploadedImagePath = '';
                loadSliderImages();
            } else {
                throw new Error(result.error || 'Failed to add slide');
            }
        } catch (error) {
            console.error('Add slide error:', error);
            showToast('Failed to add slide: ' + error.message, 'error');
        }
    });
}

async function loadSliderImages() {
    try {
        const response = await fetchWithCredentials('/api/admin/slider');
        const images = await response.json();

        const container = document.getElementById('sliderList');
        const countEl = document.getElementById('slideCount');

        if (countEl) {
            countEl.textContent = `${images.length}/10`;
        }

        if (!container) return;

        if (images.length === 0) {
            container.innerHTML = '<p class="empty-message">No slides yet. Add your first slide above.</p>';
            return;
        }

        container.innerHTML = images.map((img, index) => `
      <div class="slider-item" data-id="${img.id}" draggable="true">
        <span class="drag-handle"><i class="fas fa-grip-vertical"></i></span>
        <img src="${img.image_path}" alt="Slide ${index + 1}">
        <div class="slider-item-info">
          <h5>${img.title || 'Untitled Slide'}</h5>
          <p>${img.subtitle || 'No subtitle'}</p>
        </div>
        <div class="slider-item-actions">
          <button class="btn btn-icon btn-outline" onclick="editSlide(${img.id})" title="Edit">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-icon btn-danger" onclick="deleteSlide(${img.id})" title="Delete">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `).join('');

        // Initialize drag and drop
        initSliderDragDrop();
    } catch (error) {
        console.error('Failed to load slider images:', error);
    }
}

function initSliderDragDrop() {
    const container = document.getElementById('sliderList');
    if (!container) return;

    const items = container.querySelectorAll('.slider-item');
    let draggedItem = null;

    items.forEach(item => {
        item.addEventListener('dragstart', (e) => {
            draggedItem = item;
            item.style.opacity = '0.5';
        });

        item.addEventListener('dragend', () => {
            item.style.opacity = '';
            draggedItem = null;
            saveSliderOrder();
        });

        item.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        item.addEventListener('drop', (e) => {
            e.preventDefault();
            if (draggedItem && draggedItem !== item) {
                const allItems = [...container.querySelectorAll('.slider-item')];
                const draggedIndex = allItems.indexOf(draggedItem);
                const targetIndex = allItems.indexOf(item);

                if (draggedIndex < targetIndex) {
                    item.after(draggedItem);
                } else {
                    item.before(draggedItem);
                }
            }
        });
    });
}

async function saveSliderOrder() {
    const items = document.querySelectorAll('.slider-item');
    const order = [...items].map(item => parseInt(item.dataset.id));

    try {
        await fetch('/api/admin/slider/reorder', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order })
        });
        showToast('Slider order updated', 'success');
    } catch (error) {
        showToast('Failed to update order', 'error');
    }
}

async function deleteSlide(id) {
    if (!confirm('Are you sure you want to delete this slide?')) return;

    try {
        const response = await fetch(`/api/admin/slider/${id}`, { method: 'DELETE' });
        const data = await response.json();

        if (data.success) {
            showToast('Slide deleted', 'success');
            loadSliderImages();
        }
    } catch (error) {
        showToast('Failed to delete slide', 'error');
    }
}

// ============================================
// SECTIONS MANAGEMENT
// ============================================

async function loadSections() {
    try {
        const response = await fetch('/api/sections');
        const sections = await response.json();

        const container = document.getElementById('sectionsAccordion');
        if (!container) return;

        const sectionKeys = Object.keys(sections);

        container.innerHTML = sectionKeys.map(key => {
            const section = sections[key];
            return `
        <div class="card">
          <div class="card-header" onclick="toggleAccordion(this)">
            <h4><i class="fas fa-chevron-right"></i> ${formatSectionName(key)}</h4>
          </div>
          <div class="card-body" style="display: none;">
            <form onsubmit="saveSection(event, '${key}')" class="form-grid">
              <div class="form-group">
                <label>Title</label>
                <input type="text" id="section-${key}-title" value="${section.title || ''}">
              </div>
              <div class="form-group">
                <label>Subtitle</label>
                <input type="text" id="section-${key}-subtitle" value="${section.subtitle || ''}">
              </div>
              <div class="form-group full-width">
                <label>Content</label>
                <textarea id="section-${key}-content" rows="4">${section.content || ''}</textarea>
              </div>
              <div class="form-actions full-width">
                <button type="submit" class="btn btn-primary">
                  <i class="fas fa-save"></i> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      `;
        }).join('');
    } catch (error) {
        console.error('Failed to load sections:', error);
    }
}

function toggleAccordion(header) {
    const body = header.nextElementSibling;
    const icon = header.querySelector('i');

    if (body.style.display === 'none') {
        body.style.display = 'block';
        icon.classList.remove('fa-chevron-right');
        icon.classList.add('fa-chevron-down');
    } else {
        body.style.display = 'none';
        icon.classList.remove('fa-chevron-down');
        icon.classList.add('fa-chevron-right');
    }
}

async function saveSection(e, key) {
    e.preventDefault();

    const data = {
        title: document.getElementById(`section-${key}-title`).value,
        subtitle: document.getElementById(`section-${key}-subtitle`).value,
        content: document.getElementById(`section-${key}-content`).value,
        image_path: ''
    };

    try {
        const response = await fetchWithCredentials(`/api/admin/sections/${key}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update section');
        }

        const result = await response.json();

        if (result.success) {
            showToast('Section updated successfully', 'success');
        }
    } catch (error) {
        console.error('Save section error:', error);
        showToast('Failed to update section: ' + error.message, 'error');
    }
}

function formatSectionName(key) {
    return key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

// ============================================
// PRODUCTS MANAGEMENT
// ============================================

let categories = [];

async function loadProducts() {
    try {
        // Load categories first
        const catResponse = await fetch('/api/categories');
        categories = await catResponse.json();

        const response = await fetchWithCredentials('/api/admin/products');
        const products = await response.json();

        const tbody = document.getElementById('productsTable');
        if (!tbody) return;

        if (products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-message">No products yet. Add your first product.</td></tr>';
            return;
        }

        tbody.innerHTML = products.map(p => `
      <tr>
        <td><img src="${p.featured_image || 'https://via.placeholder.com/60x45?text=No+Image'}" alt="${p.name}"></td>
        <td><strong>${p.name}</strong><br><small style="color: #718096;">${p.scientific_name || ''}</small></td>
        <td>${p.category_name || 'Uncategorized'}</td>
        <td>${p.is_featured ? '<span class="status-badge status-active">Yes</span>' : 'No'}</td>
        <td><span class="status-badge ${p.is_active ? 'status-active' : 'status-draft'}">${p.is_active ? 'Active' : 'Inactive'}</span></td>
        <td>
          <button class="btn btn-sm btn-outline" onclick="editProduct(${p.id})"><i class="fas fa-edit"></i></button>
          <button class="btn btn-sm btn-danger" onclick="deleteProduct(${p.id})"><i class="fas fa-trash"></i></button>
        </td>
      </tr>
    `).join('');
    } catch (error) {
        console.error('Failed to load products:', error);
    }
}

function showProductModal(product = null) {
    currentEditId = product ? product.id : null;
    const title = product ? 'Edit Product' : 'Add New Product';

    const categoryOptions = categories.map(c =>
        `<option value="${c.id}" ${product && product.category_id === c.id ? 'selected' : ''}>${c.name}</option>`
    ).join('');

    openModal(title, `
    <form id="productForm" class="form-grid">
      <div class="form-group">
        <label>Product Name *</label>
        <input type="text" id="productName" value="${product?.name || ''}" required>
      </div>
      <div class="form-group">
        <label>URL Slug *</label>
        <input type="text" id="productSlug" value="${product?.slug || ''}" required placeholder="e.g., black-tiger-shrimp">
      </div>
      <div class="form-group">
        <label>Category</label>
        <select id="productCategory">
          <option value="">Select Category</option>
          ${categoryOptions}
        </select>
      </div>
      <div class="form-group">
        <label>Scientific Name</label>
        <input type="text" id="productScientific" value="${product?.scientific_name || ''}">
      </div>
      <div class="form-group full-width">
        <label>Short Description</label>
        <textarea id="productShortDesc" rows="2">${product?.short_description || ''}</textarea>
      </div>
      <div class="form-group full-width">
        <label>Full Description</label>
        <textarea id="productFullDesc" rows="4">${product?.full_description || ''}</textarea>
      </div>
      <div class="form-group full-width">
        <label>Featured Image URL</label>
        <input type="text" id="productImage" value="${product?.featured_image || ''}" placeholder="/uploads/products/image.jpg">
      </div>
      <div class="form-group">
        <label>
          <input type="checkbox" id="productFeatured" ${product?.is_featured ? 'checked' : ''}> Featured Product
        </label>
      </div>
      <div class="form-group">
        <label>
          <input type="checkbox" id="productActive" ${product?.is_active !== 0 ? 'checked' : ''}> Active
        </label>
      </div>
      <div class="form-actions full-width">
        <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">${product ? 'Update' : 'Create'} Product</button>
      </div>
    </form>
  `);

    document.getElementById('productForm').addEventListener('submit', saveProduct);

    // Auto-generate slug from name
    document.getElementById('productName').addEventListener('input', (e) => {
        if (!currentEditId) {
            document.getElementById('productSlug').value = e.target.value
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');
        }
    });
}

async function saveProduct(e) {
    e.preventDefault();

    const data = {
        name: document.getElementById('productName').value,
        slug: document.getElementById('productSlug').value,
        category_id: document.getElementById('productCategory').value || null,
        scientific_name: document.getElementById('productScientific').value,
        short_description: document.getElementById('productShortDesc').value,
        full_description: document.getElementById('productFullDesc').value,
        featured_image: document.getElementById('productImage').value,
        is_featured: document.getElementById('productFeatured').checked,
        is_active: document.getElementById('productActive').checked
    };

    try {
        const url = currentEditId ? `/api/admin/products/${currentEditId}` : '/api/admin/products';
        const method = currentEditId ? 'PUT' : 'POST';

        const response = await fetchWithCredentials(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to save product');
        }

        const result = await response.json();

        if (result.success) {
            showToast(`Product ${currentEditId ? 'updated' : 'created'} successfully`, 'success');
            closeModal();
            loadProducts();
        } else {
            throw new Error(result.error || 'Failed to save product');
        }
    } catch (error) {
        console.error('Save product error:', error);
        showToast('Failed to save product: ' + error.message, 'error');
    }
}

async function editProduct(id) {
    try {
        const response = await fetchWithCredentials('/api/admin/products');
        const products = await response.json();
        const product = products.find(p => p.id === id);
        if (product) {
            showProductModal(product);
        }
    } catch (error) {
        showToast('Failed to load product', 'error');
    }
}

async function deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
        const response = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
        if (response.ok) {
            showToast('Product deleted', 'success');
            loadProducts();
        }
    } catch (error) {
        showToast('Failed to delete product', 'error');
    }
}

// ============================================
// TEAM MANAGEMENT
// ============================================

async function loadTeamMembers() {
    try {
        const response = await fetchWithCredentials('/api/admin/team');
        const members = await response.json();

        const container = document.getElementById('teamGrid');
        if (!container) return;

        if (members.length === 0) {
            container.innerHTML = '<p class="empty-message">No team members yet. Add your first team member.</p>';
            return;
        }

        container.innerHTML = members.map(m => `
      <div class="team-card-admin">
        <img src="${m.image_path || 'https://via.placeholder.com/300x200?text=No+Photo'}" alt="${m.name}">
        <div class="team-card-admin-body">
          <h4>${m.name}</h4>
          <p>${m.position || 'Team Member'}</p>
          <div class="team-card-admin-actions">
            <button class="btn btn-sm btn-outline" onclick="editTeamMember(${m.id})"><i class="fas fa-edit"></i> Edit</button>
            <button class="btn btn-sm btn-danger" onclick="deleteTeamMember(${m.id})"><i class="fas fa-trash"></i></button>
          </div>
        </div>
      </div>
    `).join('');
    } catch (error) {
        console.error('Failed to load team:', error);
    }
}

function showTeamModal(member = null) {
    currentEditId = member ? member.id : null;
    const title = member ? 'Edit Team Member' : 'Add Team Member';

    openModal(title, `
    <form id="teamForm" class="form-grid">
      <div class="form-group">
        <label>Full Name *</label>
        <input type="text" id="memberName" value="${member?.name || ''}" required>
      </div>
      <div class="form-group">
        <label>Position</label>
        <input type="text" id="memberPosition" value="${member?.position || ''}">
      </div>
      <div class="form-group full-width">
        <label>Bio</label>
        <textarea id="memberBio" rows="3">${member?.bio || ''}</textarea>
      </div>
      <div class="form-group full-width">
        <label>Photo URL</label>
        <input type="text" id="memberImage" value="${member?.image_path || ''}" placeholder="/uploads/team/photo.jpg">
      </div>
      <div class="form-group">
        <label>Email</label>
        <input type="email" id="memberEmail" value="${member?.email || ''}">
      </div>
      <div class="form-group">
        <label>Phone</label>
        <input type="text" id="memberPhone" value="${member?.phone || ''}">
      </div>
      <div class="form-group full-width">
        <label>LinkedIn URL</label>
        <input type="url" id="memberLinkedin" value="${member?.linkedin || ''}">
      </div>
      <div class="form-actions full-width">
        <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">${member ? 'Update' : 'Add'} Member</button>
      </div>
    </form>
  `);

    document.getElementById('teamForm').addEventListener('submit', saveTeamMember);
}

async function saveTeamMember(e) {
    e.preventDefault();

    const data = {
        name: document.getElementById('memberName').value,
        position: document.getElementById('memberPosition').value,
        bio: document.getElementById('memberBio').value,
        image_path: document.getElementById('memberImage').value,
        email: document.getElementById('memberEmail').value,
        phone: document.getElementById('memberPhone').value,
        linkedin: document.getElementById('memberLinkedin').value,
        is_active: true
    };

    try {
        const url = currentEditId ? `/api/admin/team/${currentEditId}` : '/api/admin/team';
        const method = currentEditId ? 'PUT' : 'POST';

        const response = await fetchWithCredentials(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to save team member');
        }

        const result = await response.json();

        if (result.success) {
            showToast(`Team member ${currentEditId ? 'updated' : 'added'} successfully`, 'success');
            closeModal();
            loadTeamMembers();
        }
    } catch (error) {
        console.error('Save team member error:', error);
        showToast('Failed to save team member: ' + error.message, 'error');
    }
}

async function editTeamMember(id) {
    try {
        const response = await fetchWithCredentials('/api/admin/team');
        const members = await response.json();
        const member = members.find(m => m.id === id);
        if (member) {
            showTeamModal(member);
        }
    } catch (error) {
        showToast('Failed to load member', 'error');
    }
}

async function deleteTeamMember(id) {
    if (!confirm('Are you sure you want to delete this team member?')) return;

    try {
        await fetch(`/api/admin/team/${id}`, { method: 'DELETE' });
        showToast('Team member deleted', 'success');
        loadTeamMembers();
    } catch (error) {
        showToast('Failed to delete member', 'error');
    }
}

// ============================================
// NEWS MANAGEMENT
// ============================================

async function loadNewsPosts() {
    try {
        const response = await fetchWithCredentials('/api/admin/news');
        const posts = await response.json();

        const tbody = document.getElementById('newsTable');
        if (!tbody) return;

        if (posts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-message">No posts yet. Add your first news post.</td></tr>';
            return;
        }

        tbody.innerHTML = posts.map(p => `
      <tr>
        <td><img src="${p.featured_image || 'https://via.placeholder.com/60x45?text=No+Image'}" alt="${p.title}"></td>
        <td><strong>${p.title}</strong></td>
        <td>${p.published_at ? new Date(p.published_at).toLocaleDateString() : 'Not published'}</td>
        <td><span class="status-badge ${p.is_published ? 'status-active' : 'status-draft'}">${p.is_published ? 'Published' : 'Draft'}</span></td>
        <td>
          <button class="btn btn-sm btn-outline" onclick="editNews(${p.id})"><i class="fas fa-edit"></i></button>
          <button class="btn btn-sm btn-danger" onclick="deleteNews(${p.id})"><i class="fas fa-trash"></i></button>
        </td>
      </tr>
    `).join('');
    } catch (error) {
        console.error('Failed to load news:', error);
    }
}

function showNewsModal(post = null) {
    currentEditId = post ? post.id : null;
    const title = post ? 'Edit Post' : 'Add New Post';

    openModal(title, `
    <form id="newsForm" class="form-grid">
      <div class="form-group full-width">
        <label>Title *</label>
        <input type="text" id="newsTitle" value="${post?.title || ''}" required>
      </div>
      <div class="form-group full-width">
        <label>URL Slug *</label>
        <input type="text" id="newsSlug" value="${post?.slug || ''}" required>
      </div>
      <div class="form-group full-width">
        <label>Excerpt</label>
        <textarea id="newsExcerpt" rows="2">${post?.excerpt || ''}</textarea>
      </div>
      <div class="form-group full-width">
        <label>Content</label>
        <textarea id="newsContent" rows="6">${post?.content || ''}</textarea>
      </div>
      <div class="form-group full-width">
        <label>Featured Image URL</label>
        <input type="text" id="newsImage" value="${post?.featured_image || ''}">
      </div>
      <div class="form-group">
        <label>Author</label>
        <input type="text" id="newsAuthor" value="${post?.author || ''}">
      </div>
      <div class="form-group">
        <label>
          <input type="checkbox" id="newsPublished" ${post?.is_published ? 'checked' : ''}> Publish Now
        </label>
      </div>
      <div class="form-actions full-width">
        <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">${post ? 'Update' : 'Create'} Post</button>
      </div>
    </form>
  `);

    document.getElementById('newsForm').addEventListener('submit', saveNews);

    document.getElementById('newsTitle').addEventListener('input', (e) => {
        if (!currentEditId) {
            document.getElementById('newsSlug').value = e.target.value
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');
        }
    });
}

async function saveNews(e) {
    e.preventDefault();

    const data = {
        title: document.getElementById('newsTitle').value,
        slug: document.getElementById('newsSlug').value,
        excerpt: document.getElementById('newsExcerpt').value,
        content: document.getElementById('newsContent').value,
        featured_image: document.getElementById('newsImage').value,
        author: document.getElementById('newsAuthor').value,
        is_published: document.getElementById('newsPublished').checked
    };

    try {
        const url = currentEditId ? `/api/admin/news/${currentEditId}` : '/api/admin/news';
        const method = currentEditId ? 'PUT' : 'POST';

        const response = await fetchWithCredentials(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to save post');
        }

        const result = await response.json();

        if (result.success) {
            showToast(`Post ${currentEditId ? 'updated' : 'created'} successfully`, 'success');
            closeModal();
            loadNewsPosts();
        }
    } catch (error) {
        console.error('Save news error:', error);
        showToast('Failed to save post: ' + error.message, 'error');
    }
}

async function editNews(id) {
    try {
        const response = await fetchWithCredentials('/api/admin/news');
        const posts = await response.json();
        const post = posts.find(p => p.id === id);
        if (post) {
            showNewsModal(post);
        }
    } catch (error) {
        showToast('Failed to load post', 'error');
    }
}

async function deleteNews(id) {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
        await fetch(`/api/admin/news/${id}`, { method: 'DELETE' });
        showToast('Post deleted', 'success');
        loadNewsPosts();
    } catch (error) {
        showToast('Failed to delete post', 'error');
    }
}

// ============================================
// GALLERY MANAGEMENT
// ============================================

async function loadGalleryImages() {
    try {
        const response = await fetchWithCredentials('/api/admin/gallery');
        const images = await response.json();

        const container = document.getElementById('galleryGrid');
        if (!container) return;

        if (images.length === 0) {
            container.innerHTML = '<p class="empty-message" style="grid-column: 1/-1;">No gallery images yet. Add some images to showcase your products.</p>';
            return;
        }

        container.innerHTML = images.map(img => `
      <div class="gallery-admin-item">
        <img src="${img.image_path}" alt="${img.title || 'Gallery image'}">
        <div class="gallery-admin-item-overlay">
          <button onclick="deleteGalleryImage(${img.id})"><i class="fas fa-trash"></i></button>
        </div>
      </div>
    `).join('');
    } catch (error) {
        console.error('Failed to load gallery:', error);
    }
}

function showGalleryModal() {
    openModal('Add Gallery Images', `
    <form id="galleryForm" class="form-grid">
      <div class="form-group full-width">
        <label>Image URL</label>
        <input type="text" id="galleryImage" placeholder="/uploads/gallery/image.jpg" required>
      </div>
      <div class="form-group">
        <label>Title (optional)</label>
        <input type="text" id="galleryTitle">
      </div>
      <div class="form-group">
        <label>Category (optional)</label>
        <input type="text" id="galleryCategory" placeholder="e.g., Products, Team, Events">
      </div>
      <div class="form-group full-width">
        <label>Description (optional)</label>
        <textarea id="galleryDesc" rows="2"></textarea>
      </div>
      <div class="form-actions full-width">
        <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Add to Gallery</button>
      </div>
    </form>
  `);

    document.getElementById('galleryForm').addEventListener('submit', saveGalleryImage);
}

async function saveGalleryImage(e) {
    e.preventDefault();

    const data = {
        image_path: document.getElementById('galleryImage').value,
        title: document.getElementById('galleryTitle').value,
        category: document.getElementById('galleryCategory').value,
        description: document.getElementById('galleryDesc').value
    };

    try {
        const response = await fetchWithCredentials('/api/admin/gallery', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to add image');
        }

        const result = await response.json();

        if (result.success) {
            showToast('Image added to gallery', 'success');
            closeModal();
            loadGalleryImages();
        }
    } catch (error) {
        console.error('Save gallery error:', error);
        showToast('Failed to add image: ' + error.message, 'error');
    }
}

async function deleteGalleryImage(id) {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
        await fetch(`/api/admin/gallery/${id}`, { method: 'DELETE' });
        showToast('Image deleted', 'success');
        loadGalleryImages();
    } catch (error) {
        showToast('Failed to delete image', 'error');
    }
}

// ============================================
// CONTACTS MANAGEMENT
// ============================================

async function loadContacts() {
    try {
        const response = await fetchWithCredentials('/api/admin/contacts');
        const contacts = await response.json();

        const tbody = document.getElementById('contactsTable');
        if (!tbody) return;

        if (contacts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-message">No messages yet.</td></tr>';
            return;
        }

        tbody.innerHTML = contacts.map(c => `
      <tr>
        <td><strong>${c.name}</strong></td>
        <td>${c.email}</td>
        <td>${c.subject || '-'}</td>
        <td>${new Date(c.created_at).toLocaleDateString()}</td>
        <td><span class="status-badge ${c.is_read ? 'status-active' : 'status-unread'}">${c.is_read ? 'Read' : 'New'}</span></td>
        <td>
          <button class="btn btn-sm btn-outline" onclick="viewContact(${c.id}, '${escapeHtml(c.name)}', '${escapeHtml(c.email)}', '${escapeHtml(c.subject || '')}', '${escapeHtml(c.message)}')">
            <i class="fas fa-eye"></i>
          </button>
        </td>
      </tr>
    `).join('');
    } catch (error) {
        console.error('Failed to load contacts:', error);
    }
}

async function viewContact(id, name, email, subject, message) {
    openModal('Contact Message', `
    <div style="padding: 1rem 0;">
      <p><strong>From:</strong> ${name} (${email})</p>
      <p><strong>Subject:</strong> ${subject || 'No subject'}</p>
      <hr style="margin: 1rem 0; border: none; border-top: 1px solid #e2e8f0;">
      <p><strong>Message:</strong></p>
      <p style="white-space: pre-wrap; background: #f4f6f9; padding: 1rem; border-radius: 8px;">${message}</p>
    </div>
  `);

    // Mark as read
    await fetch(`/api/admin/contacts/${id}/read`, { method: 'PUT' });
    loadContacts();
    loadDashboardStats();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML.replace(/'/g, "\\'").replace(/\n/g, '\\n');
}

// ============================================
// SETTINGS
// ============================================

function initSettingsForm() {
    const form = document.getElementById('settingsForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const settings = {
            site_name: document.getElementById('siteName').value,
            site_tagline: document.getElementById('siteTagline').value,
            contact_email: document.getElementById('contactEmail').value,
            contact_phone: document.getElementById('contactPhone').value,
            contact_address: document.getElementById('contactAddress').value,
            facebook_url: document.getElementById('facebookUrl').value,
            twitter_url: document.getElementById('twitterUrl').value,
            instagram_url: document.getElementById('instagramUrl').value,
            linkedin_url: document.getElementById('linkedinUrl').value,
            footer_text: document.getElementById('footerText').value,
            wave_animation_type: document.getElementById('waveAnimationType').value
        };

        try {
            const response = await fetchWithCredentials('/api/admin/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to save settings');
            }

            const result = await response.json();

            if (result.success) {
                showToast('Settings saved successfully', 'success');
            }
        } catch (error) {
            console.error('Save settings error:', error);
            showToast('Failed to save settings: ' + error.message, 'error');
        }
    });
}

async function loadSettings() {
    try {
        const response = await fetch('/api/settings');
        const settings = await response.json();

        document.getElementById('siteName').value = settings.site_name || '';
        document.getElementById('siteTagline').value = settings.site_tagline || '';
        document.getElementById('contactEmail').value = settings.contact_email || '';
        document.getElementById('contactPhone').value = settings.contact_phone || '';
        document.getElementById('contactAddress').value = settings.contact_address || '';
        document.getElementById('facebookUrl').value = settings.facebook_url || '';
        document.getElementById('twitterUrl').value = settings.twitter_url || '';
        document.getElementById('instagramUrl').value = settings.instagram_url || '';
        document.getElementById('linkedinUrl').value = settings.linkedin_url || '';
        document.getElementById('footerText').value = settings.footer_text || '';
        document.getElementById('waveAnimationType').value = settings.wave_animation_type || 'realistic';
    } catch (error) {
        console.error('Failed to load settings:', error);
    }
}

// ============================================
// MODAL HELPERS
// ============================================

function openModal(title, content) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = content;
    document.getElementById('modalOverlay').classList.add('active');
}

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('active');
    currentEditId = null;
}

// Close modal on overlay click
document.getElementById('modalOverlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'modalOverlay') {
        closeModal();
    }
});

// ============================================
// TOAST NOTIFICATIONS
// ============================================

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i> ${message}`;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============================================
// LOAD ALL DATA ON INIT
// ============================================

function loadAllData() {
    loadSliderImages();
    loadProducts();
    loadTeamMembers();
    loadNewsPosts();
    loadGalleryImages();
    loadContacts();
    loadSettings();
}
