
import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { VideoPlayer } from '@/components/player/VideoPlayer';
import { EpisodeSelector } from '@/components/player/EpisodeSelector';
import { MovieInfo } from '@/components/player/MovieInfo';
import { MovieDescription } from '@/components/player/MovieDescription';
import { useMovieDetail } from '@/hooks/useMovieDetail';

const Player = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [currentUrl, setCurrentUrl] = useState('');
  
  const apiUrl = searchParams.get('api');
  const movieId = searchParams.get('id');
  const { movie, playUrls, loading } = useMovieDetail(apiUrl, movieId);

  // Set initial URL when playUrls are loaded
  React.useEffect(() => {
    if (playUrls.length > 0 && !currentUrl) {
      setCurrentUrl(playUrls[0].url);
      console.log('设置当前播放链接:', playUrls[0].url);
    }
  }, [playUrls, currentUrl]);

  const handleEpisodeClick = (url: string) => {
    console.log('切换集数，新链接:', url);
    setCurrentUrl(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-white text-lg">正在加载影片详情...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="text-white hover:bg-white/10 p-2"
              size="sm"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              返回
            </Button>
            <h1 className="text-lg md:text-xl font-bold text-white truncate">{movie?.vod_name}</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 py-4 max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Main Content */}
          <div className="flex-1 space-y-4">
            {/* Video Player */}
            <VideoPlayer currentUrl={currentUrl} />

            {/* Episode Selector */}
            <EpisodeSelector
              playUrls={playUrls}
              currentUrl={currentUrl}
              onEpisodeSelect={handleEpisodeClick}
            />
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-80 xl:w-96 space-y-4">
            {/* Movie Info */}
            {movie && <MovieInfo movie={movie} />}

            {/* Movie Description */}
            {movie?.vod_content && <MovieDescription content={movie.vod_content} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Player;
