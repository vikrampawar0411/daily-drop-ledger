import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, role: 'vendor' | 'customer' | 'admin', additionalData?: any) => Promise<{ error: any; user?: User | null }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  getUserRole: () => Promise<'admin' | 'staff' | 'vendor' | 'customer' | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, role: 'vendor' | 'customer' | 'admin', additionalData?: any) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          role: role
        }
      }
    });

    if (!error && data.user) {
      // Create profile and assign role
      setTimeout(async () => {
        try {
          const userName = role === 'customer' 
            ? additionalData?.name 
            : role === 'vendor' 
              ? additionalData?.contactPerson 
              : 'Admin';

          await supabase.from('profiles').insert({
            id: data.user!.id,
            email: email,
            user_type: role,
            name: userName
          });

          await supabase.from('user_roles').insert({
            user_id: data.user!.id,
            role: role
          });

          // Insert into customers or vendors table based on role (skip for admin)
          if (role === 'customer' && additionalData) {
            const selectedArea = await supabase
              .from('areas')
              .select('name')
              .eq('id', additionalData.area_id)
              .single();
            
            const selectedSociety = await supabase
              .from('societies')
              .select('name')
              .eq('id', additionalData.society_id)
              .single();
            
            const address = [
              additionalData.wing_number,
              additionalData.flat_plot_house_number,
              selectedSociety.data?.name,
              selectedArea.data?.name
            ].filter(Boolean).join(", ");

            await supabase.from('customers').insert({
              name: additionalData.name,
              phone: additionalData.phone,
              email: email,
              address: address,
              area_id: additionalData.area_id,
              society_id: additionalData.society_id,
              wing_number: additionalData.wing_number,
              flat_plot_house_number: additionalData.flat_plot_house_number,
            });
          } else if (role === 'vendor' && additionalData) {
            await supabase.from('vendors').insert({
              name: additionalData.businessName,
              category: additionalData.category,
              contact_person: additionalData.contactPerson,
              phone: additionalData.phone,
              email: additionalData.businessEmail,
              address: additionalData.address,
            });
          }
        } catch (err) {
          console.error('Error creating profile:', err);
        }
      }, 0);
    }

    return { error, user: data.user };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const getUserRole = async (): Promise<'admin' | 'staff' | 'vendor' | 'customer' | null> => {
    if (!user) return null;
    
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();
    
    if (error || !data) return null;
    return data.role as 'admin' | 'staff' | 'vendor' | 'customer';
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut, getUserRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
