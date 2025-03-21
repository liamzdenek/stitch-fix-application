import { useState, useEffect } from 'react';
import styles from './app.module.css';

// Types
interface User {
  userId: string;
  email: string;
  name: string;
  lastOrderDate: string;
  orderCount: number;
  averageOrderValue: number;
  preferredCategories: string[];
  engagementScore?: number;
  lastEmailDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface Email {
  emailId: string;
  userId: string;
  subject: string;
  content: string;
  generatedAt: string;
  engagementScoreAtTime: number;
  status: string;
  createdAt: string;
}

// API URL
const API_URL = process.env.NX_API_URL || 'https://5bxfbt52m9.execute-api.us-west-2.amazonaws.com/prod';

export function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userEmails, setUserEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [newUser, setNewUser] = useState<Partial<User>>({
    email: '',
    name: '',
    lastOrderDate: new Date().toISOString(),
    orderCount: 0,
    averageOrderValue: 0,
    preferredCategories: []
  });
  const [activeTab, setActiveTab] = useState<'users' | 'emails'>('users');

  // Fetch users and emails on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch users
        const usersResponse = await fetch(`${API_URL}/api/users`);
        if (!usersResponse.ok) {
          throw new Error('Failed to fetch users');
        }
        const usersData = await usersResponse.json();
        setUsers(usersData.data || []);
        
        // Fetch emails
        const emailsResponse = await fetch(`${API_URL}/api/emails`);
        if (!emailsResponse.ok) {
          throw new Error('Failed to fetch emails');
        }
        const emailsData = await emailsResponse.json();
        setEmails(emailsData.data || []);
        
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Fetch user emails when a user is selected
  useEffect(() => {
    const fetchUserEmails = async () => {
      if (!selectedUser) {
        setUserEmails([]);
        return;
      }
      
      try {
        const response = await fetch(`${API_URL}/api/users/${selectedUser.userId}/emails`);
        if (!response.ok) {
          throw new Error('Failed to fetch user emails');
        }
        const data = await response.json();
        setUserEmails(data.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    };
    
    fetchUserEmails();
  }, [selectedUser]);

  // Handle user selection
  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
  };

  // Handle new user form change
  const handleNewUserChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewUser(prev => ({ ...prev, [name]: value }));
  };

  // Handle new user form submit
  const handleNewUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Format preferred categories
      const formattedUser = {
        ...newUser,
        preferredCategories: newUser.preferredCategories 
          ? (typeof newUser.preferredCategories === 'string' 
              ? (newUser.preferredCategories as string).split(',').map(c => c.trim()) 
              : newUser.preferredCategories)
          : [],
        orderCount: Number(newUser.orderCount),
        averageOrderValue: Number(newUser.averageOrderValue)
      };
      
