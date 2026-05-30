import fs from 'fs/promises';
import cloudinary from '../../../config/cloudinary';

interface UploadUserProfileImageResponse {
  url: string;
  publicId: string;
}

export const uploadUserProfileImage = async (
  filePath: string,
): Promise<UploadUserProfileImageResponse> => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'user-profiles',
      resource_type: 'image',
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } finally {
    await fs.unlink(filePath).catch(() => null);
  }
};
