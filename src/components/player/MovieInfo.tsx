
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Star, Info } from 'lucide-react';
import { MovieDetail } from '@/types/movie';

interface MovieInfoProps {
  movie: MovieDetail;
}

export const MovieInfo: React.FC<MovieInfoProps> = ({ movie }) => {
  return (
    <Card className="bg-white/10 backdrop-blur-md border-purple-500/20">
      <CardContent className="p-4">
        <div className="relative mb-4">
          <img
            src={movie.vod_pic || '/placeholder.svg'}
            alt={movie.vod_name}
            className="w-full h-48 sm:h-56 lg:h-64 object-cover rounded-lg"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              console.log('海报加载失败，使用占位图');
              target.src = '/placeholder.svg';
            }}
            onLoad={() => {
              console.log('海报加载成功:', movie.vod_pic);
            }}
          />
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
