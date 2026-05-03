import { Types } from 'mongoose';
import { UserProfile, UserProfileDocument, UserProfileRole } from './userProfile.model';

export type CreateUserProfileInput = {
  userId: Types.ObjectId;
  profileId: Types.ObjectId;
  role: UserProfileRole;
};

export const createUserProfile = async (
  input: CreateUserProfileInput
): Promise<UserProfileDocument> => {
  return UserProfile.create(input);
};

export const getUserProfiles = async (
  userId: Types.ObjectId
): Promise<UserProfileDocument[]> => {
  return UserProfile.find({ userId });
};

export const getUserProfile = async (
  userId: Types.ObjectId
): Promise<UserProfileDocument | null> => {
  return UserProfile.findOne({ userId }).populate('profileId userId');
};

export const getProfilesForUser = async (
  userId: Types.ObjectId
): Promise<UserProfileDocument[]> => {
  return UserProfile.find({ userId }).populate('profileId');
};

export const getUsersForProfile = async (
  profileId: Types.ObjectId
): Promise<UserProfileDocument[]> => {
  return UserProfile.find({ profileId }).populate('userId');
};

export const deleteUserProfile = async (
  userId: Types.ObjectId,
  profileId: Types.ObjectId
): Promise<void> => {
  await UserProfile.deleteOne({ userId, profileId });
};
