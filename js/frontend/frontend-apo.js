// ============================================
// APOTHEKE FRONTEND - JavaScript
// (Identische Logik wie frontend-pta.js, nur für Apotheke-Frontend)
// ============================================

// --- DOM Elements ---------------------------------
const elements = {
    // Authentication
    loginButton: document.getElementById('login-button'),
    logoutButton: document.getElementById('logout-button'),
    userProfile: document.getElementById('user-profile'),
    authModal: document.getElementById('auth-modal'),
    authClose: document.querySelector('.auth-close'),
    authForm: document.getElementById('auth-form'),
    authEmail: document.getElementById('auth-email'),
    authPassword: document.getElementById('auth-password'),
    authToggle: document.getElementById('auth-toggle'),
    authSubmit: document.getElementById('auth-submit'),
    
    // Navigation
    navLinks: document.querySelectorAll('.nav-link'),
    
    // Hero Section
    heroSection: document.getElementById('hero-section'),
    
    // Reviews Section
    reviewsSection: document.getElementById('reviews-section'),
    reviewsContainer: document.getElementById('reviews-container'),
    reviewForm: document.getElementById('review-form'),
    reviewFormTitle: document.getElementById('review-title'),
    reviewFormComment: document.getElementById('review-comment'),
    reviewFormRating: document.querySelectorAll('.review-rating-star'),
    reviewFormCompany: document.getElementById('review-company'),
    reviewFormType: document.getElementById('review-type'),
    reviewFormYear: document.getElementById('review-year'),
    reviewFormDuration: document.getElementById('review-duration'),
    reviewFormSalary: document.getElementById('review-salary'),
    reviewFormSubmit: document.getElementById('review-submit'),
    reviewFilter: document.getElementById('review-filter'),
    reviewSearch: document.getElementById('review-search'),
    reviewSort: document.getElementById('review-sort'),
    reviewPagination: document.getElementById('review-pagination'),
    
    // Companies Section
    companiesSection: document.getElementById('companies-section'),
    companiesContainer: document.getElementById('companies-container'),
    companiesFilter: document.getElementById('companies-filter'),
    companiesSearch: document.getElementById('companies-search'),
    companiesPagination: document.getElementById('companies-pagination'),
    
    // Jobs Section
    jobsSection: document.getElementById('jobs-section'),
    jobsContainer: document.getElementById('jobs-container'),
    jobsFilter: document.getElementById('jobs-filter'),
    jobsSearch: document.getElementById('jobs-search'),
    jobsPagination: document.getElementById('jobs-pagination'),
    
    // Stats
    statsAverageRating: document.getElementById('stats-average-rating'),
    statsTotalReviews: document.getElementById('stats-total-reviews'),
    statsTotalCompanies: document.getElementById('stats-total-companies'),
    statsTotalJobs: document.getElementById('stats-total-jobs')
};

// --- State --------------------------------------
let currentUser = null;
let currentSection = 'reviews';
let reviews = [];
let companies = [];
let jobs = [];
let currentReviewPage = 1;
let currentCompanyPage = 1;
let currentJobPage = 1;
const PAGE_SIZE = 10;
let currentReviewFilter = {
    rating: '',
    type: '',
    year: '',
    company: ''
};
let currentReviewSort = 'newest';
let currentReviewSearch = '';
let selectedRating = 0;

// ============================================
// AUTHENTICATION
// ============================================

async function checkAuth() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        currentUser = user;
        updateAuthUI();
    } catch (error) {
        console.error('Auth Check Error:', error);
    }
}

