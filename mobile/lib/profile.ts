import { supabase } from "@/lib/supabase";

export async function changePassword(currentPassword: string, newPassword: string): Promise<string | null> {
  if (newPassword.length < 6) {
    return "New password must be at least 6 characters.";
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) {
    return "Not signed in.";
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (signInError) {
    return "Current password is incorrect.";
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    return error.message;
  }
  return null;
}

export async function uploadAvatar(uri: string, mimeType?: string): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const ext = mimeType?.includes("png") ? "png" : "jpg";
  const path = `${user.id}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, {
      uri,
      name: `avatar.${ext}`,
      type: mimeType || `image/${ext}`,
    } as any, {
      upsert: true,
      cacheControl: "3600",
    });

  if (uploadError) return null;

  const { data: publicUrl } = supabase.storage.from("avatars").getPublicUrl(path);
  if (!publicUrl?.publicUrl) return null;

  await supabase.from("users").update({ profile_picture_url: publicUrl.publicUrl }).eq("id", user.id);
  return publicUrl.publicUrl;
}

export async function deleteMyAccount(): Promise<string | null> {
  const { data, error } = await supabase.rpc("delete_my_account");
  if (error) return error.message;
  await supabase.auth.signOut();
  return null;
}