      const response = await fetch(`${API_URL}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formattedUser)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create user');
      }
      
      const data = await response.json();
      
      // Add new user to users list
      setUsers(prev => [...prev, data.data]);
      
      // Reset form
      setNewUser({
        email: '',
        name: '',
        lastOrderDate: new Date().toISOString(),
        orderCount: 0,
        averageOrderValue: 0,
        preferredCategories: []
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Render loading state
  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  // Render error state
  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1>Stitch Fix Client Engagement Acceleration System</h1>
        <nav className={styles.nav}>
          <button 
            className={`${styles.navButton} ${activeTab === 'users' ? styles.active : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Users
          </button>
          <button 
            className={`${styles.navButton} ${activeTab === 'emails' ? styles.active : ''}`}
            onClick={() => setActiveTab('emails')}
          >
            Emails
          </button>
        </nav>
      </header>

      <main className={styles.main}>
        {activeTab === 'users' ? (
          <div className={styles.usersTab}>
            <div className={styles.usersList}>
              <h2>Users</h2>
              {users.length === 0 ? (
                <p>No users found.</p>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Orders</th>
                      <th>Engagement Score</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr 
                        key={user.userId}
                        className={selectedUser?.userId === user.userId ? styles.selectedRow : ''}
                      >
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>{user.orderCount}</td>
                        <td>
                          <div className={styles.scoreContainer}>
                            <div 
                              className={styles.scoreBar}
                              style={{ 
                                width: `${user.engagementScore}%`,
                                backgroundColor: user.engagementScore && user.engagementScore < 50 
                                  ? '#ff4d4d' 
                                  : '#4caf50'
                              }}
                            />
                            <span>{user.engagementScore?.toFixed(1) || 'N/A'}</span>
                          </div>
                        </td>
                        <td>
                          <button 
                            className={styles.viewButton}
                            onClick={() => handleUserSelect(user)}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              <div className={styles.newUserForm}>
                <h3>Add New User</h3>
                <form onSubmit={handleNewUserSubmit}>
                  <div className={styles.formGroup}>
                    <label htmlFor="name">Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={newUser.name}
                      onChange={handleNewUserChange}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={newUser.email}
                      onChange={handleNewUserChange}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="orderCount">Order Count</label>
                    <input
                      type="number"
                      id="orderCount"
                      name="orderCount"
                      value={newUser.orderCount}
                      onChange={handleNewUserChange}
                      min="0"
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="averageOrderValue">Average Order Value</label>
                    <input
                      type="number"
                      id="averageOrderValue"
                      name="averageOrderValue"
                      value={newUser.averageOrderValue}
                      onChange={handleNewUserChange}
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="preferredCategories">Preferred Categories (comma-separated)</label>
                    <input
                      type="text"
                      id="preferredCategories"
                      name="preferredCategories"
                      value={typeof newUser.preferredCategories === 'string' 
                        ? newUser.preferredCategories 
                        : newUser.preferredCategories?.join(', ')}
                      onChange={handleNewUserChange}
                    />
                  </div>
                  <button type="submit" className={styles.submitButton}>Add User</button>
                </form>
              </div>
            </div>

            {selectedUser && (
              <div className={styles.userDetail}>
                <h2>User Details</h2>
                <div className={styles.userInfo}>
                  <h3>{selectedUser.name}</h3>
                  <p><strong>Email:</strong> {selectedUser.email}</p>
                  <p><strong>Last Order Date:</strong> {formatDate(selectedUser.lastOrderDate)}</p>
                  <p><strong>Order Count:</strong> {selectedUser.orderCount}</p>
                  <p><strong>Average Order Value:</strong> ${selectedUser.averageOrderValue.toFixed(2)}</p>
                  <p><strong>Preferred Categories:</strong> {selectedUser.preferredCategories.join(', ') || 'None'}</p>
                  <p><strong>Engagement Score:</strong> {selectedUser.engagementScore?.toFixed(1) || 'N/A'}</p>
                  <p><strong>Last Email Date:</strong> {selectedUser.lastEmailDate ? formatDate(selectedUser.lastEmailDate) : 'Never'}</p>
                  <p><strong>Created At:</strong> {formatDate(selectedUser.createdAt)}</p>
                  <p><strong>Updated At:</strong> {formatDate(selectedUser.updatedAt)}</p>
                </div>

                <div className={styles.userEmails}>
                  <h3>User Emails</h3>
                  {userEmails.length === 0 ? (
                    <p>No emails found for this user.</p>
                  ) : (
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Subject</th>
                          <th>Generated At</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userEmails.map(email => (
                          <tr key={email.emailId}>
                            <td>{email.subject}</td>
                            <td>{formatDate(email.generatedAt)}</td>
                            <td>{email.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.emailsTab}>
            <h2>Emails</h2>
            {emails.length === 0 ? (
              <p>No emails found.</p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>User</th>
                    <th>Generated At</th>
                    <th>Status</th>
                    <th>Engagement Score</th>
                  </tr>
                </thead>
                <tbody>
                  {emails.map(email => {
                    const user = users.find(u => u.userId === email.userId);
                    return (
                      <tr key={email.emailId}>
                        <td>{email.subject}</td>
                        <td>{user ? user.name : email.userId}</td>
                        <td>{formatDate(email.generatedAt)}</td>
                        <td>{email.status}</td>
                        <td>
                          <div className={styles.scoreContainer}>
                            <div 
                              className={styles.scoreBar}
                              style={{ 
                                width: `${email.engagementScoreAtTime}%`,
                                backgroundColor: email.engagementScoreAtTime < 50 
                                  ? '#ff4d4d' 
                                  : '#4caf50'
                              }}
                            />
                            <span>{email.engagementScoreAtTime.toFixed(1)}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </main>

      <footer className={styles.footer}>
        <p>Stitch Fix Client Engagement Acceleration System &copy; 2025</p>
      </footer>
    </div>
  );
}

export default App;
