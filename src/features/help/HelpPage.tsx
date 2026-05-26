import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, BookOpen, Shield, FlaskConical, Users, Database } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import { cn } from '../../app/components/ui/utils';
import { Card, CardContent } from '../../app/components/ui/card';

interface TutorialSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

export function HelpPage() {
  const { user } = useAuthStore();
  const [openSectionId, setOpenSectionId] = useState<string | null>(null);

  const toggleSection = (id: string) => {
    setOpenSectionId(prev => (prev === id ? null : id));
  };

  // Determine sections based on user role
  const getRoleBasedSections = (): TutorialSection[] => {
    const roleId = user?.roleId || 'viewer';
    const sections: TutorialSection[] = [];

    // General Manual (For Everyone)
    sections.push({
      id: 'general',
      title: 'General Navigation & Basics',
      icon: <BookOpen className="h-5 w-5 text-blue-500" />,
      content: (
        <div className="space-y-4 text-sm text-muted-foreground">
          <p>Welcome to the Bloo LIMS platform. Here are some basics to get you started:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Dashboard:</strong> Your main landing page. Provides a high-level overview of daily activities, tests, and revenue.</li>
            <li><strong>Patients:</strong> Navigate here to view the laboratory history of existing patients or register new ones.</li>
            <li><strong>Profile:</strong> Access your profile from the bottom left corner of the sidebar to manage your account details and theme preferences.</li>
          </ul>
        </div>
      )
    });

    // Receptionist / Front Desk Manual
    if (['admin', 'developer', 'receptionist', 'front_desk'].includes(roleId)) {
      sections.push({
        id: 'registration',
        title: 'Patient Registration & Billing',
        icon: <Users className="h-5 w-5 text-emerald-500" />,
        content: (
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>How to register patients and handle billing:</p>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Go to the <strong>Patients</strong> tab and select "New Patient".</li>
              <li>Fill in the demographic details. You can optionally link a referral doctor or hospital.</li>
              <li>Select the tests required from the Lab Catalogue. The total cost will automatically calculate.</li>
              <li>Enter the "Amount Paid" to track arrears.</li>
              <li>Click "Register Patient & Save Tests" to complete the process.</li>
            </ol>
          </div>
        )
      });
    }

    // Lab Technician Manual
    if (['admin', 'developer', 'lab_technician'].includes(roleId)) {
      sections.push({
        id: 'results',
        title: 'Entering Test Results',
        icon: <FlaskConical className="h-5 w-5 text-purple-500" />,
        content: (
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>Guidelines for entering and verifying laboratory results:</p>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Navigate to the <strong>Results Entry</strong> tab.</li>
              <li>Search for the specific Lab Number or Patient.</li>
              <li>For each pending test, input the measured values. The system will auto-flag abnormal results based on reference ranges.</li>
              <li>Review all entered data carefully. Once saved, the results become available for printing and approval.</li>
            </ol>
          </div>
        )
      });
    }

    // Admin / Developer Manual
    if (['admin', 'developer'].includes(roleId)) {
      sections.push({
        id: 'admin',
        title: 'System Administration & RBAC',
        icon: <Shield className="h-5 w-5 text-amber-500" />,
        content: (
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>Administrative tasks and configuration:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>User Management:</strong> Add or deactivate users, and reset passwords via the RBAC Users menu.</li>
              <li><strong>Role Management:</strong> Define custom roles and assign granular permissions to control what features users can access.</li>
              <li><strong>Settings:</strong> Configure general application settings, SMTP email, security policies, and backup configurations in the Settings page.</li>
            </ul>
          </div>
        )
      });
    }

    if (roleId === 'developer') {
      sections.push({
        id: 'dev',
        title: 'Developer Utilities',
        icon: <Database className="h-5 w-5 text-red-500" />,
        content: (
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>Developer specific information:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Database migrations and seed files are located in the <code>/sql</code> directory.</li>
              <li>Ensure all environment variables are correctly set before running production builds.</li>
              <li>API Key management for external integrations is available in Settings &gt; API Keys.</li>
            </ul>
          </div>
        )
      });
    }

    return sections;
  };

  const sections = getRoleBasedSections();

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <HelpCircle className="h-6 w-6 text-primary" />
            Help & Tutorials
          </h1>
          <p className="text-muted-foreground mt-1">User manual and guidelines tailored for your role.</p>
        </div>
      </div>

      <div className="space-y-4">
        {sections.map((section) => {
          const isOpen = openSectionId === section.id;
          return (
            <Card key={section.id} className={cn("transition-all duration-200", isOpen ? "border-primary/50 shadow-sm" : "")}>
              <button
                onClick={() => toggleSection(section.id)}
                className="flex items-center justify-between w-full p-5 text-left focus:outline-none"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-lg shrink-0">
                    {section.icon}
                  </div>
                  <h3 className="text-lg font-semibold">{section.title}</h3>
                </div>
                {isOpen ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </button>
              
              {isOpen && (
                <div className="px-5 pb-5 pt-0 animate-in slide-in-from-top-2 duration-200">
                  <div className="pt-4 border-t">
                    {section.content}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
