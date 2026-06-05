import fs from 'fs/promises';
import cloudinary from '../../../config/cloudinary';
import { logger } from '../../shared/utils/logger';

interface UploadUserProfileImageResponse {
  url: string;
  publicId: string;
}

export const uploadUserProfileImage = async (
  filePath: string,
  publicId?: string,
): Promise<UploadUserProfileImageResponse> => {
  try {
    const uploadOptions: {
      folder: string;
      resource_type: 'image';
      public_id?: string;
      overwrite?: boolean;
    } = {
      folder: 'user-profiles',
      resource_type: 'image',
    };

    if (publicId) {
      uploadOptions.public_id = publicId;
      uploadOptions.overwrite = true;
    }

    const result = await cloudinary.uploader.upload(filePath, uploadOptions);

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    logger.error({ err: error }, 'Failed to upload user profile image');
    
    throw error;
  } finally {
    await fs.unlink(filePath).catch(() => null);
  }
};
