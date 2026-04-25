// ============================================
// PharmaFaro – API Functions für Backend-Kommunikation
// ============================================

import { supabase } from './supabase-client.js';

// ============================================
// REVIEWS
// ============================================

/**
 * Erstelle neue Bewertung
 */
export async function createReview(reviewData) {
    try {
        const { data, error } = await supabase
            .from('reviews')
            .insert([{
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
                status: 'pending'
            }])
            .select()
            .single();

        if (error) throw error;
        
        return { success: true, data };
    } catch (error) {
        console.error('❌ Fehler beim Erstellen der Review:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Lade alle aktiven Bewertungen
 */
export async function getActiveReviews() {
    try {
		const { data, error } = await supabase
			.from('public_reviews')  // statt 'reviews'
			.select('*')
			.eq('status', 'active')
			.order('created_at', { ascending: false });

        if (error) throw error;
        
        return { success: true, data };
    } catch (error) {
        console.error('❌ Fehler beim Laden der Reviews:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Lade eine Review per Edit-Token
 */
export async function getReviewByToken(token) {
    try {
        const { data, error } = await supabase
            .from('reviews')
            .select('*')
            .eq('edit_token', token)
            .single();

        if (error) throw error;
        
        return { success: true, data };
    } catch (error) {
        console.error('❌ Review nicht gefunden:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// PDF UPLOAD
// ============================================

/**
 * Lade PDF hoch
 */
export async function uploadCertificate(file, reviewId) {
    try {
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
            return { success: false, error: 'Ungültiges Dateiformat. Erlaubt sind PDF, JPG und PNG.' };
        }
        if (file.size > 10 * 1024 * 1024) {
            return { success: false, error: 'Die Datei ist zu groß. Maximale Größe: 10 MB.' };
        }
        const fileExt = file.name.split('.').pop();
        const fileName = `${reviewId}/${Date.now()}.${fileExt}`;
        
        const { data, error } = await supabase.storage
            .from('certificates')
            .upload(fileName, file, {
                contentType: file.type,
                upsert: false
            });

        if (error) throw error;
        
        return { success: true, path: data.path };
    } catch (error) {
        console.error('❌ Fehler beim PDF-Upload:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Hole PDF Download-URL
 */
export async function getCertificateUrl(path) {
    try {
        const { data } = await supabase.storage
            .from('certificates')
            .createSignedUrl(path, 3600); // 1 Stunde gültig

        if (!data.signedUrl) throw new Error('Keine URL erhalten');
        
        return { success: true, url: data.signedUrl };
    } catch (error) {
        console.error('❌ Fehler beim Erstellen der PDF-URL:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// JOBS
// ============================================

/**
 * Erstelle neues Stellenangebot
 */
export async function createJob(jobData) {

    try {
        // Generiere Deaktivierungs-Token
        const deactivateToken = crypto.randomUUID();
        
		const insertData = {
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
			status: 'pending'
		};	
		
		const { data, error } = await supabase
            .from('jobs')
			.insert([insertData])
            .select()
            .single();

        if (error) throw error;
        
        return { success: true, data };
    } catch (error) {
        console.error('❌ Fehler beim Erstellen des Jobs:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Lade alle aktiven Jobs
 */
export async function getActiveJobs() {
    try {
        const { data, error } = await supabase
            .from('jobs')
            .select('*')
            .eq('status', 'active')
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        return { success: true, data };
    } catch (error) {
        console.error('❌ Fehler beim Laden der Jobs:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Lade Job per Deaktivierungs-Token
 */
export async function getJobByDeactivateToken(token) {
    try {
        const { data, error } = await supabase
            .from('jobs')
            .select('*')
            .eq('deactivate_token', token)
            .single();

        if (error) throw error;
        
        return { success: true, data };
    } catch (error) {
        console.error('❌ Job nicht gefunden:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Deaktiviere Job per Token (vom Anbieter)
 */
export async function deactivateJobByToken(token) {
    try {
        const { data, error } = await supabase
            .from('jobs')
            .update({ 
                status: 'inactive',
                deactivated_at: new Date().toISOString()
            })
            .eq('deactivate_token', token)
            .eq('status', 'active') // Nur aktive Jobs können deaktiviert werden
            .select()
            .single();

        if (error) throw error;
        
        return { success: true, data };
    } catch (error) {
        console.error('❌ Fehler beim Deaktivieren:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// COMPANY PROFILES / VERIFICATIONS
// ============================================

/**
 * Erstelle Verifizierungsantrag
 */
export async function createVerificationRequest(verificationData) {
    try {
        // Generiere Edit-Token für spätere Unternehmensbearbeitung
        const editToken = crypto.randomUUID();
        
        const { data, error } = await supabase
            .from('company_verifications')
            .insert([{
                contact_email: verificationData.email,
                contact_person: verificationData.contactPerson,
                company_name: verificationData.companyName,
                edit_token: editToken,
                status: 'pending'
            }])
            .select()
            .single();

        if (error) throw error;
        
        return { success: true, data };
    } catch (error) {
        console.error('❌ Fehler beim Erstellen des Antrags:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Lade Unternehmensprofil per Edit-Token
 */
export async function getCompanyByEditToken(token) {
    try {
        const { data, error } = await supabase
            .from('company_verifications')
            .select('*')
            .eq('edit_token', token)
            .eq('status', 'verified') // Nur verifizierte Unternehmen können bearbeitet werden
            .single();

        if (error) throw error;
        
        return { success: true, data };
    } catch (error) {
        console.error('❌ Unternehmen nicht gefunden:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Aktualisiere Unternehmensprofil
 */
export async function updateCompanyProfile(token, profileData) {
    try {
        const { data, error } = await supabase
            .from('company_verifications')
            .update({
                company_description: profileData.description || null,
                company_website: profileData.website || null,
                company_logo_url: profileData.logoUrl || null,
                contact_person: profileData.contactPerson || null,
                contact_email: profileData.contactEmail || null,
                contact_phone: profileData.phone || null,
                updated_at: new Date().toISOString()
            })
            .eq('edit_token', token)
            .eq('status', 'verified')
            .select()
            .single();

        if (error) throw error;
        
        return { success: true, data };
    } catch (error) {
        console.error('❌ Fehler beim Aktualisieren:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// ADMIN FUNCTIONS
// ============================================

/**
 * Aktiviere eine Review (Admin)
 */
export async function activateReview(reviewId) {
    try {
        const { data, error } = await supabase
            .from('reviews')
            .update({ 
                status: 'active',
                activated_at: new Date().toISOString()
            })
            .eq('id', reviewId)
            .select()
            .single();

        if (error) throw error;
        
        return { success: true, data };
    } catch (error) {
        console.error('❌ Fehler beim Aktivieren:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Deaktiviere eine Review (Admin)
 */
export async function deactivateReview(reviewId) {
    try {
        const { data, error } = await supabase
            .from('reviews')
            .update({ status: 'inactive' })
            .eq('id', reviewId)
            .select()
            .single();

        if (error) throw error;
        
        return { success: true, data };
    } catch (error) {
        console.error('❌ Fehler beim Deaktivieren:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Aktiviere einen Job (Admin) und sende E-Mail
 */
export async function activateJob(jobId) {
    try {
        const { data, error } = await supabase
            .from('jobs')
            .update({ 
                status: 'active',
                activated_at: new Date().toISOString(),
                expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // 3 Monate
            })
            .eq('id', jobId)
            .select()
            .single();

        if (error) throw error;
        
        
        // Sende E-Mail an Ansprechperson
        if (data.contact_email && window.sendConfirmationEmail) {
            await window.sendConfirmationEmail('job_activated', {
                email: data.contact_email,
                companyName: data.company_name,
                contactPerson: data.contact_person,
                id: typeof data.id === 'string' ? data.id.substring(0, 8) : data.id,
                deactivateToken: data.deactivate_token
            });
        }
        
        return { success: true, data };
    } catch (error) {
        console.error('❌ Fehler beim Aktivieren:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Deaktiviere einen Job (Admin)
 */
export async function deactivateJob(jobId) {
    try {
        const { data, error } = await supabase
            .from('jobs')
            .update({ status: 'inactive' })
            .eq('id', jobId)
            .select()
            .single();

        if (error) throw error;
        
        return { success: true, data };
    } catch (error) {
        console.error('❌ Fehler beim Deaktivieren:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Genehmige Verifizierung (Admin) und sende E-Mail
 */
export async function approveVerification(verificationId) {
    try {
        const { data, error } = await supabase
            .from('company_verifications')
            .update({ 
                status: 'verified',
                verified_at: new Date().toISOString()
            })
            .eq('id', verificationId)
            .select()
            .single();

        if (error) throw error;
        
        
        // Sende E-Mail an Ansprechperson
        if (data.contact_email && window.sendConfirmationEmail) {
            await window.sendConfirmationEmail('verification_approved', {
                email: data.contact_email,
                companyName: data.company_name,
                contactPerson: data.contact_person,
                editToken: data.edit_token
            });
        }
        
        return { success: true, data };
    } catch (error) {
        console.error('❌ Fehler beim Genehmigen:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Lehne Verifizierung ab (Admin) und sende E-Mail
 */
export async function rejectVerification(verificationId, reason) {
    try {
        const { data, error } = await supabase
            .from('company_verifications')
            .update({ 
                status: 'rejected',
                rejection_reason: reason || null
            })
            .eq('id', verificationId)
            .select()
            .single();

        if (error) throw error;
        
        
        // Sende E-Mail an Ansprechperson
        if (data.contact_email && window.sendConfirmationEmail) {
            await window.sendConfirmationEmail('verification_rejected', {
                email: data.contact_email,
                companyName: data.company_name,
                contactPerson: data.contact_person,
                reason: reason
            });
        }
        
        return { success: true, data };
    } catch (error) {
        console.error('❌ Fehler beim Ablehnen:', error);
        return { success: false, error: error.message };
    }
}
