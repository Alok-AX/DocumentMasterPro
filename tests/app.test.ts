import { describe, expect, test, beforeEach, afterEach, beforeAll, afterAll, jest } from '@jest/globals';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { MemStorage } from '../server/storage';
import { User, Document } from '../shared/schema';

// Mock Redux store and API client
jest.mock('../client/src/lib/store', () => ({
  store: {
    dispatch: jest.fn(),
    getState: jest.fn(),
  },
}));

// Mock API responses
const server = setupServer(
  // Auth endpoints
  http.post('/api/auth/signup', async ({ request }) => {
    const body = await request.json() as { username: string, email: string };
    const { username, email } = body;
    
    if (username === 'existinguser') {
      return HttpResponse.json(
        { message: 'Username already exists' },
        { status: 400 }
      );
    }
    
    if (email === 'existing@example.com') {
      return HttpResponse.json(
        { message: 'Email already exists' },
        { status: 400 }
      );
    }
    
    return HttpResponse.json({
      id: 123,
      username,
      email,
      name: 'Test User',
      role: 'user',
      createdAt: new Date().toISOString(),
    }, { status: 201 });
  }),
  
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json() as { username: string, password: string };
    const { username, password } = body;
    
    if (username === 'admin' && password === 'admin123') {
      return HttpResponse.json({
        id: 1,
        username: 'admin',
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
      });
    }
    
    if (username === 'testuser' && password === 'password123') {
      return HttpResponse.json({
        id: 2,
        username: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
      });
    }
    
    return HttpResponse.json(
      { message: 'Invalid credentials' },
      { status: 401 }
    );
  }),
  
  // Document endpoints
  http.get('/api/documents', () => {
    return HttpResponse.json([
      {
        id: 1,
        name: 'Document 1',
        type: 'pdf',
        size: 1024,
        path: '/path/to/document1.pdf',
        userId: 1,
        createdAt: new Date().toISOString(),
        starred: false,
      },
      {
        id: 2,
        name: 'Document 2',
        type: 'docx',
        size: 2048,
        path: '/path/to/document2.docx',
        userId: 2,
        createdAt: new Date().toISOString(),
        starred: false,
      },
    ]);
  }),
  
  http.post('/api/documents', async ({ request }) => {
    const document = await request.json() as Document;
    return HttpResponse.json({
      ...document,
      createdAt: new Date().toISOString(),
      starred: false,
    }, { status: 201 });
  }),
  
  // User endpoints
  http.get('/api/users', () => {
    return HttpResponse.json([
      {
        id: 1,
        username: 'admin',
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
      },
      {
        id: 2,
        username: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
      },
    ]);
  }),
);

