import { useState, useEffect } from 'react';
import { BookOpen, User, Library, LogIn } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info.tsx';

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
  userName?: string;
}

interface HomePageProps {
  onLoginClick: () => void;
}

export function HomePage({ onLoginClick }: HomePageProps) {
  const [books, setBooks] = useState<Book[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [collectionBooks, setCollectionBooks] = useState<Book[]>([]);
  const [view, setView] = useState<'books' | 'collections'>('books');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch all books
      const booksResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5595ca76/books`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );
      const booksData = await booksResponse.json();
      setBooks(booksData.books || []);

      // Fetch all collections
      const collectionsResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5595ca76/collections`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );
      const collectionsData = await collectionsResponse.json();
      setCollections(collectionsData.collections || []);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const viewCollection = async (collection: Collection) => {
    setSelectedCollection(collection);
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5595ca76/collection/${collection.id}/books`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );
      const data = await response.json();
      setCollectionBooks(data.books || []);
    } catch (error) {
      console.error('Error fetching collection books:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (selectedCollection) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <BookOpen className="w-8 h-8 text-indigo-600 mr-3" />
                <h1 className="text-indigo-900">Book Our Way</h1>
              </div>
              <button
                onClick={onLoginClick}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                Login / Sign Up
              </button>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={() => setSelectedCollection(null)}
            className="mb-6 text-indigo-600 hover:text-indigo-700"
          >
            ← Back to all collections
          </button>

          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-gray-900 mb-2">{selectedCollection.name}</h2>
            <p className="text-gray-600 mb-2">{selectedCollection.description}</p>
            <div className="flex items-center text-gray-500">
              <User className="w-4 h-4 mr-2" />
              {selectedCollection.userName}
            </div>
          </div>

          <h3 className="text-gray-900 mb-4">Books in this collection</h3>
          
          {collectionBooks.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
              No books in this collection yet
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {collectionBooks.map((book) => (
                <div key={book.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="h-48 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                    {book.coverImage ? (
                      <img src={book.coverImage} alt={book.title} className="w-full h-full object-cover" />
                    ) : (
                      <BookOpen className="w-16 h-16 text-indigo-400" />
                    )}
                  </div>
                  <div className="p-4">
                    <h4 className="text-gray-900 mb-1">{book.title}</h4>
                    <p className="text-gray-600 mb-2">{book.author}</p>
                    {book.description && (
                      <p className="text-gray-500 line-clamp-2">{book.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
            <button
              onClick={onLoginClick}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <LogIn className="w-4 h-4" />
              Login / Sign Up
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-gray-900 mb-2">Discover Books & Collections</h2>
          <p className="text-gray-600">Browse books and collections shared by our community</p>
        </div>

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setView('books')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              view === 'books'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            All Books
          </button>
          <button
            onClick={() => setView('collections')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              view === 'collections'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Library className="w-5 h-5" />
            Collections
          </button>
        </div>

        {view === 'books' ? (
          <div>
            {books.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
                No books yet. Be the first to share a book!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {books.map((book) => (
                  <div key={book.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="h-48 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                      {book.coverImage ? (
                        <img src={book.coverImage} alt={book.title} className="w-full h-full object-cover" />
                      ) : (
                        <BookOpen className="w-16 h-16 text-indigo-400" />
                      )}
                    </div>
                    <div className="p-4">
                      <h4 className="text-gray-900 mb-1">{book.title}</h4>
                      <p className="text-gray-600 mb-2">{book.author}</p>
                      {book.description && (
                        <p className="text-gray-500 line-clamp-2">{book.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            {collections.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
                No collections yet. Be the first to create one!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {collections.map((collection) => (
                  <div
                    key={collection.id}
                    onClick={() => viewCollection(collection)}
                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  >
                    <div className="flex items-start mb-3">
                      <Library className="w-6 h-6 text-indigo-600 mr-3 flex-shrink-0" />
                      <h4 className="text-gray-900">{collection.name}</h4>
                    </div>
                    <p className="text-gray-600 mb-3 line-clamp-2">{collection.description}</p>
                    <div className="flex items-center text-gray-500">
                      <User className="w-4 h-4 mr-2" />
                      {collection.userName}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
export default HomePage;
