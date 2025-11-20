import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Fetch a specific conversation member
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string; cm_id: string } }
) {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('conversation_members')
            .select('*')
            .eq('id', params.cm_id)
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

// PATCH - Update a specific conversation member
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string; cm_id: string } }
) {
    try {
        const supabase = await createClient();
        const body = await request.json();

        const { data, error } = await supabase
            .from('conversation_members')
            .update(body)
            .eq('id', params.cm_id)
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

// DELETE - Remove a specific conversation member
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string; cm_id: string } }
) {
    try {
        const supabase = await createClient();

        const { error } = await supabase
            .from('conversation_members')
            .delete()
            .eq('id', params.cm_id)
            .eq('conversation_id', params.id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ message: 'Member removed successfully' });
    } catch (error) {
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}