function updateAuthUI() {
    if (currentUser) {
        if (elements.loginButton) elements.loginButton.style.display = 'none';
        if (elements.logoutButton) elements.logoutButton.style.display = 'inline-block';
        if (elements.userProfile) {
            elements.userProfile.style.display = 'inline-block';
            elements.userProfile.innerHTML = `
                <span>${esc(currentUser.email)}</span>
                <span class="user-role">${currentUser.role === 'admin' ? '(Admin)' : ''}</span>
            `;
        }
        if (elements.reviewForm) {
            elements.reviewForm.style.display = 'block';
        }
    } else {
        if (elements.loginButton) elements.loginButton.style.display = 'inline-block';
        if (elements.logoutButton) elements.logoutButton.style.display = 'none';
        if (elements.userProfile) {
            elements.userProfile.style.display = 'none';
        }
        if (elements.reviewForm) {
            elements.reviewForm.style.display = 'none';
        }
    }
}

async function login(email, password) {
    if (!email || !password) {
        showNotification('Bitte E-Mail und Passwort eingeben', 'error');
        return;
    }

    showLoading(elements.authSubmit);

    try {
        const { error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password: password
        });

        if (error) throw error;

        await checkAuth();
        closeAuthModal();
        showNotification('Erfolgreich angemeldet', 'success');
    } catch (error) {
        console.error('Login Error:', error);
        showNotification(error.message || 'Login fehlgeschlagen', 'error');
    } finally {
        hideLoading(elements.authSubmit);
    }
}

async function logout() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;

        currentUser = null;
        updateAuthUI();
        showNotification('Erfolgreich abgemeldet', 'success');
    } catch (error) {
        console.error('Logout Error:', error);
        showNotification('Fehler beim Abmelden', 'error');
    }
}

async function signup(email, password) {
    if (!email || !password) {
        showNotification('Bitte E-Mail und Passwort eingeben', 'error');
        return;
    }

    if (!isValidEmail(email)) {
        showNotification('Bitte eine gültige E-Mail-Adresse eingeben', 'error');
        return;
    }

    if (password.length < 6) {
        showNotification('Passwort muss mindestens 6 Zeichen lang sein', 'error');
        return;
    }

    showLoading(elements.authSubmit);

    try {
        const { error } = await supabase.auth.signUp({
            email: email.trim(),
            password: password
        });

        if (error) throw error;

        showNotification('Registrierung erfolgreich! Bitte bestätige deine E-Mail.', 'success');
        closeAuthModal();
    } catch (error) {
        console.error('Signup Error:', error);
        showNotification(error.message || 'Registrierung fehlgeschlagen', 'error');
    } finally {
        hideLoading(elements.authSubmit);
    }
}

function openAuthModal() {
    if (elements.authModal) {
        elements.authModal.style.display = 'block';
        elements.authEmail.value = '';
        elements.authPassword.value = '';
        elements.authEmail.focus();
    }
}

function closeAuthModal() {
    if (elements.authModal) {
        elements.authModal.style.display = 'none';
    }
}

function toggleAuthMode() {
    const isLogin = elements.authSubmit.textContent.includes('Anmelden');
    if (isLogin) {
        elements.authSubmit.textContent = 'Registrieren';
        elements.authToggle.textContent = 'Schon einen Account? Anmelden';
        elements.authForm.dataset.mode = 'signup';
    } else {
        elements.authSubmit.textContent = 'Anmelden';
        elements.authToggle.textContent = 'Noch keinen Account? Registrieren';
        elements.authForm.dataset.mode = 'login';
    }
}

// ============================================
// REVIEWS
// ============================================

