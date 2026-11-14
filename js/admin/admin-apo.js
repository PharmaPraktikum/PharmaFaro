// ============================================
// APOTHEKE ADMIN DASHBOARD - JavaScript
// (Identisch mit admin-pta.js, nur für Apotheke-Admin)
// ============================================

// --- DOM Elements ---------------------------------
const elements = {
    // Authentication
    loginForm: document.getElementById('login-form'),
    loginEmail: document.getElementById('login-email'),
    loginPassword: document.getElementById('login-password'),
    loginButton: document.getElementById('login-button'),
    logoutButton: document.getElementById('logout-button'),
    mainContent: document.getElementById('main-content'),
    authSection: document.getElementById('auth-section'),
    
    // Navigation
    navLinks: document.querySelectorAll('.nav-link'),
    
    // Reviews Section
    reviewsContainer: document.getElementById('reviews-container'),
    reviewFilter: document.getElementById('review-filter'),
    reviewSearch: document.getElementById('review-search'),
    reviewStatusFilter: document.getElementById('review-status-filter'),
    reviewTableBody: document.getElementById('review-table-body'),
    
    // Companies Section
    companiesContainer: document.getElementById('companies-container'),
    companyForm: document.getElementById('company-form'),
    companyTableBody: document.getElementById('company-table-body'),
    
    // Jobs Section
    jobsContainer: document.getElementById('jobs-container'),
    jobForm: document.getElementById('job-form'),
    jobTableBody: document.getElementById('job-table-body'),
    
    // Users Section
    usersContainer: document.getElementById('users-container'),
    usersTableBody: document.getElementById('users-table-body'),
    
    // Modals
    modal: document.getElementById('modal'),
    modalTitle: document.getElementById('modal-title'),
    modalContent: document.getElementById('modal-content'),
    modalClose: document.querySelector('.modal-close'),
    modalSave: document.getElementById('modal-save'),
    modalCancel: document.getElementById('modal-cancel'),
    
    // Stats
    statsPending: document.getElementById('stats-pending'),
    statsApproved: document.getElementById('stats-approved'),
    statsCompanies: document.getElementById('stats-companies'),
    statsJobs: document.getElementById('stats-jobs')
};

// --- State --------------------------------------
let currentUser = null;
let currentSection = 'reviews';
let reviews = [];
let companies = [];
let jobs = [];
let users = [];
let currentReviewFilter = 'pending';
let currentReviewSearch = '';
let currentReviewPage = 1;
const REVIEW_PAGE_SIZE = 20;

// ============================================
// ALLE FUNKTIONEN (1:1 KOPIE VON admin-pta.js)
// ============================================

async function checkAuth() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        currentUser = user;

        if (user) {
            elements.authSection.style.display = 'none';
            elements.mainContent.style.display = 'block';
            await loadInitialData();
            showNotification(`Angemeldet als: ${user.email}`, 'success');
        } else {
            elements.authSection.style.display = 'block';
            elements.mainContent.style.display = 'none';
            currentUser = null;
        }
    } catch (error) {
        console.error('Auth Check Error:', error);
        showNotification('Fehler bei der Authentifizierung', 'error');
    }
}

async function login(email, password) {
    if (!email || !password) {
        showNotification('Bitte E-Mail und Passwort eingeben', 'error');
        return;
    }

    showLoading(elements.loginButton);

    try {
        const { error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password: password
        });

        if (error) throw error;

        await checkAuth();
    } catch (error) {
        console.error('Login Error:', error);
        showNotification(error.message || 'Login fehlgeschlagen', 'error');
    } finally {
        hideLoading(elements.loginButton);
    }
}

async function logout() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;

        currentUser = null;
        elements.authSection.style.display = 'block';
        elements.mainContent.style.display = 'none';
        showNotification('Erfolgreich abgemeldet', 'success');
    } catch (error) {
        console.error('Logout Error:', error);
        showNotification('Fehler beim Abmelden', 'error');
    }
}

