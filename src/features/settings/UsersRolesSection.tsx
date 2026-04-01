import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../app/components/ui/tabs';
import { UserTable } from '../rbac/UserTable';
import { PermissionMatrix } from '../rbac/PermissionMatrix';

export default function UsersRolesSection() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
        </TabsList>
        <TabsContent value="users">
          <UserTable />
        </TabsContent>
        <TabsContent value="roles">
          <PermissionMatrix />
        </TabsContent>
      </Tabs>
    </div>
  );
}
