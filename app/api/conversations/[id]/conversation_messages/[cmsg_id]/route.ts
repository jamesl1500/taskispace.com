import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string; cmsg_id: string } }
) {
    try {
        const supabase = await createClient();
        
        const { data, error } = await supabase
            .from('conversation_messages')
            .select('*')
            .eq('id', params.cmsg_id)
            .eq('conversation_id', params.id)
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string; cmsg_id: string } }
) {
    try {
        const supabase = await createClient();
        const body = await request.json();

        const { data, error } = await supabase
            .from('conversation_messages')
            .update(body)
            .eq('id', params.cmsg_id)
            .eq('conversation_id', params.id)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string; cmsg_id: string } }
) {
    try {
        const supabase = await createClient();

        const { error } = await supabase
            .from('conversation_messages')
            .delete()
            .eq('id', params.cmsg_id)
            .eq('conversation_id', params.id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}