async function loadReviews(status = 'pending', search = '', page = 1) {
    showLoading(elements.reviewsContainer);
    currentReviewFilter = status;
    currentReviewSearch = search;
    currentReviewPage = page;

    try {
        let query = supabase
            .from('reviews')
            .select('*, company:companies(name, city), user:users(email, role)', { count: 'exact' })
            .order('created_at', { ascending: false });

        if (status !== 'all') {
            query = query.eq('status', status);
        }

        if (search) {
            query = query.or(
                `comment.ilike.%${search}%,title.ilike.%${search}%,company.name.ilike.%${search}%`
            );
        }

        const from = (page - 1) * REVIEW_PAGE_SIZE;
        const to = from + REVIEW_PAGE_SIZE - 1;
        query = query.range(from, to);

        const { data, count, error } = await query;

        if (error) throw error;

        reviews = data || [];
        const total = count || 0;
        const totalPages = Math.ceil(total / REVIEW_PAGE_SIZE);

        renderReviews(reviews, page, totalPages, total);
        updateReviewStats();
    } catch (error) {
        console.error('Load Reviews Error:', error);
        showNotification('Fehler beim Laden der Bewertungen', 'error');
    } finally {
        hideLoading(elements.reviewsContainer);
    }
}

async function approveReview(reviewId) {
    if (!confirm('Bewertung wirklich genehmigen?')) return;

    try {
        const { error } = await supabase
            .from('reviews')
            .update({
                status: 'approved',
                approved_at: new Date().toISOString(),
                approved_by: currentUser.id
            })
            .eq('id', reviewId);

        if (error) throw error;

        showNotification('Bewertung genehmigt', 'success');
        loadReviews(currentReviewFilter, currentReviewSearch, currentReviewPage);
    } catch (error) {
        console.error('Approve Review Error:', error);
        showNotification('Fehler beim Genehmigen', 'error');
    }
}

async function rejectReview(reviewId) {
    const reason = prompt('Grund für die Ablehnung (optional):');
    if (reason === null) return;

    try {
        const { error } = await supabase
            .from('reviews')
            .update({
                status: 'rejected',
                rejected_at: new Date().toISOString(),
                rejected_by: currentUser.id,
                rejection_reason: reason || 'Kein Grund angegeben'
            })
            .eq('id', reviewId);

        if (error) throw error;

        showNotification('Bewertung abgelehnt', 'success');
        loadReviews(currentReviewFilter, currentReviewSearch, currentReviewPage);
    } catch (error) {
        console.error('Reject Review Error:', error);
        showNotification('Fehler beim Ablehnen', 'error');
    }
}

async function deleteReview(reviewId) {
    if (!confirm('Bewertung wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden!')) return;

    try {
        const { error } = await supabase
            .from('reviews')
            .delete()
            .eq('id', reviewId);

        if (error) throw error;

        showNotification('Bewertung gelöscht', 'success');
        loadReviews(currentReviewFilter, currentReviewSearch, currentReviewPage);
    } catch (error) {
        console.error('Delete Review Error:', error);
        showNotification('Fehler beim Löschen', 'error');
    }
}