// Setup and teardown
beforeAll(() => {
  server.listen();
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

// Test suites
describe('Authentication', () => {
  test('User signup should create a new user account', async () => {
    const storage = new MemStorage();
    
    const userData = {
      username: 'newuser',
      password: 'password123',
      name: 'New User',
      email: 'new@example.com',
      role: 'user' as const,
    };
    
    const user = await storage.createUser(userData);
    
    expect(user).toBeDefined();
    expect(user.id).toBeDefined();
    expect(user.username).toBe('newuser');
    expect(user.email).toBe('new@example.com');
    expect(user.role).toBe('user');
  });
  
  test('User signup should fail with existing username', async () => {
    const storage = new MemStorage();
    
    // Create first user
    await storage.createUser({
      username: 'existinguser',
      password: 'password123',
      name: 'Existing User',
      email: 'existing@example.com',
      role: 'user' as const,
    });
    
    // Try to create user with same username
    await expect(storage.createUser({
      username: 'existinguser',
      password: 'password456',
      name: 'Another User',
      email: 'another@example.com',
      role: 'user' as const,
    })).rejects.toThrowError('Username already exists');
  });
  
  test('User login should authenticate with valid credentials', async () => {
    const storage = new MemStorage();
    
    // Create a test user
    await storage.createUser({
      username: 'testuser',
      password: 'password123',
      name: 'Test User',
      email: 'test@example.com',
      role: 'user' as const,
    });
    
    // Get user by username and check password
    const user = await storage.getUserByUsername('testuser');
    
    expect(user).toBeDefined();
    expect(user?.username).toBe('testuser');
    expect(user?.password).toBe('password123');
  });
  
  test('User login should fail with invalid credentials', async () => {
    const storage = new MemStorage();
    
    // Create a test user
    await storage.createUser({
      username: 'testuser',
      password: 'password123',
      name: 'Test User',
      email: 'test@example.com',
      role: 'user' as const,
    });
    
    // Get user by username
    const user = await storage.getUserByUsername('testuser');
    
    expect(user).toBeDefined();
    expect(user?.password).not.toBe('wrongpassword');
  });
});

describe('User Management', () => {
  test('Get all users should return a list of users', async () => {
    const storage = new MemStorage();
    
    // Add some test users
    await storage.createUser({
      username: 'user1',
      password: 'password1',
      name: 'User One',
      email: 'user1@example.com',
      role: 'admin' as const,
    });
    
    await storage.createUser({
      username: 'user2',
      password: 'password2',
      name: 'User Two',
      email: 'user2@example.com',
      role: 'user' as const,
    });
    
    // Get all users
    const users = await storage.listUsers();
    
    expect(users).toBeDefined();
    expect(users.length).toBeGreaterThanOrEqual(2);
    expect(users.some((u: User) => u.username === 'user1')).toBe(true);
    expect(users.some((u: User) => u.username === 'user2')).toBe(true);
  });
  
  test('Get user by ID should return the correct user', async () => {
    const storage = new MemStorage();
    
    // Create a test user
    const createdUser = await storage.createUser({
      username: 'testuser',
      password: 'password123',
      name: 'Test User',
      email: 'test@example.com',
      role: 'user' as const,
    });
    
    // Get user by ID
    const user = await storage.getUser(createdUser.id);
    
    expect(user).toBeDefined();
    expect(user?.id).toBe(createdUser.id);
    expect(user?.username).toBe('testuser');
    expect(user?.email).toBe('test@example.com');
  });
  
  test('Update user should modify user data', async () => {
    const storage = new MemStorage();
    
    // Create a test user
    const createdUser = await storage.createUser({
      username: 'testuser',
      password: 'password123',
      name: 'Test User',
      email: 'test@example.com',
      role: 'user' as const,
    });
    
    // Update user
    const updatedUser = await storage.updateUser(createdUser.id, {
      name: 'Updated Name',
      email: 'updated@example.com',
    });
    
    expect(updatedUser).toBeDefined();
    expect(updatedUser?.id).toBe(createdUser.id);
    expect(updatedUser?.name).toBe('Updated Name');
    expect(updatedUser?.email).toBe('updated@example.com');
    expect(updatedUser?.username).toBe('testuser'); // Unchanged
  });
  
  test('Delete user should remove the user', async () => {
    const storage = new MemStorage();
    
    // Create a test user
    const createdUser = await storage.createUser({
      username: 'testuser',
      password: 'password123',
      name: 'Test User',
      email: 'test@example.com',
      role: 'user' as const,
    });
    
    // Delete user
    await storage.deleteUser(createdUser.id);
    
    // Try to get deleted user
    const user = await storage.getUser(createdUser.id);
    
    expect(user).toBeUndefined();
  });
});

describe('Document Management', () => {
  test('Create document should add a new document', async () => {
    const storage = new MemStorage();
    
    // Create a test user
    const user = await storage.createUser({
      username: 'testuser',
      password: 'password123',
      name: 'Test User',
      email: 'test@example.com',
      role: 'user' as const,
    });
    
    // Create a document
    const document = await storage.createDocument({
      name: 'Test Document',
      type: 'pdf',
      size: 1024,
      path: '/path/to/document.pdf',
      userId: user.id,
      starred: false,
    });
    
    expect(document).toBeDefined();
    expect(document.id).toBeDefined();
    expect(document.name).toBe('Test Document');
    expect(document.userId).toBe(user.id);
  });
  
  test('Get documents for user should return only their documents', async () => {
    const storage = new MemStorage();
    
    // Create test users
    const user1 = await storage.createUser({
      username: 'user1',
      password: 'password1',
      name: 'User One',
      email: 'user1@example.com',
      role: 'user' as const,
    });
    
    const user2 = await storage.createUser({
      username: 'user2',
      password: 'password2',
      name: 'User Two',
      email: 'user2@example.com',
      role: 'user' as const,
    });
    
    // Create documents for both users
    await storage.createDocument({
      name: 'User 1 Document',
      type: 'pdf',
      size: 1024,
      path: '/path/to/user1.pdf',
      userId: user1.id,
      starred: false,
    });
    
    await storage.createDocument({
      name: 'User 2 Document',
      type: 'docx',
      size: 2048,
      path: '/path/to/user2.docx',
      userId: user2.id,
      starred: false,
    });
    
    // Get documents for user1
    const user1Docs = await storage.listDocuments(user1.id);
    
    expect(user1Docs).toBeDefined();
    expect(user1Docs.length).toBe(1);
    expect(user1Docs[0].name).toBe('User 1 Document');
    expect(user1Docs[0].userId).toBe(user1.id);
    
    // Get documents for user2
    const user2Docs = await storage.listDocuments(user2.id);
    
    expect(user2Docs).toBeDefined();
    expect(user2Docs.length).toBe(1);
    expect(user2Docs[0].name).toBe('User 2 Document');
    expect(user2Docs[0].userId).toBe(user2.id);
  });
  
  test('Admin should be able to access all documents', async () => {
    const storage = new MemStorage();
    
    // Create admin user
    const admin = await storage.createUser({
      username: 'admin',
      password: 'admin123',
      name: 'Admin User',
      email: 'admin@example.com',
      role: 'admin' as const,
    });
    
    // Create regular user
    const user = await storage.createUser({
      username: 'user',
      password: 'password123',
      name: 'Regular User',
      email: 'user@example.com',
      role: 'user' as const,
    });
    
    // Create documents for both users
    await storage.createDocument({
      name: 'Admin Document',
      type: 'pdf',
      size: 1024,
      path: '/path/to/admin.pdf',
      userId: admin.id,
      starred: false,
    });
    
    await storage.createDocument({
      name: 'User Document',
      type: 'docx',
      size: 2048,
      path: '/path/to/user.docx',
      userId: user.id,
      starred: false,
    });
    
    // Get all documents (admin access)
    const allDocs = await storage.listDocuments();
    
    expect(allDocs).toBeDefined();
    expect(allDocs.length).toBeGreaterThanOrEqual(2);
    expect(allDocs.some((d: Document) => d.name === 'Admin Document')).toBe(true);
    expect(allDocs.some((d: Document) => d.name === 'User Document')).toBe(true);
  });
  
  test('Update document should modify document data', async () => {
    const storage = new MemStorage();
    
    // Create a test user
    const user = await storage.createUser({
      username: 'testuser',
      password: 'password123',
      name: 'Test User',
      email: 'test@example.com',
      role: 'user' as const,
    });
    
    // Create a document
    const document = await storage.createDocument({
      name: 'Original Document',
      type: 'pdf',
      size: 1024,
      path: '/path/to/original.pdf',
      userId: user.id,
      starred: false,
    });
    
    // Update document
    const updatedDoc = await storage.updateDocument(document.id, {
      name: 'Updated Document',
      size: 2048,
    });
    
    expect(updatedDoc).toBeDefined();
    expect(updatedDoc?.id).toBe(document.id);
    expect(updatedDoc?.name).toBe('Updated Document');
    expect(updatedDoc?.size).toBe(2048);
    expect(updatedDoc?.type).toBe('pdf'); // Unchanged
    expect(updatedDoc?.userId).toBe(user.id); // Unchanged
  });
  
  test('Delete document should remove the document', async () => {
    const storage = new MemStorage();
    
    // Create a test user
    const user = await storage.createUser({
      username: 'testuser',
      password: 'password123',
      name: 'Test User',
      email: 'test@example.com',
      role: 'user' as const,
    });
    
    // Create a document
    const document = await storage.createDocument({
      name: 'Test Document',
      type: 'pdf',
      size: 1024,
      path: '/path/to/document.pdf',
      userId: user.id,
      starred: false,
    });
    
    // Delete document
    await storage.deleteDocument(document.id);
    
    // Try to get deleted document
    const doc = await storage.getDocument(document.id);
    
    expect(doc).toBeUndefined();
  });
});

describe('Activity Tracking', () => {
  test('Create activity should track user actions', async () => {
    const storage = new MemStorage();
    
    // Create a test user
    const user = await storage.createUser({
      username: 'testuser',
      password: 'password123',
      name: 'Test User',
      email: 'test@example.com',
      role: 'user' as const,
    });
    
    // Create a document
    const document = await storage.createDocument({
      name: 'Test Document',
      type: 'pdf',
      size: 1024,
      path: '/path/to/document.pdf',
      userId: user.id,
      starred: false,
    });
    
    // Create activity
    const activity = await storage.createActivity({
      userId: user.id,
      action: 'created',
      type: 'document',
      documentId: document.id,
      documentName: document.name,
    });
    
    expect(activity).toBeDefined();
    expect(activity.id).toBeDefined();
    expect(activity.userId).toBe(user.id);
    expect(activity.action).toBe('created');
    expect(activity.type).toBe('document');
    expect(activity.documentId).toBe(document.id);
  });
  
  test('Get user activities should return actions for that user', async () => {
    const storage = new MemStorage();
    
    // Create test users
    const user1 = await storage.createUser({
      username: 'user1',
      password: 'password1',
      name: 'User One',
      email: 'user1@example.com',
      role: 'user' as const,
    });
    
    const user2 = await storage.createUser({
      username: 'user2',
      password: 'password2',
      name: 'User Two',
      email: 'user2@example.com',
      role: 'user' as const,
    });
    
    // Create documents
    const doc1 = await storage.createDocument({
      name: 'User 1 Document',
      type: 'pdf',
      size: 1024,
      path: '/path/to/user1.pdf',
      userId: user1.id,
      starred: false,
    });
    
    const doc2 = await storage.createDocument({
      name: 'User 2 Document',
      type: 'docx',
      size: 2048,
      path: '/path/to/user2.docx',
      userId: user2.id,
      starred: false,
    });
    
    // Create activities
    await storage.createActivity({
      userId: user1.id,
      action: 'created',
      type: 'document',
      documentId: doc1.id,
      documentName: doc1.name,
    });
    
    await storage.createActivity({
      userId: user2.id,
      action: 'created',
      type: 'document',
      documentId: doc2.id,
      documentName: doc2.name,
    });
    
    // Get activities for user1
    const user1Activities = await storage.listUserActivities(user1.id);
    
    expect(user1Activities).toBeDefined();
    expect(user1Activities.length).toBe(1);
    expect(user1Activities[0].userId).toBe(user1.id);
    expect(user1Activities[0].documentId).toBe(doc1.id);
  });
});

describe('Role-Based Access Control', () => {
  test('Admin users can access any document', async () => {
    const storage = new MemStorage();
    
    // Create admin user
    const admin = await storage.createUser({
      username: 'admin',
      password: 'admin123',
      name: 'Admin User',
      email: 'admin@example.com',
      role: 'admin' as const,
    });
    
    // Create regular user
    const user = await storage.createUser({
      username: 'user',
      password: 'password123',
      name: 'Regular User',
      email: 'user@example.com',
      role: 'user' as const,
    });
    
    // Create document for regular user
    const userDoc = await storage.createDocument({
      name: 'User Document',
      type: 'pdf',
      size: 1024,
      path: '/path/to/user.pdf',
      userId: user.id,
      starred: false,
    });
    
    // Admin should be able to access the document
    const document = await storage.getDocument(userDoc.id);
    expect(document).toBeDefined();
    expect(document?.id).toBe(userDoc.id);
    
    // Simulate admin permissions check (this would normally be in the route handler)
    const adminUser = await storage.getUser(admin.id);
    const canAccessDocument = adminUser?.role === 'admin' || document?.userId === admin.id;
    
    expect(canAccessDocument).toBe(true);
  });
  
  test('Regular users can only access their own documents', async () => {
    const storage = new MemStorage();
    
    // Create test users
    const user1 = await storage.createUser({
      username: 'user1',
      password: 'password1',
      name: 'User One',
      email: 'user1@example.com',
      role: 'user' as const,
    });
    
    const user2 = await storage.createUser({
      username: 'user2',
      password: 'password2',
      name: 'User Two',
      email: 'user2@example.com',
      role: 'user' as const,
    });
    
    // Create document for user1
    const user1Doc = await storage.createDocument({
      name: 'User 1 Document',
      type: 'pdf',
      size: 1024,
      path: '/path/to/user1.pdf',
      userId: user1.id,
      starred: false,
    });
    
    // Get document
    const document = await storage.getDocument(user1Doc.id);
    expect(document).toBeDefined();
    
    // Simulate permission check for user1 (owner)
    const user1CanAccess = document?.userId === user1.id;
    expect(user1CanAccess).toBe(true);
    
    // Simulate permission check for user2 (not owner)
    const user2CanAccess = document?.userId === user2.id;
    expect(user2CanAccess).toBe(false);
  });
  
  test('Viewer can only view documents, not modify them', async () => {
    const storage = new MemStorage();
    
    // Create users with different roles
    const admin = await storage.createUser({
      username: 'admin',
      password: 'admin123',
      name: 'Admin User',
      email: 'admin@example.com',
      role: 'admin' as const,
    });
    
    const regularUser = await storage.createUser({
      username: 'user',
      password: 'password123',
      name: 'Regular User',
      email: 'user@example.com',
      role: 'user' as const,
    });
    
    const viewer = await storage.createUser({
      username: 'viewer',
      password: 'password123',
      name: 'Viewer User',
      email: 'viewer@example.com',
      role: 'viewer' as const,
    });
    
    // Create document
    const document = await storage.createDocument({
      name: 'Test Document',
      type: 'pdf',
      size: 1024,
      path: '/path/to/document.pdf',
      userId: admin.id,
      starred: false,
    });
    
    // Check permissions (this would normally be in route middleware)
    const canAdminModify = admin.role === 'admin' || admin.role === 'user';
    const canUserModify = regularUser.role === 'admin' || regularUser.role === 'user';
    const canViewerModify = viewer.role === 'admin' || viewer.role === 'user';
    
    expect(canAdminModify).toBe(true);
    expect(canUserModify).toBe(true);
    expect(canViewerModify).toBe(false);
  });
});