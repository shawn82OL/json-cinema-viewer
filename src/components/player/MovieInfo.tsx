import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Star, Info, Image } from 'lucide-react';
import { MovieDetail } from '@/types/movie';

interface MovieInfoProps {
  movie: MovieDetail;
}

export const MovieInfo: React.FC<MovieInfoProps> = ({ movie }) => {
  const getImageUrl = (originalUrl: string) => {
    if (!originalUrl) return '/placeholder.svg';
    
    // 如果是相对路径，尝试构建完整URL
    if (originalUrl.startsWith('/') || originalUrl.startsWith('./')) {
      // 从当前页面URL中提取可能的域名信息
      const currentUrl = window.location.href;
      const apiParam = new URLSearchParams(window.location.search).get('api');
      if (apiParam) {
        try {
          const apiDomain = new URL(apiParam).origin;
          return apiDomain + originalUrl;
        } catch {
          return originalUrl;
        }
      }
    }
    
    // 如果URL不是以http开头，添加https
    if (!originalUrl.startsWith('http')) {
      return 'https://' + originalUrl;
    }
    
    return originalUrl;
  };

  return (
    <Card className="bg-white/10 backdrop-blur-md border-purple-500/20">
      <CardContent className="p-4">
        <div className="relative mb-4">
          <div className="w-full h-48 sm:h-56 lg:h-64 bg-gray-800 rounded-lg overflow-hidden relative">
            {movie.vod_pic ? (
              <img
                src={getImageUrl(movie.vod_pic)}
                alt={movie.vod_name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  console.log('播放页海报加载失败，原始URL:', movie.vod_pic);
                  console.log('播放页处理后URL:', getImageUrl(movie.vod_pic));
                  
                  // 尝试不同的图片代理服务
                  const originalUrl = movie.vod_pic;
                  const proxyUrls = [
                    `https://images.weserv.nl/?url=${encodeURIComponent(originalUrl)}&w=300&h=400&fit=cover`,
                    `https://wsrv.nl/?url=${encodeURIComponent(originalUrl)}&w=300&h=400&fit=cover`,
                    `https://api.allorigins.win/raw?url=${encodeURIComponent(originalUrl)}`,
                    `https://corsproxy.io/?${encodeURIComponent(originalUrl)}`,
                    '/placeholder.svg'
                  ];
                  
                  // 获取当前尝试的代理索引
                  const currentIndex = target.dataset.proxyIndex ? parseInt(target.dataset.proxyIndex) : 0;
                  
                  if (currentIndex < proxyUrls.length - 1) {
                    target.dataset.proxyIndex = (currentIndex + 1).toString();
                    target.src = proxyUrls[currentIndex + 1];
                    console.log(`播放页尝试代理 ${currentIndex + 1}:`, proxyUrls[currentIndex + 1]);
                  } else {
                    console.log('播放页所有代理都失败，使用占位图');
                    target.src = '/placeholder.svg';
                  }
                }}
                onLoad={() => {
                  console.log('播放页海报加载成功:', movie.vod_name);
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-700">
                <Image className="h-16 w-16 text-gray-500" />
                <span className="text-gray-400 text-sm ml-2">暂无海报</span>
              </div>
            )}
          </div>
          {movie.vod_remarks && (
            <div className="absolute top-2 right-2 bg-purple-600 text-white px-2 py-1 rounded text-xs">
              {movie.vod_remarks}
            </div>
          )}
        </div>
        
        <h2 className="text-lg font-bold text-white mb-3 leading-tight">
          {movie.vod_name}
        </h2>
        
        <div className="space-y-2 text-sm text-gray-300">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">年份: {movie.vod_year || '未知'}</span>
          </div>
          {movie.vod_score && (
            <div className="flex items-center space-x-2">
              <Star className="h-4 w-4 text-yellow-500 flex-shrink-0" />
              <span className="truncate">评分: {movie.vod_score}</span>
            </div>
          )}
          {movie.vod_area && (
            <div className="flex items-center space-x-2">
              <Info className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">地区: {movie.vod_area}</span>
            </div>
          )}
          {movie.vod_lang && (
            <div className="flex items-center space-x-2">
              <Info className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">语言: {movie.vod_lang}</span>
            </div>
          )}
          {movie.vod_director && (
            <div className="flex items-start space-x-2">
              <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span className="break-words text-xs">导演: {movie.vod_director}</span>
            </div>
          )}
          {movie.vod_actor && (
            <div className="flex items-start space-x-2">
              <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span className="break-words text-xs">主演: {movie.vod_actor}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};