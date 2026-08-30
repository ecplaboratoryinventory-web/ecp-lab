"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Toaster, toast } from "@/components/ui/toast";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  PackageCheck,
  Check,
  Loader2,
  Monitor,
  FileText,
  ClipboardList,
  X,
} from "lucide-react";
import { notifyRole } from "@/lib/notifications";

interface Equipment {
  id: string;
  name: string;
  available_quantity: number;
  quantity: number;
  status: string;
  category_id: string;
  subcategory_id: string | null;
  description: string;
  brand: string;
  image_url: string | null;
  department: string | null;
  categories?: { name: string };
  subcategories?: { name: string };
}

interface Category {
  id: string;
  name: string;
}

interface Subcategory {
  id: string;
  category_id: string;
  name: string;
}

interface SelectedItem {
  equipment_id: string;
  equipment_name: string;
  available_quantity: number;
  quantity: number;
  notes: string;
}

const STEP_LABELS = ["Select Equipment", "Set Details", "Review & Submit"];

// Categories offered in the filter, per faculty department.
const DEPT_CATEGORY_FILTER: Record<string, string[]> = {
  Engineering: ["Electronics"],
  Science: ["Chemistry", "Physics"],
};

export default function BorrowPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(0);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [subcategoryFilter, setSubcategoryFilter] = useState("all");

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);

  const [purpose, setPurpose] = useState("");
  const [borrowDate, setBorrowDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [returnDate, setReturnDate] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [userDept, setUserDept] = useState<string | null>(null);
  const [maxItems, setMaxItems] = useState(5);
  const [maxDuration, setMaxDuration] = useState(7);

  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("users")
        .select("department")
        .eq("id", user.id)
        .single();
      if (profile?.department) {
        setUserDept(profile.department);
      }
    };
    fetchProfile();
  }, [supabase]);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from("system_settings")
        .select("max_items_per_borrow, borrow_duration_limit")
        .eq("id", 1)
        .single();
      if (data) {
        setMaxItems(data.max_items_per_borrow ?? 5);
        setMaxDuration(data.borrow_duration_limit ?? 7);
      }
    };
    fetchSettings();
  }, [supabase]);

  const fetchEquipment = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("equipment")
      .select("*, categories(name), subcategories(name)")
      .order("name");

    if (userDept) {
      query = query.eq("department", userDept);
    }
    if (categoryFilter !== "all") {
      query = query.eq("category_id", categoryFilter);
    }
    if (subcategoryFilter !== "all") {
      query = query.eq("subcategory_id", subcategoryFilter);
    }
    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    const { data } = await query;
    setEquipment((data as Equipment[]) || []);
    setLoading(false);
  }, [supabase, categoryFilter, subcategoryFilter, search, userDept]);

  const fetchCategories = useCallback(async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("name");
    if (data) setCategories(data as Category[]);
    const { data: subs } = await supabase
      .from("subcategories")
      .select("*")
      .order("name");
    if (subs) setSubcategories(subs as Subcategory[]);
  }, [supabase]);

  useEffect(() => {
    void (async () => {
      await fetchCategories();
    })();
  }, [fetchCategories]);

  useEffect(() => {
    void (async () => {
      await fetchEquipment();
    })();
  }, [fetchEquipment]);

  const toggleSelect = (eq: Equipment) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(eq.id)) {
        next.delete(eq.id);
      } else {
        next.add(eq.id);
      }
      return next;
    });
  };

  const goToStep2 = () => {
    if (selectedIds.size === 0) return;
    const items: SelectedItem[] = equipment
      .filter((eq) => selectedIds.has(eq.id))
      .map((eq) => ({
        equipment_id: eq.id,
        equipment_name: eq.name,
        available_quantity: eq.available_quantity,
        quantity: 1,
        notes: "",
      }));
    setSelectedItems(items);
    setStep(1);
  };

  const updateItemQuantity = (index: number, qty: number) => {
    setSelectedItems((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        quantity: Math.max(1, Math.min(qty, next[index].available_quantity)),
      };
      return next;
    });
  };

  const updateItemNotes = (index: number, notes: string) => {
    setSelectedItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], notes };
      return next;
    });
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (selectedItems.length === 0) {
      newErrors.items = "Select at least one equipment";
    }
    if (selectedItems.length > maxItems) {
      newErrors.items = `You can borrow at most ${maxItems} items per request`;
    }
    if (!purpose.trim()) {
      newErrors.purpose = "Purpose is required";
    }
    if (!borrowDate) {
      newErrors.borrowDate = "Borrow date is required";
    }
    if (!returnDate) {
      newErrors.returnDate = "Return date is required";
    }
    if (borrowDate && returnDate && returnDate < borrowDate) {
      newErrors.returnDate = "Return date must be on or after borrow date";
    }
    if (
      borrowDate &&
      returnDate &&
      returnDate >= borrowDate &&
      Math.ceil(
        (new Date(returnDate).getTime() - new Date(borrowDate).getTime()) /
          (1000 * 60 * 60 * 24)
      ) > maxDuration
    ) {
      newErrors.returnDate = `Return date cannot exceed ${maxDuration} days from borrow date`;
    }
    if (selectedItems.some((item) => item.quantity < 1)) {
      newErrors.quantity = "Each item must have at least quantity 1";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const goToStep3 = () => {
    if (!validate()) return;
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!validate()) {
      setStep(1);
      return;
    }

    setSubmitting(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSubmitting(false);
      return;
    }

    const { data: request, error: requestError } = await supabase
      .from("borrow_requests")
      .insert({
        user_id: user.id,
        request_type: "faculty",
        status: "approved",
        purpose: purpose.trim(),
        borrow_date: borrowDate,
        return_date: returnDate,
        approved_at: new Date().toISOString(),
        approved_by: user.id,
      })
      .select("id")
      .single();

    if (requestError || !request) {
      toast.add({
        title: "Error",
        description: "Failed to create borrow request",
        type: "error",
      });
      setSubmitting(false);
      return;
    }

    const items = selectedItems.map((item) => ({
      borrow_request_id: request.id,
      equipment_id: item.equipment_id,
      quantity: item.quantity,
      returned_quantity: 0,
      notes: item.notes || null,
    }));

    const { error: itemsError } = await supabase
      .from("borrow_items")
      .insert(items);

    if (itemsError) {
      toast.add({
        title: "Error",
        description: "Failed to add borrow items",
        type: "error",
      });
      setSubmitting(false);
      return;
    }

    toast.add({
      title: "Borrow Request Submitted",
      description: "Your request has been auto-approved",
      type: "success",
    });

    // Notify admin of faculty borrow
    const totalQty = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
    const eqSummary = selectedItems.length === 1
      ? `${totalQty} ${selectedItems[0].equipment_name}`
      : `${selectedItems.length} items`;
    const { data: profile } = await supabase.from("users").select("full_name").eq("id", user.id).single();
    const facultyName = profile?.full_name || "Faculty";
    await notifyRole(
      "admin",
      "New Faculty Borrow Request",
      `${facultyName} requested to borrow ${eqSummary}. (Auto-approved)`,
      "borrow_status",
      "borrow_request",
      request.id
    );

    setTimeout(() => {
      router.push("/faculty/dashboard");
    }, 1500);
  };

  const formatDate = (d: string) => {
    if (!d) return "-";
    return new Date(d).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const allowedDeptCategories: string[] | null = userDept
    ? DEPT_CATEGORY_FILTER[userDept] ?? null
    : null;
  const visibleCategories =
    allowedDeptCategories === null
      ? categories
      : categories.filter((c) => allowedDeptCategories.includes(c.name));
  const visibleCategoryIds = new Set(visibleCategories.map((c) => c.id));
  const visibleSubcategories =
    categoryFilter === "all"
      ? subcategories.filter((s) => visibleCategoryIds.has(s.category_id))
      : subcategories.filter((s) => s.category_id === categoryFilter);

  return (
    <Toaster>
      <div>
        <div className="mb-6 rounded-xl border border-[#dde4ec] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-bold text-navy">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-light text-teal">
                  <PackageCheck className="h-4 w-4" />
                </span>
                Borrow Equipment
              </h2>
            </div>
          </div>
        </div>

        <div className="mb-6 flex items-center gap-2">
          {STEP_LABELS.map((label, idx) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all ${
                  idx <= step
                    ? "bg-teal text-white"
                    : "border border-[#dde4ec] bg-white text-silver"
                }`}
              >
                {idx < step ? <Check className="h-4 w-4" /> : idx + 1}
              </div>
              <span
                className={`text-sm font-semibold ${
                  idx <= step ? "text-navy" : "text-silver"
                }`}
              >
                {label}
              </span>
              {idx < STEP_LABELS.length - 1 && (
                <div
                  className={`mx-1 h-px w-8 ${
                    idx < step ? "bg-teal" : "bg-[#dde4ec]"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {step === 0 && (
          <div>
            <div className="mb-4 flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setCategoryFilter("all");
                  setSubcategoryFilter("all");
                }}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                  categoryFilter === "all"
                    ? "border-teal bg-teal text-white"
                    : "border-[#dde4ec] bg-white text-silver hover:border-teal hover:text-teal"
                }`}
              >
                All Categories
              </button>
              {visibleCategories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setCategoryFilter(c.id);
                    setSubcategoryFilter("all");
                  }}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                    categoryFilter === c.id
                      ? "border-teal bg-teal text-white"
                      : "border-[#dde4ec] bg-white text-silver hover:border-teal hover:text-teal"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>

            {visibleSubcategories.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                <button
                  onClick={() => setSubcategoryFilter("all")}
                  className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all ${
                    subcategoryFilter === "all"
                      ? "border-teal bg-teal-light text-teal"
                      : "border-[#dde4ec] bg-white text-silver hover:border-teal hover:text-teal"
                  }`}
                >
                  All Subcategories
                </button>
                {visibleSubcategories.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSubcategoryFilter(s.id)}
                    className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all ${
                      subcategoryFilter === s.id
                        ? "border-teal bg-teal-light text-teal"
                        : "border-[#dde4ec] bg-white text-silver hover:border-teal hover:text-teal"
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            )}

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-silver" />
              <Input
                placeholder="Search equipment..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full max-w-md border-[#dde4ec] pl-10"
              />
            </div>

            {loading ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="ecp-card h-32 animate-pulse p-4"
                  >
                    <div className="mb-2 h-4 w-3/4 rounded bg-[#f0f0f0]" />
                    <div className="mb-2 h-3 w-1/2 rounded bg-[#f0f0f0]" />
                    <div className="h-5 w-20 rounded-full bg-[#f0f0f0]" />
                  </div>
                ))}
              </div>
            ) : equipment.length === 0 ? (
              <div className="ecp-card flex flex-col items-center justify-center py-12">
                <Monitor className="mb-3 h-10 w-10 text-silver" />
                <p className="text-silver">No equipment available</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {equipment.map((eq) => {
                  const catName = eq.subcategories?.name || "";
                  const iconMap: Record<string, string> = {
                    Microcontrollers: "🔌", "Single Board PCs": "🖥️", "Desktop PCs": "💻",
                    Components: "⚡", Glassware: "🧪", "Measuring Instruments": "📏",
                    "Chemicals and Reagents": "⚗️", "Safety Equipment": "🛡️",
                    Consumables: "📄", "Electrical Equipment": "🔋", "Optical Equipment": "🔬",
                    "Mechanics Equipment": "⚙️",
                  };
                  const icon = iconMap[catName] || "📦";
                  const isSelected = selectedIds.has(eq.id);

                  return (
                    <button
                      key={eq.id}
                      onClick={() => toggleSelect(eq)}
                      className={`group w-full overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition-all hover:shadow-lg ${
                        isSelected ? "ring-2 ring-teal" : "border-[#dde4ec]"
                      }`}
                    >
                      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#eef2f6]">
                        {eq.image_url ? (
                          <Image src={eq.image_url} alt={eq.name} fill unoptimized className="object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#0ea5a0] to-[#0b857f]">
                            <span className="text-6xl drop-shadow">{icon}</span>
                          </div>
                        )}
                        {isSelected && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-teal shadow-lg">
                              <Check className="h-6 w-6 text-white" />
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-3 p-4">
                        <h3 className="truncate text-sm font-bold text-navy">{eq.name}</h3>
                        <div className="flex gap-1.5">
                          <span className="rounded border border-[#E2E8F0] px-2 py-0.5 text-[10px] font-semibold uppercase text-slate">
                            {catName || "Equipment"}
                          </span>
                          {eq.brand && (
                            <span className="rounded border border-[#E2E8F0] px-2 py-0.5 text-[10px] font-semibold uppercase text-slate">
                              {eq.brand}
                            </span>
                          )}
                        </div>
                        <p className="text-xs leading-relaxed text-slate line-clamp-2">
                          {eq.description || "Laboratory equipment for academic and research use."}
                        </p>
                        <hr className="border-[#f0f0f0]" />
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="block text-[10px] font-bold uppercase text-silver">Available</span>
                            <span className="text-lg font-bold text-navy">{eq.available_quantity} units</span>
                          </div>
                          <span
                            className={`rounded-xl px-4 py-2 text-[11px] font-semibold transition-colors ${
                              isSelected
                                ? "bg-teal text-white"
                                : "bg-teal-light text-teal group-hover:bg-teal group-hover:text-white"
                            }`}
                          >
                            {isSelected ? "Selected" : "Select"}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {selectedIds.size > 0 && (
              <div className="fixed bottom-0 left-0 right-0 border-t border-[#dde4ec] bg-white p-4 shadow-lg z-10">
                <div className="mx-auto flex max-w-5xl items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-navy">
                      {selectedIds.size} item{selectedIds.size !== 1 ? "s" : ""} selected
                    </span>
                    <button onClick={() => setSelectedIds(new Set())} className="flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-600">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <Button
                    onClick={goToStep2}
                    className="gap-1.5 bg-teal hover:bg-teal-dark"
                  >
                    Continue <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 1 && (
          <div>
            <div className="ecp-card mb-4 p-5">
              <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-navy">
                <FileText className="h-4 w-4 text-teal" />
                Request Details
              </h3>

              <div className="mb-3">
                <label className="text-xs font-medium text-slate">
                  Purpose <span className="text-red-400">*</span>
                </label>
                <Textarea
                  placeholder="Why do you need this equipment?"
                  value={purpose}
                  onChange={(e) => {
                    setPurpose(e.target.value);
                    if (errors.purpose) setErrors({});
                  }}
                  className="mt-1 min-h-[80px] border-[#dde4ec]"
                />
                {errors.purpose && (
                  <p className="mt-1 text-xs text-red-500">{errors.purpose}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate">
                    Borrow Date <span className="text-red-400">*</span>
                  </label>
                  <Input
                    type="date"
                    value={borrowDate}
                    onChange={(e) => {
                      setBorrowDate(e.target.value);
                      if (errors.borrowDate) setErrors({});
                    }}
                    className="mt-1 border-[#dde4ec]"
                  />
                  {errors.borrowDate && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.borrowDate}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-medium text-slate">
                    Return Date <span className="text-red-400">*</span>
                  </label>
                  <Input
                    type="date"
                    value={returnDate}
                    onChange={(e) => {
                      setReturnDate(e.target.value);
                      if (errors.returnDate) setErrors({});
                    }}
                    className="mt-1 border-[#dde4ec]"
                  />
                  {errors.returnDate && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.returnDate}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="ecp-card p-5">
              <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-navy">
                <Monitor className="h-4 w-4 text-teal" />
                Selected Equipment
                <span className="ml-auto rounded-full bg-teal-light px-2.5 py-0.5 text-xs font-semibold text-teal">
                  Max {maxItems} items · {maxDuration} day limit
                </span>
              </h3>

              <div className="space-y-4">
                {selectedItems.map((item, index) => (
                  <div
                    key={item.equipment_id}
                    className="rounded-lg border border-[#dde4ec] p-4"
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-navy">
                          {item.equipment_name}
                        </h4>
                        <p className="mt-0.5 text-xs text-silver">
                          {item.available_quantity} available
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon-sm"
                          onClick={() =>
                            updateItemQuantity(index, item.quantity - 1)
                          }
                          disabled={item.quantity <= 1}
                          className="border-[#dde4ec]"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-semibold text-navy">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon-sm"
                          onClick={() =>
                            updateItemQuantity(index, item.quantity + 1)
                          }
                          disabled={item.quantity >= item.available_quantity}
                          className="border-[#dde4ec]"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate">
                        Notes (optional)
                      </label>
                      <Input
                        placeholder="Any special instructions..."
                        value={item.notes}
                        onChange={(e) => updateItemNotes(index, e.target.value)}
                        className="mt-1 border-[#dde4ec]"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {errors.items && (
                <p className="mt-3 text-xs text-red-500">{errors.items}</p>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setStep(0)}
                className="gap-1.5 border-[#dde4ec]"
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
              <Button
                onClick={goToStep3}
                className="gap-1.5 bg-teal hover:bg-teal-dark"
              >
                Review <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="ecp-card p-5">
              <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-navy">
                <ClipboardList className="h-4 w-4 text-teal" />
                Review Summary
              </h3>

              <div className="mb-4 rounded-lg border border-[#dde4ec] bg-[#f8f9fa] p-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-xs font-medium uppercase text-silver">
                      Purpose
                    </span>
                    <p className="mt-0.5 text-navy">{purpose}</p>
                  </div>
                  <div>
                    <span className="text-xs font-medium uppercase text-silver">
                      Borrow Date
                    </span>
                    <p className="mt-0.5 text-navy">
                      {formatDate(borrowDate)}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-medium uppercase text-silver">
                      Return Date
                    </span>
                    <p className="mt-0.5 text-navy">
                      {formatDate(returnDate)}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-medium uppercase text-silver">
                      Items
                    </span>
                    <p className="mt-0.5 text-navy">
                      {selectedItems.length} item
                      {selectedItems.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {selectedItems.map((item) => (
                  <div
                    key={item.equipment_id}
                    className="flex items-center justify-between rounded-lg border border-[#dde4ec] p-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-navy">
                        {item.equipment_name}
                      </p>
                      {item.notes && (
                        <p className="mt-0.5 text-xs text-silver">
                          {item.notes}
                        </p>
                      )}
                    </div>
                    <span className="rounded-full bg-teal-light px-2.5 py-0.5 text-xs font-semibold text-teal">
                      × {item.quantity}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="gap-1.5 border-[#dde4ec]"
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="gap-1.5 bg-teal hover:bg-teal-dark"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                {submitting ? "Submitting..." : "Submit Request"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Toaster>
  );
}
