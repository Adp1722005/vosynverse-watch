import logo from './logo.svg';
import './App.css';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play, Search, Home, Bell, Settings, User, Clock, Globe, Heart, Shuffle, Volume2, MoreHorizontal, Loader2 } from 'lucide-react';

const VosynVerseWatch = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState('Watch');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [temperature] = useState('20°C');
  const [location] = useState('Toronto');
  const [isShuffling, setIsShuffling] = useState(false);
  
  // Dynamic content state
  const [jumpInItems, setJumpInItems] = useState([]);
  const [vosynVerseSelection, setVosynVerseSelection] = useState([]);
  const [builtForYou, setBuiltForYou] = useState([]);
  const [shortsData, setShortsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // API Keys - In production, these should be environment variables
  const YOUTUBE_API_KEY = 'YOUR_YOUTUBE_API_KEY'; // Replace with your actual API key
  const VIMEO_ACCESS_TOKEN = 'YOUR_VIMEO_ACCESS_TOKEN'; // Replace with your actual token

  const navigation = ['Explore Vosyn', 'Create Dashboard', 'Watch', 'Listen', 'Read', 'Play', 'News', 'Community'];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadInitialContent();
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const formatDuration = (duration) => {
    if (typeof duration === 'string') return duration;
    
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return '0:00';
    
    const hours = (match[1] || '').replace('H', '');
    const minutes = (match[2] || '').replace('M', '');
    const seconds = (match[3] || '').replace('S', '');
    
    if (hours) {
      return `${hours}h ${minutes || '0'}m`;
    }
    return `${minutes || '0'}:${seconds?.padStart(2, '0') || '00'}`;
  };

  // YouTube API integration
  const searchYouTube = async (query, maxResults = 25) => {
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=${maxResults}&key=${YOUTUBE_API_KEY}`
      );
      const data = await response.json();
      
      if (data.items) {
        return data.items.map(item => ({
          id: item.id.videoId,
          title: item.snippet.title,
          channel: item.snippet.channelTitle,
          thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default.url,
          description: item.snippet.description,
          publishedAt: item.snippet.publishedAt,
          duration: 'N/A', // Would need additional API call to get duration
          progress: Math.random() * 100, // Simulated progress
          platform: 'YouTube'
        }));
      }
      return [];
    } catch (error) {
      console.error('YouTube API Error:', error);
      return [];
    }
  };

  // Vimeo API integration
  const searchVimeo = async (query, maxResults = 25) => {
    try {
      const response = await fetch(
        `https://api.vimeo.com/videos?query=${encodeURIComponent(query)}&per_page=${maxResults}&sort=relevant`,
        {
          headers: {
            'Authorization': `Bearer ${VIMEO_ACCESS_TOKEN}`
          }
        }
      );
      const data = await response.json();
      
      if (data.data) {
        return data.data.map(item => ({
          id: item.uri.split('/').pop(),
          title: item.name,
          channel: item.user.name,
          thumbnail: item.pictures.sizes.find(size => size.width >= 640)?.link || item.pictures.base_link,
          description: item.description,
          publishedAt: item.created_time,
          duration: formatDuration(item.duration),
          progress: Math.random() * 100,
          platform: 'Vimeo'
        }));
      }
      return [];
    } catch (error) {
      console.error('Vimeo API Error:', error);
      return [];
    }
  };

  // Load initial content from various sources
  const loadInitialContent = async () => {
    setLoading(true);
    try {
      // Load different categories with different search terms
      const [
        continueWatching,
        trendingVideos,
        recommendedVideos,
        shortVideos
      ] = await Promise.all([
        searchYouTube('continue watching trending', 10),
        searchYouTube('trending videos 2024', 15),
        searchYouTube('recommended popular videos', 20),
        searchYouTube('shorts viral videos', 10)
      ]);

      // Also get some Vimeo content
      const vimeoContent = await searchVimeo('featured videos', 10);

      setJumpInItems(continueWatching);
      setVosynVerseSelection([...trendingVideos.slice(0, 5), ...vimeoContent.slice(0, 5)]);
      setBuiltForYou(recommendedVideos);
      setShortsData(shortVideos);
    } catch (error) {
      console.error('Error loading initial content:', error);
      // Fallback to sample data if API fails
      loadSampleData();
    } finally {
      setLoading(false);
    }
  };

  // Fallback sample data
  const loadSampleData = () => {
    setJumpInItems([
      { id: 1, title: 'Rise Up', channel: 'Gray\'s Anatomy', duration: '51 EP', progress: 65, thumbnail: '/api/placeholder/300/169', platform: 'Sample' },
      { id: 2, title: 'Bibendum tempus', channel: 'National Geographic', duration: '45m of 2h 34m', progress: 30, thumbnail: '/api/placeholder/300/169', platform: 'Sample' }
    ]);
    // ... other sample data
  };

  // Handle search functionality
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const [youtubeResults, vimeoResults] = await Promise.all([
        searchYouTube(searchQuery, 20),
        searchVimeo(searchQuery, 10)
      ]);

      const allResults = [...youtubeResults, ...vimeoResults];
      setSearchResults(allResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle shuffle functionality
  const handleShuffle = async () => {
    setIsShuffling(true);
    try {
      const randomQueries = ['music', 'technology', 'nature', 'cooking', 'travel', 'science'];
      const randomQuery = randomQueries[Math.floor(Math.random() * randomQueries.length)];
      
      const shuffledContent = await searchYouTube(randomQuery, 15);
      setBuiltForYou(shuffledContent);
    } catch (error) {
      console.error('Shuffle error:', error);
    } finally {
      setIsShuffling(false);
    }
  };

  // Load more content for a specific section
  const loadMoreContent = async (section) => {
    setLoadingMore(true);
    try {
      let newContent = [];
      
      switch (section) {
        case 'jumpIn':
          newContent = await searchYouTube('continue watching playlist', 10);
          setJumpInItems(prev => [...prev, ...newContent]);
          break;
        case 'vosynverse':
          newContent = await searchYouTube('featured content', 10);
          setVosynVerseSelection(prev => [...prev, ...newContent]);
          break;
        case 'builtForYou':
          newContent = await searchYouTube('recommended for you', 15);
          setBuiltForYou(prev => [...prev, ...newContent]);
          break;
        case 'shorts':
          newContent = await searchYouTube('shorts trending', 10);
          setShortsData(prev => [...prev, ...newContent]);
          break;
      }
    } catch (error) {
      console.error('Load more error:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  // Handle video click
  const handleVideoClick = (video) => {
    // In a real app, this would open the video player
    console.log('Playing video:', video);
    // You could open a modal, navigate to a video page, or embed the player
    alert(`Playing: ${video.title}\nFrom: ${video.platform}`);
  };

  const ProgressBar = ({ progress, className = '' }) => (
    <div className={`w-full bg-gray-600 rounded-full h-1 ${className}`}>
      <div 
        className="bg-blue-500 h-1 rounded-full transition-all duration-300" 
        style={{ width: `${progress}%` }}
      />
    </div>
  );

  const VideoCard = ({ item, showProgress = false, isLarge = false }) => (
    <div 
      className={`relative group cursor-pointer ${isLarge ? 'min-w-96' : 'min-w-80'}`}
      onClick={() => handleVideoClick(item)}
    >
      <div className="relative rounded-lg overflow-hidden bg-gray-800">
        <img 
          src={item.thumbnail} 
          alt={item.title}
          className={`w-full object-cover ${isLarge ? 'h-56' : 'h-44'}`}
          onError={(e) => {
            e.target.src = '/api/placeholder/300/169';
          }}
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
          <Play className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
        {showProgress && (
          <div className="absolute bottom-0 left-0 right-0 p-2">
            <ProgressBar progress={item.progress} />
          </div>
        )}
        <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
          {item.platform}
        </div>
      </div>
      <div className="mt-3">
        <h3 className="text-white font-medium text-sm line-clamp-2">{item.title}</h3>
        <p className="text-gray-400 text-xs mt-1">{item.channel}</p>
        <p className="text-gray-500 text-xs">{item.duration}</p>
      </div>
    </div>
  );

  const ShortsCard = ({ item }) => (
    <div 
      className="relative group cursor-pointer min-w-48"
      onClick={() => handleVideoClick(item)}
    >
      <div className="relative rounded-lg overflow-hidden bg-gray-800 aspect-[9/16]">
        <img 
          src={item.thumbnail} 
          alt={item.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = '/api/placeholder/200/355';
          }}
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
          <Play className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
        <div className="absolute bottom-2 left-2 right-2">
          <h3 className="text-white font-medium text-xs line-clamp-2">{item.title}</h3>
          <p className="text-gray-400 text-xs mt-1">{item.channel}</p>
        </div>
        <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-1 py-0.5 rounded">
          {item.platform}
        </div>
      </div>
    </div>
  );

  const ScrollableSection = ({ children, title, subtitle, onLoadMore, section, showMore = true }) => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-white text-xl font-bold">{title}</h2>
          {subtitle && <p className="text-gray-400 text-sm">{subtitle}</p>}
        </div>
        {showMore && (
          <button 
            onClick={() => onLoadMore(section)}
            disabled={loadingMore}
            className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center gap-1"
          >
            {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            more
          </button>
        )}
      </div>
      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4">
        {children}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Loading VosynVerse...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">V</span>
            </div>
          </div>
          <nav className="flex items-center gap-6">
            {navigation.map((item) => (
              <button
                key={item}
                onClick={() => setActiveTab(item)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === item
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800'
                }`}
              >
                {item}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-gray-300">
            <Globe className="w-4 h-4" />
            <span className="text-sm">{temperature}</span>
            <span className="text-sm">{formatTime(currentTime)}</span>
            <span className="text-sm">{location}</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-800 rounded-lg">
              <Home className="w-5 h-5" />
            </button>
            <button className="p-2 hover:bg-gray-800 rounded-lg">
              <Bell className="w-5 h-5" />
            </button>
            <button className="p-2 hover:bg-gray-800 rounded-lg">
              <Settings className="w-5 h-5" />
            </button>
            <button className="p-2 hover:bg-gray-800 rounded-lg">
              <User className="w-5 h-5" />
            </button>
          </div>
          <button 
            onClick={handleShuffle}
            disabled={isShuffling}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium disabled:opacity-50"
          >
            {isShuffling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shuffle className="w-4 h-4" />}
            Shuffle
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-6 py-4">
        <form onSubmit={handleSearch} className="relative max-w-lg">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search content from YouTube, Vimeo, and more..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 animate-spin" />
          )}
        </form>
      </div>

      {/* Main Content */}
      <div className="px-6 pb-8">
        {/* Search Results */}
        {searchResults.length > 0 && (
          <ScrollableSection 
            title="Search Results" 
            subtitle={`Found ${searchResults.length} results for "${searchQuery}"`}
            showMore={false}
          >
            {searchResults.map((item) => (
              <VideoCard key={`${item.platform}-${item.id}`} item={item} />
            ))}
          </ScrollableSection>
        )}

        {/* Jump In Section */}
        <ScrollableSection 
          title="Jump In" 
          subtitle="Continue watching from where you left off"
          onLoadMore={loadMoreContent}
          section="jumpIn"
        >
          {jumpInItems.map((item) => (
            <VideoCard key={`${item.platform}-${item.id}`} item={item} showProgress={true} />
          ))}
        </ScrollableSection>

        {/* VosynVerse Selection */}
        <ScrollableSection 
          title="VosynVerse Selection" 
          subtitle="Daily selection powered by VosynVerse"
          onLoadMore={loadMoreContent}
          section="vosynverse"
        >
          {vosynVerseSelection.map((item) => (
            <VideoCard key={`${item.platform}-${item.id}`} item={item} isLarge={true} />
          ))}
        </ScrollableSection>

        {/* Built for You */}
        <ScrollableSection 
          title="Built for You" 
          subtitle="Recommendations from multiple platforms"
          onLoadMore={loadMoreContent}
          section="builtForYou"
        >
          {builtForYou.map((item) => (
            <VideoCard key={`${item.platform}-${item.id}`} item={item} />
          ))}
        </ScrollableSection>

        {/* Shorts */}
        <ScrollableSection 
          title="Shorts" 
          subtitle="Trending short videos from across the web"
          onLoadMore={loadMoreContent}
          section="shorts"
        >
          {shortsData.map((item) => (
            <ShortsCard key={`${item.platform}-${item.id}`} item={item} />
          ))}
        </ScrollableSection>
      </div>

      {/* Custom Styles */}
      <style jsx global>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default VosynVerseWatch;
