
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Play, Calendar, Star, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Artplayer from 'artplayer';

interface MovieDetail {
  vod_id: string;
  vod_name: string;
  vod_pic: string;
  vod_remarks: string;
  vod_year: string;
  vod_score: string;
  vod_content: string;
  vod_play_url: string;
  vod_actor: string;
  vod_director: string;
  vod_area: string;
  vod_lang: string;
}

const Player = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const playerRef = useRef<HTMLDivElement>(null);
  const artRef = useRef<Artplayer | null>(null);
  const [movie, setMovie] = useState<MovieDetail | null>(null);
  const [playUrls, setPlayUrls] = useState<Array<{name: string, url: string}>>([]);
  const [currentUrl, setCurrentUrl] = useState('');
  const [loading, setLoading] = useState(true);
  
  const apiUrl = searchParams.get('api');
  const movieId = searchParams.get('id');

  useEffect(() => {
    if (apiUrl && movieId) {
      fetchMovieDetail();
    }
    
    return () => {
      if (artRef.current) {
        artRef.current.destroy();
      }
    };
  }, [apiUrl, movieId]);

  useEffect(() => {
    if (currentUrl && playerRef.current) {
      initPlayer();
    }
  }, [currentUrl]);

  const fetchMovieDetail = async () => {
    try {
      setLoading(true);
      let url = `${apiUrl}${apiUrl.includes('?') ? '&' : '?'}ac=detail&ids=${movieId}`;
      
      console.log('正在获取影片详情:', url);
      
      let response;
      try {
        response = await fetch(url);
        if (!response.ok) throw new Error('Direct request failed');
        console.log('直接请求成功');
      } catch (error) {
        console.log('直接请求失败，尝试使用代理...', error);
        try {
          const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
          response = await fetch(proxyUrl);
          console.log('代理请求成功');
        } catch (proxyError) {
          console.log('代理1失败，尝试备用代理...', proxyError);
          const proxyUrl2 = `https://corsproxy.io/?${encodeURIComponent(url)}`;
          response = await fetch(proxyUrl2);
          console.log('备用代理请求成功');
        }
      }
      
      const data = await response.json();
      console.log('获取到的数据:', data);
      
      if (data.list && data.list[0]) {
        const movieData = data.list[0];
        setMovie(movieData);
        parsePlayUrls(movieData.vod_play_url);
        console.log('成功加载影片详情:', movieData.vod_name);
      } else {
        console.error('数据格式错误:', data);
        toast({
          title: "加载失败",
          description: "无法获取影片详情，数据格式不正确",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('获取影片详情失败:', error);
      toast({
        title: "连接错误",
        description: "无法连接到数据源，请检查网络连接",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const parsePlayUrls = (playUrl: string) => {
    if (!playUrl) {
      console.log('没有播放链接数据');
      return;
    }
    
    console.log('原始播放链接数据:', playUrl);
    
    // 解析播放链接格式：线路名$集数$播放地址#集数$播放地址
    const lines = playUrl.split('$$$');
    const urls: Array<{name: string, url: string}> = [];
    
    lines.forEach((line, lineIndex) => {
      console.log(`处理线路 ${lineIndex + 1}:`, line);
      const parts = line.split('$');
      
      // 跳过线路名，从索引1开始处理集数和链接
      for (let i = 1; i < parts.length; i += 2) {
        if (parts[i] && parts[i + 1]) {
          urls.push({
            name: `第${parts[i]}集`,
            url: parts[i + 1].trim()
          });
          console.log(`添加集数: 第${parts[i]}集, 链接: ${parts[i + 1].trim()}`);
        }
      }
    });
    
    console.log('解析出的播放链接:', urls);
    setPlayUrls(urls);
    if (urls.length > 0) {
      setCurrentUrl(urls[0].url);
      console.log('设置当前播放链接:', urls[0].url);
    }
  };

  const initPlayer = () => {
    if (artRef.current) {
      artRef.current.destroy();
    }

    if (playerRef.current && currentUrl) {
      console.log('初始化播放器，链接:', currentUrl);
      
      artRef.current = new Artplayer({
        container: playerRef.current,
        url: currentUrl,
        volume: 0.5,
        isLive: false,
        muted: false,
        autoplay: false,
        pip: true,
        setting: true,
        loop: false,
        flip: true,
        playbackRate: true,
        aspectRatio: true,
        fullscreen: true,
        fullscreenWeb: true,
        subtitleOffset: true,
        miniProgressBar: true,
        mutex: true,
        backdrop: true,
        playsInline: true,
        autoSize: false,
        airplay: true,
        theme: '#8b5cf6',
        lang: navigator.language.toLowerCase(),
        moreVideoAttr: {
          crossOrigin: 'anonymous',
        },
      });

      artRef.current.on('ready', () => {
        console.log('播放器准备就绪');
      });

      artRef.current.on('error', (error) => {
        console.error('播放器错误:', error);
        toast({
          title: "播放错误",
          description: "视频加载失败，请尝试其他播放源",
          variant: "destructive"
        });
      });
    }
  };

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
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回
            </Button>
            <h1 className="text-xl md:text-2xl font-bold text-white truncate">{movie?.vod_name}</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 md:py-8">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Player Section */}
          <div className="lg:col-span-3 space-y-6">
            <Card className="bg-black/50 backdrop-blur-md border-purple-500/20">
              <CardContent className="p-0">
                <div 
                  ref={playerRef}
                  className="w-full aspect-video rounded-lg overflow-hidden"
                  style={{ minHeight: '300px' }}
                ></div>
              </CardContent>
            </Card>

            {/* Episodes */}
            {playUrls.length > 0 && (
              <Card className="bg-white/10 backdrop-blur-md border-purple-500/20">
                <CardContent className="p-4 md:p-6">
                  <h3 className="text-white text-lg font-semibold mb-4">选集播放 ({playUrls.length}集)</h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
                    {playUrls.map((episode, index) => (
                      <Button
                        key={index}
                        variant={currentUrl === episode.url ? "default" : "ghost"}
                        size="sm"
                        onClick={() => handleEpisodeClick(episode.url)}
                        className={`text-xs h-8 ${
                          currentUrl === episode.url 
                            ? "bg-purple-600 hover:bg-purple-700 text-white" 
                            : "text-white hover:bg-white/10 border border-purple-500/30"
                        }`}
                      >
                        {episode.name}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Movie Info Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-white/10 backdrop-blur-md border-purple-500/20">
              <CardContent className="p-4 md:p-6">
                <div className="relative mb-4">
                  <img
                    src={movie?.vod_pic || '/placeholder.svg'}
                    alt={movie?.vod_name}
                    className="w-full h-48 md:h-64 object-cover rounded-lg"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      console.log('海报加载失败，使用占位图');
                      target.src = '/placeholder.svg';
                    }}
                    onLoad={() => {
                      console.log('海报加载成功:', movie?.vod_pic);
                    }}
                  />
                  {movie?.vod_remarks && (
                    <div className="absolute top-2 right-2 bg-purple-600 text-white px-2 py-1 rounded text-xs">
                      {movie.vod_remarks}
                    </div>
                  )}
                </div>
                
                <h2 className="text-lg md:text-xl font-bold text-white mb-3 leading-tight">{movie?.vod_name}</h2>
                
                <div className="space-y-2 text-sm text-gray-300">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">年份: {movie?.vod_year || '未知'}</span>
                  </div>
                  {movie?.vod_score && (
                    <div className="flex items-center space-x-2">
                      <Star className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                      <span className="truncate">评分: {movie.vod_score}</span>
                    </div>
                  )}
                  {movie?.vod_area && (
                    <div className="flex items-center space-x-2">
                      <Info className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">地区: {movie.vod_area}</span>
                    </div>
                  )}
                  {movie?.vod_lang && (
                    <div className="flex items-center space-x-2">
                      <Info className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">语言: {movie.vod_lang}</span>
                    </div>
                  )}
                  {movie?.vod_director && (
                    <div className="flex items-start space-x-2">
                      <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span className="break-words">导演: {movie.vod_director}</span>
                    </div>
                  )}
                  {movie?.vod_actor && (
                    <div className="flex items-start space-x-2">
                      <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span className="break-words">主演: {movie.vod_actor}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            {movie?.vod_content && (
              <Card className="bg-white/10 backdrop-blur-md border-purple-500/20">
                <CardContent className="p-4 md:p-6">
                  <h3 className="text-white text-lg font-semibold mb-3">剧情简介</h3>
                  <p className="text-gray-300 text-sm leading-relaxed break-words">
                    {movie.vod_content.replace(/<[^>]*>/g, '')}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Player;
