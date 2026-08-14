import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!["admin", "staff"].includes(profile?.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const month = parseInt(searchParams.get("month") || "0", 10);
  const year = parseInt(searchParams.get("year") || "0", 10);

  const now = new Date();
  const targetMonth = month >= 1 && month <= 12 ? month : now.getMonth() + 1;
  const targetYear = year > 2000 ? year : now.getFullYear();

  const startDate = new Date(targetYear, targetMonth - 1, 1);
  const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

  const startISO = startDate.toISOString();
  const endISO = endDate.toISOString();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const [
    { count: totalBorrows },
    { count: totalReturns },
    { count: totalBorrowed },
    { count: totalApproved },
    { count: totalPending },
    { data: recentBorrows },
    { data: equipmentStatus },
    { data: monthlyBorrowRequests },
  ] = await Promise.all([
    supabase
      .from("borrow_requests")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startISO)
      .lte("created_at", endISO),
    supabase
      .from("borrow_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "returned")
      .gte("created_at", startISO)
      .lte("created_at", endISO),
    supabase
      .from("borrow_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "borrowed"),
    supabase
      .from("borrow_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "approved"),
    supabase
      .from("borrow_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("borrow_requests")
      .select(
        "id, user_id, status, purpose, borrow_date, return_date, created_at, users!borrow_requests_user_id_fkey(full_name), borrow_items(*, equipment(id, name))",
      )
      .gte("created_at", startISO)
      .lte("created_at", endISO)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("equipment")
      .select("status")
      .order("status"),
    supabase
      .from("borrow_requests")
      .select("status")
      .gte("created_at", startISO)
      .lte("created_at", endISO),
  ]);

  const eqStatusCounts: Record<string, number> = {};
  equipmentStatus?.forEach((eq) => {
    eqStatusCounts[eq.status] = (eqStatusCounts[eq.status] || 0) + 1;
  });

  const monthlyStatusCounts: Record<string, number> = {};
  monthlyBorrowRequests?.forEach((br) => {
    monthlyStatusCounts[br.status] = (monthlyStatusCounts[br.status] || 0) + 1;
  });

  const formattedBorrows = (recentBorrows || []).map((br: Record<string, unknown>) => {
    const borrowItems = (br.borrow_items as Array<{ quantity: number; equipment?: { name: string } | null }>) || [];
    const userData = br.users as { full_name: string } | null;
    const items = borrowItems.map(
      (bi: { quantity: number; equipment?: { name: string } | null }) => ({
        quantity: bi.quantity,
        name: bi.equipment?.name || "Unknown",
      }),
    );
    const itemsSummary = items
      .map((i: { quantity: number; name: string }) => `${i.quantity}x ${i.name}`)
      .join(", ");

    return {
      id: br.id as string,
      requestId: (br.id as string).substring(0, 8),
      user: userData?.full_name || "Unknown",
      purpose: (br.purpose as string) || "",
      itemsSummary,
      items,
      borrowDate: br.borrow_date
        ? new Date((br.borrow_date as string) + "T00:00:00").toLocaleDateString()
        : "-",
      returnDate: br.return_date
        ? new Date((br.return_date as string) + "T00:00:00").toLocaleDateString()
        : "-",
      status: br.status as string,
      createdAt: br.created_at as string,
    };
  });

  const equipmentSummary = [
    {
      status: "available",
      label: "Available",
      count: eqStatusCounts["available"] || 0,
      color: "#10b981",
    },
    {
      status: "borrowed",
      label: "In Use",
      count: eqStatusCounts["borrowed"] || 0,
      color: "#f59e0b",
    },
    {
      status: "under_maintenance",
      label: "Maintenance",
      count: eqStatusCounts["under_maintenance"] || 0,
      color: "#ef4444",
    },
  ];

  return NextResponse.json({
    title: "ECP Lab — Monthly Activity Report",
    month: monthNames[targetMonth - 1],
    year: targetYear,
    dateRange: {
      from: startDate.toISOString().slice(0, 10),
      to: endDate.toISOString().slice(0, 10),
    },
    stats: {
      totalBorrows: totalBorrows || 0,
      totalReturns: totalReturns || 0,
      totalBorrowed: totalBorrowed || 0,
      totalApproved: totalApproved || 0,
      totalPending: totalPending || 0,
      monthlyStatusCounts,
    },
    equipmentSummary,
    recentBorrows: formattedBorrows,
    generatedAt: new Date().toISOString(),
  });
}
