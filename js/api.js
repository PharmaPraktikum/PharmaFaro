import { supabase } from './supabase-client.js';

// ---------------------------------------------------------------
// Hilfsfunktion: Aufruf von Edge Functions (tokenbasierte Aktionen)
// ---------------------------------------------------------------
async function callFn(name, payload) {
    try {
        const res = await fetch(`${window.SUPABASE_URL}/functions/v1/${name}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`,
                'apikey': window.SUPABASE_ANON_KEY
            },
            body: JSON.stringify(payload)
        });
        let json = {};
        try { json = await res.json(); } catch (e) { /* leere Antwort */ }
        if (!res.ok || json.success === false) {
            return { success: false, error: json.error || `HTTP ${res.status}` };
        }
        return json;
    } catch (error) {
        return { success: false, error: error.message };
    }
}

const CERT_TYPES = { 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png' };

// ---------------------------------------------------------------
// Bewertungen
// ---------------------------------------------------------------
// ID und Löschtoken werden clientseitig erzeugt, damit kein SELECT auf die
// Tabelle nötig ist. Die Praktikumsbestätigung wird direkt mit eingereicht.
export async function createReview(reviewData, certificateFile) {
    try {
        const id = crypto.randomUUID();
        const deleteToken = crypto.randomUUID();

        let pdfPath = null;
        if (certificateFile) {
            const ext = CERT_TYPES[certificateFile.type];
            if (!ext) return { success: false, error: 'Ungültiges Dateiformat. Erlaubt sind PDF, JPG und PNG.' };
            if (certificateFile.size > 10 * 1024 * 1024) return { success: false, error: 'Die Datei ist zu groß. Maximale Größe: 10 MB.' };
            pdfPath = `${id}/${Date.now()}.${ext}`;
        }

        const { error } = await supabase
            .from('reviews')
            .insert([{
                id,
                user_email: reviewData.email,
                company_name: reviewData.companyName,
                address: reviewData.address,
                state: reviewData.state,
                country: reviewData.country || null,
                category: reviewData.category,
                salary: reviewData.salary,
                saturday_work: reviewData.saturdayWork,
                ratings: reviewData.ratings,
                tasks: reviewData.tasks,
                feedback: reviewData.feedback,
                highlights: reviewData.highlights,
                benefits: reviewData.benefits,
                specializations: reviewData.specializations,
                customer_type: reviewData.customerType,
                area: reviewData.area || null,
                working_hours_data: reviewData.workingHoursData,
                internship_year: reviewData.internshipYear || null,
                status: 'pending',
                practice_type: reviewData.practiceType || 'Apo',
                has_pta_degree: reviewData.hasPtaDegree || false,
                delete_token: deleteToken,
                pdf_url: pdfPath,
                pdf_filename: certificateFile ? certificateFile.name : null
            }]);

        if (error) throw error;

        if (certificateFile) {
            const { error: upErr } = await supabase.storage
                .from('certificates')
                .upload(pdfPath, certificateFile, { contentType: certificateFile.type, upsert: false });
            if (upErr) {
                // Eintrag wieder entfernen, damit keine Bewertung ohne Beleg zurückbleibt
                await callFn('delete-review', { token: deleteToken });
                throw new Error('Upload der Praktikumsbestätigung fehlgeschlagen: ' + upErr.message);
            }
        }

        return { success: true, data: { id, delete_token: deleteToken } };
    } catch (error) {
        console.error('❌ Fehler beim Erstellen der Review:', error);
        return { success: false, error: error.message };
    }
}

export async function getActiveReviews(practiceType = 'Apo') {
    try {
        const { data, error } = await supabase
            .from('public_reviews')
            .select('*')
            .eq('practice_type', practiceType)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('❌ Fehler beim Laden der Reviews:', error);
        return { success: false, error: error.message };
    }
}

// Veraltet: Upload erfolgt jetzt in createReview. Bleibt für Kompatibilität bestehen.
export async function uploadCertificate(file, reviewId) {
    try {
        const ext = CERT_TYPES[file.type];
        if (!ext) return { success: false, error: 'Ungültiges Dateiformat. Erlaubt sind PDF, JPG und PNG.' };
        if (file.size > 10 * 1024 * 1024) return { success: false, error: 'Die Datei ist zu groß. Maximale Größe: 10 MB.' };
        const fileName = `${reviewId}/${Date.now()}.${ext}`;
        const { data, error } = await supabase.storage
            .from('certificates')
            .upload(fileName, file, { contentType: file.type, upsert: false });
        if (error) throw error;
        return { success: true, path: data.path };
    } catch (error) {
        console.error('❌ Fehler beim PDF-Upload:', error);
        return { success: false, error: error.message };
    }
}

// ---------------------------------------------------------------
// Stellenangebote
// ---------------------------------------------------------------
export async function createJob(jobData) {
    try {
        const id = crypto.randomUUID();
        const deactivateToken = crypto.randomUUID();

        const insertData = {
            id,
            contact_email: jobData.contactEmail,
            contact_person: jobData.contactPerson,
            company_name: jobData.companyName,
            address: jobData.address,
            state: jobData.state,
            country: jobData.country || null,
            category: jobData.category,
            salary: jobData.salary,
            saturday_work: jobData.saturdayWork,
            description: jobData.description,
            benefits: jobData.benefits || null,
            specializations: jobData.specializations || null,
            customer_type: jobData.customerType || null,
            area: jobData.area || null,
            application_notes: jobData.applicationNotes || null,
            working_hours_data: jobData.workingHoursData,
            earliest_start: jobData.earliestStart || null,
            deactivate_token: deactivateToken,
            practice_type: jobData.practiceType || 'Apo',
            status: 'pending'
        };

        const { error } = await supabase.from('jobs').insert([insertData]);
        if (error) throw error;

        return { success: true, data: { id } };
    } catch (error) {
        console.error('❌ Fehler beim Erstellen des Jobs:', error);
        return { success: false, error: error.message };
    }
}

export async function getActiveJobs(practiceType = 'Apo') {
    try {
        const { data, error } = await supabase
            .from('public_jobs')
            .select('*')
            .eq('practice_type', practiceType)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('❌ Fehler beim Laden der Jobs:', error);
        return { success: false, error: error.message };
    }
}

export async function getJobByDeactivateToken(token) {
    return callFn('token-actions', { action: 'getJob', token });
}

export async function deactivateJobByToken(token) {
    return callFn('token-actions', { action: 'deactivateJob', token });
}

// ---------------------------------------------------------------
// Unternehmensverifizierung / Profil
// ---------------------------------------------------------------
export async function createVerificationRequest(verificationData) {
    try {
        const id = crypto.randomUUID();
        const editToken = crypto.randomUUID();

        const { error } = await supabase
            .from('company_verifications')
            .insert([{
                id,
                contact_email: verificationData.email,
                contact_person: verificationData.contactPerson,
                company_name: verificationData.companyName,
                edit_token: editToken,
                status: 'pending'
            }]);

        if (error) throw error;
        return { success: true, data: { id } };
    } catch (error) {
        console.error('❌ Fehler beim Erstellen des Antrags:', error);
        return { success: false, error: error.message };
    }
}

export async function getCompanyByEditToken(token) {
    return callFn('token-actions', { action: 'getCompany', token });
}

export async function updateCompanyProfile(token, profileData) {
    return callFn('token-actions', { action: 'updateCompany', token, profile: profileData });
}
