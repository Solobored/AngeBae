import { type NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active") === "true";

    let query = supabase
      .from("offers")
      .select(`
        *,
        products (
          name,
          description,
          image_url,
          price
        )
      `)
      .order("position", { ascending: true });

    if (activeOnly) {
      const now = new Date().toISOString();
      query = query.eq("is_active", true).lte("start_date", now).gte("end_date", now);
    }

    const { data: offers, error } = await query;

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json({ error: "Failed to fetch offers" }, { status: 500 });
    }

    const transformedOffers = (offers || []).map((offer) => ({
      id: offer.id,
      product_id: offer.product_id,
      product_name: offer.products?.name ?? "Producto",
      product_image: offer.products?.image_url ?? "/placeholder.svg?height=200&width=300",
      product_description: offer.products?.description ?? "",
      original_price: offer.products?.price ?? offer.offer_price,
      offer_price: offer.offer_price,
      discount_percentage: offer.discount_percentage,
      start_date: offer.start_date,
      end_date: offer.end_date,
      is_active: offer.is_active,
      position: offer.position,
      created_at: offer.created_at,
    }));

    return NextResponse.json({ offers: transformedOffers });
  } catch (err) {
    console.error("Offers GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const body = await request.json();

    const { product_id, offer_price, discount_percentage, start_date, end_date, is_active = true, position = 1 } = body;

    if (!product_id || !offer_price || !start_date || !end_date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data: offer, error } = await supabase
      .from("offers")
      .insert({
        product_id,
        offer_price,
        discount_percentage,
        start_date,
        end_date,
        is_active,
        position,
      })
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json({ error: "Failed to create offer" }, { status: 500 });
    }

    return NextResponse.json({ offer }, { status: 201 });
  } catch (err) {
    console.error("Offers POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
