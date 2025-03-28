import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { apiRequest } from '@/lib/queryClient';
import Layout from '@/components/layout/Layout';
import { useToast } from '@/hooks/use-toast';
import { User } from '@shared/schema';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  UserPlus, 
  MoreVertical, 
  Pencil, 
  Trash2, 
  Loader2, 
  Shield, 
  FileEdit, 
  Eye, 
  X 
} from 'lucide-react';
import { motion } from 'framer-motion';

interface UserFormData {
  username: string;
  password: string;
  name: string;
  email: string;
  role: string;
}

const Users = () => {
  const { toast } = useToast();
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [isDeleteUserOpen, setIsDeleteUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userFormData, setUserFormData] = useState<UserFormData>({
    username: '',
    password: '',
    name: '',
    email: '',
    role: 'viewer',
  });
  
  // Fetch users
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });
  
  // Add user mutation
  const addUserMutation = useMutation({
    mutationFn: async (userData: UserFormData) => {
      const res = await apiRequest('POST', '/api/auth/signup', userData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'User created successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setIsAddUserOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create user',
        variant: 'destructive',
      });
    },
  });
  
  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<User> }) => {
      const res = await apiRequest('PUT', `/api/users/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'User updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setIsEditUserOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update user',
        variant: 'destructive',
      });
    },
  });
  
  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/users/${id}`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'User deleted successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setIsDeleteUserOpen(false);
      setSelectedUser(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete user',
        variant: 'destructive',
      });
    },
  });
  
  // Helper functions
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserFormData({ ...userFormData, [name]: value });
  };
  
  const handleRoleChange = (value: string) => {
    setUserFormData({ ...userFormData, role: value });
  };
  
  const handleAddUser = () => {
    addUserMutation.mutate(userFormData);
  };
  
  const handleUpdateUser = () => {
    if (!selectedUser) return;
    
    // Only send fields that have changed
    const updatedFields: Partial<User> = {};
    if (userFormData.name !== selectedUser.name) updatedFields.name = userFormData.name;
    if (userFormData.email !== selectedUser.email) updatedFields.email = userFormData.email;
    if (userFormData.role !== selectedUser.role) updatedFields.role = userFormData.role;
    if (userFormData.password) updatedFields.password = userFormData.password;
    
    updateUserMutation.mutate({ id: selectedUser.id, data: updatedFields });
  };
  
  const handleDeleteUser = () => {
    if (selectedUser) {
      deleteUserMutation.mutate(selectedUser.id);
    }
  };
  
  const openEditUserDialog = (user: User) => {
    setSelectedUser(user);
    setUserFormData({
      username: user.username,
      password: '', // Don't populate password for security
      name: user.name,
      email: user.email,
      role: user.role,
    });
    setIsEditUserOpen(true);
  };
  
  const openDeleteUserDialog = (user: User) => {
    setSelectedUser(user);
    setIsDeleteUserOpen(true);
  };
  
  const resetForm = () => {
    setUserFormData({
      username: '',
      password: '',
      name: '',
      email: '',
      role: 'viewer',
    });
    setSelectedUser(null);
  };
  
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4 text-red-500" />;
      case 'editor':
        return <FileEdit className="h-4 w-4 text-blue-500" />;
      case 'viewer':
        return <Eye className="h-4 w-4 text-green-500" />;
      default:
        return <Eye className="h-4 w-4 text-green-500" />;
    }
  };
  
  return (
    <Layout>
      <div className="p-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl">User Management</CardTitle>
            <Button onClick={() => setIsAddUserOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-secondary" />
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users && users.length > 0 ? (
                      users.map((user, index) => (
                        <motion.tr
                          key={user.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-b"
                        >
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.username}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getRoleIcon(user.role)}
                              <span className="capitalize">{user.role}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditUserDialog(user)}>
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => openDeleteUserDialog(user)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </motion.tr>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          No users found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Add User Dialog */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                value={userFormData.name}
                onChange={handleInputChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                value={userFormData.username}
                onChange={handleInputChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={userFormData.email}
                onChange={handleInputChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={userFormData.password}
                onChange={handleInputChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select 
                value={userFormData.role} 
                onValueChange={handleRoleChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                resetForm();
                setIsAddUserOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddUser}
              disabled={addUserMutation.isPending}
            >
              {addUserMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : 'Add User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit User Dialog */}
      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                name="name"
                value={userFormData.name}
                onChange={handleInputChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-username">Username</Label>
              <Input
                id="edit-username"
                name="username"
                value={userFormData.username}
                disabled
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                name="email"
                type="email"
                value={userFormData.email}
                onChange={handleInputChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-password">Password (leave blank to keep current)</Label>
              <Input
                id="edit-password"
                name="password"
                type="password"
                value={userFormData.password}
                onChange={handleInputChange}
                placeholder="••••••••"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-role">Role</Label>
              <Select 
                value={userFormData.role} 
                onValueChange={handleRoleChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                resetForm();
                setIsEditUserOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateUser}
              disabled={updateUserMutation.isPending}
            >
              {updateUserMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : 'Update User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete User Confirmation */}
      <AlertDialog open={isDeleteUserOpen} onOpenChange={setIsDeleteUserOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user 
              <strong>{selectedUser ? ` "${selectedUser.name}"` : ''}</strong> and remove their data from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600"
            >
              {deleteUserMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default Users;
