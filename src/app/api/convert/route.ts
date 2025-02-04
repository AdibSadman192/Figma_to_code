import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { projectId, fileData } = await request.json();
    const supabase = createRouteHandlerClient({ cookies });

    // Update project status to processing
    const { error: updateError } = await supabase
      .from('projects')
      .update({ status: 'processing' })
      .eq('id', projectId);

    if (updateError) throw updateError;

    // Send the design data to the ML service
    const mlResponse = await fetch('http://localhost:8000/convert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        design_data: fileData,
        settings: {}
      }),
    });

    if (!mlResponse.ok) {
      throw new Error('ML service error');
    }

    const { html, css, assets } = await mlResponse.json();

    // Store the generated code
    const { error: codeError } = await supabase
      .from('generated_code')
      .insert({
        project_id: projectId,
        html_content: html,
        css_content: css,
        assets
      });

    if (codeError) throw codeError;

    // Update project status to completed
    const { error: finalUpdateError } = await supabase
      .from('projects')
      .update({ status: 'completed' })
      .eq('id', projectId);

    if (finalUpdateError) throw finalUpdateError;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Conversion error:', error);
    
    // Update project status to failed
    const supabase = createRouteHandlerClient({ cookies });
    await supabase
      .from('projects')
      .update({ status: 'failed' })
      .eq('id', projectId);

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
