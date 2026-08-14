"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/components/shared/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  User,
  Settings,
  LogOut,
  Save,
  Key,
  PackageCheck,
  Clock,
  Loader2,
} from "lucide-react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

function formatTime(dateStr: string): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [userId, setUserId] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

  const [profileForm, setProfileForm] = useState({ full_name: "", email: "" });
  const [profileSaving, setProfileSaving] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [passwordSaving, setPasswordSaving] = useState(false);

  const [totalBorrowed, setTotalBorrowed] = useState(0);
  const [currentlyBorrowed, setCurrentlyBorrowed] = useState(0);

  const [systemName, setSystemName] = useState("");
  const [borrowDuration, setBorrowDuration] = useState("7");
  const [maxItemsPerBorrow, setMaxItemsPerBorrow] = useState("5");
  const [systemSaving, setSystemSaving] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);

  const withConfirm = (action: () => void) => {
    setConfirmAction(() => action);
    setConfirmOpen(true);
  };

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from("system_settings")
        .select("system_name, borrow_duration_limit, max_items_per_borrow")
        .eq("id", 1)
        .single();
      if (data) {
        if (data.system_name) setSystemName(data.system_name);
        if (data.borrow_duration_limit != null)
          setBorrowDuration(String(data.borrow_duration_limit));
        if (data.max_items_per_borrow != null)
          setMaxItemsPerBorrow(String(data.max_items_per_borrow));
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      setUserId(user.id);
      setEmail(user.email ?? "");

      const { data: userData } = await supabase
        .from("users")
        .select("full_name")
        .eq("id", user.id)
        .single();

      const name = userData?.full_name ?? "";
      setFullName(name);
      setProfileForm({ full_name: name, email: user.email ?? "" });

      const { count: total } = await supabase
        .from("borrow_requests")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      const { count: active } = await supabase
        .from("borrow_requests")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "borrowed");

      setTotalBorrowed(total ?? 0);
      setCurrentlyBorrowed(active ?? 0);

      setLoading(false);
    };

    fetchProfile();
  }, [supabase]);

  const getInitials = (name: string): string => {
    if (!name) return "A";
    return name
      .split(" ")
      .map((p) => p.charAt(0).toUpperCase())
      .slice(0, 2)
      .join("");
  };

  const handleProfileSave = async () => {
    if (!profileForm.full_name.trim()) {
      toast({ title: "Validation Error", description: "Full name is required.", variant: "error" });
      return;
    }

    if (profileForm.email.trim() && profileForm.email !== email) {
      const { data: existingEmail } = await supabase
        .from("users")
        .select("id")
        .eq("email", profileForm.email.trim())
        .neq("id", userId)
        .maybeSingle();
      if (existingEmail) {
        toast({ title: "Error", description: "Email is already in use by another account.", variant: "error" });
        return;
      }
    }

    setProfileSaving(true);

    const { error } = await supabase
      .from("users")
      .update({ full_name: profileForm.full_name.trim() })
      .eq("id", userId);

    if (error) {
      toast({ title: "Error", description: "Failed to update profile.", variant: "error" });
    } else {
      setFullName(profileForm.full_name.trim());
      toast({ title: "Profile Updated", description: "Your profile has been saved.", variant: "success" });
    }

    setProfileSaving(false);
  };

  const handlePasswordChange = async () => {
    if (!passwordForm.current || !passwordForm.new || !passwordForm.confirm) {
      toast({ title: "Validation Error", description: "All password fields are required.", variant: "error" });
      return;
    }
    if (passwordForm.new.length < 6) {
      toast({ title: "Validation Error", description: "Password must be at least 6 characters.", variant: "error" });
      return;
    }
    if (passwordForm.new !== passwordForm.confirm) {
      toast({ title: "Validation Error", description: "New passwords do not match.", variant: "error" });
      return;
    }

    setPasswordSaving(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: passwordForm.current,
    });
    if (signInError) {
      toast({ title: "Error", description: "Current password is incorrect.", variant: "error" });
      setPasswordSaving(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: passwordForm.new,
    });

    if (error) {
      toast({ title: "Error", description: error.message || "Failed to change password.", variant: "error" });
    } else {
      toast({ title: "Password Changed", description: "Your password has been updated.", variant: "success" });
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

  const handleSystemSave = async () => {
    setSystemSaving(true);
    const { error } = await supabase
      .from("system_settings")
      .upsert({
        id: 1,
        system_name: systemName || "ECP Inventory Lab",
        borrow_duration_limit: parseInt(borrowDuration, 10) || 7,
        max_items_per_borrow: parseInt(maxItemsPerBorrow, 10) || 5,
        updated_by: userId || null,
      });
    setSystemSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message || "Failed to save settings.", variant: "error" });
    } else {
      toast({ title: "Settings Saved", description: "System settings have been updated.", variant: "success" });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="mt-4 h-10 w-48 rounded-lg" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="rounded-xl border border-[#dde4ec] bg-gradient-to-r from-navy to-[#253348] p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-white">Settings & Profile</h1>
          <p className="mt-1 text-sm text-white/70">
            Manage your account and system preferences.
          </p>
        </div>

        <Tabs defaultValue="profile">
          <TabsList variant="line" className="mb-6 border-b border-[#dde4ec]">
            <TabsTrigger value="profile">
              <User className="mr-1.5 h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="system">
              <Settings className="mr-1.5 h-4 w-4" />
              System
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                <div className="ecp-card p-6 border-0 shadow-none">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal text-xl font-bold text-white">
                      {getInitials(fullName)}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-navy">
                        {fullName || "Administrator"}
                      </h2>
                      <p className="text-sm text-silver">{email}</p>
                    </div>
                  </div>

                  <div className="border-t border-[#dde4ec] pt-6">
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
                        <p className="mt-1 text-[11px] text-silver">
                          Email cannot be changed here.
                        </p>
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
              </div>

              <div className="space-y-6">
                <div className="ecp-card p-6 border-0 shadow-none">
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-silver">
                    Account Stats
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 rounded-lg border border-[#dde4ec] bg-[#f8f9fa] p-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-light">
                        <PackageCheck className="h-5 w-5 text-teal" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-navy">
                          {totalBorrowed}
                        </p>
                        <p className="text-xs text-silver">Total Borrowed</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-lg border border-[#dde4ec] bg-[#f8f9fa] p-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
                        <Clock className="h-5 w-5 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-navy">
                          {currentlyBorrowed}
                        </p>
                        <p className="text-xs text-silver">
                          Currently Borrowed
                        </p>
                      </div>
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
            </div>
          </TabsContent>

          <TabsContent value="system">
            <div className="ecp-card max-w-2xl space-y-6 p-6 border-0 shadow-none">
              <div>
                <label className="text-xs font-medium text-slate">
                  System Name
                </label>
                <Input
                  value={systemName}
                  onChange={(e) => setSystemName(e.target.value)}
                  className="mt-1 border-[#dde4ec]"
                  placeholder="e.g. ECP Inventory Lab"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate">
                  Borrow Duration Limit (days)
                </label>
                <Input
                  type="number"
                  min="1"
                  max="365"
                  value={borrowDuration}
                  onChange={(e) => setBorrowDuration(e.target.value)}
                  className="mt-1 border-[#dde4ec]"
                />
                <p className="mt-1 text-[11px] text-silver">
                  Maximum number of days a single borrow can span.
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate">
                  Max Items Per Borrow
                </label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={maxItemsPerBorrow}
                  onChange={(e) => setMaxItemsPerBorrow(e.target.value)}
                  className="mt-1 border-[#dde4ec]"
                />
                <p className="mt-1 text-[11px] text-silver">
                  Maximum equipment items per borrow request.
                </p>
              </div>
              <Button
                onClick={handleSystemSave}
                disabled={systemSaving}
                className="gap-1.5 bg-teal hover:bg-teal-dark"
              >
                {systemSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {systemSaving ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
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
