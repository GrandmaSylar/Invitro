import { useRbacStore } from '../stores/useRbacStore';
import { User, Role } from '../lib/types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const randomDelay = () => delay(Math.floor(Math.random() * 300) + 300);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const authService = {
  authenticate: async (credentials: any): Promise<{ user: User; role: Role }> => {
    await randomDelay();
    const state = useRbacStore.getState();
    const { username, email } = credentials;
    const identifier = username || email;
    
    // Accept any password for seed users
    const user = state.users.find(u => u.username === identifier || u.email === identifier);
    if (!user) {
      throw new Error('Invalid credentials');
    }
    
    if (user.status !== 'active') {
      throw new Error('User account is inactive. Please contact your administrator.');
    }
    
    const role = state.roles.find(r => r.id === user.roleId);
    if (!role) {
      throw new Error('User role not found');
    }
    
    return { user, role };
  },
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  sendMagicLink: async (_email: string) => {
    await randomDelay();
    return { success: true };
  },
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  sendOtp: async (_phone: string) => {
    await randomDelay();
    return { success: true };
  },
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  verifyTwoFactor: async (_code: string) => {
    await randomDelay();
    return { success: true };
  },
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  sendPasswordReset: async (_email: string) => {
    await randomDelay();
    return { success: true };
  },
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  resetPassword: async (_token: string, _newPassword: string) => {
    await randomDelay();
    return { success: true };
  }
};
