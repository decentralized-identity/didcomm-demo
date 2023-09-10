export interface Secret {
    id: string;
    type: string;
    privateKeyJwk: {
        crv: string;
        d: string;
        kty: string;
        x: string;
    };
}

export interface Profile {
    id: string;
    secrets: Secret[];
    mediatorURL: string;
}

export abstract class ProfileService {
  abstract setActiveProfile(profileId: string): void;
  abstract unsetActiveProfile(): void;
  abstract getActiveProfile(): Profile;
  abstract getActiveProfileId(): string;
  abstract saveProfile(profile: Profile): void;
  abstract deleteProfile(profileId: string): void;
  abstract getProfileIds(): string[];
}

export class LocalStorageProfileService extends ProfileService {
  private static ACTIVE_PROFILE_ID_KEY = 'activeProfileId';
  private static PROFILE_PREFIX = 'profile_'; // Prefix for storing profile data

  // Set the active profile ID in local storage
  setActiveProfile(profileId: string): void {
    localStorage.setItem(LocalStorageProfileService.ACTIVE_PROFILE_ID_KEY, profileId);
  }

  // Unset the active profile ID in local storage
  unsetActiveProfile(): void {
    localStorage.removeItem(LocalStorageProfileService.ACTIVE_PROFILE_ID_KEY);
  }

  // Fetch the active profile from local storage using the active profile ID
  getActiveProfile(): Profile {
    const activeProfileId = this.getActiveProfileId();
    if (!activeProfileId) {
      throw new Error('No active profile set');
    }

    const profileData = localStorage.getItem(LocalStorageProfileService.PROFILE_PREFIX + activeProfileId);
    if (!profileData) {
      throw new Error('Profile not found for ID ' + activeProfileId);
    }

    return JSON.parse(profileData);
  }

  // Retrieve the active profile ID from local storage
  getActiveProfileId(): string {
    const profileId = localStorage.getItem(LocalStorageProfileService.ACTIVE_PROFILE_ID_KEY);
    if (profileId === null) {
      throw new Error('No active profile set');
    }
    return profileId;
  }

  // Save or update the profile data in local storage
  saveProfile(profile: Profile): void {
    if (!profile.id) {
      throw new Error('Profile must have an ID');
    }

    const serializedProfile = JSON.stringify(profile);
    localStorage.setItem(LocalStorageProfileService.PROFILE_PREFIX + profile.id, serializedProfile);
  }

  // Delete the profile from local storage
  deleteProfile(profileId: string): void {
    localStorage.removeItem(LocalStorageProfileService.PROFILE_PREFIX + profileId);
  }

  // Retrieve all profile IDs from local storage
  getProfileIds(): string[] {
    const profileIds: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(LocalStorageProfileService.PROFILE_PREFIX)) {
        const profileId = key.replace(LocalStorageProfileService.PROFILE_PREFIX, '');
        profileIds.push(profileId);
      }
    }

    return profileIds;
  }
}

export default new LocalStorageProfileService();
