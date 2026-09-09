import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const BUCKET_NAME = 'aura-media';

// Supabase client with admin/service-role privileges for storage management
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';

    let buffer: Buffer;
    let mimeType: string = 'image/jpeg';
    let folder: string = 'profiles';
    let filename: string = '';

    if (contentType.includes('application/json')) {
      const body = await req.json();
      const { dataUri, folder: customFolder, filename: customFilename } = body;

      if (!dataUri || typeof dataUri !== 'string') {
        return NextResponse.json({ error: 'dataUri is required' }, { status: 400 });
      }

      if (customFolder) folder = customFolder;

      // Parse Data URI (e.g. data:image/jpeg;base64,/9j/4AAQSk...)
      const matches = dataUri.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return NextResponse.json({ error: 'Invalid data URI format' }, { status: 400 });
      }

      mimeType = matches[1];
      buffer = Buffer.from(matches[2], 'base64');
      
      const ext = mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
      filename = customFilename || `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${ext}`;
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const customFolder = formData.get('folder') as string | null;
      const customFilename = formData.get('filename') as string | null;

      if (!file) {
        return NextResponse.json({ error: 'file is required' }, { status: 400 });
      }

      if (customFolder) folder = customFolder;

      mimeType = file.type || 'application/octet-stream';
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);

      if (customFilename) {
        filename = customFilename;
      } else {
        const ext = file.name ? file.name.split('.').pop() || 'bin' : 'bin';
        filename = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${ext}`;
      }
    } else {
      return NextResponse.json({ error: 'Unsupported Content-Type' }, { status: 415 });
    }

    const filePath = `${folder}/${filename}`;

    // Upload to Supabase Storage 'aura-media' bucket
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(filePath, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      console.error('[Storage Upload Error]:', uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Retrieve public CDN URL
    const { data: publicUrlData } = supabaseAdmin.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      url: publicUrlData.publicUrl,
      path: filePath,
    });
  } catch (error: any) {
    console.error('[Storage Route Exception]:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