async function loadReviews(page = 1, filter = {}, sort = 'newest', search = '') {
    showLoading(elements.reviewsContainer);
    currentReviewPage = page;
    currentReviewFilter = filter;
    currentReviewSort = sort;
    currentReviewSearch = search;

    try {
        let query = supabase
            .from('reviews')
            .select('*, company:companies(name, city, website), user:users(email)', { count: 'exact' })
            .eq('status', 'approved');

        if (filter.rating) {
            query = query.eq('rating', parseInt(filter.rating));
        }
        if (filter.type) {
            query = query.eq('type', filter.type);
        }
        if (filter.year) {
            query = query.eq('year', parseInt(filter.year));
        }
        if (filter.company) {
            query = query.eq('company_id', filter.company);
        }

        if (search) {
            query = query.or(
                `title.ilike.%${search}%,comment.ilike.%${search}%,company.name.ilike.%${search}%`
            );
        }

        if (sort === 'newest') {
            query = query.order('created_at', { ascending: false });
        } else if (sort === 'oldest') {
            query = query.order('created_at', { ascending: true });
        } else if (sort === 'rating-high') {
            query = query.order('rating', { ascending: false });
        } else if (sort === 'rating-low') {
            query = query.order('rating', { ascending: true });
        }

        const from = (page - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;
        query = query.range(from, to);

        const { data, count, error } = await query;

        if (error) throw error;

        reviews = data || [];
        const total = count || 0;
        const totalPages = Math.ceil(total / PAGE_SIZE);

        renderReviews(reviews);
        renderReviewPagination(page, totalPages, total);
        updateReviewStats();
    } catch (error) {
        console.error('Load Reviews Error:', error);
        showNotification('Fehler beim Laden der Bewertungen', 'error');
    } finally {
        hideLoading(elements.reviewsContainer);
    }
}

function renderReviews(reviews) {
    if (!elements.reviewsContainer) return;

    if (reviews.length === 0) {
        elements.reviewsContainer.innerHTML = `
            <div class="no-results">
                <p>Keine Bewertungen gefunden.</p>
                ${currentUser ? `
                    <p>Sei der Erste und hinterlasse eine Bewertung!</p>
                    <button class="btn btn-primary" onclick="scrollToReviewForm()">Bewertung schreiben</button>
                ` : `
                    <p>Melde dich an, um Bewertungen zu schreiben.</p>
                `}
            </div>
        `;
        return;
    }

    elements.reviewsContainer.innerHTML = reviews.map(review => `
        <article class="review-card" data-rating="${review.rating}" data-company="${review.company_id}">
            <div class="review-header">
                <div class="review-company">
                    <h3>${esc(review.company?.name || 'Unbekanntes Unternehmen')}</h3>
                    <div class="review-location">${esc(review.company?.city || '')}</div>
                </div>
                <div class="review-rating">
                    <div class="rating-stars">
                        ${'★'.repeat(review.rating || 0)}${'☆'.repeat(5 - (review.rating || 0))}
                    </div>
                    <div class="rating-value">${review.rating || 0}/5</div>
                </div>
            </div>

            <div class="review-meta">
                <span class="review-type">${esc(review.type || 'Praktikum')}</span>
                <span class="review-date">${formatDate(review.created_at)}</span>
                ${review.year ? `<span class="review-year">${review.year}</span>` : ''}
                ${review.duration ? `<span class="review-duration">${review.duration}</span>` : ''}
            </div>

            ${review.title ? `<h4 class="review-title">${esc(review.title)}</h4>` : ''}

            <div class="review-comment">
                <p>${esc(review.comment || 'Kein Kommentar')}</p>
            </div>

            ${review.salary ? `
                <div class="review-salary">
                    <strong>Verdienst:</strong> ${esc(review.salary)}
                </div>
            ` : ''}

            <div class="review-actions">
                ${review.company?.website ? `
                    <a href="${esc(review.company.website)}" target="_blank" rel="noopener noreferrer" class="btn btn-website">
                        Website besuchen
                    </a>
                ` : ''}
                <button class="btn btn-pdf" data-id="${review.id}" title="Als PDF speichern">
                    📄 PDF
                </button>
                ${currentUser && currentUser.id === review.user_id ? `
                    <button class="btn btn-delete" data-id="${review.id}" title="Bewertung löschen">
                        🗑 Löschen
                    </button>
                ` : ''}
            </div>
        </article>
    `).join('');

    elements.reviewsContainer.querySelectorAll('.btn-pdf').forEach(btn => {
        btn.addEventListener('click', () => {
            generatePDF(btn.dataset.id);
        });
    });

    elements.reviewsContainer.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', () => {
            deleteReview(btn.dataset.id);
        });
    });
}

