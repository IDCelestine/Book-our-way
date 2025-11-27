import { useState, useEffect } from 'react';
import { BookOpen, Plus, Library, User, LogOut, Trash2, Edit2, X } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info.tsx';
import { getSupabaseClient } from '../utils/supabase/client.tsx';

interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  coverImage?: string;
  collectionId: string;
  userId: string;
}

interface Collection {
  id: string;
  name: string;
  description: string;
  userId: string;
}

interface UserProfile {
  id: string;
  email: string;
  name: string;
  bio?: string;
}

interface DashboardPageProps {
  accessToken: string;
  userId: string;
  onLogout: () => void;
}

export function DashboardPage({ accessToken, userId, onLogout }: DashboardPageProps) {
  const [view, setView] = useState<'collections' | 'all-books' | 'profile'>('collections');
  const [collections, setCollections] = useState<Collection[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [showBookModal, setShowBookModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  
  // Form states
  const [collectionName, setCollectionName] = useState('');
  const [collectionDescription, setCollectionDescription] = useState('');
  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');
  const [bookDescription, setBookDescription] = useState('');
  const [bookCollection, setBookCollection] = useState('');
  const [profileName, setProfileName] = useState('');
  const [profileBio, setProfileBio] = useState('');

  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch collections
      const collectionsResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5595ca76/my/collections`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );
      const collectionsData = await collectionsResponse.json();
      setCollections(collectionsData.collections || []);

      // Fetch books
      const booksResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5595ca76/my/books`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );
      const booksData = await booksResponse.json();
      setBooks(booksData.books || []);

      // Fetch profile
      const profileResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5595ca76/my/profile`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );
      const profileData = await profileResponse.json();
      setProfile(profileData.user || null);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    onLogout();
  };

  const createCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5595ca76/my/collections`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            name: collectionName,
            description: collectionDescription,
          }),
        }
      );

      const data = await response.json();
      
      if (response.ok) {
        setCollections([...collections, data.collection]);
        setShowCollectionModal(false);
        setCollectionName('');
        setCollectionDescription('');
      } else {
        alert(data.error || 'Failed to create collection');
      }
    } catch (error) {
      console.error('Error creating collection:', error);
      alert('Failed to create collection');
    }
  };

  const deleteCollection = async (collectionId: string) => {
    if (!confirm('Delete this collection? All books in it will also be deleted.')) {
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5595ca76/my/collections/${collectionId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        setCollections(collections.filter(c => c.id !== collectionId));
        setBooks(books.filter(b => b.collectionId !== collectionId));
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete collection');
      }
    } catch (error) {
      console.error('Error deleting collection:', error);
      alert('Failed to delete collection');
    }
  };

  const createOrUpdateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isEditing = editingBook !== null;
    const url = isEditing
      ? `https://${projectId}.supabase.co/functions/v1/make-server-5595ca76/my/books/${editingBook.id}`
      : `https://${projectId}.supabase.co/functions/v1/make-server-5595ca76/my/books`;

    try {
      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          title: bookTitle,
          author: bookAuthor,
          description: bookDescription,
          collectionId: bookCollection,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        if (isEditing) {
          setBooks(books.map(b => b.id === data.book.id ? data.book : b));
        } else {
          setBooks([...books, data.book]);
        }
        setShowBookModal(false);
        resetBookForm();
      } else {
        alert(data.error || 'Failed to save book');
      }
    } catch (error) {
      console.error('Error saving book:', error);
      alert('Failed to save book');
    }
  };

  const deleteBook = async (bookId: string) => {
    if (!confirm('Delete this book?')) {
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5595ca76/my/books/${bookId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        setBooks(books.filter(b => b.id !== bookId));
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete book');
      }
    } catch (error) {
      console.error('Error deleting book:', error);
      alert('Failed to delete book');
    }
  };

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5595ca76/my/profile`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            name: profileName,
            bio: profileBio,
          }),
        }
      );

      const data = await response.json();
      
      if (response.ok) {
        setProfile(data.user);
        setShowProfileModal(false);
      } else {
        alert(data.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    }
  };

  const resetBookForm = () => {
    setBookTitle('');
    setBookAuthor('');
    setBookDescription('');
    setBookCollection('');
    setEditingBook(null);
  };

  const openEditBookModal = (book: Book) => {
    setEditingBook(book);
    setBookTitle(book.title);
    setBookAuthor(book.author);
    setBookDescription(book.description);
    setBookCollection(book.collectionId);
    setShowBookModal(true);
  };

  const openNewBookModal = (collectionId?: string) => {
    resetBookForm();
    if (collectionId) {
      setBookCollection(collectionId);
    }
    setShowBookModal(true);
  };

  const openProfileModal = () => {
    if (profile) {
      setProfileName(profile.name);
      setProfileBio(profile.bio || '');
      setShowProfileModal(true);
    }
  };

  const getCollectionBooks = (collectionId: string) => {
    return books.filter(b => b.collectionId === collectionId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <BookOpen className="w-8 h-8 text-indigo-600 mr-3" />
              <h1 className="text-indigo-900">Book Our Way</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-700">Welcome, {profile?.name}</span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-indigo-600 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setView('collections')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              view === 'collections'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Library className="w-5 h-5" />
            My Collections
          </button>
          <button
            onClick={() => setView('all-books')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              view === 'all-books'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            All My Books
          </button>
          <button
            onClick={() => setView('profile')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              view === 'profile'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <User className="w-5 h-5" />
            Profile
          </button>
        </div>

        {view === 'collections' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-gray-900">My Collections</h2>
              <button
                onClick={() => setShowCollectionModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                New Collection
              </button>
            </div>

            {collections.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
                No collections yet. Create your first one!
              </div>
            ) : (
              <div className="space-y-6">
                {collections.map((collection) => {
                  const collectionBooks = getCollectionBooks(collection.id);
                  return (
                    <div key={collection.id} className="bg-white rounded-lg shadow-md p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-gray-900 mb-2">{collection.name}</h3>
                          <p className="text-gray-600">{collection.description}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => openNewBookModal(collection.id)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Add book"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => deleteCollection(collection.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete collection"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      {collectionBooks.length === 0 ? (
                        <div className="text-gray-500 text-center py-4">No books in this collection</div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {collectionBooks.map((book) => (
                            <div key={book.id} className="bg-gray-50 rounded-lg overflow-hidden">
                              <div className="h-32 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                                <BookOpen className="w-12 h-12 text-indigo-400" />
                              </div>
                              <div className="p-3">
                                <h4 className="text-gray-900 mb-1">{book.title}</h4>
                                <p className="text-gray-600 mb-2">{book.author}</p>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => openEditBookModal(book)}
                                    className="flex-1 px-2 py-1 text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                  >
                                    <Edit2 className="w-4 h-4 mx-auto" />
                                  </button>
                                  <button
                                    onClick={() => deleteBook(book.id)}
                                    className="flex-1 px-2 py-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4 mx-auto" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {view === 'all-books' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-gray-900">All My Books</h2>
              <button
                onClick={() => openNewBookModal()}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                disabled={collections.length === 0}
              >
                <Plus className="w-5 h-5" />
                New Book
              </button>
            </div>

            {collections.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
                Create a collection first before adding books
              </div>
            ) : books.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
                No books yet. Add your first book!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {books.map((book) => {
                  const collection = collections.find(c => c.id === book.collectionId);
                  return (
                    <div key={book.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                      <div className="h-48 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                        <BookOpen className="w-16 h-16 text-indigo-400" />
                      </div>
                      <div className="p-4">
                        <h4 className="text-gray-900 mb-1">{book.title}</h4>
                        <p className="text-gray-600 mb-2">{book.author}</p>
                        <p className="text-gray-500 mb-3">{collection?.name}</p>
                        {book.description && (
                          <p className="text-gray-500 line-clamp-2 mb-3">{book.description}</p>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditBookModal(book)}
                            className="flex-1 px-3 py-2 text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteBook(book.id)}
                            className="flex-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {view === 'profile' && profile && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-gray-900">My Profile</h2>
              <button
                onClick={openProfileModal}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Edit2 className="w-5 h-5" />
                Edit Profile
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="max-w-2xl">
                <div className="mb-6">
                  <label className="block text-gray-700 mb-2">Name</label>
                  <p className="text-gray-900">{profile.name}</p>
                </div>
                <div className="mb-6">
                  <label className="block text-gray-700 mb-2">Email</label>
                  <p className="text-gray-900">{profile.email}</p>
                </div>
                <div className="mb-6">
                  <label className="block text-gray-700 mb-2">Bio</label>
                  <p className="text-gray-900">{profile.bio || 'No bio yet'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-gray-700">Collections</p>
                    <p className="text-gray-900">{collections.length}</p>
                  </div>
                  <div>
                    <p className="text-gray-700">Books</p>
                    <p className="text-gray-900">{books.length}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Collection Modal */}
      {showCollectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-900">New Collection</h3>
              <button
                onClick={() => {
                  setShowCollectionModal(false);
                  setCollectionName('');
                  setCollectionDescription('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={createCollection}>
              <div className="mb-4">
                <label htmlFor="collection-name" className="block text-gray-700 mb-2">
                  Name
                </label>
                <input
                  id="collection-name"
                  type="text"
                  value={collectionName}
                  onChange={(e) => setCollectionName(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  placeholder="e.g., Science Fiction"
                />
              </div>
              <div className="mb-6">
                <label htmlFor="collection-description" className="block text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="collection-description"
                  value={collectionDescription}
                  onChange={(e) => setCollectionDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  placeholder="What's this collection about?"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Create Collection
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Create/Edit Book Modal */}
      {showBookModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-900">{editingBook ? 'Edit Book' : 'New Book'}</h3>
              <button
                onClick={() => {
                  setShowBookModal(false);
                  resetBookForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={createOrUpdateBook}>
              <div className="mb-4">
                <label htmlFor="book-title" className="block text-gray-700 mb-2">
                  Title
                </label>
                <input
                  id="book-title"
                  type="text"
                  value={bookTitle}
                  onChange={(e) => setBookTitle(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  placeholder="Book title"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="book-author" className="block text-gray-700 mb-2">
                  Author
                </label>
                <input
                  id="book-author"
                  type="text"
                  value={bookAuthor}
                  onChange={(e) => setBookAuthor(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  placeholder="Author name"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="book-description" className="block text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="book-description"
                  value={bookDescription}
                  onChange={(e) => setBookDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  placeholder="Book description"
                />
              </div>
              <div className="mb-6">
                <label htmlFor="book-collection" className="block text-gray-700 mb-2">
                  Collection
                </label>
                <select
                  id="book-collection"
                  value={bookCollection}
                  onChange={(e) => setBookCollection(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                >
                  <option value="">Select a collection</option>
                  {collections.map((collection) => (
                    <option key={collection.id} value={collection.id}>
                      {collection.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                {editingBook ? 'Update Book' : 'Create Book'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-900">Edit Profile</h3>
              <button
                onClick={() => setShowProfileModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={updateProfile}>
              <div className="mb-4">
                <label htmlFor="profile-name" className="block text-gray-700 mb-2">
                  Name
                </label>
                <input
                  id="profile-name"
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  placeholder="Your name"
                />
              </div>
              <div className="mb-6">
                <label htmlFor="profile-bio" className="block text-gray-700 mb-2">
                  Bio
                </label>
                <textarea
                  id="profile-bio"
                  value={profileBio}
                  onChange={(e) => setProfileBio(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  placeholder="Tell us about yourself..."
                />
              </div>
              <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Update Profile
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default DashboardPage;
