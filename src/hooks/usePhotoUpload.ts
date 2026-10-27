import { useState } from 'react';
import { supabase } from '../lib/supabase';

export function usePhotoUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadPhotos(issueId: string, files: File[], userId: string) {
    setUploading(true);
    setError(null);

    try {
      const uploadedAttachments = [];

      for (const file of files) {
        // Create unique file path
        const fileExt = file.name.split('.').pop();
        const fileName = `${issueId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('issue-attachments')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        // Create attachment record in database
        const { error: dbError } = await supabase
          .from('issue_attachments')
          .insert({
            issue_id: issueId,
            uploaded_by: userId,
            file_name: file.name,
            file_path: uploadData.path,
            file_size: file.size,
            content_type: file.type
          } as any);

        if (dbError) {
          // Clean up uploaded file if database insert fails
          await supabase.storage.from('issue-attachments').remove([fileName]);
          throw dbError;
        }

        uploadedAttachments.push(uploadData.path);
      }

      return { success: true, paths: uploadedAttachments };
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to upload photos';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setUploading(false);
    }
  }

  async function deletePhoto(attachmentId: string, filePath: string) {
    try {
      // Delete from storage
      await supabase.storage.from('issue-attachments').remove([filePath]);

      // Delete from database
      const { error } = await supabase
        .from('issue_attachments')
        .delete()
        .eq('id', attachmentId);

      if (error) throw error;

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  async function getSignedUrl(filePath: string) {
    try {
      const { data, error } = await supabase.storage
        .from('issue-attachments')
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (error) throw error;
      return data.signedUrl;
    } catch (err) {
      console.error('Error getting signed URL:', err);
      return null;
    }
  }

  return {
    uploadPhotos,
    deletePhoto,
    getSignedUrl,
    uploading,
    error
  };
}