function renderReviews(reviews, page, totalPages, total) {
    if (!elements.reviewTableBody) return;

    if (reviews.length === 0) {
        elements.reviewTableBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center">Keine Bewertungen gefunden</td>
            </tr>
        `;
        return;
    }

    elements.reviewTableBody.innerHTML = reviews.map(review => `
        <tr>
            <td>${esc(review.id)}</td>
            <td>
                <div class="review-company">${esc(review.company?.name || 'Unbekannt')}</div>
                <div class="review-city">${esc(review.company?.city || '')}</div>
            </td>
            <td>${esc(review.title || 'Kein Titel')}</td>
            <td>
                <div class="rating-stars">
                    ${'★'.repeat(review.rating || 0)}${'☆'.repeat(5 - (review.rating || 0))}
                </div>
                <div class="rating-value">${review.rating || 0}/5</div>
            </td>
            <td>${formatDate(review.created_at)}</td>
            <td>
                <span class="status-badge status-${review.status}">
                    ${getStatusText(review.status)}
                </span>
            </td>
            <td>${esc(review.user?.email || 'Gelöscht')}</td>
            <td class="actions">
                ${review.status === 'pending' ? `
                    <button class="btn btn-approve" data-id="${review.id}" title="Genehmigen">✓</button>
                    <button class="btn btn-reject" data-id="${review.id}" title="Ablehnen">✗</button>
                ` : ''}
                <button class="btn btn-delete" data-id="${review.id}" title="Löschen">🗑</button>
            </td>
        </tr>
    `).join('');

    renderPagination(page, totalPages, total, 'reviews');
}

async function loadCompanies() {
    showLoading(elements.companiesContainer);

    try {
        const { data, error } = await supabase
            .from('companies')
            .select('*, reviews_count:reviews(count)')
            .order('name');

        if (error) throw error;

        companies = data || [];
        renderCompanies(companies);
    } catch (error) {
        console.error('Load Companies Error:', error);
        showNotification('Fehler beim Laden der Unternehmen', 'error');
    } finally {
        hideLoading(elements.companiesContainer);
    }
}

async function saveCompany(companyData, companyId = null) {
    try {
        const dataToSave = {
            name: companyData.name.trim(),
            city: companyData.city.trim(),
            address: companyData.address.trim(),
            website: companyData.website.trim(),
            description: companyData.description.trim(),
            status: companyData.status || 'unverified',
            updated_at: new Date().toISOString()
        };

        let result;
        if (companyId) {
            result = await supabase
                .from('companies')
                .update(dataToSave)
                .eq('id', companyId)
                .select();
        } else {
            result = await supabase
                .from('companies')
                .insert([dataToSave])
                .select();
        }

        if (result.error) throw result.error;

        showNotification(`Unternehmen ${companyId ? 'aktualisiert' : 'hinzugefügt'}`, 'success');
        loadCompanies();
        closeModal();
    } catch (error) {
        console.error('Save Company Error:', error);
        showNotification('Fehler beim Speichern des Unternehmens', 'error');
    }
}

async function deleteCompany(companyId) {
    if (!confirm('Unternehmen wirklich löschen? Alle zugehörigen Bewertungen und Jobs werden ebenfalls gelöscht!')) return;

    try {
        const { error: reviewsError } = await supabase
            .from('reviews')
            .delete()
            .eq('company_id', companyId);

        if (reviewsError) throw reviewsError;

        const { error: jobsError } = await supabase
            .from('jobs')
            .delete()
            .eq('company_id', companyId);

        if (jobsError) throw jobsError;

        const { error } = await supabase
            .from('companies')
            .delete()
            .eq('id', companyId);

        if (error) throw error;

        showNotification('Unternehmen und alle zugehörigen Daten gelöscht', 'success');
        loadCompanies();
    } catch (error) {
        console.error('Delete Company Error:', error);
        showNotification('Fehler beim Löschen des Unternehmens', 'error');
    }
}

function renderCompanies(companies) {
    if (!elements.companyTableBody) return;

    if (companies.length === 0) {
        elements.companyTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">Keine Unternehmen gefunden</td>
            </tr>
        `;
        return;
    }

    elements.companyTableBody.innerHTML = companies.map(company => `
        <tr>
            <td>${esc(company.id)}</td>
            <td>
                <strong>${esc(company.name)}</strong>
                <div class="text-small">${esc(company.city)}</div>
            </td>
            <td>${esc(truncate(company.description, 50))}</td>
            <td>
                <span class="status-badge status-${company.status}">
                    ${getStatusText(company.status)}
                </span>
            </td>
            <td>${company.reviews_count?.[0]?.count || 0}</td>
            <td class="actions">
                <button class="btn btn-edit" data-id="${company.id}" title="Bearbeiten">✏️</button>
                <button class="btn btn-delete" data-id="${company.id}" title="Löschen">🗑</button>
            </td>
        </tr>
    `).join('');
}

async function loadJobs() {
    showLoading(elements.jobsContainer);

    try {
        const { data, error } = await supabase
            .from('jobs')
            .select('*, company:companies(name, city)')
            .order('created_at', { ascending: false });

        if (error) throw error;

        jobs = data || [];
        renderJobs(jobs);
    } catch (error) {
        console.error('Load Jobs Error:', error);
        showNotification('Fehler beim Laden der Jobs', 'error');
    } finally {
        hideLoading(elements.jobsContainer);
    }
}

