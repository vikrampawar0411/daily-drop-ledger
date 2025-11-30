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
    
    // Pass all data via user metadata - the trigger will handle record creation
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          role: role,
          name: additionalData?.name || additionalData?.contactPerson,
          phone: additionalData?.phone,
          // Vendor specific
          businessName: additionalData?.businessName,
          category: additionalData?.category,
          contactPerson: additionalData?.contactPerson,
          address: additionalData?.address,
        }
      }
    });

    if (!error && data.user && role === 'customer' && additionalData) {
      // For customers, complete signup with additional location details
      setTimeout(async () => {
        try {
          // Build full address
          const selectedArea = await supabase
            .from('areas')
            .select('name, city_id')
            .eq('id', additionalData.area_id)
            .maybeSingle();
          
          const selectedSociety = await supabase
            .from('societies')
            .select('name')
            .eq('id', additionalData.society_id)
            .maybeSingle();
          
          let cityName = '';
          let stateName = '';
          
          if (selectedArea.data?.city_id) {
            const selectedCity = await supabase
              .from('cities')
              .select('name, state_id')
              .eq('id', selectedArea.data.city_id)
              .maybeSingle();
            
            cityName = selectedCity.data?.name || '';
            
            if (selectedCity.data?.state_id) {
              const selectedState = await supabase
                .from('states')
                .select('name')
                .eq('id', selectedCity.data.state_id)
                .maybeSingle();
              
              stateName = selectedState.data?.name || '';
            }
          }
          
          const fullAddress = [
            additionalData.flat_plot_house_number,
            additionalData.wing_number,
            selectedSociety.data?.name,
            selectedArea.data?.name,
            cityName,
            stateName
          ].filter(Boolean).join(", ");

          // Call the RPC function to complete customer signup
          await supabase.rpc('complete_customer_signup', {
            p_area_id: additionalData.area_id,
            p_society_id: additionalData.society_id,
            p_wing_number: additionalData.wing_number || null,
            p_flat_plot_house_number: additionalData.flat_plot_house_number,
            p_full_address: fullAddress
          });
        } catch (err) {
          console.error('Error completing customer signup:', err);
        }
      }, 1000); // Small delay to ensure the trigger has completed
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
    
    // First try user_roles table
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();
    
    if (roleData?.role) {
      return roleData.role as 'admin' | 'staff' | 'vendor' | 'customer';
    }
    
    // Fallback to profiles.user_type
    const { data: profileData } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single();
    
    if (profileData?.user_type) {
      return profileData.user_type as 'admin' | 'staff' | 'vendor' | 'customer';
    }
    
    return null;
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
