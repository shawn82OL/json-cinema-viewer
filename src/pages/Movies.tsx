
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search, ArrowLeft, Play, Calendar, Star } from 'lucide-react';
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
  const apiUrl = searchParams.get('api');

  useEffect(() => {
    if (apiUrl) {
      fetchMovies();
    }
  }, [apiUrl, currentPage]);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const url = `${apiUrl}${apiUrl.includes('?') ? '&' : '?'}pg=${currentPage}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.list) {
        setMovies(data.list);
      } else {
        toast({
          title: "数据格式错误",
          description: "无法解析JSON数据，请检查接口格式",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "加载失败",
        description: "无法连接到数据源，请检查网络或接口地址",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
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

      {/* Movies Grid */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredMovies.map((movie) => (
            <Card
              key={movie.vod_id}
              className="bg-white/10 backdrop-blur-md border-purple-500/20 hover:bg-white/20 transition-all duration-300 cursor-pointer transform hover:scale-105"
              onClick={() => handleMovieClick(movie)}
            >
              <CardContent className="p-0">
                <div className="relative">
                  <img
                    src={movie.vod_pic || '/placeholder.svg'}
                    alt={movie.vod_name}
                    className="w-full h-64 object-cover rounded-t-lg"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder.svg';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center rounded-t-lg">
                    <Play className="h-12 w-12 text-white" />
                  </div>
                  {movie.vod_remarks && (
                    <div className="absolute top-2 right-2 bg-purple-600 text-white px-2 py-1 rounded text-xs">
                      {movie.vod_remarks}
                    </div>
                  )}
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

        {filteredMovies.length === 0 && !loading && (
          <div className="text-center text-white py-12">
            <p className="text-xl">没有找到相关影片</p>
            <p className="text-gray-400 mt-2">请尝试其他关键词或检查数据源</p>
          </div>
        )}

        {/* Pagination */}
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
      </div>
    </div>
  );
};

export default Movies;