async function saveJob(jobData, jobId = null) {
    try {
        const dataToSave = {
            title: jobData.title.trim(),
            description: jobData.description.trim(),
            company_id: jobData.company_id,
            type: jobData.type,
            location: jobData.location.trim(),
            salary: jobData.salary.trim(),
            requirements: jobData.requirements.trim(),
            benefits: jobData.benefits.trim(),
            contact_email: jobData.contact_email.trim(),
            application_deadline: jobData.application_deadline,
            status: jobData.status || 'active',
            updated_at: new Date().toISOString()
        };

        let result;
        if (jobId) {
            result = await supabase
                .from('jobs')
                .update(dataToSave)
                .eq('id', jobId)
                .select();
        } else {
            result = await supabase
                .from('jobs')
                .insert([dataToSave])
                .select();
        }

        if (result.error) throw result.error;

        showNotification(`Job ${jobId ? 'aktualisiert' : 'hinzugefügt'}`, 'success');
        loadJobs();
        closeModal();
    } catch (error) {
        console.error('Save Job Error:', error);
        showNotification('Fehler beim Speichern des Jobs', 'error');
    }
}

async function deleteJob(jobId) {
    if (!confirm('Job wirklich löschen?')) return;

    try {
        const { error } = await supabase
            .from('jobs')
            .delete()
            .eq('id', jobId);

        if (error) throw error;

        showNotification('Job gelöscht', 'success');
        loadJobs();
    } catch (error) {
        console.error('Delete Job Error:', error);
        showNotification('Fehler beim Löschen des Jobs', 'error');
    }
}

function renderJobs(jobs) {
    if (!elements.jobTableBody) return;

    if (jobs.length === 0) {
        elements.jobTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">Keine Jobs gefunden</td>
            </tr>
        `;
        return;
    }

    elements.jobTableBody.innerHTML = jobs.map(job => `
        <tr>
            <td>${esc(job.id)}</td>
            <td>
                <strong>${esc(job.title)}</strong>
                <div class="text-small">${esc(job.company?.name || 'Unbekannt')}</div>
            </td>
            <td>${esc(job.type || 'Vollzeit')}</td>
            <td>${esc(job.location || job.company?.city || '')}</td>
            <td>${formatDate(job.created_at)}</td>
            <td>
                <span class="status-badge status-${job.status}">
                    ${getStatusText(job.status)}
                </span>
            </td>
            <td class="actions">
                <button class="btn btn-edit" data-id="${job.id}" title="Bearbeiten">✏️</button>
                <button class="btn btn-delete" data-id="${job.id}" title="Löschen">🗑</button>
            </td>
        </tr>
    `).join('');
}

async function loadUsers() {
    showLoading(elements.usersContainer);

    try {
        const { data, error } = await supabase
            .from('users')
            .select('*, reviews_count:reviews(count), jobs_count:jobs(count)')
            .order('created_at', { ascending: false });

        if (error) throw error;

        users = data || [];
        renderUsers(users);
    } catch (error) {
        console.error('Load Users Error:', error);
        showNotification('Fehler beim Laden der Benutzer', 'error');
    } finally {
        hideLoading(elements.usersContainer);
    }
}

async function updateUserRole(userId, role) {
    try {
        const { error } = await supabase
            .from('users')
            .update({ role: role })
            .eq('id', userId);

        if (error) throw error;

        showNotification('Benutzerrolle aktualisiert', 'success');
        loadUsers();
    } catch (error) {
        console.error('Update User Role Error:', error);
        showNotification('Fehler beim Aktualisieren der Rolle', 'error');
    }
}

function renderUsers(users) {
    if (!elements.usersTableBody) return;

    if (users.length === 0) {
        elements.usersTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center">Keine Benutzer gefunden</td>
            </tr>
        `;
        return;
    }

    elements.usersTableBody.innerHTML = users.map(user => `
        <tr>
            <td>${esc(user.id)}</td>
            <td>${esc(user.email)}</td>
            <td>
                <select class="role-select" data-user-id="${user.id}">
                    <option value="user" ${user.role === 'user' ? 'selected' : ''}>Benutzer</option>
                    <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                    <option value="moderator" ${user.role === 'moderator' ? 'selected' : ''}>Moderator</option>
                </select>
            </td>
            <td>${user.reviews_count?.[0]?.count || 0}</td>
            <td>${formatDate(user.created_at)}</td>
        </tr>
    `).join('');

    document.querySelectorAll('.role-select').forEach(select => {
        select.addEventListener('change', (e) => {
            const userId = e.target.dataset.userId;
            const newRole = e.target.value;
            updateUserRole(userId, newRole);
        });
    });
}

