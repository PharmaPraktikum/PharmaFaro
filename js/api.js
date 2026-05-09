import { supabase } from './supabase-client.js';

export async function createReview(reviewData) {
    try {
        const deleteToken = crypto.randomUUID();

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
                status: 'pending',
                delete_token: deleteToken,
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

export async function getActiveReviews() {
    try {
		const { data, error } = await supabase
			.from('public_reviews')
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

export async function createJob(jobData) {

    try {
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

export async function deactivateJobByToken(token) {
    try {
        const { data, error } = await supabase
            .from('jobs')
            .update({ 
                status: 'inactive',
                deactivated_at: new Date().toISOString()
            })
            .eq('deactivate_token', token)
            .eq('status', 'active')
            .select()
            .single();

        if (error) throw error;
        
        return { success: true, data };
    } catch (error) {
        console.error('❌ Fehler beim Deaktivieren:', error);
        return { success: false, error: error.message };
    }
}

export async function createVerificationRequest(verificationData) {
    try {
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

export async function getCompanyByEditToken(token) {
    try {
        const { data, error } = await supabase
            .from('company_verifications')
            .select('*')
            .eq('edit_token', token)
            .eq('status', 'verified')
            .single();

        if (error) throw error;
        
        return { success: true, data };
    } catch (error) {
        console.error('❌ Unternehmen nicht gefunden:', error);
        return { success: false, error: error.message };
    }
}

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
