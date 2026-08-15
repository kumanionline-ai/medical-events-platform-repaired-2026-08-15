import { supabase } from "@/lib/supabase";
import type { DatabaseCrmContact, DatabaseCrmMessage } from "@/lib/types";

/** Fetch all CRM contacts belonging to the signed-in user. */
export async function fetchContacts(userId: string): Promise<DatabaseCrmContact[]> {
  const { data, error } = await supabase
    .from("crm_contacts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return data as DatabaseCrmContact[];
}

/** Create a new CRM contact for the user. */
export async function createContact(
  userId: string,
  contact: { name: string; phone: string; country?: string; specialty?: string; tags?: string[]; notes?: string; whatsappOptIn?: boolean }
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("crm_contacts").insert({
    user_id: userId,
    name: contact.name.trim(),
    phone: contact.phone.trim(),
    country: contact.country ?? "",
    specialty: contact.specialty ?? "",
    tags: contact.tags ?? [],
    notes: contact.notes ?? "",
  });
  if (error) return { error: error.message };

  if (contact.whatsappOptIn) {
    const { error: recipientError } = await supabase
      .from("whatsapp_allowed_recipients")
      .upsert(
        {
          user_id: userId,
          phone: contact.phone.trim(),
          label: contact.name.trim(),
          is_active: true,
          verified_at: new Date().toISOString(),
        },
        { onConflict: "user_id,phone" },
      );
    if (recipientError) {
      return { error: `Contact saved, but WhatsApp consent could not be activated: ${recipientError.message}` };
    }
  }
  return { error: null };
}

/** Delete a CRM contact. */
export async function deleteContact(
  contactId: string,
  userId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("crm_contacts")
    .delete()
    .eq("id", contactId)
    .eq("user_id", userId);
  if (error) return { error: error.message };
  return { error: null };
}

export async function fetchContactMessages(contactId: string): Promise<DatabaseCrmMessage[]> {
  const { data: conversation } = await supabase.from("crm_conversations").select("id").eq("contact_id", contactId).maybeSingle();
  if (!conversation) return [];
  const { data, error } = await supabase.from("crm_messages").select("*").eq("conversation_id", conversation.id).order("sent_at");
  if (error) throw error;
  return (data ?? []) as DatabaseCrmMessage[];
}

export async function sendWhatsAppMessage(userId: string, contact: DatabaseCrmContact, body: string): Promise<{ mode: "cloud" | "handoff"; url?: string }> {
  let { data: conversation } = await supabase.from("crm_conversations").select("id").eq("contact_id", contact.id).maybeSingle();
  if (!conversation) {
    const { data, error } = await supabase.from("crm_conversations").insert({ contact_id: contact.id, owner_user_id: userId, channel: "whatsapp", status: "open" }).select("id").single();
    if (error) throw error;
    conversation = data;
  }
  const { data: recipient } = await supabase.from("whatsapp_allowed_recipients").select("id,is_active").eq("user_id", userId).eq("phone", contact.phone).maybeSingle();
  if (!recipient?.is_active) throw new Error("This recipient is not approved for WhatsApp delivery.");
  const { data: stored, error: storeError } = await supabase.from("crm_messages").insert({ conversation_id: conversation.id, direction: "outbound", body, status: "queued", sent_by: userId, phone: contact.phone }).select("id").single();
  if (storeError) throw storeError;
  const { data: delivery, error: invokeError } = await supabase.functions.invoke<{ messageId?: string; error?: string; hint?: string }>("send-whatsapp", { body: { phone: contact.phone, message: body } });
  if (invokeError || delivery?.error) {
    await supabase.from("crm_messages").update({ status: "failed" }).eq("id", stored.id);
    const failure = delivery?.error || invokeError?.message || "WhatsApp delivery failed.";
    throw new Error(delivery?.hint ? `${failure} ${delivery.hint}` : failure);
  }
  const { error } = await supabase.from("crm_messages").update({ external_message_id: delivery?.messageId ?? null, status: "sent" }).eq("id", stored.id);
  if (error) throw error;
  return { mode: "cloud" };
}