async function deleteReview(reviewId) {
    if (!confirm('Bewertung wirklich löschen?')) return;

    try {
        const { error } = await supabase
            .from('reviews')
            .delete()
            .eq('id', reviewId)
            .eq('user_id', currentUser.id);

        if (error) throw error;

        showNotification('Bewertung gelöscht', 'success');
        loadReviews(currentReviewPage, currentReviewFilter, currentReviewSort, currentReviewSearch);
    } catch (error) {
        console.error('Delete Review Error:', error);
        showNotification('Fehler beim Löschen der Bewertung', 'error');
    }
}

async function submitReview() {
    if (!currentUser) {
        showNotification('Bitte melde dich an, um eine Bewertung zu schreiben', 'error');
        openAuthModal();
        return;
    }

    const title = elements.reviewFormTitle?.value.trim() || '';
    const comment = elements.reviewFormComment?.value.trim() || '';
    const companyId = elements.reviewFormCompany?.value;
    const type = elements.reviewFormType?.value || 'praktikum';
    const year = elements.reviewFormYear?.value ? parseInt(elements.reviewFormYear.value) : null;
    const duration = elements.reviewFormDuration?.value.trim() || '';
    const salary = elements.reviewFormSalary?.value.trim() || '';

    if (!companyId) {
        showNotification('Bitte wähle ein Unternehmen aus', 'error');
        return;
    }

    if (selectedRating === 0) {
        showNotification('Bitte vergebe eine Bewertung (1-5 Sterne)', 'error');
        return;
    }

    showLoading(elements.reviewFormSubmit);

    try {
        const { error } = await supabase
            .from('reviews')
            .insert([{
                title: title,
                comment: comment,
                rating: selectedRating,
                company_id: companyId,
                type: type,
                year: year,
                duration: duration,
                salary: salary,
                status: 'pending',
                user_id: currentUser.id,
                created_at: new Date().toISOString()
            }]);

        if (error) throw error;

        showNotification('Bewertung eingereicht! Sie wird nach Prüfung veröffentlicht.', 'success');
        elements.reviewForm.reset();
        selectedRating = 0;
        updateRatingStars();
        loadReviews(1);
        scrollToReviews();
    } catch (error) {
        console.error('Submit Review Error:', error);
        showNotification('Fehler beim Einreichen der Bewertung', 'error');
    } finally {
        hideLoading(elements.reviewFormSubmit);
    }
}

function updateRatingStars() {
    if (!elements.reviewFormRating) return;

    elements.reviewFormRating.forEach((star, index) => {
        if (index < selectedRating) {
            star.classList.add('selected');
        } else {
            star.classList.remove('selected');
        }
    });
}

function handleRatingStarClick(index) {
    selectedRating = index + 1;
    updateRatingStars();
}

async function generatePDF(reviewId) {
    try {
        const { data: review, error } = await supabase
            .from('reviews')
            .select('*, company:companies(name, city, website)')
            .eq('id', reviewId)
            .single();

        if (error) throw error;

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('Bewertung für ' + (review.company?.name || 'Unbekannt'), 105, 20, { align: 'center' });

        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        doc.text(`Unternehmen: ${review.company?.name || 'Unbekannt'}`, 20, 40);
        doc.text(`Standort: ${review.company?.city || 'Unbekannt'}`, 20, 50);
        if (review.company?.website) {
            doc.text(`Website: ${review.company.website}`, 20, 60);
        }

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Bewertung', 20, 80);

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`Sterne: ${review.rating}/5`, 20, 90);
        doc.text(`Typ: ${review.type || 'Praktikum'}`, 20, 100);
        if (review.year) {
            doc.text(`Jahr: ${review.year}`, 20, 110);
        }
        if (review.duration) {
            doc.text(`Dauer: ${review.duration}`, 20, 120);
        }
        if (review.salary) {
            doc.text(`Verdienst: ${review.salary}`, 20, 130);
        }

        if (review.title) {
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text(`Titel: ${review.title}`, 20, 150);
        }

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        const commentLines = doc.splitTextToSize(
            review.comment || 'Kein Kommentar',
            170
        );
        doc.text(commentLines, 20, 160);

        doc.text(`Erstellt am: ${formatDate(review.created_at)}`, 20, doc.lastAutoTable?.finalY + 20 || 200);

        const fileName = `bewertung-${review.company?.name || 'unbekannt'}-${review.id}.pdf`;
        doc.save(fileName);

        showNotification('PDF generiert und heruntergeladen', 'success');
    } catch (error) {
        console.error('Generate PDF Error:', error);
        showNotification('Fehler beim Generieren des PDFs', 'error');
    }
}

