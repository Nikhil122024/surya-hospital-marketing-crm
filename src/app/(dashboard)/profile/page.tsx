"use client";

import { Camera, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import { Avatar, Button, PageHeader } from "@/components/ui";
import { updateRecord } from "@/lib/firebase/repository";
import { uploadFile } from "@/lib/firebase/storage";

export default function ProfilePage() {
  const { user } = useAuth();
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const save = async () => { if (!user) return; setSaving(true); try { await updateRecord("users", user.id, { phone }); toast.success("Profile updated successfully."); } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to update profile."); } finally { setSaving(false); } };
  const uploadPhoto = async (file: File | undefined) => { if (!file || !user) return; setUploading(true); try { const photoURL = await uploadFile(file, `users/${user.id}/profile-${crypto.randomUUID()}-${file.name}`); await updateRecord("users", user.id, { photoURL }); toast.success("Profile photo updated."); } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to upload profile photo."); } finally { setUploading(false); } };
  return <><PageHeader eyebrow="Workspace" title="Profile" description="Keep your hospital directory information current." /><div className="max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_24px_rgba(16,42,67,.04)]"><div className="flex items-center gap-4 border-b border-slate-100 pb-6"><Avatar name={user?.name ?? "Surya user"} photoURL={user?.photoURL} /><div><h2 className="font-extrabold text-[#102a43]">{user?.name}</h2><p className="text-sm text-slate-500">{user?.designation ?? user?.role}</p></div><label className="ml-auto cursor-pointer rounded-xl border border-slate-200 p-2.5 text-slate-500 hover:bg-slate-50" aria-label="Change profile photo"><Camera size={18} /><input type="file" accept="image/*" className="sr-only" disabled={uploading} onChange={(event) => void uploadPhoto(event.target.files?.[0])} /></label></div><dl className="grid gap-5 py-6 sm:grid-cols-2"><div><dt className="text-xs font-bold uppercase tracking-wider text-slate-400">Employee ID</dt><dd className="mt-1 font-semibold text-[#102a43]">{user?.employeeId ?? "-"}</dd></div><div><dt className="text-xs font-bold uppercase tracking-wider text-slate-400">Official email</dt><dd className="mt-1 font-semibold text-[#102a43]">{user?.email}</dd></div><div><dt className="text-xs font-bold uppercase tracking-wider text-slate-400">Department</dt><dd className="mt-1 font-semibold text-[#102a43]">{user?.department}</dd></div><div><dt className="text-xs font-bold uppercase tracking-wider text-slate-400">Role</dt><dd className="mt-1 font-semibold text-[#102a43]">{user?.role}</dd></div><div><dt className="text-xs font-bold uppercase tracking-wider text-slate-400">Joining date</dt><dd className="mt-1 font-semibold text-[#102a43]">{user?.joiningDate ?? "-"}</dd></div><label className="block text-sm font-bold text-[#102a43]">Phone<input value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-normal outline-none focus:border-blue-400" /></label></dl><Button onClick={() => void save()} disabled={saving}><Save size={16} />{saving ? "Saving..." : "Save changes"}</Button></div></>;
}