async function updateReviewStats() {
    try {
        const { count: pendingCount } = await supabase
            .from('reviews')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending');

        const { count: approvedCount } = await supabase
            .from('reviews')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'approved');

        const { count: companiesCount } = await supabase
            .from('companies')
            .select('*', { count: 'exact', head: true });

        const { count: jobsCount } = await supabase
            .from('jobs')
            .select('*', { count: 'exact', head: true });

        if (elements.statsPending) elements.statsPending.textContent = pendingCount || 0;
        if (elements.statsApproved) elements.statsApproved.textContent = approvedCount || 0;
        if (elements.statsCompanies) elements.statsCompanies.textContent = companiesCount || 0;
        if (elements.statsJobs) elements.statsJobs.textContent = jobsCount || 0;
    } catch (error) {
        console.error('Stats Update Error:', error);
    }
}

function openModal(type, id = null) {
    const item = type === 'company' ? companies.find(c => c.id === id) :
                 type === 'job' ? jobs.find(j => j.id === id) :
                 null;

    let title = '';
    let content = '';

    if (type === 'company') {
        title = id ? 'Unternehmen bearbeiten' : 'Neues Unternehmen hinzufügen';
        content = `
            <form id="modal-form">
                <div class="form-group">
                    <label for="company-name">Name *</label>
                    <input type="text" id="company-name" value="${esc(item?.name || '')}" required>
                </div>
                <div class="form-group">
                    <label for="company-city">Stadt *</label>
                    <input type="text" id="company-city" value="${esc(item?.city || '')}" required>
                </div>
                <div class="form-group">
                    <label for="company-address">Adresse</label>
                    <input type="text" id="company-address" value="${esc(item?.address || '')}">
                </div>
                <div class="form-group">
                    <label for="company-website">Website</label>
                    <input type="url" id="company-website" value="${esc(item?.website || '')}">
                </div>
                <div class="form-group">
                    <label for="company-description">Beschreibung</label>
                    <textarea id="company-description">${esc(item?.description || '')}</textarea>
                </div>
                <div class="form-group">
                    <label for="company-status">Status</label>
                    <select id="company-status">
                        <option value="verified" ${item?.status === 'verified' ? 'selected' : ''}>Verifiziert</option>
                        <option value="unverified" ${item?.status === 'unverified' ? 'selected' : ''}>Nicht verifiziert</option>
                    </select>
                </div>
            </form>
        `;
    } else if (type === 'job') {
        title = id ? 'Job bearbeiten' : 'Neuen Job hinzufügen';
        const companiesOptions = companies.map(c =>
            `<option value="${c.id}" ${item?.company_id === c.id ? 'selected' : ''}>${esc(c.name)}</option>`
        ).join('');

        content = `
            <form id="modal-form">
                <div class="form-group">
                    <label for="job-title">Titel *</label>
                    <input type="text" id="job-title" value="${esc(item?.title || '')}" required>
                </div>
                <div class="form-group">
                    <label for="job-company">Unternehmen *</label>
                    <select id="job-company" required>
                        <option value="">-- Unternehmen auswählen --</option>
                        ${companiesOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label for="job-type">Art</label>
                    <select id="job-type">
                        <option value="full-time" ${item?.type === 'full-time' ? 'selected' : ''}>Vollzeit</option>
                        <option value="part-time" ${item?.type === 'part-time' ? 'selected' : ''}>Teilzeit</option>
                        <option value="internship" ${item?.type === 'internship' ? 'selected' : ''}>Praktikum</option>
                        <option value="apprenticeship" ${item?.type === 'apprenticeship' ? 'selected' : ''}>Ausbildung</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="job-location">Standort</label>
                    <input type="text" id="job-location" value="${esc(item?.location || '')}">
                </div>
                <div class="form-group">
                    <label for="job-salary">Gehalt</label>
                    <input type="text" id="job-salary" value="${esc(item?.salary || '')}">
                </div>
                <div class="form-group">
                    <label for="job-description">Beschreibung</label>
                    <textarea id="job-description">${esc(item?.description || '')}</textarea>
                </div>
                <div class="form-group">
                    <label for="job-requirements">Anforderungen</label>
                    <textarea id="job-requirements">${esc(item?.requirements || '')}</textarea>
                </div>
                <div class="form-group">
                    <label for="job-benefits">Vorteile</label>
                    <textarea id="job-benefits">${esc(item?.benefits || '')}</textarea>
                </div>
                <div class="form-group">
                    <label for="job-contact">Kontakt-E-Mail</label>
                    <input type="email" id="job-contact" value="${esc(item?.contact_email || '')}">
                </div>
                <div class="form-group">
                    <label for="job-deadline">Bewerbungsfrist</label>
                    <input type="date" id="job-deadline" value="${item?.application_deadline || ''}">
                </div>
                <div class="form-group">
                    <label for="job-status">Status</label>
                    <select id="job-status">
                        <option value="active" ${item?.status === 'active' ? 'selected' : ''}>Aktiv</option>
                        <option value="inactive" ${item?.status === 'inactive' ? 'selected' : ''}>Inaktiv</option>
                    </select>
                </div>
            </form>
        `;
    }

    elements.modalTitle.textContent = title;
    elements.modalContent.innerHTML = content;
    elements.modal.style.display = 'block';
    elements.modal.dataset.type = type;
    elements.modal.dataset.id = id || '';
}

