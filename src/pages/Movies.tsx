import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search, ArrowLeft, Play, Calendar, Star, AlertCircle, Image } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Movie {
  vod_id: string;
  vod_name: string;
  vod_pic: string;
  vod_remarks: string;
  vod_year: string;
  vod_score: string;
  vod_content: string;
  vod_play_url?: string;
}

const Movies = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [corsError, setCorsError] = useState(false);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const apiUrl = searchParams.get('api');

  useEffect(() => {
    if (apiUrl) {
      fetchMovies();
    }
  }, [apiUrl, currentPage]);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      setCorsError(false);
      
      let url = `${apiUrl}${apiUrl.includes('?') ? '&' : '?'}pg=${currentPage}`;
      console.log('正在请求:', url);
      
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
      
      if (data.list && Array.isArray(data.list)) {
        // 处理图片URL，确保它们是完整的URL
        const processedMovies = data.list.map((movie: Movie) => ({
          ...movie,
          vod_pic: processImageUrl(movie.vod_pic)
        }));
        
        setMovies(processedMovies);
        console.log('成功加载影片数据:', processedMovies.length, '部影片');
        
        // 预加载图片
        processedMovies.forEach((movie: Movie) => {
          if (movie.vod_pic) {
            preloadImage(movie.vod_pic, movie.vod_id);
          }
        });
      } else {
        console.error('数据格式错误:', data);
        toast({
          title: "数据格式错误",
          description: "API返回的数据格式不正确",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('请求失败:', error);
      setCorsError(true);
      toast({
        title: "连接失败",
        description: "无法连接到数据源，请检查API地址或网络连接",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // 处理图片URL，确保是完整的URL
  const processImageUrl = (picUrl: string): string => {
    if (!picUrl) return '';
    
    // 如果已经是完整URL，直接返回
    if (picUrl.startsWith('http://') || picUrl.startsWith('https://')) {
      return picUrl;
    }
    
    // 如果是相对路径，尝试补全
    if (picUrl.startsWith('/')) {
      // 从API URL中提取域名
      try {
        const apiDomain = new URL(apiUrl || '').origin;
        return apiDomain + picUrl;
      } catch {
        return picUrl;
      }
    }
    
    return picUrl;
  };

  // 预加载图片并处理错误
  const preloadImage = (src: string, movieId: string) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      console.log('图片加载成功:', src);
    };
    
    img.onerror = () => {
      console.log('图片加载失败:', src);
      setImageErrors(prev => new Set(prev).add(movieId));
    };
    
    img.src = src;
  };

  // 处理图片加载错误
  const handleImageError = (movieId: string, originalSrc: string) => {
    console.log('图片加载失败，尝试代理:', originalSrc);
    setImageErrors(prev => new Set(prev).add(movieId));
    
    // 尝试使用图片代理服务
    const proxyImageUrl = `https://images.weserv.nl/?url=${encodeURIComponent(originalSrc)}&w=300&h=400&fit=cover&a=attention`;
    return proxyImageUrl;
  };

  // 获取图片URL，包含错误处理
  const getImageUrl = (movie: Movie): string => {
    if (imageErrors.has(movie.vod_id)) {
      // 如果原图片失败，尝试使用代理
      if (movie.vod_pic) {
        return `https://images.weserv.nl/?url=${encodeURIComponent(movie.vod_pic)}&w=300&h=400&fit=cover&a=attention`;
      }
      return '/placeholder.svg';
    }
    return movie.vod_pic || '/placeholder.svg';
  };

  const filteredMovies = movies.filter(movie =>
    movie.vod_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleMovieClick = (movie: Movie) => {
    navigate(`/player?api=${encodeURIComponent(apiUrl || '')}&id=${movie.vod_id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-white text-lg">正在加载影视资源...</p>
          <p className="text-gray-400 text-sm mt-2">正在尝试连接数据源</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => navigate(-1)}
                className="text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                返回
              </Button>
              <h1 className="text-2xl font-bold text-white">影视资源库</h1>
            </div>
            <div className="flex items-center space-x-2 max-w-md">
              <Search className="h-5 w-5 text-purple-400" />
              <Input
                placeholder="搜索影片..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white/10 border-purple-500/30 text-white placeholder:text-gray-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* CORS错误提示 */}
      {corsError && movies.length === 0 && (
        <div className="container mx-auto px-4 py-6">
          <Card className="bg-yellow-900/50 border-yellow-600/50">
            <CardContent className="p-6">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-6 w-6 text-yellow-400 mt-1" />
                <div>
                  <h3 className="text-yellow-200 font-semibold mb-2">连接问题</h3>
                  <p className="text-yellow-100 text-sm mb-3">
                    由于浏览器安全限制，无法直接访问该API。正在尝试使用代理服务...
                  </p>
                  <Button 
                    onClick={fetchMovies}
                    size="sm"
                    className="bg-yellow-600 hover:bg-yellow-700"
                  >
                    重试连接
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Movies Grid */}
      <div className="container mx-auto px-4 py-8">
        {movies.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredMovies.map((movie) => (
              <Card
                key={movie.vod_id}
                className="bg-white/10 backdrop-blur-md border-purple-500/20 hover:bg-white/20 transition-all duration-300 cursor-pointer transform hover:scale-105"
                onClick={() => handleMovieClick(movie)}
              >
                <CardContent className="p-0">
                  <div className="relative">
                    <div className="w-full h-64 bg-gray-800 rounded-t-lg overflow-hidden relative">
                      {movie.vod_pic ? (
                        <img
                          src={getImageUrl(movie)}
                          alt={movie.vod_name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (!imageErrors.has(movie.vod_id)) {
                              // 第一次失败，尝试代理
                              target.src = handleImageError(movie.vod_id, movie.vod_pic);
                            } else {
                              // 代理也失败，使用占位图
                              target.src = '/placeholder.svg';
                            }
                          }}
                          onLoad={() => {
                            console.log('图片显示成功:', movie.vod_name);
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-700">
                          <Image className="h-16 w-16 text-gray-500" />
                        </div>
                      )}
                      
                      <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <Play className="h-12 w-12 text-white" />
                      </div>
                      
                      {movie.vod_remarks && (
                        <div className="absolute top-2 right-2 bg-purple-600 text-white px-2 py-1 rounded text-xs">
                          {movie.vod_remarks}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-white font-semibold mb-2 line-clamp-2 h-12">
                      {movie.vod_name}
                    </h3>
                    <div className="flex items-center justify-between text-sm text-gray-300">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{movie.vod_year || '未知'}</span>
                      </div>
                      {movie.vod_score && (
                        <div className="flex items-center space-x-1">
                          <Star className="h-3 w-3 text-yellow-500" />
                          <span>{movie.vod_score}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          !loading && (
            <div className="text-center text-white py-12">
              <p className="text-xl">没有找到相关影片</p>
              <p className="text-gray-400 mt-2">请检查API地址或尝试重新加载</p>
              <Button 
                onClick={fetchMovies}
                className="mt-4 bg-purple-600 hover:bg-purple-700"
              >
                重新加载
              </Button>
            </div>
          )
        )}

        {/* Pagination */}
        {movies.length > 0 && (
          <div className="flex justify-center mt-8 space-x-2">
            <Button
              variant="ghost"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="text-white hover:bg-white/10"
            >
              上一页
            </Button>
            <span className="text-white flex items-center px-4">
              第 {currentPage} 页
            </span>
            <Button
              variant="ghost"
              onClick={() => setCurrentPage(currentPage + 1)}
              className="text-white hover:bg-white/10"
            >
              下一页
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Movies;