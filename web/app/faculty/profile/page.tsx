"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster, toast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  User,
  Mail,
  School,
  Shield,
  Hash,
  PackageCheck,
  Clock,
  RotateCcw,
  LogOut,
  Save,
  Key,
  Loader2,
} from "lucide-react";

function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  id_no: string | null;
  department: string | null;
  role: string;
}

interface BorrowActivity {
  id: string;
  purpose: string;
  status: string;
  borrow_date: string | null;
  return_date: string | null;
  created_at: string;
  items: string;
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-amber-100 text-amber-700" },
  approved: { label: "Approved", className: "bg-blue-100 text-blue-700" },
  borrowed: { label: "Borrowed", className: "bg-teal-100 text-teal" },
  returned: { label: "Returned", className: "bg-green-100 text-green-700" },
  denied: { label: "Denied", className: "bg-red-100 text-red-500" },
  rejected: { label: "Rejected", className: "bg-red-100 text-red-500" },
};

export default function FacultyProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalBorrowed, setTotalBorrowed] = useState(0);
  const [activeBorrows, setActiveBorrows] = useState(0);
  const [returnedCount, setReturnedCount] = useState(0);
  const [recentActivity, setRecentActivity] = useState<BorrowActivity[]>([]);

  const [profileForm, setProfileForm] = useState({ full_name: "", email: "" });
  const [profileSaving, setProfileSaving] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [passwordSaving, setPasswordSaving] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);

  const withConfirm = (action: () => void) => {
    setConfirmAction(() => action);
    setConfirmOpen(true);
  };

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: userData } = await supabase
        .from("users")
        .select("id, full_name, email, id_no, department, role")
        .eq("id", user.id)
        .single();

      if (userData) {
        const p = userData as UserProfile;
        setProfile(p);
        setProfileForm({
          full_name: p.full_name ?? "",
          email: p.email ?? "",
        });
      }

      const { count: total } = await supabase
        .from("borrow_requests")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      const { count: active } = await supabase
        .from("borrow_requests")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "borrowed");

      const { count: returned } = await supabase
        .from("borrow_requests")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "returned");

      setTotalBorrowed(total ?? 0);
      setActiveBorrows(active ?? 0);
      setReturnedCount(returned ?? 0);

      const { data: recentReq } = await supabase
        .from("borrow_requests")
        .select("id, purpose, status, borrow_date, return_date, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (recentReq && recentReq.length > 0) {
        const reqIds = recentReq.map((r) => r.id);

        const { data: items } = await supabase
          .from("borrow_items")
          .select("borrow_request_id, equipment_id, quantity")
          .in("borrow_request_id", reqIds);

        const equipIds = items
          ? [...new Set(items.map((i) => i.equipment_id))]
          : [];

        const { data: equipment } =
          equipIds.length > 0
            ? await supabase
                .from("equipment")
                .select("id, name")
                .in("id", equipIds)
            : { data: [] };

        const equipMap: Record<string, string> = {};
        equipment?.forEach((e) => {
          equipMap[e.id] = e.name;
        });

        const itemMap: Record<string, { name: string; qty: number }[]> = {};
        items?.forEach((i) => {
          if (!itemMap[i.borrow_request_id]) itemMap[i.borrow_request_id] = [];
          const name = equipMap[i.equipment_id] ?? "-";
          itemMap[i.borrow_request_id].push({
            name,
            qty: i.quantity,
          });
        });

        const activity: BorrowActivity[] = recentReq.map((r) => {
          const reqItems = itemMap[r.id] ?? [];
          const itemsStr = reqItems
            .map((i) => `${i.name} (${i.qty})`)
            .join(", ");
          return {
            id: r.id,
            purpose: r.purpose ?? "-",
            status: r.status,
            borrow_date: r.borrow_date,
            return_date: r.return_date,
            created_at: r.created_at,
            items: itemsStr || "-",
          };
        });

        setRecentActivity(activity);
      }

      setLoading(false);
    };

    fetchData();
  }, [supabase]);

  const getInitials = (name: string | null): string => {
    if (!name) return "F";
    return name
      .split(" ")
      .map((p) => p.charAt(0).toUpperCase())
      .slice(0, 2)
      .join("");
  };

  const handleProfileSave = async () => {
    if (!profile || !profileForm.full_name.trim()) return;
    setProfileSaving(true);

    const { error } = await supabase
      .from("users")
      .update({ full_name: profileForm.full_name.trim() })
      .eq("id", profile.id);

    if (error) {
      toast.add({
        title: "Error",
        description: "Failed to update profile.",
        type: "error",
      });
    } else {
      setProfile({ ...profile, full_name: profileForm.full_name.trim() });
      toast.add({
        title: "Profile Updated",
        description: "Your profile has been saved.",
        type: "success",
      });
    }

    setProfileSaving(false);
  };

  const handlePasswordChange = async () => {
    if (!passwordForm.current || !passwordForm.new || !passwordForm.confirm) {
      toast.add({
        title: "Validation Error",
        description: "All password fields are required.",
        type: "error",
      });
      return;
    }
    if (passwordForm.new !== passwordForm.confirm) {
      toast.add({
        title: "Validation Error",
        description: "New passwords do not match.",
        type: "error",
      });
      return;
    }
    if (passwordForm.new.length < 6) {
      toast.add({
        title: "Validation Error",
        description: "Password must be at least 6 characters.",
        type: "error",
      });
      return;
    }

    setPasswordSaving(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: profile?.email ?? "",
      password: passwordForm.current,
    });
    if (signInError) {
      toast.add({
        title: "Error",
        description: "Current password is incorrect.",
        type: "error",
      });
      setPasswordSaving(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: passwordForm.new,
    });

    if (error) {
      toast.add({
        title: "Error",
        description: error.message || "Failed to change password.",
        type: "error",
      });
    } else {
      toast.add({
        title: "Password Changed",
        description: "Your password has been updated.",
        type: "success",
      });
      setPasswordForm({ current: "", new: "", confirm: "" });
    }

    setPasswordSaving(false);
  };

  const handleLogout = () => {
    withConfirm(async () => {
      await supabase.auth.signOut();
      router.push("/auth/login");
    });
  };

  const statCards = [
    {
      label: "Total Borrowed",
      value: totalBorrowed,
      icon: PackageCheck,
      color: "#0ea5a0",
    },
    {
      label: "Active Borrows",
      value: activeBorrows,
      icon: Clock,
      color: "#f59e0b",
    },
    {
      label: "Returned",
      value: returnedCount,
      icon: RotateCcw,
      color: "#10b981",
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-full rounded-xl" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-silver">Unable to load profile.</p>
      </div>
    );
  }

  return (
    <>
      <Toaster>
        <div className="space-y-6">
          <div className="rounded-xl border border-[#dde4ec] bg-gradient-to-r from-navy to-[#253348] p-6 shadow-sm">
            <h1 className="text-2xl font-bold text-white">My Profile</h1>
            <p className="mt-1 text-sm text-white/70">
              View and manage your profile information.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {statCards.map((stat) => (
              <div key={stat.label} className="ecp-stat-card">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-silver">{stat.label}</p>
                    <p className="mt-1 text-3xl font-bold text-navy">
                      {stat.value}
                    </p>
                  </div>
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg"
                    style={{ backgroundColor: stat.color + "15" }}
                  >
                    <stat.icon className="h-5 w-5" style={{ color: stat.color }} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1 space-y-6">
              <div className="ecp-card p-6 border-0 shadow-none">
                <div className="flex flex-col items-center text-center">
                  <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-teal text-2xl font-bold text-white">
                    {getInitials(profile.full_name)}
                  </div>
                  <h2 className="text-lg font-bold text-navy">
                    {profile.full_name || "Faculty"}
                  </h2>
                  <Badge className="mt-1 bg-teal-light text-teal hover:bg-teal-light">
                    {profile.department || "No Department"}
                  </Badge>
                </div>

                <div className="mt-5 space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-silver shrink-0" />
                    <span className="text-slate truncate">
                      {profile.email || "-"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Hash className="h-4 w-4 text-silver shrink-0" />
                    <span className="text-slate">
                      {profile.id_no || "-"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <School className="h-4 w-4 text-silver shrink-0" />
                    <span className="text-slate">
                      {profile.department || "-"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="h-4 w-4 text-silver shrink-0" />
                    <span className="text-slate capitalize">
                      {profile.role}
                    </span>
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={handleLogout}
                className="w-full gap-2 border-red-200 text-red-500 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="ecp-card p-6 border-0 shadow-none">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-silver">
                  Edit Profile
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-slate">
                      Full Name
                    </label>
                    <Input
                      value={profileForm.full_name}
                      onChange={(e) =>
                        setProfileForm({
                          ...profileForm,
                          full_name: e.target.value,
                        })
                      }
                      className="mt-1 border-[#dde4ec]"
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate">
                      Email
                    </label>
                    <Input
                      value={profileForm.email}
                      disabled
                      className="mt-1 border-[#dde4ec] bg-[#f8f9fa] text-silver"
                    />
                  </div>
                  <Button
                    onClick={handleProfileSave}
                    disabled={profileSaving}
                    className="gap-1.5 bg-teal hover:bg-teal-dark"
                  >
                    {profileSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {profileSaving ? "Saving..." : "Save Profile"}
                  </Button>
                </div>
              </div>

              <div className="ecp-card p-6 border-0 shadow-none">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-silver">
                  <Key className="h-4 w-4" />
                  Change Password
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-slate">
                      Current Password
                    </label>
                    <Input
                      type="password"
                      value={passwordForm.current}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          current: e.target.value,
                        })
                      }
                      className="mt-1 border-[#dde4ec]"
                      placeholder="Enter current password"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-slate">
                        New Password
                      </label>
                      <Input
                        type="password"
                        value={passwordForm.new}
                        onChange={(e) =>
                          setPasswordForm({
                            ...passwordForm,
                            new: e.target.value,
                          })
                        }
                        className="mt-1 border-[#dde4ec]"
                        placeholder="New password"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate">
                        Confirm Password
                      </label>
                      <Input
                        type="password"
                        value={passwordForm.confirm}
                        onChange={(e) =>
                          setPasswordForm({
                            ...passwordForm,
                            confirm: e.target.value,
                          })
                        }
                        className="mt-1 border-[#dde4ec]"
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handlePasswordChange}
                    disabled={passwordSaving}
                    className="gap-1.5 bg-teal hover:bg-teal-dark"
                  >
                    {passwordSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Key className="h-4 w-4" />
                    )}
                    {passwordSaving ? "Changing..." : "Change Password"}
                  </Button>
                </div>
              </div>

              <div className="ecp-card p-6 border-0 shadow-none">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-silver">
                  Recent Activity
                </h3>
                {recentActivity.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Clock className="mb-2 h-8 w-8 text-silver/40" />
                    <p className="text-sm text-silver">No recent activity</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentActivity.map((a) => (
                      <div
                        key={a.id}
                        className="rounded-lg border border-[#dde4ec] p-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-navy truncate">
                              {a.items}
                            </p>
                            <p className="mt-0.5 text-xs text-silver line-clamp-2">
                              {a.purpose}
                            </p>
                            <div className="mt-1.5 flex items-center gap-2">
                              <span className="text-[11px] text-silver">
                                {formatDate(a.borrow_date ?? "")} &mdash;{" "}
                                {formatDate(a.return_date ?? "")}
                              </span>
                            </div>
                          </div>
                          <Badge
                            className={
                              STATUS_MAP[a.status]?.className ??
                              "bg-gray-100 text-gray-600"
                            }
                          >
                            {STATUS_MAP[a.status]?.label ?? a.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Toaster>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Logout?"
        description="Are you sure you want to logout?"
        confirmLabel="Logout"
        variant="danger"
        onConfirm={() => { confirmAction?.(); setConfirmOpen(false); }}
      />
    </>
  );
}