function closeModal() {
    elements.modal.style.display = 'none';
    elements.modalContent.innerHTML = '';
}

function saveModal() {
    const type = elements.modal.dataset.type;
    const id = elements.modal.dataset.id;

    if (type === 'company') {
        const data = {
            name: document.getElementById('company-name').value,
            city: document.getElementById('company-city').value,
            address: document.getElementById('company-address').value,
            website: document.getElementById('company-website').value,
            description: document.getElementById('company-description').value,
            status: document.getElementById('company-status').value
        };
        saveCompany(data, id || null);
    } else if (type === 'job') {
        const data = {
            title: document.getElementById('job-title').value,
            company_id: document.getElementById('job-company').value,
            type: document.getElementById('job-type').value,
            location: document.getElementById('job-location').value,
            salary: document.getElementById('job-salary').value,
            description: document.getElementById('job-description').value,
            requirements: document.getElementById('job-requirements').value,
            benefits: document.getElementById('job-benefits').value,
            contact_email: document.getElementById('job-contact').value,
            application_deadline: document.getElementById('job-deadline').value,
            status: document.getElementById('job-status').value
        };
        saveJob(data, id || null);
    }
}

function renderPagination(page, totalPages, total, type) {
    const paginationContainer = document.getElementById(`${type}-pagination`);
    if (!paginationContainer) return;

    let html = `
        <div class="pagination-info">
            Seite ${page} von ${totalPages} (${total} Einträge)
        </div>
        <div class="pagination-controls">
    `;

    if (page > 1) {
        html += `
            <button class="btn btn-pagination" data-page="${page - 1}" data-type="${type}">← Zurück</button>
        `;
    }

    let startPage = Math.max(1, page - 2);
    let endPage = Math.min(totalPages, page + 2);

    if (page <= 2) endPage = Math.min(totalPages, 5);
    if (page >= totalPages - 1) startPage = Math.max(1, totalPages - 4);

    for (let i = startPage; i <= endPage; i++) {
        html += `
            <button class="btn btn-pagination ${i === page ? 'active' : ''}" data-page="${i}" data-type="${type}">${i}</button>
        `;
    }

    if (page < totalPages) {
        html += `
            <button class="btn btn-pagination" data-page="${page + 1}" data-type="${type}">Vor →</button>
        `;
    }

    html += `</div>`;
    paginationContainer.innerHTML = html;

    paginationContainer.querySelectorAll('.btn-pagination').forEach(btn => {
        btn.addEventListener('click', () => {
            const newPage = parseInt(btn.dataset.page);
            if (type === 'reviews') {
                loadReviews(currentReviewFilter, currentReviewSearch, newPage);
            }
        });
    });
}

