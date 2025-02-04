'use client';

import { useEffect, useState } from 'react';
import { useSupabase } from '@/app/providers';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navigation/Navbar';
import { User } from '@supabase/supabase-js';
import { Background } from '@/components/ui/background';

interface Profile {
  id: string;
  full_name: string | null;
  figma_access_token: string | null;
  created_at: string;
  updated_at: string;
}

interface UpdateProfileForm {
  full_name: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ProfilePage() {
  const { supabase } = useSupabase();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState<UpdateProfileForm>({
    full_name: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/auth');
          return;
        }

        setUser(session.user);

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError) throw profileError;
        setProfile(profileData);
        setFormData(prev => ({
          ...prev,
          full_name: profileData.full_name || '',
        }));
      } catch (err) {
        console.error('Error loading profile:', err);
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [supabase, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setUpdating(true);

    try {
      // Validate passwords if trying to change password
      if (formData.newPassword || formData.currentPassword || formData.confirmPassword) {
        if (!formData.currentPassword) {
          throw new Error('Current password is required to change password');
        }
        if (formData.newPassword !== formData.confirmPassword) {
          throw new Error('New passwords do not match');
        }
        if (formData.newPassword.length < 6) {
          throw new Error('New password must be at least 6 characters');
        }

        // Update password
        const { error: passwordError } = await supabase.auth.updateUser({
          password: formData.newPassword,
        });

        if (passwordError) throw passwordError;
      }

      // Update profile information
      const updates = {
        id: user?.id,
        full_name: formData.full_name,
        updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user?.id);

      if (updateError) throw updateError;

      // Refresh profile data
      const { data: newProfile, error: refreshError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (refreshError) throw refreshError;
      setProfile(newProfile);

      // Clear password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));

      setSuccessMessage('Profile updated successfully');
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <Background>
        <div className="min-h-screen">
          <Navbar />
          <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded w-1/4 mb-8"></div>
              <div className="space-y-4">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </div>
            </div>
          </main>
        </div>
      </Background>
    );
  }

  if (error || !user) {
    return (
      <Background>
        <div className="min-h-screen">
          <Navbar />
          <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
            <div className="rounded-md bg-destructive/10 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-destructive">Error</h3>
                  <div className="mt-2 text-sm text-destructive">
                    <p>{error || 'Profile not found'}</p>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </Background>
    );
  }

  return (
    <Background>
      <div className="min-h-screen">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="space-y-10 divide-y divide-border">
            <div>
              <h2 className="text-base font-semibold leading-7 text-foreground">Profile</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Manage your account settings and preferences.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-x-8 gap-y-8 pt-10 md:grid-cols-3">
              <div className="px-4 sm:px-0">
                <h2 className="text-base font-semibold leading-7 text-foreground">Personal Information</h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Update your account details and password.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="bg-card shadow-sm ring-1 ring-border sm:rounded-xl md:col-span-2">
                <div className="px-4 py-6 sm:p-8">
                  {error && (
                    <div className="mb-6 rounded-md bg-destructive/10 p-4">
                      <div className="flex">
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-destructive">Error</h3>
                          <div className="mt-2 text-sm text-destructive">
                            <p>{error}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {successMessage && (
                    <div className="mb-6 rounded-md bg-green-50 p-4">
                      <div className="flex">
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-green-800">Success</h3>
                          <div className="mt-2 text-sm text-green-700">
                            <p>{successMessage}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                    <div className="col-span-full">
                      <div className="mt-2">
                        <div className="flex items-center gap-x-3">
                          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-primary text-lg font-medium">
                              {user.email?.[0].toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-base font-semibold leading-7 text-foreground">
                              {profile?.full_name || user.email?.split('@')[0]}
                            </h3>
                            <p className="text-sm font-medium text-muted-foreground">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="col-span-full">
                      <label htmlFor="full_name" className="block text-sm font-medium leading-6 text-foreground">
                        Full Name
                      </label>
                      <div className="mt-2">
                        <input
                          type="text"
                          name="full_name"
                          id="full_name"
                          value={formData.full_name}
                          onChange={handleInputChange}
                          className="block w-full rounded-md border-0 py-1.5 text-foreground shadow-sm ring-1 ring-inset ring-border placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 bg-background"
                        />
                      </div>
                    </div>

                    <div className="col-span-full">
                      <label htmlFor="figma-token" className="block text-sm font-medium leading-6 text-foreground">
                        Figma Access Token
                      </label>
                      <div className="mt-2">
                        <div className="flex rounded-md bg-muted/50 ring-1 ring-inset ring-border focus-within:ring-2 focus-within:ring-primary">
                          <input
                            type="text"
                            name="figma-token"
                            id="figma-token"
                            className="flex-1 border-0 bg-transparent py-1.5 pl-3 text-foreground focus:ring-0 sm:text-sm sm:leading-6"
                            value={profile?.figma_access_token || ''}
                            readOnly
                          />
                          <button
                            type="button"
                            onClick={() => router.push('/settings')}
                            className="relative -ml-px inline-flex items-center gap-x-1.5 rounded-r-md px-3 py-2 text-sm font-semibold text-foreground ring-1 ring-inset ring-border hover:bg-muted"
                          >
                            Update
                          </button>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Your Figma access token is used to access your Figma designs.
                        </p>
                      </div>
                    </div>

                    <div className="col-span-full">
                      <label htmlFor="currentPassword" className="block text-sm font-medium leading-6 text-foreground">
                        Current Password
                      </label>
                      <div className="mt-2">
                        <input
                          type="password"
                          name="currentPassword"
                          id="currentPassword"
                          value={formData.currentPassword}
                          onChange={handleInputChange}
                          className="block w-full rounded-md border-0 py-1.5 text-foreground shadow-sm ring-1 ring-inset ring-border placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 bg-background"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="newPassword" className="block text-sm font-medium leading-6 text-foreground">
                        New Password
                      </label>
                      <div className="mt-2">
                        <input
                          type="password"
                          name="newPassword"
                          id="newPassword"
                          value={formData.newPassword}
                          onChange={handleInputChange}
                          className="block w-full rounded-md border-0 py-1.5 text-foreground shadow-sm ring-1 ring-inset ring-border placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 bg-background"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="confirmPassword" className="block text-sm font-medium leading-6 text-foreground">
                        Confirm New Password
                      </label>
                      <div className="mt-2">
                        <input
                          type="password"
                          name="confirmPassword"
                          id="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          className="block w-full rounded-md border-0 py-1.5 text-foreground shadow-sm ring-1 ring-inset ring-border placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 bg-background"
                        />
                      </div>
                    </div>

                    <div className="col-span-full">
                      <div className="flex flex-col gap-y-2 text-sm text-muted-foreground">
                        <p>Member since: {new Date(profile?.created_at || '').toLocaleDateString()}</p>
                        <p>Last updated: {new Date(profile?.updated_at || '').toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-x-6 border-t border-border px-4 py-4 sm:px-8">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        full_name: profile?.full_name || '',
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: '',
                      });
                      setError(null);
                      setSuccessMessage(null);
                    }}
                    className="text-sm font-semibold leading-6 text-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updating ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </Background>
  );
}
