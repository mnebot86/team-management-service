import mongoose, { Types } from 'mongoose';
import { Profile, ProfileDocument } from './profile.model';

// Safer link code generator with retry to avoid collisions
const generateLinkCode = async (): Promise<string> => {
  const make = () => `P-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString().slice(-4)}`;

  for (let i = 0; i < 5; i++) {
    const code = make();
    const exists = await Profile.exists({ linkCode: code });
    if (!exists) return code;
  }

  // Fallback (extremely unlikely to collide)
  return `P-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
};

export type CreateProfileInput = {
  firstName: string;
  lastName?: string;
  createdByUserId: Types.ObjectId;
  isClaimed: boolean;
};

export const createProfile = async (
  input: CreateProfileInput,
  session?: mongoose.ClientSession
): Promise<ProfileDocument> => {
  const linkCode = await generateLinkCode();

  const [profile] = await Profile.create(
    [
      {
        ...input,
        linkCode,
      },
    ],
    { session }
  );

  if (!profile) {
    throw new Error('Profile creation failed');
  }

  return profile;
};

export const createProfileForUser = async (
  userId: Types.ObjectId,
  firstName: string,
  lastName?: string
): Promise<ProfileDocument> => {
  return createProfile({
    firstName,
    ...(lastName !== undefined ? { lastName } : {}),
    createdByUserId: userId,
    isClaimed: true,
  });
};

export const createProfileByCoach = async (
  coachUserId: Types.ObjectId,
  firstName: string,
  lastName?: string
): Promise<ProfileDocument> => {
  return createProfile({
    firstName,
    ...(lastName !== undefined ? { lastName } : {}),
    createdByUserId: coachUserId,
    isClaimed: false,
  });
};

export const getProfilesByCreator = async (
  userId: Types.ObjectId
): Promise<ProfileDocument[]> => {
  return Profile.find({ createdByUserId: userId });
};

export const getProfileById = async (
  profileId: Types.ObjectId
): Promise<ProfileDocument | null> => {
  return Profile.findById(profileId);
};

export const linkProfileToUser = async (
  userId: Types.ObjectId,
  linkCode: string
): Promise<ProfileDocument | null> => {
  const profile = await Profile.findOne({ linkCode });

  if (!profile) return null;

  // mark as claimed
  profile.isClaimed = true;
  await profile.save();

  // NOTE: linking to UserProfile collection will be handled elsewhere
  return profile;
};

export const searchProfilesByName = async (
  name: string
): Promise<ProfileDocument[]> => {
  return Profile.find({
    firstName: { $regex: name, $options: 'i' },
  }).limit(10);
};
