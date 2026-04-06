import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// We use the service role key to bypass RLS for onboarding, as the MVP doesn't have volunteer account auth yet.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock-service-key';

const adminSupabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const phoneNumber = formData.get('phoneNumber') as string;
    
    const driverLicense = formData.get('driverLicense') as File | null;
    const insurance = formData.get('insurance') as File | null;

    if (!firstName || !lastName || !phoneNumber) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    let driverLicenseUrl = null;
    let insuranceUrl = null;
    
    // In a real scenario we might have an authenticated UID.
    // For MVP, we'll use a temporary folder for them based on phone number
    const folderName = phoneNumber.replace(/[^0-9]/g, '');

    // Upload Driver License if provided
    if (driverLicense && driverLicense.size > 0) {
      const ext = driverLicense.name.split('.').pop();
      const path = `${folderName}/dl_${Date.now()}.${ext}`;
      const buffer = Buffer.from(await driverLicense.arrayBuffer());
      
      const { data, error } = await adminSupabase.storage
        .from('compliance_docs')
        .upload(path, buffer, { contentType: driverLicense.type, upsert: true });
        
      if (error) throw new Error(`DL upload failed: ${error.message}`);
      driverLicenseUrl = data.path;
    }

    // Upload Insurance if provided
    if (insurance && insurance.size > 0) {
      const ext = insurance.name.split('.').pop();
      const path = `${folderName}/ins_${Date.now()}.${ext}`;
      const buffer = Buffer.from(await insurance.arrayBuffer());
      
      const { data, error } = await adminSupabase.storage
        .from('compliance_docs')
        .upload(path, buffer, { contentType: insurance.type, upsert: true });
        
      if (error) throw new Error(`Insurance upload failed: ${error.message}`);
      insuranceUrl = data.path;
    }

    // Insert volunteer into database
    // For mockup, we can set insurance expiry to 60 days from now to simulate compliance
    const insuranceExpiryDate = new Date();
    insuranceExpiryDate.setDate(insuranceExpiryDate.getDate() + 60);

    const { data: volunteer, error: dbError } = await adminSupabase
      .from('volunteers')
      .insert({
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber,
        status: 'active', // For MVP, immediately activate them instead of pending
        driver_license_url: driverLicenseUrl,
        insurance_url: insuranceUrl,
        insurance_expiry: insuranceExpiryDate.toISOString().split('T')[0] // format YYYY-MM-DD
      })
      .select()
      .single();

    if (dbError) {
      // Typically this errors if phone_number is duplicate
      return NextResponse.json({ success: false, error: dbError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, volunteer });
  } catch (error: any) {
    console.error(`[ONBOARDING API] Error:`, error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