function switchSection(section) {
    document.querySelectorAll('.section-container').forEach(container => {
        container.style.display = 'none';
    });

    const container = document.getElementById(`${section}-container`);
    if (container) container.style.display = 'block';

    elements.navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.dataset.section === section) link.classList.add('active');
    });

    currentSection = section;

    if (section === 'reviews') {
        loadReviews(currentReviewFilter, currentReviewSearch, currentReviewPage);
    } else if (section === 'companies') {
        loadCompanies();
    } else if (section === 'jobs') {
        loadJobs();
    } else if (section === 'users') {
        loadUsers();
    }
}

async function loadInitialData() {
    try {
        await Promise.all([
            loadReviews('pending'),
            loadCompanies(),
            loadJobs(),
            loadUsers()
        ]);
    } catch (error) {
        console.error('Initial Data Load Error:', error);
        showNotification('Fehler beim Laden der Initialdaten', 'error');
    }
}

function setupEventListeners() {
    if (elements.loginForm) {
        elements.loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            login(elements.loginEmail.value, elements.loginPassword.value);
        });
    }

    if (elements.logoutButton) {
        elements.logoutButton.addEventListener('click', logout);
    }

    elements.navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            switchSection(link.dataset.section);
        });
    });

    if (elements.reviewFilter) {
        elements.reviewFilter.addEventListener('submit', (e) => {
            e.preventDefault();
            const status = elements.reviewStatusFilter?.value || 'pending';
            const search = elements.reviewSearch?.value || '';
            loadReviews(status, search, 1);
        });
    }

    if (elements.reviewSearch) {
        elements.reviewSearch.addEventListener('input', debounce((e) => {
            const status = elements.reviewStatusFilter?.value || 'pending';
            loadReviews(status, e.target.value, 1);
        }, 500));
    }

    if (elements.reviewsContainer) {
        elements.reviewsContainer.addEventListener('click', (e) => {
            if (e.target.closest('.btn-approve')) {
                approveReview(e.target.closest('.btn-approve').dataset.id);
            }
            if (e.target.closest('.btn-reject')) {
                rejectReview(e.target.closest('.btn-reject').dataset.id);
            }
            if (e.target.closest('.btn-delete')) {
                deleteReview(e.target.closest('.btn-delete').dataset.id);
            }
        });
    }

    if (elements.companiesContainer) {
        elements.companiesContainer.addEventListener('click', (e) => {
            if (e.target.closest('.btn-add-company')) {
                openModal('company');
            }
            if (e.target.closest('.btn-edit')) {
                openModal('company', e.target.closest('.btn-edit').dataset.id);
            }
            if (e.target.closest('.btn-delete')) {
                deleteCompany(e.target.closest('.btn-delete').dataset.id);
            }
        });
    }

    if (elements.jobsContainer) {
        elements.jobsContainer.addEventListener('click', (e) => {
            if (e.target.closest('.btn-add-job')) {
                openModal('job');
            }
            if (e.target.closest('.btn-edit')) {
                openModal('job', e.target.closest('.btn-edit').dataset.id);
            }
            if (e.target.closest('.btn-delete')) {
                deleteJob(e.target.closest('.btn-delete').dataset.id);
            }
        });
    }

    if (elements.modalClose) {
        elements.modalClose.addEventListener('click', closeModal);
    }

    if (elements.modalCancel) {
        elements.modalCancel.addEventListener('click', closeModal);
    }

    if (elements.modalSave) {
        elements.modalSave.addEventListener('click', saveModal);
    }

    if (elements.modal) {
        elements.modal.addEventListener('click', (e) => {
            if (e.target === elements.modal) closeModal();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && elements.modal.style.display === 'block') {
            closeModal();
        }
    });
}

async function init() {
    try {
        await checkAuth();
        setupEventListeners();

        if (elements.navLinks.length > 0) {
            switchSection(elements.navLinks[0].dataset.section);
        }
    } catch (error) {
        console.error('Initialization Error:', error);
        showNotification('Fehler bei der Initialisierung', 'error');
    }
}

document.addEventListener('DOMContentLoaded', init);