function scrollToReviewForm() {
    if (elements.reviewForm) {
        elements.reviewForm.scrollIntoView({ behavior: 'smooth' });
    }
}

function scrollToReviews() {
    if (elements.reviewsSection) {
        elements.reviewsSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// ============================================
// COMPANIES
// ============================================

async function loadCompanies(page = 1, search = '') {
    showLoading(elements.companiesContainer);
    currentCompanyPage = page;
    currentReviewSearch = search;

    try {
        let query = supabase
            .from('companies')
            .select('*, avg_rating:reviews(rating), review_count:reviews(count)', { count: 'exact' })
            .eq('status', 'verified');

        if (search) {
            query = query.or(
                `name.ilike.%${search}%,city.ilike.%${search}%,description.ilike.%${search}%`
            );
        }

        query = query.order('avg_rating', { ascending: false, nulls: 'last' });

        const from = (page - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;
        query = query.range(from, to);

        const { data, count, error } = await query;

        if (error) throw error;

        companies = data || [];
        const total = count || 0;
        const totalPages = Math.ceil(total / PAGE_SIZE);

        renderCompanies(companies);
        renderCompanyPagination(page, totalPages, total);
        updateCompanyStats();
    } catch (error) {
        console.error('Load Companies Error:', error);
        showNotification('Fehler beim Laden der Unternehmen', 'error');
    } finally {
        hideLoading(elements.companiesContainer);
    }
}

function renderCompanies(companies) {
    if (!elements.companiesContainer) return;

    if (companies.length === 0) {
        elements.companiesContainer.innerHTML = `
            <div class="no-results">
                <p>Keine Unternehmen gefunden.</p>
            </div>
        `;
        return;
    }

    elements.companiesContainer.innerHTML = companies.map(company => {
        const avgRating = company.avg_rating?.[0]?.rating || 0;
        const reviewCount = company.review_count?.[0]?.count || 0;

        return `
            <article class="company-card" data-id="${company.id}">
                <div class="company-header">
                    <h3>${esc(company.name)}</h3>
                    <div class="company-rating">
                        <div class="rating-stars">
                            ${avgRating > 0 ? '★'.repeat(Math.round(avgRating)) + '☆'.repeat(5 - Math.round(avgRating)) : 'No ratings'}
                        </div>
                        <div class="rating-value">${avgRating > 0 ? avgRating.toFixed(1) : 'No ratings'}/5</div>
                        <div class="review-count">(${reviewCount} Bewertungen)</div>
                    </div>
                </div>

                <div class="company-location">${esc(company.city || '')}</div>

                ${company.description ? `
                    <div class="company-description">
                        <p>${esc(truncate(company.description, 200))}</p>
                    </div>
                ` : ''}

                <div class="company-actions">
                    ${company.website ? `
                        <a href="${company.website}" target="_blank" rel="noopener noreferrer" class="btn btn-website">
                            Website besuchen
                        </a>
                    ` : ''}
                    <button class="btn btn-reviews" data-id="${company.id}" title="Bewertungen anzeigen">
                        Bewertungen anzeigen (${reviewCount})
                    </button>
                </div>
            </article>
        `;
    }).join('');

    elements.companiesContainer.querySelectorAll('.btn-reviews').forEach(btn => {
        btn.addEventListener('click', () => {
            const companyId = btn.dataset.id;
            loadReviews(1, { ...currentReviewFilter, company: companyId }, currentReviewSort, currentReviewSearch);
            switchSection('reviews');
        });
    });
}

// ============================================
// JOBS
// ============================================

async function loadJobs(page = 1, search = '') {
    showLoading(elements.jobsContainer);
    currentJobPage = page;
    currentReviewSearch = search;

    try {
        let query = supabase
            .from('jobs')
            .select('*, company:companies(name, city)', { count: 'exact' })
            .eq('status', 'active');

        if (search) {
            query = query.or(
                `title.ilike.%${search}%,description.ilike.%${search}%,company.name.ilike.%${search}%`
            );
        }

        query = query.order('created_at', { ascending: false });

        const from = (page - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;
        query = query.range(from, to);

        const { data, count, error } = await query;

        if (error) throw error;

        jobs = data || [];
        const total = count || 0;
        const totalPages = Math.ceil(total / PAGE_SIZE);

        renderJobs(jobs);
        renderJobPagination(page, totalPages, total);
        updateJobStats();
    } catch (error) {
        console.error('Load Jobs Error:', error);
        showNotification('Fehler beim Laden der Jobs', 'error');
    } finally {
        hideLoading(elements.jobsContainer);
    }
}

function renderJobs(jobs) {
    if (!elements.jobsContainer) return;

    if (jobs.length === 0) {
        elements.jobsContainer.innerHTML = `
            <div class="no-results">
                <p>Keine Jobs gefunden.</p>
            </div>
        `;
        return;
    }

    elements.jobsContainer.innerHTML = jobs.map(job => `
        <article class="job-card" data-id="${job.id}">
            <div class="job-header">
                <h3>${esc(job.title)}</h3>
                <div class="job-company">${esc(job.company?.name || 'Unbekannt')}</div>
            </div>

            <div class="job-meta">
                <span class="job-type">${esc(job.type || 'Vollzeit')}</span>
                <span class="job-location">${esc(job.location || job.company?.city || '')}</span>
                <span class="job-date">Veröffentlicht: ${formatDate(job.created_at)}</span>
            </div>

            ${job.salary ? `<div class="job-salary">${esc(job.salary)}</div>` : ''}

            ${job.description ? `
                <div class="job-description">
                    <p>${esc(truncate(job.description, 300))}</p>
                </div>
            ` : ''}

            <div class="job-actions">
                ${job.contact_email ? `
                    <a href="mailto:${esc(job.contact_email)}" class="btn btn-apply">
                        Jetzt bewerben
                    </a>
                ` : ''}
                ${job.website ? `
                    <a href="${esc(job.website)}" target="_blank" rel="noopener noreferrer" class="btn btn-website">
                        Website besuchen
                    </a>
                ` : ''}
            </div>
        </article>
    `).join('');
}

// ============================================
// STATISTIKEN
// ============================================

async function updateReviewStats() {
    try {
        const { data: avgRating } = await supabase
            .from('reviews')
            .select('rating')
            .eq('status', 'approved');

        if (avgRating && avgRating.length > 0) {
            const avg = avgRating.reduce((sum, r) => sum + (r.rating || 0), 0) / avgRating.length;
            if (elements.statsAverageRating) {
                elements.statsAverageRating.innerHTML = `
                    <span class="stats-value">${avg.toFixed(1)}</span>
                    <span class="stats-label">/5 Sterne</span>
                `;
            }
        }

        const { count: totalReviews } = await supabase
            .from('reviews')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'approved');

        if (elements.statsTotalReviews) {
            elements.statsTotalReviews.innerHTML = `
                <span class="stats-value">${totalReviews || 0}</span>
                <span class="stats-label">Bewertungen</span>
            `;
        }
    } catch (error) {
        console.error('Review Stats Error:', error);
    }
}

async function updateCompanyStats() {
    try {
        const { count: totalCompanies } = await supabase
            .from('companies')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'verified');

        if (elements.statsTotalCompanies) {
            elements.statsTotalCompanies.innerHTML = `
                <span class="stats-value">${totalCompanies || 0}</span>
                <span class="stats-label">Unternehmen</span>
            `;
        }
    } catch (error) {
        console.error('Company Stats Error:', error);
    }
}

async function updateJobStats() {
    try {
        const { count: totalJobs } = await supabase
            .from('jobs')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active');

        if (elements.statsTotalJobs) {
            elements.statsTotalJobs.innerHTML = `
                <span class="stats-value">${totalJobs || 0}</span>
                <span class="stats-label">Jobs</span>
            `;
        }
    } catch (error) {
        console.error('Job Stats Error:', error);
    }
}

// ============================================
// PAGINATION
// ============================================

function renderReviewPagination(page, totalPages, total) {
    if (!elements.reviewPagination) return;

    let html = `
        <div class="pagination-info">
            Seite ${page} von ${totalPages} (${total} Bewertungen)
        </div>
        <div class="pagination-controls">
    `;

    if (page > 1) {
        html += `<button class="btn btn-pagination" data-page="${page - 1}">← Zurück</button>`;
    }

    const startPage = Math.max(1, page - 2);
    const endPage = Math.min(totalPages, page + 2);

    for (let i = startPage; i <= endPage; i++) {
        html += `<button class="btn btn-pagination ${i === page ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }

    if (page < totalPages) {
        html += `<button class="btn btn-pagination" data-page="${page + 1}">Vor →</button>`;
    }

    html += `</div>`;
    elements.reviewPagination.innerHTML = html;

    elements.reviewPagination.querySelectorAll('.btn-pagination').forEach(btn => {
        btn.addEventListener('click', () => {
            const newPage = parseInt(btn.dataset.page);
            loadReviews(newPage, currentReviewFilter, currentReviewSort, currentReviewSearch);
        });
    });
}

function renderCompanyPagination(page, totalPages, total) {
    if (!elements.companiesPagination) return;

    let html = `
        <div class="pagination-info">
            Seite ${page} von ${totalPages} (${total} Unternehmen)
        </div>
        <div class="pagination-controls">
    `;

    if (page > 1) {
        html += `<button class="btn btn-pagination" data-page="${page - 1}">← Zurück</button>`;
    }

    const startPage = Math.max(1, page - 2);
    const endPage = Math.min(totalPages, page + 2);

    for (let i = startPage; i <= endPage; i++) {
        html += `<button class="btn btn-pagination ${i === page ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }

    if (page < totalPages) {
        html += `<button class="btn btn-pagination" data-page="${page + 1}">Vor →</button>`;
    }

    html += `</div>`;
    elements.companiesPagination.innerHTML = html;

    elements.companiesPagination.querySelectorAll('.btn-pagination').forEach(btn => {
        btn.addEventListener('click', () => {
            const newPage = parseInt(btn.dataset.page);
            loadCompanies(newPage, currentReviewSearch);
        });
    });
}

function renderJobPagination(page, totalPages, total) {
    if (!elements.jobsPagination) return;

    let html = `
        <div class="pagination-info">
            Seite ${page} von ${totalPages} (${total} Jobs)
        </div>
        <div class="pagination-controls">
    `;

    if (page > 1) {
        html += `<button class="btn btn-pagination" data-page="${page - 1}">← Zurück</button>`;
    }

    const startPage = Math.max(1, page - 2);
    const endPage = Math.min(totalPages, page + 2);

    for (let i = startPage; i <= endPage; i++) {
        html += `<button class="btn btn-pagination ${i === page ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }

    if (page < totalPages) {
        html += `<button class="btn btn-pagination" data-page="${page + 1}">Vor →</button>`;
    }

    html += `</div>`;
    elements.jobsPagination.innerHTML = html;

    elements.jobsPagination.querySelectorAll('.btn-pagination').forEach(btn => {
        btn.addEventListener('click', () => {
            const newPage = parseInt(btn.dataset.page);
            loadJobs(newPage, currentReviewSearch);
        });
    });
}

// ============================================
// SECTION NAVIGATION
// ============================================

function switchSection(section) {
    document.querySelectorAll('.content-section').forEach(s => {
        s.style.display = 'none';
    });

    const sectionElement = document.getElementById(`${section}-section`);
    if (sectionElement) {
        sectionElement.style.display = 'block';
    }

    elements.navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.dataset.section === section) {
            link.classList.add('active');
        }
    });

    currentSection = section;

    if (section === 'reviews') {
        loadReviews(1, currentReviewFilter, currentReviewSort, currentReviewSearch);
    } else if (section === 'companies') {
        loadCompanies(1, '');
    } else if (section === 'jobs') {
        loadJobs(1, '');
    }
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
    // Authentication
    if (elements.loginButton) {
        elements.loginButton.addEventListener('click', openAuthModal);
    }

    if (elements.logoutButton) {
        elements.logoutButton.addEventListener('click', logout);
    }

    if (elements.authClose) {
        elements.authClose.addEventListener('click', closeAuthModal);
    }

    if (elements.authToggle) {
        elements.authToggle.addEventListener('click', toggleAuthMode);
    }

    if (elements.authForm) {
        elements.authForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = elements.authEmail.value.trim();
            const password = elements.authPassword.value.trim();
            const mode = elements.authForm.dataset.mode || 'login';

            if (mode === 'login') {
                login(email, password);
            } else {
                signup(email, password);
            }
        });
    }

    if (elements.authModal) {
        elements.authModal.addEventListener('click', (e) => {
            if (e.target === elements.authModal) {
                closeAuthModal();
            }
        });
    }

    // Navigation
    elements.navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            switchSection(link.dataset.section);
        });
    });

    // Reviews
    if (elements.reviewFormRating) {
        elements.reviewFormRating.forEach((star, index) => {
            star.addEventListener('click', () => {
                handleRatingStarClick(index);
            });
        });
    }

    if (elements.reviewForm) {
        elements.reviewForm.addEventListener('submit', (e) => {
            e.preventDefault();
            submitReview();
        });
    }

    if (elements.reviewFilter) {
        elements.reviewFilter.addEventListener('submit', (e) => {
            e.preventDefault();
            loadReviews(1, {
                rating: elements.reviewFilter.querySelector('[name="rating"]').value,
                type: elements.reviewFilter.querySelector('[name="type"]').value,
                year: elements.reviewFilter.querySelector('[name="year"]').value
            }, currentReviewSort, currentReviewSearch);
        });
    }

    if (elements.reviewSearch) {
        elements.reviewSearch.addEventListener('input', debounce((e) => {
            loadReviews(1, currentReviewFilter, currentReviewSort, e.target.value);
        }, 500));
    }

    if (elements.reviewSort) {
        elements.reviewSort.addEventListener('change', (e) => {
            loadReviews(1, currentReviewFilter, e.target.value, currentReviewSearch);
        });
    }

    // Companies
    if (elements.companiesSearch) {
        elements.companiesSearch.addEventListener('input', debounce((e) => {
            loadCompanies(1, e.target.value);
        }, 500));
    }

    // Jobs
    if (elements.jobsSearch) {
        elements.jobsSearch.addEventListener('input', debounce((e) => {
            loadJobs(1, e.target.value);
        }, 500));
    }

    // Auth Modal ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (elements.authModal && elements.authModal.style.display === 'block') {
                closeAuthModal();
            }
        }
    });
}

// ============================================
// INITIALIZATION
// ============================================

async function init() {
    try {
        await checkAuth();
        setupEventListeners();

        await Promise.all([
            loadReviews(1),
            loadCompanies(1),
            loadJobs(1)
        ]);

        if (elements.navLinks.length > 0) {
            switchSection(elements.navLinks[0].dataset.section);
        }
    } catch (error) {
        console.error('Initialization Error:', error);
        showNotification('Fehler bei der Initialisierung', 'error');
    }
}

// Starte, wenn DOM geladen ist
document.addEventListener('DOMContentLoaded', init);
